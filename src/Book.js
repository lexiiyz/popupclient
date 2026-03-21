import * as THREE from 'three';
import { PageBase } from './pages/PageBase.js';
import { Page1 } from './pages/Page1.js';
import { Page2 } from './pages/Page2.js';
import { Page3 } from './pages/Page3.js';
import { Page4 } from './pages/Page4.js';
import { Page5 } from './pages/Page5.js';
import { Page6 } from './pages/Page6.js';
import { Page7 } from './pages/Page7.js';
import { Page8 } from './pages/Page8.js';
import { Page9 } from './pages/Page9.js';
import { Page10 } from './pages/Page10.js';
import { Page11 } from './pages/Page11.js';
import { Page12 } from './pages/Page12.js';
import { Page13 } from './pages/Page13.js';
import { Page14 } from './pages/Page14.js';
import { Page15 } from './pages/Page15.js';
import { Page16 } from './pages/Page16.js';
import { CinemaSign } from './CinemaSign.js';

/**
 * Coordinate system:
 *   Y = up, book lies flat on XZ plane
 *   Spine runs along Z at x=0
 *   Right side = +X, Left side = -X
 *   Page flip = rotation around Z axis (spine direction)
 *   Positive Z rotation = page lifts UP and goes from right to left
 */

const W = 7;
const H = 10;

export class Book {
    constructor() {
        this.group = new THREE.Group();
        this.currentSpread = 0;

        this._coverState = 'closed'; // 'closed' | 'opening' | 'open' | 'closing'
        this._coverAngle = 0;
        this._onCoverOpen = null;
        this._onCoverClose = null;

        this._isFlipping = false;
        this._flipDir = 0;

        this._bgImg = new Image();
        this._bgImg.src = '/assets/images/bg.png';
        this._bgImg.onload = () => {
            // Re-render ALL spreads to ensure background is applied everywhere
            if (this._contentData) {
                this.setContent(this._contentData);
            }
            if (this._lastData) this._renderSpread(this._lastData);
        };

        this._buildTable();
        this._buildCovers();
        this._buildStaticPages();
        this._buildFlipPage();
        this._buildAllPopups();

        // Start closed: hide pages
        this._leftPage.visible = false;
        this._rightPage.visible = false;
    }

    _buildTable() {
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshStandardMaterial({ color: 0x1a0e08, roughness: 0.95 })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -0.35;
        mesh.receiveShadow = true;
        this.group.add(mesh);
    }

    _buildCovers() {
        const loader = new THREE.TextureLoader();
        const coverTex = loader.load('/assets/images/cover.png');
        coverTex.colorSpace = THREE.SRGBColorSpace;

        const coverColor = 0x8B2500;
        const coverMat = new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.6 });
        const frontFaceMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.6 });

        // Get matching paper textures for inside spread base
        const { texLeft, texRight } = this._getPaperTextures();
        const paperLeftMat  = new THREE.MeshStandardMaterial({ map: texLeft,  roughness: 0.8 });
        const paperRightMat = new THREE.MeshStandardMaterial({ map: texRight, roughness: 0.8 });

        // Materials array for BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z]
        // Front Cover: Top (+Y) is outside cover, Bottom (-Y) is inside paper (becomes LEFT spread)
        const frontMats = [
            coverMat, coverMat, // sides
            frontFaceMat,       // top (outside)
            paperLeftMat,       // bottom (inside paper)
            coverMat, coverMat  // sides
        ];

        // Back Cover: Top (+Y) is inside paper (becomes RIGHT spread base), Bottom (-Y) is outside cover
        const backMats = [
            coverMat, coverMat, // sides
            paperRightMat,      // top (inside paper)
            coverMat,           // bottom (outside)
            coverMat, coverMat  // sides
        ];

        // Back cover: sits on the RIGHT side, always stationary underneath
        const backCover = new THREE.Mesh(new THREE.BoxGeometry(W, 0.22, H), backMats);
        backCover.position.set(W / 2, -0.15, 0);
        this.group.add(backCover);

        // Front cover: pivots around Z at x=0 (the spine)
        this._frontCoverPivot = new THREE.Group();
        const frontGeom = new THREE.BoxGeometry(W, 0.22, H);
        frontGeom.translate(W / 2, 0, 0); // Pivot at spine
        const frontMesh = new THREE.Mesh(frontGeom, frontMats);
        frontMesh.position.y = 0.15; // Above back cover when closed
        frontMesh.castShadow = true;
        this._frontCoverPivot.add(frontMesh);
        this.group.add(this._frontCoverPivot);
    }

    _buildStaticPages() {
        const { texLeft, texRight } = this._getPaperTextures();
        this._leftMat  = new THREE.MeshStandardMaterial({ map: texLeft,  side: THREE.DoubleSide, roughness: 0.8 });
        this._rightMat = new THREE.MeshStandardMaterial({ map: texRight, side: THREE.DoubleSide, roughness: 0.8 });

        // Left page at x ∈ [-W, 0]
        this._leftPage = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this._leftMat);
        this._leftPage.rotation.x = -Math.PI / 2;
        this._leftPage.position.set(-W / 2, 0.01, 0);
        this._leftPage.receiveShadow = true;
        this.group.add(this._leftPage);

        // Right page at x ∈ [0, W]
        this._rightPage = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this._rightMat);
        this._rightPage.rotation.x = -Math.PI / 2;
        this._rightPage.position.set(W / 2, 0.01, 0);
        this._rightPage.receiveShadow = true;
        this.group.add(this._rightPage);
    }

    _buildFlipPage() {
        // Flip page: PlaneGeometry pivoting at spine (x=0), extends to +X
        const geom = new THREE.PlaneGeometry(W, H);
        geom.translate(W / 2, 0, 0); // Pivot at left edge = spine

        this._flipFrontMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.FrontSide, roughness: 0.8 });
        this._flipBackMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.BackSide,  roughness: 0.8 });

        this._flipFront = new THREE.Mesh(geom, this._flipFrontMat);
        this._flipBack  = new THREE.Mesh(geom, this._flipBackMat);

        // Lie flat on table initially
        this._flipFront.rotation.x = -Math.PI / 2;
        this._flipBack.rotation.x  = -Math.PI / 2;
        this._flipFront.position.y = 0.005;
        this._flipBack.position.y  = -0.005;
        this._flipFront.castShadow = true;
        this._flipBack.castShadow = true;

        this._flipPivot = new THREE.Group();
        this._flipPivot.add(this._flipFront, this._flipBack);
        this._flipPivot.visible = false;
        this.group.add(this._flipPivot);
    }

    _buildAllPopups() {
        this._pages = [];
        this._popupGroups = [];

        // Define which class to use for each page spread (0-indexed)
        const pageClasses = {
            0: Page1,
            1: Page2,
            2: Page3, 
            3: Page4,
            4: Page5,
            5: Page6,
            6: Page7,
            7: Page8,
            8: Page9,
            9: Page10,
            10: Page11,
            11: Page12,
            12: Page13,
            13: Page14,
            14: Page15,
            15: Page16,
        };

        for (let i = 0; i < 16; i++) {
            const PageClass = pageClasses[i] || PageBase;
            const pageInstance = new PageClass(W * 2, H);
            
            this._pages.push(pageInstance);
            this._popupGroups.push(pageInstance.mesh);
            this.group.add(pageInstance.mesh);
        }
       // Card-making logic now moved to PageBase.js
   }

    // ─── CMS Content ────────────────────────────────────────────────────

    setContent(contentData) {
        this._contentData = contentData;
        this._leftTextures = [];
        this._rightTextures = [];

        contentData.forEach((data, i) => {
            const { texLeft, texRight } = this._renderSpread(data);
            this._leftTextures.push(texLeft);
            this._rightTextures.push(texRight);

             const page = this._pages[i];
             if (page) {
                 page.update(data);
             }
        });

        // Pre-load textures but DON'T show pages (book is closed)
        if (this._leftTextures[0]) {
            this._leftMat.map = this._leftTextures[0];
            this._leftMat.needsUpdate = true;
        }
        if (this._rightTextures[0]) {
            this._rightMat.map = this._rightTextures[0];
            this._rightMat.needsUpdate = true;
        }
    }

    _getPaperTextures() {
        const cW = 1400, cH = 1000;
        const canvas = document.createElement('canvas');
        canvas.width = cW; canvas.height = cH;
        const ctx = canvas.getContext('2d');

        // Draw custom background if loaded
        if (this._bgImg && this._bgImg.complete && this._bgImg.naturalWidth > 0) {
            ctx.drawImage(this._bgImg, 0, 0, cW, cH);
        } else {
            ctx.fillStyle = '#FFF9F0';
            ctx.fillRect(0, 0, cW, cH);
        }

        // Spine shadow (optional, depending on bg design)
        const grd = ctx.createLinearGradient(cW/2 - 30, 0, cW/2 + 30, 0);
        grd.addColorStop(0, "rgba(0,0,0,0)");
        grd.addColorStop(0.5, "rgba(0,0,0,0.1)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(cW/2 - 30, 0, 60, cH);

        // Procedural borders removed to favor custom bg.png design
        // ctx.strokeStyle = '#C8956B'; ctx.lineWidth = 6;
        // ctx.strokeRect(30, 30, cW/2 - 60, cH - 60);
        // ctx.strokeRect(cW/2 + 30, 30, cW/2 - 60, cH - 60);

        const baseTex = new THREE.CanvasTexture(canvas);
        baseTex.anisotropy = 8;
        baseTex.colorSpace = THREE.SRGBColorSpace;

        const texLeft = baseTex.clone();
        texLeft.repeat.set(0.5, 1);
        texLeft.offset.set(0, 0);

        const texRight = baseTex.clone();
        texRight.repeat.set(0.5, 1);
        texRight.offset.set(0.5, 0);

        return { texLeft, texRight, canvas, ctx, cW, cH };
    }

    _renderSpread(data) {
        this._lastData = data;
        const { texLeft, texRight, canvas, ctx, cW, cH } = this._getPaperTextures();

        // Left content
        ctx.fillStyle = '#5C1A00';

        ctx.font = 'bold 52px serif'; ctx.textAlign = 'center';
        ctx.fillText(data.title || 'Materi Drama', cW / 4, 150);

        ctx.fillStyle = '#333';
        ctx.font = '30px serif'; ctx.textAlign = 'left';
        this._wrap(ctx, data.text || '', 60, 230, cW/2 - 120, 44);

        // Right content
        ctx.fillStyle = '#8B2500';
        ctx.font = 'bold 44px serif'; ctx.textAlign = 'center';
        ctx.fillText('Media & Interaksi', (cW * 3) / 4, 150);

        let ly = 230;
        const hasLinks = data.links && data.links.length > 0;
        const hasAudio = !!data.audio;

        if (hasLinks) {
            ctx.fillStyle = '#444';
            ctx.font = 'italic 28px serif'; ctx.textAlign = 'left';
            data.links.forEach(lnk => {
                const label = typeof lnk === 'string' ? this._linkLabel(lnk) : (lnk.label || '🔗 Buka Tautan');
                ctx.fillText(`• ${label}`, cW / 2 + 80, ly);
                ly += 50;
            });
        }

        if (hasAudio) {
            ctx.fillStyle = '#8B6B50';
            ctx.font = 'italic 26px serif'; ctx.textAlign = 'left';
            ctx.fillText('♪ Konten Audio Tersedia', cW / 2 + 80, ly + 20);
        }

        if (!hasLinks && !hasAudio) {
            ctx.fillStyle = '#999';
            ctx.font = 'italic 28px serif'; ctx.textAlign = 'center';
            ctx.fillText('Belum ada interaksi tersedia', (cW * 3) / 4, 300);
        }
        
        ctx.fillStyle = '#C8956B';
        ctx.font = '22px serif'; ctx.textAlign = 'right';
        ctx.fillText(`— Hal ${data.page || '-'} —`, cW - 60, cH - 50);

        return { texLeft, texRight };
    }



    _linkLabel(url) {
        if (!url || typeof url !== 'string') return '🔗 Buka Tautan';
        if (url.includes('menti'))     return '🗳️ Buka Mentimeter';
        if (url.includes('youtu'))     return '▶️ Tonton Video';
        if (url.includes('drive'))     return '📄 Buka Materi (Drive)';
        if (url.includes('heyzine'))   return '📖 Buka Naskah (Heyzine)';
        if (url.includes('wayground')) return '🎯 Buka Aktivitas';
        return '🔗 Buka Tautan';
    }

    _wrap(ctx, text, x, y, maxW, lh) {
        for (const para of text.split('\n')) {
            let line = '';
            for (const word of para.split(' ')) {
                const t = line + word + ' ';
                if (ctx.measureText(t).width > maxW && line) {
                    ctx.fillText(line, x, y); line = word + ' '; y += lh;
                } else { line = t; }
            }
            ctx.fillText(line, x, y);
            y += lh * 1.3;
        }
    }

    // ─── Cover ──────────────────────────────────────────────────────────

    openCover(onDone) {
        if (this._coverState !== 'closed') return;
        this._coverState = 'opening';
        this._leftPage.visible = true;
        this._rightPage.visible = true;
        this._showSpread(0);
        this._onCoverOpen = onDone || null;
    }

    closeCover(onDone) {
        if (this._coverState !== 'open') return;
        this._hidePopup(this.currentSpread);
        this._coverState = 'closing';
        this._onCoverClose = onDone || null;
    }

    get isOpen()   { return this._coverState === 'open'; }
    get isClosed() { return this._coverState === 'closed'; }

    // ─── Navigation ─────────────────────────────────────────────────────

    goNext(onDone) {
        if (this._coverState !== 'open' || this._isFlipping || this.currentSpread >= 15) return;
        this._onFlipDone = onDone || null;
        this._startFlip(1);
    }

    goPrev(onDone) {
        if (this._coverState !== 'open' || this._isFlipping || this.currentSpread <= 0) return;
        this._onFlipDone = onDone || null;
        this._startFlip(-1);
    }

    _startFlip(dir) {
        this._isFlipping = true;
        this._flipDir = dir;

        // rotation.z: 0 = right side, +PI = left side (goes UP and over)
        this._flipPivot.rotation.z = dir === 1 ? 0 : Math.PI;
        this._flipPivot.visible = true;

        // Set flip page textures
        if (dir === 1) {
            if (this._rightTextures[this.currentSpread]) {
                this._flipFrontMat.map = this._rightTextures[this.currentSpread];
                this._flipFrontMat.needsUpdate = true;
            }
            if (this._leftTextures[this.currentSpread + 1]) {
                this._flipBackMat.map = this._leftTextures[this.currentSpread + 1];
                this._flipBackMat.needsUpdate = true;
            }
            if (this._rightTextures[this.currentSpread + 1]) {
                this._rightMat.map = this._rightTextures[this.currentSpread + 1];
                this._rightMat.needsUpdate = true;
            }
            this._rightPage.visible = true;
        } else {
            if (this._leftTextures[this.currentSpread]) {
                this._flipBackMat.map = this._leftTextures[this.currentSpread];
                this._flipBackMat.needsUpdate = true;
            }
            if (this._rightTextures[this.currentSpread - 1]) {
                this._flipFrontMat.map = this._rightTextures[this.currentSpread - 1];
                this._flipFrontMat.needsUpdate = true;
            }
            if (this._leftTextures[this.currentSpread - 1]) {
                this._leftMat.map = this._leftTextures[this.currentSpread - 1];
                this._leftMat.needsUpdate = true;
            }
            this._leftPage.visible = true;
        }

        this._hidePopup(this.currentSpread);
    }

    _finishFlip() {
        this._isFlipping = false;
        this._flipPivot.visible = false;
        this.currentSpread += this._flipDir;
        this._showSpread(this.currentSpread);
        if (this._onFlipDone) {
            this._onFlipDone();
            this._onFlipDone = null;
        }
    }

    _showSpread(idx) {
        if (this._leftTextures[idx]) {
            this._leftMat.map = this._leftTextures[idx];
            this._leftMat.needsUpdate = true;
        }
        if (this._rightTextures[idx]) {
            this._rightMat.map = this._rightTextures[idx];
            this._rightMat.needsUpdate = true;
        }
        this._leftPage.visible = true;
        this._rightPage.visible = true;
        this._showPopup(idx);
    }

    _showPopup(idx) {
        this._popupGroups.forEach((g, i) => {
            g.visible = (i === idx);
            if (i === idx) {
                g.userData._animating = true;
                // Elements pop up from the center spine
                if (g.userData.elements) {
                    g.userData.elements.forEach(el => {
                        if (el.userData.origX === undefined) {
                            el.userData.origX = el.position.x;
                            el.userData.origZ = el.position.z; // Just in case
                        }
                        // Start fully flat at the center
                        el.position.x = 0;
                        el.rotation.x = el.userData.flatRotX;
                        el.scale.y = 0.001;
                    });
                }
            }
        });
    }

    _hidePopup(idx) {
        if (this._popupGroups[idx]) {
            this._popupGroups[idx].userData._animating = false;
        }
    }

    // ─── Update ─────────────────────────────────────────────────────────

    update() {
        // Cover animation (rotation.z: 0 → +PI = lifts UP and opens left)
        if (this._coverState === 'opening') {
            this._coverAngle = THREE.MathUtils.lerp(this._coverAngle, Math.PI, 0.07);
            this._frontCoverPivot.rotation.z = this._coverAngle;

            if (Math.abs(this._coverAngle - Math.PI) < 0.03) {
                this._coverAngle = Math.PI;
                this._frontCoverPivot.rotation.z = Math.PI;
                this._coverState = 'open';
                if (this._onCoverOpen) { this._onCoverOpen(); this._onCoverOpen = null; }
            }
        }

        if (this._coverState === 'closing') {
            this._coverAngle = THREE.MathUtils.lerp(this._coverAngle, 0, 0.07);
            this._frontCoverPivot.rotation.z = this._coverAngle;

            if (Math.abs(this._coverAngle) < 0.03) {
                this._coverAngle = 0;
                this._frontCoverPivot.rotation.z = 0;
                this._coverState = 'closed';
                this._leftPage.visible = false;
                this._rightPage.visible = false;
                this.currentSpread = 0;
                this._popupGroups.forEach(g => g.visible = false);
                if (this._onCoverClose) { this._onCoverClose(); this._onCoverClose = null; }
            }
        }

        // Flip animation (rotation.z: 0 → +PI = right to left, going UP)
        if (this._isFlipping) {
            const speed = 0.09;
            const target = this._flipDir === 1 ? Math.PI : 0;
            this._flipPivot.rotation.z = THREE.MathUtils.lerp(this._flipPivot.rotation.z, target, speed);

            // Dynamic "lift" on Y axis for more 3D feel
            // Sine wave based on rotation: peak lift at 90 degrees (Math.PI/2)
            const lift = Math.sin(this._flipPivot.rotation.z) * 1.2;
            this._flipPivot.position.y = 0.03 + lift;

            if (Math.abs(this._flipPivot.rotation.z - target) < 0.02) {
                this._flipPivot.position.y = 0;
                this._finishFlip();
            }
        }

        // V-fold pop-up animation
        for (const grp of this._popupGroups) {
            if (!grp.visible) continue;
            const ud = grp.userData;
            const isOpen = ud._animating;

            ud.elements.forEach(el => {
                if (el.userData.origX === undefined) {
                    el.userData.origX = el.position.x;
                }

                const tgtRotX = isOpen ? el.userData.standRotX : el.userData.flatRotX;
                el.rotation.x = THREE.MathUtils.lerp(el.rotation.x, tgtRotX, 0.1);
                const progress = 1.0 - Math.abs(el.rotation.x - el.userData.standRotX) / (Math.PI / 2);
                el.scale.y = Math.max(0.001, progress);

                // Animate X towards flip direction when closing, and back to origX when opening
                let tgtX = isOpen ? el.userData.origX : (this._flipDir === 1 ? -6 : 6);
                if (!isOpen && this._coverState === 'closing') {
                    tgtX = 6;
                }
                el.position.x = THREE.MathUtils.lerp(el.position.x, tgtX, 0.1);
            });
        }
    }

    get currentPage() { return this.currentSpread + 1; }
    get mesh() { return this.group; }

    get raycastTargets() {
        const grp = this._popupGroups[this.currentSpread];
        if (!grp || !grp.visible) return [];
        return grp.userData.elements || [];
    }
}
