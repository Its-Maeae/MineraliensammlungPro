import React, { useState, useEffect } from 'react';

interface ChartDataItem {
  label: string;
  count: number;
}

interface StatisticsPageProps {
  currentPage: string;
  showPage?: (page: string) => void;
  isAuthenticated?: boolean;
}

const chartTypes = [
  { value: 'name', label: 'Mineral' },
  { value: 'rock_type', label: 'Art' },
  { value: 'color', label: 'Farbe' },
  { value: 'location', label: 'Fundort' },
];

export default function StatisticsPage({ currentPage, showPage, isAuthenticated }: StatisticsPageProps) {
  const [chartType, setChartType] = useState<string>('name');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (currentPage === 'statistics') {
      loadChartData();
    }
  }, [chartType, currentPage]);

  const loadChartData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = forceRefresh 
        ? `/api/chart-data?type=${chartType}&force=true`
        : `/api/chart-data?type=${chartType}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Daten sind kein Array:', data);
        throw new Error('Ungültiges Datenformat');
      }
      
      setChartData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Fehler beim Laden der Chart-Daten:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChartData(true);
  };

  const maxCount = Math.max(...chartData.map(item => item.count), 1);

  const getBarColor = (index: number) => {
    const colors = [
      '#3b82f6', 
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="page active">
      <div className="container">
        <div className="page-header">
          <div className="page-header-content">
            <div>
              <h1 className="page-title">Sammlungsstatistik</h1>
              <p className="page-description">Visualisierung Ihrer Mineraliensammlung</p>
              {lastUpdate && (
                <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                  Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isAuthenticated && (
                <button 
                  className="btn btn-secondary btn-large"
                  onClick={handleRefresh}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  title="Statistiken neu laden"
                >
                  <span></span>
                  <span>{loading ? 'Lädt...' : 'Aktualisieren'}</span>
                </button>
              )}
              {showPage ? (
                <button 
                  className="btn btn-secondary btn-large"
                  onClick={() => showPage('collection')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span></span>
                  <span>Zur Sammlung</span>
                </button>
              ) : (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => window.location.href = '/?page=collection'}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span></span>
                  <span>Zur Sammlung</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: '20px', 
            margin: '20px 0', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px'
          }}>
            <strong>Fehler:</strong> {error}
            <br />
            <small>Öffne die Browser-Konsole (F12) für Details</small>
          </div>
        )}

        {loading ? (
          <div className="loading">Lade Statistiken...</div>
        ) : error ? (
          <div className="no-data">
            <p>Fehler beim Laden der Daten</p>
            <button 
              className="btn btn-secondary"
              onClick={() => loadChartData()}
              style={{ marginTop: '10px' }}
            >
              Erneut versuchen
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="no-data">
            <p>Keine Daten für diese Kategorie verfügbar</p>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
              Typ: {chartType} | Anzahl Einträge: {chartData.length}
            </p>
          </div>
        ) : (
          <div className="chart-container">
            <div className="chart-header">
              <h2>Top {chartData.length} - {chartTypes.find(t => t.value === chartType)?.label}</h2>
              <div className="chart-type-buttons">
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    className={`chart-type-btn ${chartType === type.value ? 'active' : ''}`}
                    onClick={() => setChartType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bar-chart">
              <div className="y-axis">
                <div className="y-axis-label">Anzahl</div>
                <div className="y-axis-ticks">
                  {[...Array(6)].map((_, i) => {
                    const value = Math.round((maxCount / 5) * (5 - i));
                    return (
                      <div key={i} className="y-tick">
                        <span>{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="chart-area">
                <div className="bars-container">
                  {chartData.map((item, index) => (
                    <div key={index} className="bar-wrapper">
                      <div className="bar-container">
                        <div 
                          className="bar"
                          style={{
                            height: `${(item.count / maxCount) * 100}%`,
                            backgroundColor: getBarColor(index)
                          }}
                        >
                          <span className="bar-value">{item.count}</span>
                        </div>
                      </div>
                      <div className="bar-label">
                        <span title={item.label}>{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="x-axis">
                  <div className="x-axis-label">
                    {chartTypes.find(t => t.value === chartType)?.label}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-summary">
              <div className="summary-card">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                  <div className="summary-value">{chartData.reduce((sum, item) => sum + item.count, 0)}</div>
                  <div className="summary-label">Gesamtanzahl</div>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">🏆</div>
                <div className="summary-content">
                  <div className="summary-value">{chartData[0]?.label || '-'}</div>
                  <div className="summary-label">Häufigste Kategorie</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}