import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Clipboard,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  Code,
  KeyRound,
  Globe,
  Trash2,
  MessageSquare,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import type { StreamMessage, ConnectionStatus } from '../types';
import { copyToClipboard, formatTime } from '../utils/helpers';

interface ChatWorkspaceProps {
  messages: StreamMessage[];
  onSendMessage: (text: string) => void;
  onClearStream: () => void;
  disabled?: boolean;
  connectionStatus: ConnectionStatus;
  deviceCount: number;
}

const MAX_CHAR_LIMIT = 5000;

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  onSendMessage,
  onClearStream,
  disabled,
  connectionStatus,
  deviceCount,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Theo dõi vị trí cuộn để hiện nút cuộn xuống nếu user đang cuộn lên xem lịch sử
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isFarFromBottom);
  };

  // Sao chép tin nhắn
  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Gửi tin nhắn
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    if (trimmed.length > MAX_CHAR_LIMIT) {
      alert(`Text exceeds limit of ${MAX_CHAR_LIMIT.toLocaleString()} characters!`);
      return;
    }

    onSendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Xử lý phím Enter (Enter gửi, Shift+Enter xuống dòng)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Dán từ clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setInputText((prev) => {
            const combined = prev ? `${prev}\n${clipText}` : clipText;
            return combined.slice(0, MAX_CHAR_LIMIT);
          });
          textareaRef.current?.focus();
        }
      }
    } catch {
      alert('Use Ctrl + V to paste directly into the box.');
    }
  };

  // Tự động điều chỉnh chiều cao textarea theo nội dung gõ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 160)}px`;
    }
  }, [inputText]);

  const charCount = inputText.length;
  const isWarning = charCount > MAX_CHAR_LIMIT * 0.9;

  return (
    <div className="chat-workspace" id="chat-workspace-container">
      {/* Header của Khung Chat */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-title">
            <MessageSquare size={16} className="text-emerald" />
            <span>Chat & Text Stream</span>
          </div>

          <div className="chat-header-meta">
            <span className={`chat-status-dot ${connectionStatus}`} />
            <span className="chat-status-text">
              {connectionStatus === 'connected'
                ? `${deviceCount} ${deviceCount === 1 ? 'device' : 'devices'} active`
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
            <span className="chat-count-pill">
              {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="btn-clear-chat"
            id="btn-clear-chat-history"
            onClick={onClearStream}
            title="Clear current stream from screen"
          >
            <Trash2 size={13} />
            <span>Clear list</span>
          </button>
        )}
      </div>

      {/* Khu vực Tin nhắn (Cuộn bên trong, tin mới nhất ở dưới) */}
      <div
        className="chat-messages-area"
        id="chat-messages-scroll-box"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="chat-empty-state" id="chat-empty-state">
            <div className="chat-empty-icon">
              <Sparkles size={26} color="#10B981" />
            </div>
            <div className="chat-empty-title">Ready for real-time text sync</div>
            <p className="chat-empty-subtitle">
              Type or paste OTP, links, or code below to instantly share. Newest messages
              will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="chat-messages-list" id="chat-messages-list">
            {messages.map((msg) => {
              const isCopied = copiedId === msg.id;

              return (
                <article
                  key={msg.id}
                  className={`chat-message-card ${msg.isSelf ? 'is-self' : 'is-remote'}`}
                  id={`chat-msg-${msg.id}`}
                >
                  {/* Topbar của tin nhắn */}
                  <div className="chat-card-topbar">
                    <div className="chat-card-meta">
                      <div className={`chat-device-tag ${msg.isSelf ? 'self' : 'remote'}`}>
                        {msg.senderDevice === 'mobile' ? (
                          <Smartphone size={13} />
                        ) : (
                          <Monitor size={13} />
                        )}
                        <span>{msg.isSelf ? 'This device' : msg.senderName}</span>
                      </div>

                      <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>

                      {msg.contentType === 'otp' && (
                        <span className="chat-type-pill otp">
                          <KeyRound size={11} />
                          OTP
                        </span>
                      )}
                      {msg.contentType === 'url' && (
                        <span className="chat-type-pill url">
                          <Globe size={11} />
                          LINK
                        </span>
                      )}
                      {msg.contentType === 'code' && (
                        <span className="chat-type-pill code">
                          <Code size={11} />
                          CODE
                        </span>
                      )}
                    </div>

                    <div className="chat-card-actions">
                      {msg.contentType === 'url' && (
                        <a
                          href={msg.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chat-action-link"
                          id={`btn-open-${msg.id}`}
                        >
                          <ExternalLink size={12} />
                          <span>Open</span>
                        </a>
                      )}

                      <button
                        type="button"
                        className={`chat-copy-btn ${isCopied ? 'copied' : ''}`}
                        id={`btn-copy-${msg.id}`}
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

                  {/* Nội dung đầy đủ không bị co rút */}
                  <div className="chat-card-body">
                    {msg.contentType === 'otp' ? (
                      <div className="chat-otp-view" id={`otp-val-${msg.id}`}>
                        {msg.text}
                      </div>
                    ) : msg.contentType === 'code' ? (
                      <pre className="chat-code-view">
                        <code>{msg.text}</code>
                      </pre>
                    ) : (
                      <div className="chat-text-view">{msg.text}</div>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </div>
        )}

        {/* Nút trượt nhanh xuống dưới cùng nếu người dùng đang cuộn lên */}
        {showScrollBottom && (
          <button
            type="button"
            className="btn-scroll-bottom"
            onClick={() => scrollToBottom(true)}
            title="Scroll to latest message"
          >
            <ArrowDown size={16} />
            <span>Latest</span>
          </button>
        )}
      </div>

      {/* Input gửi văn bản ghim ở DƯỚI CÙNG */}
      <div className="chat-input-container" id="chat-input-container">
        <div className="chat-input-box-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            id="chat-input-textarea"
            rows={1}
            placeholder="Type a message, paste OTP or link... (Enter to send, Shift+Enter for new line)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHAR_LIMIT))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>

        <div className="chat-input-toolbar">
          <div className="chat-toolbar-left">
            <span className="chat-shortcut-hint">
              <kbd>Enter</kbd> send • <kbd>Shift</kbd>+<kbd>Enter</kbd> newline
            </span>
            <span className={`chat-char-counter ${isWarning ? 'warning' : ''}`}>
              {charCount.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()}
            </span>
          </div>

          <div className="chat-toolbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-chat-paste"
              id="btn-chat-paste"
              onClick={handlePasteFromClipboard}
              title="Paste from clipboard"
            >
              <Clipboard size={14} />
              <span>Paste</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-chat-send"
              id="btn-chat-send"
              onClick={handleSend}
              disabled={disabled || !inputText.trim()}
              title="Send text"
            >
              <Send size={14} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
