import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { DeviceInfo, DeviceType, StreamMessage } from '../types';

interface RealtimeCallbacks {
  onMessage: (msg: StreamMessage) => void;
  onPresenceUpdate: (count: number, devices: DeviceInfo[]) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
}

export class RealtimeSession {
  private sessionId: string;
  private deviceId: string;
  private deviceName: string;
  private deviceType: DeviceType;
  private callbacks: RealtimeCallbacks;
  
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatTimer: number | null = null;
  private localPeers: Map<string, DeviceInfo> = new Map();

  constructor(
    sessionId: string,
    deviceId: string,
    deviceName: string,
    deviceType: DeviceType,
    callbacks: RealtimeCallbacks
  ) {
    this.sessionId = sessionId;
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.deviceType = deviceType;
    this.callbacks = callbacks;
  }

  public connect(): void {
    this.callbacks.onStatusChange('connecting');

    // Luôn khởi tạo native BroadcastChannel cho kết nối cục bộ (multi-tab / cùng máy)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`quicktext_${this.sessionId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastChannelMessage(event.data);
        };
        // Gửi thông báo sự hiện diện cục bộ
        this.sendLocalPresence('join');
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // Kiểm tra cấu hình Supabase Realtime qua biến môi trường
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
          realtime: {
            params: {
              eventsPerSecond: 20,
            },
          },
        });

        const channelName = `quicktext_session_${this.sessionId}`;
        this.channel = this.supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: this.deviceId },
          },
        });

        // 1. Lắng nghe broadcast tin nhắn
        this.channel.on('broadcast', { event: 'text-stream' }, ({ payload }) => {
          if (payload && payload.id) {
            this.callbacks.onMessage({
              ...payload,
              isSelf: false,
            });
          }
        });

        // 2. Lắng nghe Presence (số thiết bị trực tuyến)
        this.channel.on('presence', { event: 'sync' }, () => {
          if (!this.channel) return;
          const presenceState = this.channel.presenceState();
          const activeDevices: DeviceInfo[] = [];

          Object.values(presenceState).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.deviceId) {
                activeDevices.push({
                  deviceId: p.deviceId,
                  deviceName: p.deviceName || 'Thiết bị',
                  deviceType: p.deviceType || 'unknown',
                  joinedAt: p.joinedAt || Date.now(),
                });
              }
            });
          });

          this.callbacks.onPresenceUpdate(Math.max(1, activeDevices.length), activeDevices);
        });

        // Đăng ký kênh và track presence
        this.channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.callbacks.onStatusChange('connected');
            await this.channel?.track({
              deviceId: this.deviceId,
              deviceName: this.deviceName,
              deviceType: this.deviceType,
              joinedAt: Date.now(),
            });
          } else if (status === 'CHANNEL_ERROR') {
            this.callbacks.onStatusChange('disconnected');
          } else if (status === 'TIMED_OUT') {
            this.callbacks.onStatusChange('reconnecting');
          }
        });
      } catch (err) {
        console.error('Lỗi kết nối Supabase Realtime:', err);
        this.fallbackToLocalMode();
      }
    } else {
      // Chế độ không có Supabase env: hoạt động ở chế độ Local Multi-tab / Same-browser Mesh
      this.fallbackToLocalMode();
    }
  }

  private fallbackToLocalMode(): void {
    this.callbacks.onStatusChange('connected');
    
    // Thêm chính mình vào danh sách peer cục bộ
    this.localPeers.set(this.deviceId, {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType,
      joinedAt: Date.now(),
    });
    this.callbacks.onPresenceUpdate(1, Array.from(this.localPeers.values()));

    // Gửi heartbeat định kỳ qua BroadcastChannel
    this.heartbeatTimer = window.setInterval(() => {
      this.sendLocalPresence('ping');
    }, 4000);
  }

  private sendLocalPresence(action: 'join' | 'ping' | 'leave'): void {
    if (!this.broadcastChannel) return;
    this.broadcastChannel.postMessage({
      type: 'presence',
      action,
      payload: {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        deviceType: this.deviceType,
        joinedAt: Date.now(),
      },
    });
  }

  private handleBroadcastChannelMessage(data: any): void {
    if (!data || !data.type) return;

    if (data.type === 'text-stream') {
      const msg = data.payload as StreamMessage;
      if (msg.senderId !== this.deviceId) {
        this.callbacks.onMessage({
          ...msg,
          isSelf: false,
        });
      }
    } else if (data.type === 'presence') {
      const peer = data.payload as DeviceInfo;
      if (peer.deviceId === this.deviceId) return;

      if (data.action === 'join' || data.action === 'ping') {
        this.localPeers.set(peer.deviceId, peer);
        if (data.action === 'join') {
          // Trả lời lại cho thiết bị mới biết mình đang có mặt
          this.sendLocalPresence('ping');
        }
      } else if (data.action === 'leave') {
        this.localPeers.delete(peer.deviceId);
      }

      // Đảm bảo luôn có chính mình
      this.localPeers.set(this.deviceId, {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        deviceType: this.deviceType,
        joinedAt: Date.now(),
      });

      this.callbacks.onPresenceUpdate(this.localPeers.size, Array.from(this.localPeers.values()));
    }
  }

  public async sendMessage(msg: StreamMessage): Promise<void> {
    // 1. Gửi qua Supabase nếu có
    if (this.channel) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'text-stream',
          payload: msg,
        });
      } catch (err) {
        console.error('Lỗi khi gửi broadcast qua Supabase:', err);
      }
    }

    // 2. Gửi qua BroadcastChannel cục bộ
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'text-stream',
        payload: msg,
      });
    }
  }

  public disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.sendLocalPresence('leave');

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.supabase) {
      this.supabase.removeAllChannels();
      this.supabase = null;
    }

    this.localPeers.clear();
    this.callbacks.onStatusChange('disconnected');
  }
}
