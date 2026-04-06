import React from 'react';
import { Info, List, Gauge, Accessibility } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="about-root">
      <h2 className="panel-title">About & Help</h2>
      <section className="about-section">
        <h3><Info size={16} /> How to Use the Tool</h3>
        <ol>
          <li>Go to the Simplifier page.</li>
          <li>Enter your User ID.</li>
          <li>Paste the text you want to simplify.</li>
          <li>Select a reading profile.</li>
          <li>Enable dyslexia mode or audio mode if needed.</li>
          <li>Click <em>Simplify Text</em>.</li>
          <li>View the cognitive analysis and simplified output.</li>
        </ol>
      </section>

      <section className="about-section">
        <h3><List size={16} /> Key Features</h3>
        <ul>
          <li><strong>Cognitive Load Analysis</strong><br />Measures reading difficulty using linguistic metrics and generates a score (0–100).</li>
          <li><strong>Sentence Heatmap</strong><br />Highlights difficult sentences to identify cognitive spikes.</li>
          <li><strong>Adaptive Simplification</strong><br />Automatically simplifies complex sentences and adjusts based on your reading profile.</li>
          <li><strong>Dyslexia Support</strong><br />Optimized typography, improved spacing, and sentence chunking.</li>
          <li><strong>Audio Narration</strong><br />Converts simplified text into speech for auditory learners.</li>
        </ul>
      </section>

      <section className="about-section">
        <h3><Gauge size={16} /> Understanding the Cognitive Score</h3>
        <p>The cognitive score ranges from 0 to 100 and indicates overall reading difficulty:</p>
        <ul>
          <li><strong>0–40</strong> → Low difficulty</li>
          <li><strong>41–70</strong> → Moderate difficulty</li>
          <li><strong>71–100</strong> → High cognitive load</li>
        </ul>
        <p>The score considers sentence length, word complexity, and other reading difficulty metrics.</p>
      </section>

      <section className="about-section">
        <h3><Accessibility size={16} /> Accessibility Features</h3>
        <ul>
          <li>ADHD focus mode (sentence isolation)</li>
          <li>Dyslexia-friendly formatting</li>
          <li>Text-to-speech audio narration</li>
          <li>Cognitive load reduction analysis</li>
        </ul>
      </section>
    </div>
  );
};

export default About;
