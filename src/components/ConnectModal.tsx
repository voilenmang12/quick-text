import React, { useState, useEffect, useRef } from 'react';
import { Radio, X, ArrowRight } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (code: string) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a session code.');
      return;
    }
    if (cleanCode.length < 2) {
      setError('Code must be at least 2 characters.');
      return;
    }

    onConnect(cleanCode);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="connect-modal-backdrop">
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        id="connect-modal-dialog"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <Radio size={18} />
            </div>
            <div>
              <h3 className="modal-title">Connect Session</h3>
              <p className="modal-subtitle">Enter a session code to join an active room</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-icon-only modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="modal-code-input"
              id="connect-session-input"
              placeholder="e.g. Q3N4S5"
              value={code}
              maxLength={12}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {error && <div className="modal-error-text">{error}</div>}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-confirm-connect"
              disabled={!code.trim()}
            >
              <span>Connect</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
