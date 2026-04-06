import React from 'react';

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  return (
    <div className="audio-root" aria-label="Audio narration">
      <div className="audio-header">
        <p className="audio-title">Audio narration</p>
        <span className="audio-badge">Beta</span>
      </div>
      <p className="audio-caption">
        Uses the exact audio URL returned by the backend cognitive engine.
      </p>
      <audio src={src} controls autoPlay className="audio-element">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;

