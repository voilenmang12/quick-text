import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SessionBridge } from './components/SessionBridge';
import { QuickSender } from './components/QuickSender';
import { TextStreamList } from './components/TextStreamList';
import { ConnectModal } from './components/ConnectModal';
import { RealtimeSession } from './services/realtime';
import type { ConnectionStatus, DeviceInfo, StreamMessage } from './types';
import {
  generateSessionId,
  detectDeviceType,
  getFriendlyDeviceName,
  detectContentType,
} from './utils/helpers';

export const App: React.FC = () => {
  // Lấy hoặc sinh Session ID từ URL (?s= hoặc #s=)
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const sParam = searchParams.get('s');
      if (sParam && sParam.trim().length >= 4) {
        return sParam.trim().toUpperCase();
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.length >= 4) {
        return hash.toUpperCase();
      }
    }
    return generateSessionId();
  });

  // Tạo định danh thiết bị duy nhất trong bộ nhớ RAM cho phiên này
  const [deviceId] = useState<string>(() => 'dev_' + Math.random().toString(36).substring(2, 9));
  const deviceType = useRef(detectDeviceType()).current;
  const deviceName = useRef(getFriendlyDeviceName(deviceType)).current;

  // Trạng thái phiên (Zero Persistence - RAM Only)
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  const realtimeRef = useRef<RealtimeSession | null>(null);

  // Đường dẫn đầy đủ của phiên để sinh QR và chia sẻ
  const sessionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?s=${sessionId}`
    : `https://quicktext.app?s=${sessionId}`;

  // Cập nhật URL trình duyệt đồng bộ với Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('s', sessionId);
      window.history.replaceState(null, '', url.toString());
    }
  }, [sessionId]);

  // Khởi tạo kết nối Realtime
  const connectSession = useCallback((targetSessionId: string) => {
    if (realtimeRef.current) {
      realtimeRef.current.disconnect();
    }

    const session = new RealtimeSession(
      targetSessionId,
      deviceId,
      deviceName,
      deviceType,
      {
        onMessage: (msg) => {
          setMessages((prev) => [msg, ...prev]);
        },
        onPresenceUpdate: (count, activeDevices) => {
          setDeviceCount(count);
          setDevices(activeDevices);
        },
        onStatusChange: (status) => {
          setConnectionStatus(status);
        },
      }
    );

    session.connect();
    realtimeRef.current = session;
  }, [deviceId, deviceName, deviceType]);

  useEffect(() => {
    connectSession(sessionId);

    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
      }
    };
  }, [sessionId, connectSession]);

  // Xử lý khi tab active trở lại (mobile sleep mode recovery)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connectSession(sessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, connectSession]);

  // Gửi văn bản từ máy này
  const handleSendMessage = async (rawText: string) => {
    const messageItem: StreamMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: deviceId,
      senderName: deviceName,
      senderDevice: deviceType,
      text: rawText,
      timestamp: Date.now(),
      isSelf: true,
      contentType: detectContentType(rawText),
    };

    // Cập nhật giao diện của máy mình trước
    setMessages((prev) => [messageItem, ...prev]);

    // Bắn qua socket thời gian thực
    if (realtimeRef.current) {
      await realtimeRef.current.sendMessage(messageItem);
    }
  };

  // Đổi sang phiên mới hoàn toàn
  const handleNewSession = () => {
    const newId = generateSessionId();
    setMessages([]);
    setSessionId(newId);
  };

  // Kết nối vào một phiên có sẵn qua mã code
  const handleConnectSession = (targetCode: string) => {
    setMessages([]);
    setSessionId(targetCode);
  };

  return (
    <div className="app-container" id="quicktext-app">
      <Header
        deviceCount={deviceCount}
        devices={devices}
        connectionStatus={connectionStatus}
        onNewSession={handleNewSession}
        onOpenConnect={() => setIsConnectModalOpen(true)}
      />

      <main className="main-layout" id="quicktext-main">
        {/* Cột trái: Ghép đôi thiết bị bằng QR & Link */}
        <aside className="sidebar-area" id="quicktext-sidebar">
          <SessionBridge
            sessionId={sessionId}
            sessionUrl={sessionUrl}
          />
        </aside>

        {/* Cột phải: Khung gửi nhanh & Danh sách nhận văn bản */}
        <section className="content-area" id="quicktext-content">
          <QuickSender
            onSend={handleSendMessage}
            disabled={connectionStatus === 'disconnected'}
          />

          <TextStreamList
            messages={messages}
          />
        </section>
      </main>

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnectSession}
      />
    </div>
  );
};

export default App;
