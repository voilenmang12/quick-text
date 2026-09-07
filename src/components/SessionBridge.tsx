import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, ShieldCheck, Link2, Lock, Unlock, X } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';

interface SessionBridgeProps {
  sessionId: string;
  sessionUrl: string;
  password: string;
  onPasswordChange: (newPassword: string) => void;
}

export const SessionBridge: React.FC<SessionBridgeProps> = ({
  sessionId,
  sessionUrl,
  password,
  onPasswordChange,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyId = async () => {
    const ok = await copyToClipboard(sessionId);
    if (ok) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(sessionUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="sidebar-card" id="session-bridge-card">
      <div className="sidebar-title">
        <span>Session Bridge</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="session-badge" id="session-id-display">{sessionId}</span>
          <button
            className="btn btn-secondary btn-icon-only"
            id="btn-copy-session-id"
            onClick={handleCopyId}
            title="Copy Session ID"
          >
            {copiedId ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="qr-wrapper" id="qr-code-container">
        <QRCodeSVG
          value={sessionUrl}
          size={160}
          level="M"
          includeMargin={false}
          imageSettings={{
            src: '/favicon.svg',
            x: undefined,
            y: undefined,
            height: 28,
            width: 28,
            excavate: true,
          }}
        />
        <div className="qr-caption">
          <QrCode size={14} color="#10B981" />
          <span>Scan with mobile camera</span>
        </div>
      </div>

      {/* Shareable Link */}
      <div className="link-box" id="session-link-box">
        <Link2 size={15} color="#64748B" style={{ flexShrink: 0 }} />
        <input
          type="text"
          readOnly
          value={sessionUrl}
          className="link-input"
          id="session-url-input"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          className="btn btn-secondary btn-copy-link"
          id="btn-copy-link"
          onClick={handleCopyLink}
        >
          {copiedLink ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          <span style={{ fontSize: '0.75rem' }}>{copiedLink ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Room Password Input Box */}
      <div className={`password-box ${password ? 'is-locked' : ''}`} id="session-password-box">
        <div className="password-box-icon">
          {password ? (
            <Lock size={15} color="#10B981" />
          ) : (
            <Unlock size={15} color="#64748B" />
          )}
        </div>
        <input
          type="text"
          className="password-input"
          id="session-password-input"
          placeholder="Room password (empty = public)..."
          value={password}
          maxLength={20}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
        {password && (
          <button
            type="button"
            className="password-clear-btn"
            id="btn-clear-password"
            onClick={() => onPasswordChange('')}
            title="Remove room password"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Steps instructions */}
      <div className="steps-list">
        <div className="step-item">
          <span className="step-number">1</span>
          <span>Scan QR or share link with another device to pair.</span>
        </div>
        <div className="step-item">
          <span className="step-number">2</span>
          <span>
            {password ? (
              <span style={{ color: '#10B981' }}>Password protected: New devices must enter passcode to join.</span>
            ) : (
              <span>Paste text, OTP or code anywhere to sync instantly.</span>
            )}
          </span>
        </div>
      </div>

      {/* Privacy guarantee */}
      <div className="privacy-box" id="privacy-assurance-box">
        <ShieldCheck size={16} style={{ flexShrink: 0 }} />
        <span>RAM only • Zero server logs • Auto-clears on tab close</span>
      </div>
    </div>
  );
};
