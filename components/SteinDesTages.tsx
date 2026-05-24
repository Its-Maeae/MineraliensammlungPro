import React, { useEffect, useState } from 'react';
import { Mineral } from '../types';

interface SteinDesTagesProps {
  onOpenMineral: (id: number) => void;
}

export default function SteinDesTages({ onOpenMineral }: SteinDesTagesProps) {
  const [mineral, setMineral] = useState<(Mineral & { date?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/minerals/minerals-of-the-day');
        if (!res.ok) throw new Error();
        setMineral(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="sdtag-wrapper">
      <div className="sdtag-loading">Lade Stein des Tages…</div>
    </div>
  );

  if (error || !mineral) return null;

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="sdtag-wrapper">
      <div className="sdtag-header">
        <div className="sdtag-eyebrow">
          <span className="sdtag-gem">✦</span>
          <span>Stein des Tages</span>
          <span className="sdtag-gem">✦</span>
        </div>
        <p className="sdtag-date">{today}</p>
      </div>

      <div
        className="sdtag-card"
        onClick={() => onOpenMineral(mineral.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenMineral(mineral.id)}
        aria-label={`Details zu ${mineral.name} anzeigen`}
      >
        <div className="sdtag-image-wrap">
          {mineral.image_path ? (
            <img
              src={`/uploads/${mineral.image_path}`}
              alt={mineral.name}
              className="sdtag-image"
            />
          ) : (
            <div className="sdtag-placeholder">🪨</div>
          )}
          <div className="sdtag-shimmer" />
        </div>

        <div className="sdtag-info">
          <h2 className="sdtag-name">{mineral.name}</h2>

          <div className="sdtag-meta">
            {mineral.number && (
              <span className="sdtag-badge">Nr. {mineral.number}</span>
            )}
            {mineral.color && (
              <span className="sdtag-badge">{mineral.color}</span>
            )}
            {mineral.rock_type && (
              <span className="sdtag-badge">{mineral.rock_type}</span>
            )}
          </div>

          {mineral.location && (
            <p className="sdtag-location">
              <span className="sdtag-icon">📍</span>
              {mineral.location}
            </p>
          )}

          {mineral.description && (
            <p className="sdtag-description">
              {mineral.description.length > 160
                ? mineral.description.slice(0, 160) + '…'
                : mineral.description}
            </p>
          )}

          <div className="sdtag-cta">Details ansehen →</div>
        </div>
      </div>
    </div>
  );
}