import React from 'react';

interface SettingsProps {
  defaultProfile: string;
  onProfileChange: (value: string) => void;
  dyslexiaDefault: boolean;
  onDyslexiaDefaultChange: (value: boolean) => void;
  audioDefault: boolean;
  onAudioDefaultChange: (value: boolean) => void;
  fontSize: 'small' | 'medium' | 'large';
  onFontSizeChange: (value: 'small' | 'medium' | 'large') => void;
  theme: 'light' | 'dark';
  onThemeChange: (value: 'light' | 'dark') => void;
}

const Settings: React.FC<SettingsProps> = ({
  defaultProfile,
  onProfileChange,
  dyslexiaDefault,
  onDyslexiaDefaultChange,
  audioDefault,
  onAudioDefaultChange,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
}) => {
  return (
    <div className="settings-root">
      <div className="settings-container">
        <div className="settings-header">
          <h2 className="panel-title">Settings</h2>
          <p className="panel-subtitle">This page controls user preferences.</p>
        </div>

        <div className="settings-body">
          <div className="settings-row">
            <label className="field-label">Default Profile</label>
            <select
              className="field-select"
              value={defaultProfile}
              onChange={(e) => onProfileChange(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="focus">Focus</option>
              <option value="easy_read">Easy read</option>
              <option value="academic">Academic</option>
            </select>
          </div>

          <div className="settings-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={dyslexiaDefault}
                onChange={(e) => onDyslexiaDefaultChange(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-custom" />
              Always enable dyslexia mode
            </label>
          </div>

          <div className="settings-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={audioDefault}
                onChange={(e) => onAudioDefaultChange(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-custom" />
              Enable audio narration
            </label>
          </div>

          <div className="settings-row">
            <label className="field-label">Text Size</label>
            <div className="button-group">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  className={`option-button ${fontSize === size ? 'active' : ''}`}
                  onClick={() => onFontSizeChange(size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <label className="field-label">Theme</label>
            <div className="button-group">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  className={`option-button ${theme === t ? 'active' : ''}`}
                  onClick={() => onThemeChange(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
