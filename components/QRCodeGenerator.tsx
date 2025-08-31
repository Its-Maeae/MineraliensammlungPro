import React, { useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  shelfId: number;
  shelfName: string;
  fullCode: string;
  baseUrl?: string;
}

export default function QRCodeGenerator({ 
  shelfId, 
  shelfName, 
  fullCode, 
  baseUrl = 'http://192.168.178.50:8085' 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isGenerated, setIsGenerated] = React.useState(false);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // URL zum direkten Aufrufen des Regals
      const qrUrl = `${baseUrl}?shelf=${shelfId}`;
      
      // QR-Code generieren
      await QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setIsGenerated(true);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
      alert('Fehler beim Generieren des QR-Codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current || !isGenerated) return;
    
    // Canvas als Bild herunterladen
    const link = document.createElement('a');
    link.download = `qr-code-${fullCode}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const printQRCode = () => {
    if (!canvasRef.current || !isGenerated) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const imageData = canvasRef.current.toDataURL('image/png');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR-Code für ${shelfName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              border: 1px solid #ddd; 
              padding: 20px; 
              margin: 20px auto; 
              width: 300px; 
            }
            h2 { margin: 10px 0; }
            p { margin: 5px 0; color: #666; }
            img { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${shelfName}</h2>
            <p>Regal-Code: ${fullCode}</p>
            <img src="${imageData}" alt="QR-Code" />
            <p style="font-size: 12px;">
              QR-Code scannen zum direkten Zugriff auf das Regal
            </p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="qr-code-generator">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button 
          className="btn btn-primary"
          onClick={generateQRCode}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generiere...' : 'QR-Code generieren'}
        </button>
        
        {isGenerated && (
          <>
            <button 
              className="btn btn-secondary"
              onClick={downloadQRCode}
            >
              Herunterladen
            </button>
            <button 
              className="btn btn-secondary"
              onClick={printQRCode}
            >
              Drucken
            </button>
          </>
        )}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <canvas 
          ref={canvasRef}
          style={{ 
            border: isGenerated ? '1px solid #ddd' : 'none',
            borderRadius: '4px'
          }}
        />
        {isGenerated && (
          <p style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '10px' 
          }}>
            QR-Code für direkten Zugriff auf {shelfName} ({fullCode})
          </p>
        )}
      </div>
    </div>
  );
}