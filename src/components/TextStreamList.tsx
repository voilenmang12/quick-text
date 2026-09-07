import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Inbox, Smartphone, Monitor, Code, KeyRound, Globe, FileText } from 'lucide-react';
import type { StreamMessage } from '../types';
import { copyToClipboard, formatTime } from '../utils/helpers';

interface TextStreamListProps {
  messages: StreamMessage[];
}

export const TextStreamList: React.FC<TextStreamListProps> = ({ messages }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

  return (
    <section className="stream-section" id="stream-section">
      <div className="stream-header">
        <h2 className="stream-title">
          <span>Received Stream</span>
          <span className="stream-count-badge" id="stream-count-badge">
            {messages.length} {messages.length === 1 ? 'item' : 'items'}
          </span>
        </h2>
      </div>

      {messages.length === 0 ? (
        <div className="empty-stream" id="empty-stream-placeholder">
          <div className="empty-icon">
            <Inbox size={22} />
          </div>
          <div className="empty-title">No texts in this session yet</div>
          <p className="empty-subtitle">
            Send text from above or pair another device via QR code below.
          </p>
        </div>
      ) : (
        <div className="stream-list" id="stream-cards-list">
          {messages.map((msg) => {
            const isCopied = copiedId === msg.id;

            return (
              <article
                key={msg.id}
                className={`stream-card ${msg.isSelf ? 'is-self' : 'is-remote'}`}
                id={`stream-card-${msg.id}`}
              >
                <div className="card-topbar">
                  <div className={`device-indicator ${msg.isSelf ? 'self' : 'remote'}`}>
                    {msg.senderDevice === 'mobile' ? (
                      <Smartphone size={14} />
                    ) : (
                      <Monitor size={14} />
                    )}
                    <span>
                      {msg.isSelf ? 'This device' : msg.senderName}
                    </span>
                  </div>

                  <div className="card-meta">
                    {msg.contentType === 'otp' && (
                      <span className="type-pill otp">
                        <KeyRound size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        OTP
                      </span>
                    )}
                    {msg.contentType === 'url' && (
                      <span className="type-pill url">
                        <Globe size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        LINK
                      </span>
                    )}
                    {msg.contentType === 'code' && (
                      <span className="type-pill code">
                        <Code size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        CODE
                      </span>
                    )}
                    {msg.contentType === 'text' && (
                      <span className="type-pill text">
                        <FileText size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        TEXT
                      </span>
                    )}

                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="card-content">
                  {msg.contentType === 'otp' ? (
                    <div className="otp-display" id={`otp-value-${msg.id}`}>{msg.text}</div>
                  ) : msg.contentType === 'code' ? (
                    <pre className="code-display">
                      <code>{msg.text}</code>
                    </pre>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>

                {/* 1-Click Copy Button */}
                <div className="card-actionbar">
                  {msg.contentType === 'url' && (
                    <a
                      href={msg.text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-link-btn"
                      id={`btn-open-link-${msg.id}`}
                    >
                      <ExternalLink size={13} />
                      <span>Open</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className={`copy-btn ${isCopied ? 'copied' : ''}`}
                    id={`btn-copy-card-${msg.id}`}
                    onClick={() => handleCopy(msg.id, msg.text)}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
