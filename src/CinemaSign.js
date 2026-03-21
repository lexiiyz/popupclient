import * as THREE from 'three';

export class CinemaSign {
    constructor(w, h, style = {}) {
        this.w = w;
        this.h = h;
        this.cW = 512;
        this.cH = Math.round(512 * (h / w));

        // Default Styles
        this.style = {
            headerFontSize: style.headerFontSize || 22,
            contentFontSize: style.contentFontSize || 17,
            frameColor: style.frameColor || '#EA1B21',
            panelColor: style.panelColor || '#FFFDF5',
            headerColor: style.headerColor || '#8B0000',
            contentColor: style.contentColor || '#1A1A1A',
            bulbColors: style.bulbColors || ['#FFF5CC', '#FFD54F', '#FFB300'],
            ...style
        };

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cW;
        this.canvas.height = this.cH;
        this.ctx = this.canvas.getContext('2d');

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.anisotropy = 8;
        this.texture.colorSpace = THREE.SRGBColorSpace;

        const geom = new THREE.PlaneGeometry(w, h);
        geom.translate(0, h / 2, 0);

        // 🔥 FIXED MATERIAL (less bright)
        this.material = new THREE.MeshStandardMaterial({
            map: this.texture,
            emissiveMap: this.texture,
            emissive: 0xffcc88,          // warm glow instead of pure white
            emissiveIntensity: 0.12,     // reduced from 0.4
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.05
        });

        this.mesh = new THREE.Mesh(geom, this.material);
        this.mesh.castShadow = true;

        this.mesh.userData = {
            flatRotX: -Math.PI / 2,
            standRotX: -0.1,
            type: 'text'
        };

        this._drawBase();
    }

    _drawBase() {
        const { ctx, cW, cH, style } = this;
        ctx.clearRect(0, 0, cW, cH);

        const inset = 60;
        const bevel = 12;

        // Bottom bevel (darker shade of frame color)
        ctx.fillStyle = this._shadeColor(style.frameColor, -40);
        ctx.beginPath();
        ctx.moveTo(inset, cH);
        ctx.lineTo(cW - inset, cH);
        ctx.lineTo(cW - inset + bevel, cH - bevel);
        ctx.lineTo(inset - bevel, cH - bevel);
        ctx.closePath();
        ctx.fill();

        // Main frame
        ctx.fillStyle = style.frameColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cW, 0);
        ctx.lineTo(cW - inset, cH - bevel);
        ctx.lineTo(inset, cH - bevel);
        ctx.closePath();
        ctx.fill();

        // Inner panel
        const margin = 28;
        const iInset = inset - margin * 0.6;
        ctx.fillStyle = style.panelColor;
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(cW - margin, margin);
        ctx.lineTo(cW - margin - iInset, cH - margin - bevel);
        ctx.lineTo(margin + iInset, cH - margin - bevel);
        ctx.closePath();
        ctx.fill();

        // 💡 Softer bulb glow
        const dotSize = 10;
        const spacing = 42;

        const drawBulb = (x, y) => {
            const grad = ctx.createRadialGradient(x, y, 2, x, y, dotSize);
            grad.addColorStop(0, style.bulbColors[0]);
            grad.addColorStop(0.4, style.bulbColors[1]);
            grad.addColorStop(0.7, style.bulbColors[2]);
            grad.addColorStop(1, 'rgba(255, 179, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        };

        // Top bulbs
        for (let x = margin; x <= cW - margin; x += spacing) {
            drawBulb(x, margin / 2);
        }

        // Bottom bulbs
        for (let x = margin + iInset; x <= cW - margin - iInset; x += spacing) {
            drawBulb(x, cH - margin / 2 - bevel);
        }

        // Side bulbs
        const steps = 5;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const xOffset = inset * t;
            const y = margin + (cH - margin * 2 - bevel) * t;

            drawBulb(margin / 2 + (xOffset / 2), y);
            drawBulb(cW - margin / 2 - (xOffset / 2), y);
        }

        this.texture.needsUpdate = true;
    }

    updateContent(data) {
        this._drawBase();

        const { ctx, cW, cH, style } = this;
        const margin = 28;

        // Header
        ctx.fillStyle = style.headerColor;
        ctx.font = `bold ${style.headerFontSize}px Georgia, serif`;
        ctx.textAlign = 'center';
        
        const headerText = data.header || 'MATERI UTAMA';
        const headerMaxW = cW - (margin * 2) - 40;
        
        let nextY = this._wrap(ctx, headerText, cW / 2, margin + 45, headerMaxW, style.headerFontSize * 1.2);

        // Content text — if QR exists, use left portion only
        const hasQR = !!data.qrcode;
        const textMaxW = hasQR ? (cW * 0.45) : (cW - (margin + 40) * 2 - 20);

        ctx.fillStyle = style.contentColor;
        ctx.font = `${style.contentFontSize}px Georgia, serif`;
        ctx.textAlign = 'left';

        const textMargin = margin + 40;
        const contentStartY = Math.max(margin + 85, nextY + 5);

        this._wrap(ctx, data.text || '', textMargin, contentStartY, textMaxW, style.contentFontSize * 1.5);

        this.texture.needsUpdate = true;

        this.mesh.userData.rawTitle = data.title || 'Materi';
        this.mesh.userData.rawText = data.text || '';

        // Load and draw QR code image if available
        if (hasQR) {
            const qrImg = new Image();
            qrImg.crossOrigin = 'anonymous';
            qrImg.onload = () => {
                const qrSize = Math.min(cH * 0.45, 150);
                const qrX = cW - margin - qrSize - 30;
                const qrY = contentStartY - 20;

                // White background with border
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
                ctx.fill();
                ctx.strokeStyle = '#d4c5a1';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw QR image
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                // Label
                ctx.fillStyle = '#8B4513';
                ctx.font = 'bold 13px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('Scan QR', qrX + qrSize / 2, qrY + qrSize + 18);

                this.texture.needsUpdate = true;
            };
            qrImg.src = data.qrcode;
        }
    }

    _wrap(ctx, text, x, y, maxW, lh) {
        const paras = text.split('\n');
        let currentY = y;

        for (const para of paras) {
            let line = '';
            const words = para.split(' ');

            for (const word of words) {
                const test = line + word + ' ';

                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line, x, currentY);
                    line = word + ' ';
                    currentY += lh;
                } else {
                    line = test;
                }
            }

            ctx.fillText(line, x, currentY);
            currentY += lh * 1.3;
        }
        return currentY;
    }

    _shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        R = Math.max(0, R);
        G = Math.max(0, G);
        B = Math.max(0, B);

        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }
}