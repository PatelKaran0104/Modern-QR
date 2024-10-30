const validateInput = (activeTab) => {
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
            return document.getElementById('wifi-ssid').value.trim() !== '';
        case 'email':
            const toEmail = document.getElementById('email-to').value.trim();
            return toEmail !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail);
        default:
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
        qrPreview.innerHTML = '';

        if (content) {
            if (qrCode) {
                qrCode.clear();
                qrCode.makeCode(content);
            } else {
                qrCode = new QRCode(qrPreview, {
                    text: content,
                    width: qrOptions.width,
                    height: qrOptions.height,
                    colorDark: qrOptions.colorDark,
                    colorLight: qrOptions.colorLight,
                    correctLevel: QRCode.CorrectLevel.H
                });
            }

            downloadPng.disabled = false;
            downloadSvg.disabled = false;
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
        qrOptions.width = parseInt(e.target.value);
        qrOptions.height = parseInt(e.target.value);
        sizeValue.textContent = `${qrOptions.width}×${qrOptions.height}`;
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
        if (!qrCode) return;

        const canvas = qrPreview.querySelector('canvas');
        const svg = qrPreview.querySelector('svg');
        const fileName = `qr-code-${activeTab}-${new Date().getTime()}`;

        if (format === 'png' && canvas) {
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (format === 'svg' && svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const link = document.createElement('a');
            link.download = `${fileName}.svg`;
            link.href = URL.createObjectURL(svgBlob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
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
