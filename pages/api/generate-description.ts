import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mineralName } = req.body;

  // Validierung
  if (!mineralName || typeof mineralName !== 'string' || mineralName.trim().length === 0) {
    return res.status(400).json({ error: 'Mineralname ist erforderlich' });
  }

  // Gemini API Key aus Umgebungsvariablen
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY ist nicht konfiguriert');
    return res.status(500).json({ error: 'API-Konfiguration fehlt' });
  }

  try {
    // Gemini AI initialisieren
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Verwende das Standard-Modell (gemini-1.5-flash ist empfohlen)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    });

    // Prompt für die Mineralbeschreibung
    const prompt = `Erstelle eine kurze, wissenschaftlich korrekte Beschreibung für das Mineral "${mineralName.trim()}".

Anforderungen:
- Beginne direkt mit der chemischen Formel in Fettschrift (z.B. **SiO₂**)
- Gib 2-3 Sätze zu den wichtigsten Eigenschaften (Farbe, Kristallsystem, Härte, Vorkommen)
- Falls das Mineral giftig, radioaktiv oder anderweitig gefährlich ist, füge am Ende eine deutliche Warnung in einer neuen Zeile hinzu: "⚠️ WARNUNG: [Beschreibung der Gefahr]"
- Verwende deutsche Sprache
- Sei präzise und fachlich korrekt
- Maximal 4 Sätze (ohne Warnung)
- Keine Einleitung, keine Überschriften, nur die Beschreibung

Beispiel:
**SiO₂** - Quarz ist eines der häufigsten Minerale der Erdkruste und kristallisiert im trigonalen System. Es hat eine Mohshärte von 7 und tritt in zahlreichen Farbvarianten auf. Wichtige Fundorte sind weltweit verbreitet.`;

    // Generierung starten
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    // Erfolgreiche Antwort zurückgeben
    return res.status(200).json({ 
      description: description.trim(),
      mineralName: mineralName.trim()
    });

  } catch (error: any) {
    console.error('Fehler bei der Gemini API-Anfrage:', error);
    
    // Detaillierte Fehlerinformationen loggen
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Spezifische Fehlerbehandlung
    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      return res.status(500).json({ error: 'API-Schlüssel ungültig oder nicht konfiguriert' });
    }
    
    if (error.message?.includes('quota') || error.status === 429) {
      return res.status(429).json({ error: 'API-Limit erreicht. Bitte später erneut versuchen.' });
    }

    if (error.message?.includes('model') || error.message?.includes('not found')) {
      return res.status(500).json({ error: 'Modell nicht verfügbar. Bitte Administrator kontaktieren.' });
    }
    
    return res.status(500).json({ 
      error: 'Fehler bei der KI-Generierung',
      details: error.message || 'Unbekannter Fehler'
    });
  }
}