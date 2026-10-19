import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import './Controls.css';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

export default function LanguageSelector() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('rpl_lang') || 'en';
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (code) => {
    setLang(code);
    localStorage.setItem('rpl_lang', code);
    setIsOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="dropdown-container">
      <button
        className="control-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        title="Select Language"
      >
        <Globe size={18} className="text-sky" />
        <span className="control-btn-label">{current.native}</span>
      </button>

      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div className="dropdown-menu glass-panel animate-fade-in">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                className={`dropdown-item ${item.code === lang ? 'active' : ''}`}
                onClick={() => handleSelect(item.code)}
              >
                <span className="lang-native">{item.native}</span>
                <span className="lang-label">({item.label})</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
