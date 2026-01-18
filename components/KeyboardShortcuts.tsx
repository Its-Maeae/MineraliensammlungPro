import { useEffect, useState } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface KeyboardShortcutsProps {
  showPage: (page: string) => void;
  currentPage: string;
  isAuthenticated: boolean;
  onOpenSearch?: () => void;
  onOpenFilters?: () => void;
  onClearFilters?: () => void;
  onEscape?: () => void;
}

export default function KeyboardShortcuts({
  showPage,
  currentPage,
  isAuthenticated,
  onOpenSearch,
  onOpenFilters,
  onClearFilters,
  onEscape
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      alt: true,
      action: () => showPage('home'),
      description: 'Zur Startseite',
      category: 'Navigation'
    },
    {
      key: 'v',
      alt: true,
      action: () => showPage('vitrines'),
      description: 'Zu den Vitrinen',
      category: 'Navigation'
    },
    {
      key: 's',
      alt: true,
      action: () => showPage('collection'),
      description: 'Zur Sammlung',
      category: 'Navigation'
    },
    {
      key: 'm',
      alt: true,
      action: () => showPage('map'),
      description: 'Zur Karte',
      category: 'Navigation'
    },
    {
      key: 'a',
      alt: true,
      action: () => showPage('admin'),
      description: 'Zur Verwaltung',
      category: 'Navigation'
    },
    
    {
      key: 'f',
      ctrl: true,
      action: () => {
        if (onOpenSearch) onOpenSearch();
        else {
          const searchInput = document.querySelector('.search-input') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }
      },
      description: 'Suche öffnen / fokussieren',
      category: 'Suche & Filter'
    },
    {
      key: 'k',
      ctrl: true,
      action: () => {
        if (onOpenFilters) onOpenFilters();
      },
      description: 'Filter öffnen',
      category: 'Suche & Filter'
    },
    {
      key: 'r',
      ctrl: true,
      shift: true,
      action: () => {
        if (onClearFilters) onClearFilters();
      },
      description: 'Filter zurücksetzen',
      category: 'Suche & Filter'
    },
    
    {
      key: 'Escape',
      action: () => {
        if (onEscape) {
          onEscape();
        } else {
          const closeButtons = document.querySelectorAll('.close-button, .modal');
          if (closeButtons.length > 0) {
            (closeButtons[0] as HTMLElement).click();
          }
        }
      },
      description: 'Modals schließen / Zurück',
      category: 'Allgemein'
    },
    {
      key: '?',
      shift: true,
      action: () => setShowHelp(!showHelp),
      description: 'Tastenkombinationen anzeigen',
      category: 'Allgemein'
    },
    
    ...(isAuthenticated ? [
      {
        key: 'n',
        ctrl: true,
        action: () => {
          if (currentPage === 'admin') {
            const firstInput = document.querySelector('#name') as HTMLInputElement;
            if (firstInput) firstInput.focus();
          }
        },
        description: 'Neues Mineral (auf Admin-Seite)',
        category: 'Admin'
      },
      {
        key: 'l',
        alt: true,
        shift: true,
        action: () => showPage('security'),
        description: 'Security-Logs öffnen',
        category: 'Admin'
      }
    ] : [])
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (isInputField && e.key !== 'Escape' && !(e.ctrlKey && e.key === 'f')) {
        return;
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey : !e.ctrlKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isAuthenticated, showPage, onOpenSearch, onOpenFilters, onClearFilters, onEscape]);

  if (!showHelp) return null;

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div 
      className="modal" 
      style={{ display: 'flex' }}
      onClick={() => setShowHelp(false)}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px' }}
      >
        <span className="close-button" onClick={() => setShowHelp(false)}>&times;</span>
        <h2>⌨️ Tastenkombinationen</h2>
        
        <div style={{ marginTop: '20px' }}>
          {categories.map(category => {
            const categoryShortcuts = shortcuts.filter(s => s.category === category);
            
            return (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  marginBottom: '12px',
                  color: '#333',
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  {category}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ color: '#555' }}>{shortcut.description}</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {shortcut.ctrl && <kbd>Strg</kbd>}
                        {shortcut.alt && <kbd>Alt</kbd>}
                        {shortcut.shift && <kbd>⇧</kbd>}
                        <kbd>{shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()}</kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          kbd {
            display: inline-block;
            padding: 4px 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            color: #333;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            min-width: 24px;
            text-align: center;
          }
        `}</style>
      </div>
    </div>
  );
}