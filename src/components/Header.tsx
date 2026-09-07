import React from 'react';
import { Zap, RefreshCw, Trash2, Monitor, Smartphone } from 'lucide-react';
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
          <Zap size={22} />
        </div>
        <div className="brand-text-group">
          <h1 className="brand-title">
            QuickText
            <span className="brand-badge">CLIPBOARD</span>
          </h1>
          <p className="brand-tagline">Instant cross-device text & OTP sync</p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Device presence pill */}
        <div 
          className="device-pill" 
          id="device-presence-pill"
          title={devices.map(d => `${d.deviceName} (${d.deviceType})`).join(', ') || 'Waiting for devices'}
        >
          <span className={`status-dot ${isConnected ? '' : 'disconnected'}`} />
          <span className="device-count-text">
            {deviceCount <= 1 ? '1 device' : `${deviceCount} devices`}
          </span>
          {deviceCount > 1 && (
            <span className="device-icons-preview">
              {devices.some(d => d.deviceType === 'mobile') && <Smartphone size={13} />}
              {devices.some(d => d.deviceType === 'desktop') && <Monitor size={13} />}
            </span>
          )}
        </div>

        {/* New session button */}
        <button
          className="btn btn-secondary btn-compact"
          id="btn-new-session"
          onClick={onNewSession}
          title="Start a new session"
        >
          <RefreshCw size={14} />
          <span className="btn-label">New</span>
        </button>

        {/* Clear/Leave button */}
        <button
          className="btn btn-danger btn-compact"
          id="btn-leave-session"
          onClick={onClearSession}
          title="Clear session and disconnect"
        >
          <Trash2 size={14} />
          <span className="btn-label">Reset</span>
        </button>
      </div>
    </header>
  );
};

