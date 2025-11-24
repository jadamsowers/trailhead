import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface OutingQRCodeProps {
    outingId: string;
    outingName: string;
    isVisible: boolean;
    onClose: () => void;
}

const OutingQRCode: React.FC<OutingQRCodeProps> = ({ outingId, outingName, isVisible, onClose }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    useEffect(() => {
        if (isVisible && outingId) {
            generateQRCode();
        }
    }, [isVisible, outingId]);

    const generateQRCode = async () => {
        try {
            // Generate URL that points to the outing signup page
            const baseUrl = window.location.origin;
            const outingUrl = `${baseUrl}/outings?outing=${outingId}`;
            
            // Generate QR code with high error correction and very large size for fullscreen display
            const qrCodeUrl = await QRCode.toDataURL(outingUrl, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 1, // Minimal margin for maximum size
                color: {
                    dark: '#1a365d', // Dark blue color matching site theme
                    light: '#ffffff'
                },
                width: 800 // Much larger size for fullscreen display
            });
            
            setQrCodeDataUrl(qrCodeUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-[9999] cursor-pointer p-4 sm:p-8"
            onClick={onClose}
        >
            {/* Header - Compact for mobile */}
            <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 font-heading">
                    {outingName}
                </h2>
                <p className="text-sm sm:text-lg text-gray-300 mb-1">
                    Scan to view outing details
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                    Click anywhere to close
                </p>
            </div>

            {/* QR Code - Fill most of the screen */}
            <div className="flex-1 flex items-center justify-center w-full max-w-full max-h-full">
                <div className="bg-white p-2 sm:p-4 md:p-6 rounded-lg shadow-2xl max-w-[90vw] max-h-[70vh] sm:max-w-[80vw] sm:max-h-[75vh] md:max-w-[70vw] md:max-h-[80vh] flex items-center justify-center">
                    {qrCodeDataUrl ? (
                        <img 
                            src={qrCodeDataUrl} 
                            alt={`QR code for ${outingName}`}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%' }}
                        />
                    ) : (
                        <div className="w-full h-full min-w-[200px] min-h-[200px] flex items-center justify-center bg-gray-100 rounded">
                            <div className="text-gray-500 text-center">
                                <div className="text-lg mb-2">⏳</div>
                                <div>Generating QR code...</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer info - Compact */}
            <div className="text-center mt-2 sm:mt-4 flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-400">
                    QR code links to outing signup page
                </p>
            </div>
        </div>
    );
};

export default OutingQRCode;