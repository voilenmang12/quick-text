import React from 'react';
import { Zap, RefreshCw, LogOut, Monitor, Smartphone } from 'lucide-react';
import type { ConnectionStatus, DeviceInfo } from '../types';

interface HeaderProps {
  deviceCount: number;
  devices: DeviceInfo[];
  connectionStatus: ConnectionStatus;
  onNewSession: () => void;
  onClearSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceCount,
  devices,
  connectionStatus,
  onNewSession,
  onClearSession,
}) => {
  const isConnected = connectionStatus === 'connected';

  return (
    <header className="navbar" id="quicktext-navbar">
      <div className="brand-section">
        <div className="brand-icon" id="quicktext-brand-icon">
          <Zap size={24} />
        </div>
        <div>
          <h1 className="brand-title">
            QuickText
            <span className="brand-badge">REMOTE CLIPBOARD</span>
          </h1>
          <p className="brand-tagline">Truyền văn bản & mã OTP tức thì giữa điện thoại và máy tính</p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Device presence pill */}
        <div 
          className="device-pill" 
          id="device-presence-pill"
          title={devices.map(d => `${d.deviceName} (${d.deviceType})`).join(', ') || 'Chờ thiết bị khác'}
        >
          <span className={`status-dot ${isConnected ? '' : 'disconnected'}`} />
          <span>
            {deviceCount <= 1 ? (
              '1 thiết bị (Đang chờ...)'
            ) : (
              `${deviceCount} thiết bị online`
            )}
          </span>
          {deviceCount > 1 && (
            <span style={{ display: 'flex', gap: '4px', opacity: 0.8 }}>
              {devices.some(d => d.deviceType === 'mobile') && <Smartphone size={14} />}
              {devices.some(d => d.deviceType === 'desktop') && <Monitor size={14} />}
            </span>
          )}
        </div>

        {/* New session button */}
        <button
          className="btn btn-secondary"
          id="btn-new-session"
          onClick={onNewSession}
          title="Tạo một phiên làm việc mới"
        >
          <RefreshCw size={15} />
          <span>Phiên mới</span>
        </button>

        {/* Clear/Leave button */}
        <button
          className="btn btn-danger"
          id="btn-leave-session"
          onClick={onClearSession}
          title="Xóa trắng dữ liệu trên máy và hủy kết nối"
        >
          <LogOut size={15} />
          <span>Tự hủy</span>
        </button>
      </div>
    </header>
  );
};
