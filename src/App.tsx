import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SessionBridge } from './components/SessionBridge';
import { QuickSender } from './components/QuickSender';
import { TextStreamList } from './components/TextStreamList';
import { ConnectModal } from './components/ConnectModal';
import { CreateCustomModal } from './components/CreateCustomModal';
import { PasswordPromptModal } from './components/PasswordPromptModal';
import { RealtimeSession, probeSession } from './services/realtime';
import type { ConnectionStatus, DeviceInfo, StreamMessage } from './types';
import {
  generateSessionId,
  detectDeviceType,
  getFriendlyDeviceName,
  detectContentType,
  hashPassword,
} from './utils/helpers';

export const App: React.FC = () => {
  // Lấy hoặc sinh Session ID từ URL (?s= hoặc #s=)
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const sParam = searchParams.get('s');
      if (sParam && sParam.trim().length >= 2) {
        return sParam.trim().toUpperCase();
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.length >= 2) {
        return hash.toUpperCase();
      }
    }
    return generateSessionId();
  });

  // Mật khẩu phòng (mặc định ban đầu trống)
  const [roomPassword, setRoomPassword] = useState<string>('');

  // Định danh thiết bị trong RAM
  const [deviceId] = useState<string>(() => 'dev_' + Math.random().toString(36).substring(2, 9));
  const deviceType = useRef(detectDeviceType()).current;
  const deviceName = useRef(getFriendlyDeviceName(deviceType)).current;

  // Trạng thái phiên (Zero Persistence - RAM Only)
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const messagesRef = useRef<StreamMessage[]>([]);
  messagesRef.current = messages;

  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isCreateCustomOpen, setIsCreateCustomOpen] = useState<boolean>(false);
  const [pendingProtectedSession, setPendingProtectedSession] = useState<{
    targetSessionId: string;
    expectedHash: string;
  } | null>(null);

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
  const connectSession = useCallback(async (targetSessionId: string, currentPassword = '') => {
    if (realtimeRef.current) {
      realtimeRef.current.disconnect();
    }

    const passHash = currentPassword ? await hashPassword(currentPassword) : '';

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
        getCurrentMessages: () => messagesRef.current,
        onSyncHistory: (incomingMessages) => {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = incomingMessages
              .filter((m) => !existingIds.has(m.id))
              .map((m) => ({
                ...m,
                isSelf: m.senderId === deviceId,
              }));
            if (newItems.length === 0) return prev;
            return [...newItems, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          });
        },
      },
      passHash
    );

    session.connect();
    realtimeRef.current = session;
  }, [deviceId, deviceName, deviceType]);

  useEffect(() => {
    connectSession(sessionId, roomPassword);

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
        connectSession(sessionId, roomPassword);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, roomPassword, connectSession]);

  // Khi người dùng thay đổi mật khẩu phòng
  const handlePasswordChange = async (newPassword: string) => {
    setRoomPassword(newPassword);
    const hash = newPassword ? await hashPassword(newPassword) : '';
    if (realtimeRef.current) {
      realtimeRef.current.updatePasswordHash(hash);
    }
  };

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

    setMessages((prev) => [messageItem, ...prev]);

    if (realtimeRef.current) {
      await realtimeRef.current.sendMessage(messageItem);
    }
  };

  // Tạo phiên ngẫu nhiên
  const handleRandomSession = () => {
    const newId = generateSessionId();
    setMessages([]);
    setRoomPassword('');
    setSessionId(newId);
  };

  // Tạo phiên tùy chỉnh (Custom Code)
  const handleCreateCustomSession = (customCode: string) => {
    setMessages([]);
    setRoomPassword('');
    setSessionId(customCode);
  };

  // Yêu cầu kết nối vào phòng có sẵn (Kiểm tra xem phòng có mật khẩu hay không)
  const handleRequestConnect = async (targetCode: string) => {
    try {
      const probeResult = await probeSession(targetCode);

      // Nếu phòng có mật khẩu: KHÔNG chuyển vào ngay, giữ ở phòng hiện tại và mở popup pass
      if (probeResult.hasPassword && probeResult.passwordHash) {
        setPendingProtectedSession({
          targetSessionId: targetCode,
          expectedHash: probeResult.passwordHash,
        });
        return;
      }

      // Nếu phòng công khai hoặc chưa có ai: chuyển thẳng vào phòng
      setMessages([]);
      setRoomPassword('');
      setSessionId(targetCode);
    } catch {
      // Fallback
      setMessages([]);
      setRoomPassword('');
      setSessionId(targetCode);
    }
  };

  // Mở khóa phòng có mật khẩu thành công
  const handleUnlockSuccess = (targetSessionId: string, verifiedPassword: string) => {
    setMessages([]);
    setRoomPassword(verifiedPassword);
    setSessionId(targetSessionId);
    setPendingProtectedSession(null);
  };

  return (
    <div className="app-container" id="quicktext-app">
      <Header
        deviceCount={deviceCount}
        devices={devices}
        connectionStatus={connectionStatus}
        onNewSession={handleRandomSession}
        onOpenCustomSession={() => setIsCreateCustomOpen(true)}
        onOpenConnect={() => setIsConnectModalOpen(true)}
      />

      <main className="main-layout" id="quicktext-main">
        {/* Cột trái: Ghép đôi thiết bị bằng QR, Link & Mật khẩu phòng */}
        <aside className="sidebar-area" id="quicktext-sidebar">
          <SessionBridge
            sessionId={sessionId}
            sessionUrl={sessionUrl}
            password={roomPassword}
            onPasswordChange={handlePasswordChange}
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

      {/* Modal kết nối vào phòng */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleRequestConnect}
      />

      {/* Modal tạo phòng với mã tùy chọn */}
      <CreateCustomModal
        isOpen={isCreateCustomOpen}
        onClose={() => setIsCreateCustomOpen(false)}
        onCreate={handleCreateCustomSession}
      />

      {/* Modal yêu cầu nhập mật khẩu khi join vào phòng có pass */}
      <PasswordPromptModal
        isOpen={!!pendingProtectedSession}
        targetSessionId={pendingProtectedSession?.targetSessionId || ''}
        expectedHash={pendingProtectedSession?.expectedHash || ''}
        onClose={() => setPendingProtectedSession(null)}
        onSuccess={handleUnlockSuccess}
      />
    </div>
  );
};

export default App;
