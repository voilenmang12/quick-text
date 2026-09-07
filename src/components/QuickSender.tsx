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
      alert(`Text exceeds limit of ${MAX_CHAR_LIMIT.toLocaleString()} characters!`);
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
      alert('Use Ctrl + V to paste directly into the box.');
    }
  };

  // Tự co giãn chiều cao textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 72), 220)}px`;
    }
  }, [text]);

  const charCount = text.length;
  const isWarning = charCount > MAX_CHAR_LIMIT * 0.9;

  return (
    <div className="sender-card" id="quick-sender-box">
      <div className="sender-header">
        <div className="sender-title">
          <Sparkles size={15} color="#10B981" />
          <span>Quick Send</span>
        </div>
        <div className={`char-counter ${isWarning ? 'warning' : ''}`} id="char-counter">
          {charCount.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="sender-textarea"
        id="sender-input-textarea"
        rows={2}
        placeholder="Type or paste OTP, link, text..."
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHAR_LIMIT))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <div className="sender-footer">
        <div className="sender-shortcuts">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
          <span>to send</span>
        </div>

        <div className="sender-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sender"
            id="btn-paste-clipboard"
            onClick={handlePasteFromClipboard}
            title="Paste from clipboard"
          >
            <Clipboard size={14} />
            <span>Paste</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sender"
            id="btn-send-text"
            onClick={handleSend}
            disabled={!text.trim() || disabled}
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
