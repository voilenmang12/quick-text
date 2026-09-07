import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Inbox, Smartphone, Monitor, Code, KeyRound, Globe, Trash2 } from 'lucide-react';
import type { StreamMessage } from '../types';
import { copyToClipboard, formatTime } from '../utils/helpers';

interface TextStreamListProps {
  messages: StreamMessage[];
  onClearStream?: () => void;
}

export const TextStreamList: React.FC<TextStreamListProps> = ({ messages, onClearStream }) => {
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

        {messages.length > 0 && onClearStream && (
          <button
            type="button"
            className="btn-clear-stream"
            onClick={onClearStream}
            title="Clear list from screen"
          >
            <Trash2 size={13} />
            <span>Clear list</span>
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="empty-stream" id="empty-stream-placeholder">
          <div className="empty-icon">
            <Inbox size={20} />
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
                  <div className="card-topbar-left">
                    <div className={`device-indicator ${msg.isSelf ? 'self' : 'remote'}`}>
                      {msg.senderDevice === 'mobile' ? (
                        <Smartphone size={13} />
                      ) : (
                        <Monitor size={13} />
                      )}
                      <span>{msg.isSelf ? 'This device' : msg.senderName}</span>
                    </div>

                    <span className="timestamp">{formatTime(msg.timestamp)}</span>

                    {msg.contentType === 'otp' && (
                      <span className="type-pill otp">
                        <KeyRound size={10} style={{ marginRight: 2 }} />
                        OTP
                      </span>
                    )}
                    {msg.contentType === 'url' && (
                      <span className="type-pill url">
                        <Globe size={10} style={{ marginRight: 2 }} />
                        LINK
                      </span>
                    )}
                    {msg.contentType === 'code' && (
                      <span className="type-pill code">
                        <Code size={10} style={{ marginRight: 2 }} />
                        CODE
                      </span>
                    )}
                  </div>

                  <div className="card-topbar-actions">
                    {msg.contentType === 'url' && (
                      <a
                        href={msg.text}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="open-link-btn"
                        id={`btn-open-link-${msg.id}`}
                      >
                        <ExternalLink size={12} />
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
                          <Check size={13} />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
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
                    <div className="text-body">{msg.text}</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
