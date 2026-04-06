import React from 'react';
import type { UserProfile } from '../types/apiTypes';

interface TextInputProps {
  text: string;
  onTextChange: (value: string) => void;
  profile: UserProfile;
  onProfileChange: (value: UserProfile) => void;
  dyslexiaEnabled: boolean;
  onDyslexiaToggle: (value: boolean) => void;
  audioEnabled: boolean;
  onAudioToggle: (value: boolean) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  text,
  onTextChange,
  profile,
  onProfileChange,
  dyslexiaEnabled,
  onDyslexiaToggle,
  audioEnabled,
  onAudioToggle,
  userId,
  onUserIdChange,
  onSubmit,
  loading
}) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="text-input-root">
      {/* “dark” class applied here */}
      <div className="text-input-container dark">
        <div className="text-input-header">
          <h2 className="panel-title">Text simplifier</h2>
          <p className="panel-subtitle">
            Paste or type text to analyse and simplify according to your
            reading profile.
          </p>
        </div>

        <div className="text-input-top">
          <div className="text-input-field">
            <label htmlFor="user-id-input" className="field-label">
              User ID
            </label>
            <input
              id="user-id-input"
              type="text"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              className="field-input"
              placeholder="demo-user-001"
            />
            <p className="field-hint">
              Used to fetch your long‑term cognitive progress.
            </p>
          </div>

          <div className="text-input-field">
            <label htmlFor="profile-select" className="field-label">
              Reading profile
            </label>
            <select
              id="profile-select"
              value={profile}
              onChange={(e) =>
                onProfileChange(e.target.value as UserProfile)
              }
              className="field-select"
            >
              <option value="default">Default</option>
              <option value="focus">Focus</option>
              <option value="easy_read">Easy read</option>
              <option value="academic">Academic</option>
            </select>
          </div>
        </div>

        <div className="text-input-field textarea-field">
          <label htmlFor="input-textarea" className="field-label">
            Text to simplify
          </label>
          <textarea
            id="input-textarea"
            className="field-textarea"
            rows={7}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type text that may be cognitively demanding…
Press Ctrl/⌘ + Enter to simplify."
          />
        </div>

        <div className="text-input-controls">
          <div className="text-input-toggles">
            <button
              type="button"
              className={`toggle-btn ${dyslexiaEnabled ? 'active' : ''}`}
              onClick={() => onDyslexiaToggle(!dyslexiaEnabled)}
            >
              <span className="toggle-dot" />
              Dyslexia mode
            </button>

            <button
              type="button"
              className={`toggle-btn ${audioEnabled ? 'active' : ''}`}
              onClick={() => onAudioToggle(!audioEnabled)}
            >
              <span className="toggle-dot" />
              Audio mode
            </button>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={loading || !text.trim()}
            onClick={onSubmit}
          >
            {loading ? 'Simplifying…' : 'Simplify text'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInput;