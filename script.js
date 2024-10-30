const validateInput = (activeTab) => {
    try {
        switch (activeTab) {
            case 'url':
                const urlInput = document.getElementById('url-input').value;
                return urlInput.trim() !== '' && /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(urlInput);
            case 'text':
                return document.getElementById('text-input').value.trim() !== '';
            case 'contact':
                const name = document.getElementById('contact-name').value.trim();
                const phone = document.getElementById('contact-phone').value.trim();
                const email = document.getElementById('contact-email').value.trim();
                return name !== '' || phone !== '' || (email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value.trim();
                return ssid !== '';
            case 'email':
                const toEmail = document.getElementById('email-to').value.trim();
                return toEmail !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail);
            default:
                return false;
        }
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const qrPreview = document.getElementById('qr-preview');
    const downloadPng = document.getElementById('download-png');
    const downloadSvg = document.getElementById('download-svg');
    const clearButton = document.getElementById('clear-button');
    const sizeValue = document.getElementById('size-value');
    const toast = document.getElementById('toast');

    let qrCode;
    let activeTab = 'url';
    let qrOptions = {
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#FFFFFF'
    };

    const getQRContent = () => {
        switch (activeTab) {
            case 'url':
                return document.getElementById('url-input').value;
            case 'text':
                return document.getElementById('text-input').value;
            case 'contact':
                const name = document.getElementById('contact-name').value;
                const phone = document.getElementById('contact-phone').value;
                const email = document.getElementById('contact-email').value;
                return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value;
                const password = document.getElementById('wifi-password').value;
                return `WIFI:T:WPA;S:${ssid};P:${password};;`;
            case 'email':
                const toEmail = document.getElementById('email-to').value;
                const subject = document.getElementById('email-subject').value;
                const body = document.getElementById('email-body').value;
                return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            default:
                return '';
        }
    };

    const generateQR = () => {
        if (!validateInput(activeTab)) {
            qrPreview.innerHTML = '<p class="placeholder-text">Enter valid data to generate QR code</p>';
            downloadPng.disabled = true;
            downloadSvg.disabled = true;
            return;
        }

        const content = getQRContent();
        
        if (content) {
            try {
                // Clear previous QR code
                qrPreview.innerHTML = '';
                
                // Create new QR code instance
                const typeNumber = 0;
                const errorCorrectionLevel = 'H';
                const qr = qrcode(typeNumber, errorCorrectionLevel);
                qr.addData(content);
                qr.make();
                
                // Create canvas for custom coloring
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = qrOptions.width;
                canvas.height = qrOptions.height;
                
                // Set background color
                ctx.fillStyle = qrOptions.colorLight;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw QR code
                const moduleCount = qr.getModuleCount();
                const moduleSize = Math.floor(qrOptions.width / moduleCount);
                const offsetX = Math.floor((qrOptions.width - moduleSize * moduleCount) / 2);
                const offsetY = Math.floor((qrOptions.height - moduleSize * moduleCount) / 2);
                
                ctx.fillStyle = qrOptions.colorDark;
                
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(
                                offsetX + col * moduleSize,
                                offsetY + row * moduleSize,
                                moduleSize,
                                moduleSize
                            );
                        }
                    }
                }
                
                // Convert to image and display
                const qrImage = new Image();
                qrImage.src = canvas.toDataURL('image/png');
                qrPreview.appendChild(qrImage);
                
                downloadPng.disabled = false;
                downloadSvg.disabled = false;
                
            } catch (error) {
                console.error('Error generating QR code:', error);
                qrPreview.innerHTML = '<p class="placeholder-text">Error generating QR code</p>';
                downloadPng.disabled = true;
                downloadSvg.disabled = true;
            }
        } else {
            qrPreview.innerHTML = '<p class="placeholder-text">Enter data to generate QR code</p>';
            downloadPng.disabled = true;
            downloadSvg.disabled = true;
        }
    };

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            document.getElementById(`${activeTab}-tab`).classList.add('active');

            generateQR();
        });
    });

    // Input event listeners
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', generateQR);
    });

    // QR code options event listeners
    document.getElementById('qr-size').addEventListener('input', (e) => {
        // Round to nearest multiple of 50
        const roundedValue = Math.round(parseInt(e.target.value) / 50) * 50;
        e.target.value = roundedValue; // Update slider value

        qrOptions.width = roundedValue;
        qrOptions.height = roundedValue;
        sizeValue.textContent = `${roundedValue}×${roundedValue}`;
        generateQR();
    });

    document.getElementById('qr-color').addEventListener('input', (e) => {
        qrOptions.colorDark = e.target.value;
        generateQR();
    });

    document.getElementById('qr-bg-color').addEventListener('input', (e) => {
        qrOptions.colorLight = e.target.value;
        generateQR();
    });

    // Download functions
    const downloadQR = (format) => {
        const qrImage = qrPreview.querySelector('img');
        if (!qrImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = qrOptions.width;
        canvas.height = qrOptions.height;

        // Draw QR code on canvas
        ctx.fillStyle = qrOptions.colorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const fileName = `qr-code-${activeTab}-${new Date().getTime()}`;
            const link = document.createElement('a');

            if (format === 'png') {
                link.download = `${fileName}.png`;
                link.href = canvas.toDataURL('image/png');
            } else if (format === 'svg') {
                // Convert to SVG
                const svgData = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                        <image href="${canvas.toDataURL('image/png')}" width="100%" height="100%"/>
                    </svg>
                `;
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                link.download = `${fileName}.svg`;
                link.href = URL.createObjectURL(svgBlob);
            }

            link.click();
            if (format === 'svg') {
                URL.revokeObjectURL(link.href);
            }
        };
        img.src = qrImage.src;
    };

    // Clear all inputs
    const clearInputs = () => {
        document.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
        });
        generateQR();
    };

    // Event listeners for buttons
    downloadPng.addEventListener('click', () => downloadQR('png'));
    downloadSvg.addEventListener('click', () => downloadQR('svg'));
    clearButton.addEventListener('click', clearInputs);

    // Initialize
    generateQR();
});

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
