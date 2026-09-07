import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { DeviceInfo, DeviceType, SessionProbeResult, StreamMessage } from '../types';

interface RealtimeCallbacks {
  onMessage: (msg: StreamMessage) => void;
  onPresenceUpdate: (count: number, devices: DeviceInfo[]) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
  onRoomPasswordDetected?: (passHash: string) => void;
  getCurrentMessages: () => StreamMessage[];
  onSyncHistory: (messages: StreamMessage[]) => void;
}

export class RealtimeSession {
  private sessionId: string;
  private deviceId: string;
  private deviceName: string;
  private deviceType: DeviceType;
  private passwordHash: string;
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
    callbacks: RealtimeCallbacks,
    passwordHash = ''
  ) {
    this.sessionId = sessionId;
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.deviceType = deviceType;
    this.passwordHash = passwordHash;
    this.callbacks = callbacks;
  }

  public updatePasswordHash(newHash: string): void {
    this.passwordHash = newHash;
    if (this.channel) {
      this.channel.track({
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        deviceType: this.deviceType,
        joinedAt: Date.now(),
        hasPassword: !!newHash,
        passwordHash: newHash,
      });
    }
    this.sendLocalPresence('join');
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
        // Yêu cầu đồng bộ lịch sử từ tab khác đang mở
        this.broadcastChannel.postMessage({
          type: 'sync-req',
          requesterId: this.deviceId,
        });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // Kiểm tra cấu hình Supabase Realtime qua các biến môi trường (hỗ trợ cả Vercel Supabase integration)
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
      import.meta.env.SUPABASE_URL;

    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.SUPABASE_ANON_KEY;

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

        // 2. Lắng nghe yêu cầu đồng bộ lịch sử từ máy mới vào
        this.channel.on('broadcast', { event: 'sync-req' }, ({ payload }) => {
          if (payload && payload.requesterId && payload.requesterId !== this.deviceId) {
            const currentList = this.callbacks.getCurrentMessages();
            if (currentList.length > 0) {
              this.channel?.send({
                type: 'broadcast',
                event: 'sync-res',
                payload: {
                  targetId: payload.requesterId,
                  messages: currentList,
                },
              });
            }
          }
        });

        // 3. Nhận lịch sử đồng bộ từ máy đang online
        this.channel.on('broadcast', { event: 'sync-res' }, ({ payload }) => {
          if (payload && payload.targetId === this.deviceId && Array.isArray(payload.messages)) {
            this.callbacks.onSyncHistory(payload.messages);
          }
        });

        // 4. Lắng nghe Presence (số thiết bị trực tuyến và trạng thái mật khẩu phòng)
        this.channel.on('presence', { event: 'sync' }, () => {
          if (!this.channel) return;
          const presenceState = this.channel.presenceState();
          const activeDevices: DeviceInfo[] = [];

          Object.values(presenceState).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.deviceId) {
                activeDevices.push({
                  deviceId: p.deviceId,
                  deviceName: p.deviceName || 'Device',
                  deviceType: p.deviceType || 'unknown',
                  joinedAt: p.joinedAt || Date.now(),
                  hasPassword: !!p.hasPassword,
                  passwordHash: p.passwordHash || '',
                });

                // Nếu có peer khác đặt mật khẩu, thông báo cho callback
                if (p.hasPassword && p.passwordHash && this.callbacks.onRoomPasswordDetected) {
                  this.callbacks.onRoomPasswordDetected(p.passwordHash);
                }
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
              hasPassword: !!this.passwordHash,
              passwordHash: this.passwordHash,
            });

            // Gửi yêu cầu xin lịch sử tin nhắn từ các máy đang mở tab
            this.channel?.send({
              type: 'broadcast',
              event: 'sync-req',
              payload: { requesterId: this.deviceId },
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
      hasPassword: !!this.passwordHash,
      passwordHash: this.passwordHash,
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
        hasPassword: !!this.passwordHash,
        passwordHash: this.passwordHash,
      },
    });
  }

  private handleBroadcastChannelMessage(data: any): void {
    if (!data || !data.type) return;

    if (data.type === 'probe-req') {
      this.broadcastChannel?.postMessage({
        type: 'probe-ack',
        probeId: data.probeId,
        hasPassword: !!this.passwordHash,
        passwordHash: this.passwordHash,
      });
      return;
    }

    if (data.type === 'sync-req' && data.requesterId !== this.deviceId) {
      const currentList = this.callbacks.getCurrentMessages();
      if (currentList.length > 0) {
        this.broadcastChannel?.postMessage({
          type: 'sync-res',
          targetId: data.requesterId,
          messages: currentList,
        });
      }
      return;
    }

    if (data.type === 'sync-res' && data.targetId === this.deviceId && Array.isArray(data.messages)) {
      this.callbacks.onSyncHistory(data.messages);
      return;
    }

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
        hasPassword: !!this.passwordHash,
        passwordHash: this.passwordHash,
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

/**
 * Kiểm tra xem một mã phòng đã có thiết bị đang online hay chưa và có mật khẩu không
 */
export async function probeSession(targetSessionId: string): Promise<SessionProbeResult> {
  const cleanId = targetSessionId.trim().toUpperCase();

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL;

  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const probeChannel = client.channel(`quicktext_session_${cleanId}`);

      const result = await new Promise<SessionProbeResult>((resolve) => {
        let isDone = false;

        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            probeChannel.unsubscribe();
            client.removeChannel(probeChannel);
            resolve({ inUse: false, hasPassword: false, memberCount: 0 });
          }
        }, 1400);

        probeChannel.on('presence', { event: 'sync' }, () => {
          if (isDone) return;
          const state = probeChannel.presenceState();
          const members: any[] = [];
          Object.values(state).forEach((list: any) => {
            members.push(...list);
          });

          if (members.length > 0) {
            isDone = true;
            clearTimeout(timer);
            const protectedMember = members.find((m) => m.hasPassword);
            probeChannel.unsubscribe();
            client.removeChannel(probeChannel);
            resolve({
              inUse: true,
              hasPassword: !!protectedMember,
              passwordHash: protectedMember?.passwordHash || '',
              memberCount: members.length,
            });
          }
        });

        probeChannel.subscribe();
      });

      return result;
    } catch {
      // Fallback
    }
  }

  // Native BroadcastChannel probe for local peer testing
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new Promise((resolve) => {
      try {
        const bc = new BroadcastChannel(`quicktext_${cleanId}`);
        const probeId = 'probe_' + Math.random().toString(36).substring(2, 7);
        let resolved = false;

        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            bc.close();
            resolve({ inUse: false, hasPassword: false, memberCount: 0 });
          }
        }, 350);

        bc.onmessage = (event) => {
          if (event.data?.type === 'probe-ack' && event.data?.probeId === probeId) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              bc.close();
              resolve({
                inUse: true,
                hasPassword: !!event.data.hasPassword,
                passwordHash: event.data.passwordHash || '',
                memberCount: 1,
              });
            }
          }
        };

        bc.postMessage({ type: 'probe-req', probeId });
      } catch {
        resolve({ inUse: false, hasPassword: false, memberCount: 0 });
      }
    });
  }

  return { inUse: false, hasPassword: false, memberCount: 0 };
}
