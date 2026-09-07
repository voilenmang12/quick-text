import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { hashPassword } from '../utils/helpers';

interface PasswordPromptModalProps {
  isOpen: boolean;
  targetSessionId: string;
  expectedHash: string;
  onClose: () => void;
  onSuccess: (targetSessionId: string, password: string) => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  targetSessionId,
  expectedHash,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsVerifying(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the session password.');
      return;
    }

    setIsVerifying(true);
    setError('');

    const inputHash = await hashPassword(password);
    if (inputHash === expectedHash) {
      setIsVerifying(false);
      onSuccess(targetSessionId, password);
      onClose();
    } else {
      setIsVerifying(false);
      setError('Incorrect password! You remain in your current room.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="password-modal-backdrop">
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        id="password-modal-dialog"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon password-icon">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="modal-title">Password Required</h3>
              <p className="modal-subtitle">
                Session <strong className="highlight-code">{targetSessionId}</strong> is password protected
              </p>
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
          <div className="modal-input-wrapper password-input-wrap">
            <Lock size={16} className="input-lock-icon" />
            <input
              ref={inputRef}
              type="password"
              className="modal-password-input"
              id="room-password-input-prompt"
              placeholder="Enter room password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="modal-error-box">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

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
              id="btn-confirm-password"
              disabled={!password || isVerifying}
            >
              <span>Unlock & Join</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
