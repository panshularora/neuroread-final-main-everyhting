import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SimplifiedTextProps {
  simplifiedText: string;
  isolationMode: boolean;
  dyslexiaEnabled: boolean;
}

const SimplifiedText: React.FC<SimplifiedTextProps> = ({
  simplifiedText,
  isolationMode,
  dyslexiaEnabled
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const activeText = useMemo(() => {
    return dyslexiaEnabled ? simplifiedText : simplifiedText;
  }, [ simplifiedText, dyslexiaEnabled]);

  const sentences = useMemo(() => {
    if (!activeText) return [];
    return activeText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeText]);

  const hasContent = sentences.length > 0;

  const nextSentence = () => {
    setCurrentIndex((prev) => (prev + 1 < sentences.length ? prev + 1 : prev));
  };

  const currentSentence = isolationMode && hasContent ? sentences[currentIndex] : null;

  return (
    <div className="simplified-root">
      <p className="simplified-label">
        {dyslexiaEnabled ? 'Dyslexia-adapted content' : 'Simplified content'}
      </p>

      <div
        className={`simplified-box ${
          dyslexiaEnabled ? 'simplified-dyslexia' : ''
        }`}
      >
        {!hasContent && (
          <p className="simplified-empty">
            Simplified text will appear here once you run an analysis.
          </p>
        )}

        {hasContent && !isolationMode && (
          <p className="simplified-text">{activeText}</p>
        )}

        {hasContent && isolationMode && (
          <div className="simplified-focus">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="simplified-text"
              >
                {currentSentence}
              </motion.p>
            </AnimatePresence>

            <div className="simplified-context">
              <p className="simplified-context-title">Context (dimmed)</p>
              <p className="simplified-context-body">
                {sentences.join(' ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {isolationMode && hasContent && currentIndex < sentences.length - 1 && (
        <div className="simplified-actions">
          <button
            type="button"
            onClick={nextSentence}
            className="secondary-button"
          >
            Next sentence
          </button>
        </div>
      )}
    </div>
  );
};

export default SimplifiedText;

