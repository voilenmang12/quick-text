import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { probeSession } from '../services/realtime';

interface CreateCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (customCode: string) => void;
}

export const CreateCustomModal: React.FC<CreateCustomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setIsChecking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setError('Please enter a session code.');
      return;
    }
    if (cleanCode.length < 2) {
      setError('Session code must be at least 2 characters.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const probeResult = await probeSession(cleanCode);
      if (probeResult.inUse) {
        setError(`Session code "${cleanCode}" is already in use by active devices! Please choose another code.`);
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
      onCreate(cleanCode);
      onClose();
    } catch {
      setIsChecking(false);
      onCreate(cleanCode);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="create-modal-backdrop">
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        id="create-modal-dialog"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon custom-create-icon">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="modal-title">Custom Session</h3>
              <p className="modal-subtitle">Pick your own unique session code</p>
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
              id="custom-session-input"
              placeholder="e.g. NET88"
              value={code}
              maxLength={12}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              autoComplete="off"
              spellCheck="false"
              disabled={isChecking}
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
              disabled={isChecking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-confirm-create-custom"
              disabled={!code.trim() || isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Create</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
