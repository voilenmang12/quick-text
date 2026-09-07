import React from 'react';
import { Zap, RefreshCw, Radio, PlusCircle, Monitor, Smartphone } from 'lucide-react';
import type { ConnectionStatus, DeviceInfo } from '../types';

interface HeaderProps {
  deviceCount: number;
  devices: DeviceInfo[];
  connectionStatus: ConnectionStatus;
  onNewSession: () => void;
  onOpenCustomSession: () => void;
  onOpenConnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceCount,
  devices,
  connectionStatus,
  onNewSession,
  onOpenCustomSession,
  onOpenConnect,
}) => {
  const isConnected = connectionStatus === 'connected';

  return (
    <header className="navbar" id="quicktext-navbar">
      <div className="navbar-main-row">
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
      </div>

      {/* Action buttons group: automatically moves to second line on mobile */}
      <div className="nav-buttons-group" id="nav-actions-group">
        <button
          className="btn btn-secondary btn-compact"
          id="btn-new-session"
          onClick={onNewSession}
          title="Create a random session"
        >
          <RefreshCw size={13} />
          <span className="btn-label">Random</span>
        </button>

        <button
          className="btn btn-secondary btn-compact"
          id="btn-custom-session"
          onClick={onOpenCustomSession}
          title="Create a room with your custom code"
        >
          <PlusCircle size={13} />
          <span className="btn-label">Custom</span>
        </button>

        <button
          className="btn btn-connect btn-compact"
          id="btn-open-connect"
          onClick={onOpenConnect}
          title="Join an existing session by code"
        >
          <Radio size={13} />
          <span className="btn-label">Connect</span>
        </button>
      </div>
    </header>
  );
};
