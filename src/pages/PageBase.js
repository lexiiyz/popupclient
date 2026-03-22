import * as THREE from 'three';
import { CinemaSign } from '../CinemaSign.js';

/**
 * PageBase — Base class for all page spreads.
 * 
 * Supports dynamic CinemaSign pop-ups (1-6) driven by CMS `popups` array.
 * Pop-ups are placed randomly on the left half with collision avoidance.
 */
export class PageBase {
    constructor(w, h) {
        this.W = w / 2;
        this.H = h;
        
        this.group = new THREE.Group();
        this.group.visible = false;
        
        // 1. Elements
        this.group.userData = { 
            elements: [], 
            cinemaSign: null,
            _animating: false 
        };

        // 2. Custom Sign Dimensions
        this.signW = null;
        this.signH = null;
        this.signStyle = {};

        this._cinemaSignPool = [];
        this._setupCommon();
    }

    // 3. Setup Common
    _setupCommon() {
        const light = new THREE.PointLight(0xfff5d7, 0.35, 10);
        light.position.set(0, 4, 2);
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        this.group.add(light);
    }

    // 4. Function untuk Positioning Sign
    _generatePositions(count) {
        const { W, H } = this;
        const positions = [];
        
        // Grid setup
        const grid = [
            { x: -W * 0.7, z: H * 0.15 }, { x: -W * 0.3, z: H * 0.15 },
            { x: -W * 0.7, z: H * 0.45 }, { x: -W * 0.3, z: H * 0.45 },
            { x: -W * 0.7, z: H * 0.75 }, { x: -W * 0.3, z: H * 0.75 }
        ];

        for (let i = 0; i < Math.min(count, 6); i++) {
            positions.push(grid[i]);
        }

        return positions;
    }

    _createSimpleCard(w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = Math.round(512 * (h / w));
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#fffaef';
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, 20);
        ctx.fill();
        ctx.strokeStyle = '#d4c5a1';
        ctx.lineWidth = 10;
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        const geom = new THREE.PlaneGeometry(w, h);
        geom.translate(0, h / 2, 0);
        const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
        const mesh = new THREE.Mesh(geom, mat);
        
        mesh.userData = { 
            flatRotX: -Math.PI / 2, 
            standRotX: -0.15, 
            type: 'media',
            canvas, 
            ctx, 
            texture: tex 
        };
        return mesh;
    }

    update(data) {
        console.log(`Updating Page ${data.page || 'unknown'}:`, data);
        
        // --- Dynamic CinemaSign Pop-ups ---
        let popups = data.popups;
        
        // If popups is missing or NOT an array, fallback to using page-level text
        if (!Array.isArray(popups)) {
            console.warn(`Page ${data.page} has invalid or missing popups. Using text fallback.`);
            popups = [{ text: data.text || '' }];
        }

        const count = Math.min(popups.length, 6);
        console.log(`Creating ${count} popups for Page ${data.page}`);

        // Remove old CinemaSign instances
        this._cinemaSignPool.forEach(cs => {
            this.group.remove(cs.mesh);
            const idx = this.group.userData.elements.indexOf(cs.mesh);
            if (idx !== -1) this.group.userData.elements.splice(idx, 1);
        });
        this._cinemaSignPool = [];

        const { W, H } = this;
        const positions = this._generatePositions(count);

        // Scale down signs when there are multiple (if not overridden)
        const scaleFactor = count === 1 ? 1 : Math.max(0.55, 1 - count * 0.08);
        const signW = this.signW || (W * 0.8 * scaleFactor);
        const signH = this.signH || (H * 0.45 * scaleFactor);

        for (let i = 0; i < count; i++) {
            const cs = new CinemaSign(signW, signH, this.signStyle);
            const pos = positions[i] || { x: 0, z: 0 };
            
            // Allow override of Y elevation (altitude) from position data
            const elevationY = pos.y !== undefined ? pos.y : (0.05 + i * 0.02);
            cs.mesh.position.set(pos.x, elevationY, pos.z);
            cs.mesh.rotation.x = -Math.PI / 2;
            
            // Read QR/Links from the specific popup object (with fallback to page-level for the first sign)
            const popup = popups[i];
            const popupData = {
                ...data, // Keep page-level defaults
                header: popup.header || '',
                text: popup.text || '',
                qrcode: popup.qrcode || (i === 0 ? data.qrcode : '') || '',
                links: (popup.links && popup.links.length > 0) ? popup.links : (i === 0 ? (data.links || []) : [])
            };
            cs.updateContent(popupData);

            // Store metadata on mesh for raycast overlay
            cs.mesh.userData.type = 'popup';
            cs.mesh.userData.rawTitle = popupData.header || data.title || 'Materi';
            cs.mesh.userData.rawText = popup.text || '';
            cs.mesh.userData.links = popupData.links;
            cs.mesh.userData.qrcode = popupData.qrcode;
            cs.mesh.userData.audio = popup.audio || data.audio || null;
            
            this.group.add(cs.mesh);
            this.group.userData.elements.push(cs.mesh);
            this._cinemaSignPool.push(cs);
        }

        // Keep legacy reference to first sign
        this.group.userData.cinemaSign = this._cinemaSignPool[0] || null;
    }

    get mesh() {
        return this.group;
    }
}
