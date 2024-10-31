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

// Move getQRContent outside of DOMContentLoaded
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

// Also move activeTab declaration outside
let activeTab = 'url';

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const qrPreview = document.getElementById('qr-preview');
    const downloadPng = document.getElementById('download-png');
    const downloadSvg = document.getElementById('download-svg');
    const sizeSlider = document.getElementById('qr-size');
    const sizeValue = document.getElementById('size-value');

    let activePattern = 'square';
    let qrOptions = {
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#FFFFFF'
    };

    const generateQR = () => {
        if (!validateInput(activeTab)) {
            qrPreview.innerHTML = '<p class="placeholder-text">Enter valid data to generate QR code</p>';
            downloadPng.disabled = true;
            downloadSvg.disabled = true;
            return;
        }

        try {
            const qr = qrcode(0, 'L');
            const content = getQRContent();

            if (!content) {
                throw new Error('No content to generate QR code');
            }

            qr.addData(content);
            qr.make();

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Add high DPI support
            const scale = window.devicePixelRatio || 1;
            canvas.width = qrOptions.width * scale;
            canvas.height = qrOptions.height * scale;
            canvas.style.width = qrOptions.width + 'px';
            canvas.style.height = qrOptions.height + 'px';
            ctx.scale(scale, scale);

            // Clear canvas and draw background
            ctx.fillStyle = qrOptions.colorLight;
            ctx.fillRect(0, 0, qrOptions.width, qrOptions.height);

            const moduleCount = qr.getModuleCount();
            const moduleSize = Math.floor(Math.min(qrOptions.width, qrOptions.height) * 0.9 / moduleCount);
            const offsetX = Math.floor((qrOptions.width - moduleSize * moduleCount) / 2);
            const offsetY = Math.floor((qrOptions.height - moduleSize * moduleCount) / 2);

            ctx.fillStyle = qrOptions.colorDark;

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        const x = offsetX + col * moduleSize;
                        const y = offsetY + row * moduleSize;
                        drawQRModule(ctx, x, y, moduleSize);
                    }
                }
            }

            qrPreview.innerHTML = '';
            qrPreview.appendChild(canvas);

            downloadPng.disabled = false;
            downloadSvg.disabled = false;

        } catch (error) {
            console.error('Error generating QR code:', error);
            qrPreview.innerHTML = '<p class="placeholder-text">Error generating QR code</p>';
            downloadPng.disabled = true;
            downloadSvg.disabled = true;
        }
    };

    const drawQRModule = (ctx, x, y, size) => {
        switch (activePattern) {
            case 'dots':
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2 * 0.85, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'rounded':
                ctx.beginPath();
                const radius = size * 0.3;
                ctx.roundRect(x, y, size, size, radius);
                ctx.fill();
                break;

            case 'classy':
                ctx.beginPath();
                ctx.moveTo(x + size / 2, y);
                ctx.lineTo(x + size, y + size / 2);
                ctx.lineTo(x + size / 2, y + size);
                ctx.lineTo(x, y + size / 2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'diamond':
                const padding = size * 0.15;
                ctx.beginPath();
                ctx.moveTo(x + size / 2, y + padding);
                ctx.lineTo(x + size - padding, y + size / 2);
                ctx.lineTo(x + size / 2, y + size - padding);
                ctx.lineTo(x + padding, y + size / 2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'eye':
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2 * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2 * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = qrOptions.colorLight;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2 * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = qrOptions.colorDark;
                ctx.fill();
                break;

            default: // square
                ctx.fillRect(x, y, size, size);
        }
    };

    // Event Listeners
    sizeSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        qrOptions.width = size;
        qrOptions.height = size;
        sizeValue.textContent = `${size}×${size}`;
        generateQR();
    });

    document.querySelectorAll('.pattern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activePattern = btn.dataset.pattern;
            generateQR();
        });
    });

    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('custom')) {
                return;
            }
            document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Get colors from data attributes instead of computed style
            const presetColor = btn.dataset.color;
            const presetBg = btn.dataset.bg;

            if (presetColor && presetBg) {
                qrOptions.colorDark = presetColor;
                qrOptions.colorLight = presetBg;
                generateQR();
            }
        });
    });

    // Add tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            document.getElementById(`${activeTab}-tab`).classList.add('active');

            generateQR();
        });
    });

    // Add clear button functionality
    document.getElementById('clear-button').addEventListener('click', () => {
        document.querySelectorAll('.input').forEach(input => {
            input.value = '';
        });

        qrPreview.innerHTML = '<p class="placeholder-text">Enter data to generate QR code</p>';

        // Disable download buttons
        downloadPng.disabled = true;
        downloadSvg.disabled = true;
    });

    // Add download functionality
    downloadPng.addEventListener('click', () => {
        const canvas = qrPreview.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qr-code.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });

    // Add input event listeners for all input fields
    document.querySelectorAll('.input').forEach(input => {
        input.addEventListener('input', generateQR);
    });

    // Initial QR generation
    generateQR();

    // Add this to your DOMContentLoaded event listener
    const qrColorInput = document.getElementById('qr-color');
    const customColorBtn = document.getElementById('custom-color-btn');

    qrColorInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    qrColorInput.addEventListener('input', (e) => {
        qrOptions.colorDark = e.target.value;
        document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
        customColorBtn.classList.add('active');
        generateQR();
    });
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

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + D to download
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const downloadBtn = document.getElementById('download-png');
        if (!downloadBtn.disabled) downloadBtn.click();
    }

    // Ctrl/Cmd + Delete to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
        e.preventDefault();
        document.getElementById('clear-button').click();
    }
});

// Add touch support for mobile devices
const qrPreview = document.getElementById('qr-preview');
let touchStartX = 0;
let touchStartY = 0;

qrPreview.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

qrPreview.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // If it's more of a tap than a swipe
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const downloadBtn = document.getElementById('download-png');
        if (!downloadBtn.disabled) downloadBtn.click();
    }
});


const downloadQRCode = () => {
    const canvas = document.querySelector('#qr-preview canvas');
    if (!canvas) return;

    // Create a temporary canvas with padding
    const tempCanvas = document.createElement('canvas');
    const padding = 20; // Padding in pixels
    tempCanvas.width = canvas.width + (padding * 2);
    tempCanvas.height = canvas.height + (padding * 2);

    const ctx = tempCanvas.getContext('2d');
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original QR code in the center
    ctx.drawImage(canvas, padding, padding);

    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    link.download = `qrcode-${timestamp}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// Add error handling
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    alert('An error occurred. Please try again later.');
    return false;
};

const downloadSvg = () => {
    // Get the current QR code content and generate it again
    const content = getQRContent();
    if (!content) return;

    const qr = qrcode(0, 'L');
    qr.addData(content);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const padding = 20;

    // Calculate SVG size based on current canvas size
    const canvas = document.querySelector('#qr-preview canvas');
    if (!canvas) return;

    const size = canvas.width;
    const moduleSize = Math.floor((size - (padding * 2)) / moduleCount);
    const svgSize = size + (padding * 2);

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgSize);
    svg.setAttribute('height', svgSize);
    svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Add white background
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#FFFFFF');
    svg.appendChild(background);

    // Get current color and pattern
    const qrColor = document.querySelector('.color-preset.active')?.dataset.color ||
        document.getElementById('qr-color')?.value ||
        '#000000';
    const activePattern = document.querySelector('.pattern-btn.active')?.dataset.pattern || 'square';

    // Create group for QR modules
    const dotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dotsGroup.setAttribute('fill', qrColor);

    // Generate QR modules
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                const x = padding + (col * moduleSize);
                const y = padding + (row * moduleSize);

                let element;
                switch (activePattern) {
                    case 'dots':
                        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        element.setAttribute('cx', x + moduleSize / 2);
                        element.setAttribute('cy', y + moduleSize / 2);
                        element.setAttribute('r', moduleSize * 0.4);
                        break;
                    case 'rounded':
                        element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        element.setAttribute('x', x);
                        element.setAttribute('y', y);
                        element.setAttribute('width', moduleSize);
                        element.setAttribute('height', moduleSize);
                        element.setAttribute('rx', moduleSize * 0.3);
                        break;
                    default: // square pattern
                        element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        element.setAttribute('x', x);
                        element.setAttribute('y', y);
                        element.setAttribute('width', moduleSize);
                        element.setAttribute('height', moduleSize);
                }
                dotsGroup.appendChild(element);
            }
        }
    }

    svg.appendChild(dotsGroup);

    // Convert SVG to string and download
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    link.download = `qrcode-${timestamp}.svg`;
    link.href = URL.createObjectURL(svgBlob);
    link.click();
    URL.revokeObjectURL(link.href);
};

document.getElementById('download-svg').addEventListener('click', () => {
    if (!document.getElementById('download-svg').disabled) {
        downloadSvg();
    }
});