import * as THREE from 'three';

export class ActivitySign {
    constructor(w, h, style = {}, title = "AKTIVITAS 1", text = "Menentukan Perbedaan\nantara Drama, Puisi\ndan Prosa") {
        this.w = w;
        this.h = h;
        this.cW = 512;
        this.cH = Math.round(512 * (h / w));

        // Default Styles for a Blackboard
        this.style = {
            headerFontSize: style.headerFontSize || 32,
            contentFontSize: style.contentFontSize || 24,
            borderColor: style.borderColor || '#5C4033', // Dark Wood
            boardColor: style.boardColor || '#2F4F4F', // Dark Slate Gray
            textColor: style.textColor || '#F5F5F5', // Chalk White
            ...style
        };

        this.title = title;
        this.textContent = text;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cW;
        this.canvas.height = this.cH;
        this.ctx = this.canvas.getContext('2d');

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.anisotropy = 8;
        this.texture.colorSpace = THREE.SRGBColorSpace;

        const geom = new THREE.PlaneGeometry(w, h);
        geom.translate(0, h / 2, 0);

        this.material = new THREE.MeshStandardMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0.1
        });

        this.mesh = new THREE.Mesh(geom, this.material);
        this.mesh.castShadow = true;

        this.mesh.userData = {
            flatRotX: -Math.PI / 2,
            standRotX: -0.15,
            type: 'text'
        };

        this._drawBoard();
    }

    _drawBoard() {
        const { ctx, cW, cH, style } = this;
        ctx.clearRect(0, 0, cW, cH);

        const border = 20;

        // Draw Wooden Border
        ctx.fillStyle = style.borderColor;
        ctx.fillRect(0, 0, cW, cH);

        // Draw Inner Board
        ctx.fillStyle = style.boardColor;
        ctx.fillRect(border, border, cW - border * 2, cH - border * 2);

        // Inner frame shadow for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 4;
        ctx.strokeRect(border, border, cW - border * 2, cH - border * 2);

        // Header: AKTIVITAS 1
        ctx.fillStyle = style.textColor;
        ctx.font = `bold ${style.headerFontSize}px "Comic Sans MS", cursive, sans-serif`;
        ctx.textAlign = 'center';
        
        // Add chalk-like slight shadow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 2;
        
        ctx.fillText(this.title, cW / 2, border + 50);

        // Content
        ctx.font = `${style.contentFontSize}px "Comic Sans MS", cursive, sans-serif`;
        ctx.textAlign = 'center';
        
        this._wrap(ctx, this.textContent, cW / 2, border + 110, cW - border * 2 - 40, style.contentFontSize * 1.5);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw some chalk dust
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for(let i=0; i<50; i++) {
            const dx = border + Math.random() * (cW - border * 2);
            const dy = border + Math.random() * (cH - border * 2);
            ctx.beginPath();
            ctx.arc(dx, dy, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        this.texture.needsUpdate = true;

        this.mesh.userData.rawTitle = this.title;
        this.mesh.userData.rawText = this.textContent;
    }

    _wrap(ctx, text, x, y, maxW, lh) {
        const paras = text.split('\n');

        for (const para of paras) {
            let line = '';
            const words = para.split(' ');

            for (const word of words) {
                const test = line + word + ' ';

                if (ctx.measureText(test).width > maxW && line) {
                    ctx.fillText(line, x, y);
                    line = word + ' ';
                    y += lh;
                } else {
                    line = test;
                }
            }

            ctx.fillText(line, x, y);
            y += lh * 1.3;
        }
    }
}
