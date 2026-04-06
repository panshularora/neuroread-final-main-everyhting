import React from 'react';
import { motion } from 'framer-motion';

interface DyslexiaToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

const DyslexiaToggle: React.FC<DyslexiaToggleProps> = ({ enabled, onToggle }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      className="toggle compact-toggle"
    >
      <motion.span
        className={`toggle-track ${enabled ? 'on' : ''}`}
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <motion.span
          className="toggle-knob"
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </motion.span>
      <span className="toggle-label">Dyslexia mode</span>
    </button>
  );
};

export default DyslexiaToggle;

