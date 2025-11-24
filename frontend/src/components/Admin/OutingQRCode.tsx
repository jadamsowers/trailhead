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
            
            // Generate QR code with high error correction and large size
            const qrCodeUrl = await QRCode.toDataURL(outingUrl, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 2,
                color: {
                    dark: '#1a365d', // Dark blue color matching site theme
                    light: '#ffffff'
                },
                width: 400
            });
            
            setQrCodeDataUrl(qrCodeUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] cursor-pointer"
            onClick={onClose}
        >
            <div className="flex flex-col items-center max-w-md w-full mx-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-heading">
                        {outingName}
                    </h2>
                    <p className="text-lg text-gray-300">
                        Scan to view outing details
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Click anywhere to close
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-8 rounded-xl shadow-2xl">
                    {qrCodeDataUrl ? (
                        <img 
                            src={qrCodeDataUrl} 
                            alt={`QR code for ${outingName}`}
                            className="w-full h-auto max-w-sm"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    ) : (
                        <div className="w-80 h-80 flex items-center justify-center bg-gray-100 rounded">
                            <div className="text-gray-500">Generating QR code...</div>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-400">
                        QR code links to outing signup page
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OutingQRCode;