import React, { useState, useRef, useEffect } from 'react';
import { Send, Clipboard, Sparkles } from 'lucide-react';

interface QuickSenderProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const MAX_CHAR_LIMIT = 5000;

export const QuickSender: React.FC<QuickSenderProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (trimmed.length > MAX_CHAR_LIMIT) {
      alert(`Văn bản vượt quá giới hạn ${MAX_CHAR_LIMIT} ký tự!`);
      return;
    }
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText(clipText.slice(0, MAX_CHAR_LIMIT));
          textareaRef.current?.focus();
        }
      }
    } catch {
      // Trình duyệt có thể từ chối quyền đọc clipboard tự động
      alert('Vui lòng sử dụng phím tắt Ctrl + V để dán trực tiếp vào ô nhập.');
    }
  };

  // Tự co giãn chiều cao textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 260)}px`;
    }
  }, [text]);

  const charCount = text.length;
  const isWarning = charCount > MAX_CHAR_LIMIT * 0.9;

  return (
    <div className="sender-card" id="quick-sender-box">
      <div className="sender-header">
        <div className="sender-title">
          <Sparkles size={16} color="#10B981" />
          <span>Gửi văn bản đến các thiết bị</span>
        </div>
        <div className={`char-counter ${isWarning ? 'warning' : ''}`} id="char-counter">
          {charCount.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="sender-textarea"
        id="sender-input-textarea"
        rows={3}
        placeholder="Dán mã OTP, link, ghi chú hoặc văn bản vào đây để truyền sang các máy khác..."
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHAR_LIMIT))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <div className="sender-footer">
        <div className="sender-shortcuts">
          <span>Gợi ý:</span>
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
          <span>để gửi nhanh</span>
        </div>

        <div className="sender-actions">
          <button
            type="button"
            className="btn btn-secondary"
            id="btn-paste-clipboard"
            onClick={handlePasteFromClipboard}
            title="Đọc từ Clipboard máy tính"
          >
            <Clipboard size={15} />
            <span>Dán từ máy</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            id="btn-send-text"
            onClick={handleSend}
            disabled={!text.trim() || disabled}
          >
            <Send size={15} />
            <span>Gửi đến máy khác</span>
          </button>
        </div>
      </div>
    </div>
  );
};
