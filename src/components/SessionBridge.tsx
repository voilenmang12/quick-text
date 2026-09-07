import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, ShieldCheck, Link2 } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';

interface SessionBridgeProps {
  sessionId: string;
  sessionUrl: string;
}

export const SessionBridge: React.FC<SessionBridgeProps> = ({
  sessionId,
  sessionUrl,
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
        <span>Phiên kết nối</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="session-badge" id="session-id-display">{sessionId}</span>
          <button
            className="btn btn-secondary"
            id="btn-copy-session-id"
            onClick={handleCopyId}
            style={{ padding: '0.35rem 0.6rem' }}
            title="Sao chép mã phiên"
          >
            {copiedId ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="qr-wrapper" id="qr-code-container">
        <QRCodeSVG
          value={sessionUrl}
          size={190}
          level="M"
          includeMargin={false}
          imageSettings={{
            src: '/favicon.svg',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
        <div className="qr-caption">
          <QrCode size={15} color="#10B981" />
          <span>Quét bằng Camera điện thoại</span>
        </div>
      </div>

      {/* Shareable Link */}
      <div className="link-box" id="session-link-box">
        <Link2 size={16} color="#64748B" style={{ flexShrink: 0 }} />
        <input
          type="text"
          readOnly
          value={sessionUrl}
          className="link-input"
          id="session-url-input"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          className="btn btn-secondary"
          id="btn-copy-link"
          onClick={handleCopyLink}
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
        >
          {copiedLink ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Steps instructions */}
      <div className="steps-list">
        <div className="step-item">
          <span className="step-number">1</span>
          <span>Dùng điện thoại quét mã QR hoặc mở link trên để ghép đôi.</span>
        </div>
        <div className="step-item">
          <span className="step-number">2</span>
          <span>Dán văn bản hoặc mã OTP tại bất kỳ máy nào, nội dung sẽ đồng bộ tức thì.</span>
        </div>
      </div>

      {/* Privacy guarantee */}
      <div className="privacy-box" id="privacy-assurance-box">
        <ShieldCheck size={18} style={{ flexShrink: 0 }} />
        <span>Không lưu máy chủ • Tự động hủy dữ liệu khi đóng tab trình duyệt</span>
      </div>
    </div>
  );
};
