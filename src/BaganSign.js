import * as THREE from 'three';

export class BaganSign {
    constructor(w, h, url = '/assets/images/page8/1.png', title = 'Bagan', text = '', audio = null) {
        this.w = w;
        this.h = h;
        
        // Group holds both frame and image
        this.mesh = new THREE.Group();
        
        const interactData = {
            flatRotX: -Math.PI / 2,
            standRotX: -0.05, // slight tilt back for better 3D effect
            type: 'popup',
            rawTitle: title,
            rawText: text,
            audio: audio,
            links: [],
            qrcode: ''
        };
        this.mesh.userData = interactData;

        // 1. Frame / Cardboard Backdrop
        const padding = 0.4; // extra width/height for the border
        const frameW = w + padding;
        const frameH = h + padding;
        
        // Shift pivot to bottom
        const frameGeom = new THREE.BoxGeometry(frameW, frameH, 0.05);
        frameGeom.translate(0, frameH / 2, 0); 
        
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xFFF8E7, // Warm cardboard/paper color (Cosmic Latte)
            roughness: 0.9,
        });
        const frameMesh = new THREE.Mesh(frameGeom, frameMat);
        frameMesh.castShadow = true;
        frameMesh.receiveShadow = true;
        
        // 2. Inner wooden border
        const borderGeom = new THREE.BoxGeometry(w + 0.15, h + 0.15, 0.08);
        borderGeom.translate(0, frameH / 2, 0);
        const borderMat = new THREE.MeshStandardMaterial({
            color: 0x6B4226, // Dark Wood
            roughness: 0.8
        });
        const borderMesh = new THREE.Mesh(borderGeom, borderMat);
        borderMesh.castShadow = true;

        // 3. Wooden Feet/Stand
        const footGeom = new THREE.BoxGeometry(0.8, 0.2, 0.4);
        footGeom.translate(0, 0.1, 0.05);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x4A2E1B, roughness: 0.9 });
        
        const leftFoot = new THREE.Mesh(footGeom, footMat);
        leftFoot.position.set(-w * 0.3, 0, 0);
        
        const rightFoot = new THREE.Mesh(footGeom, footMat);
        rightFoot.position.set(w * 0.3, 0, 0);

        // 4. The Image (Bagan)
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        const imgGeom = new THREE.PlaneGeometry(w, h);
        // Translate so bottom is at Y = padding/2 to be exactly centered in frame
        imgGeom.translate(0, h / 2 + padding / 2, 0); 
        
        const imgMat = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            side: THREE.FrontSide, 
            alphaTest: 0.1
        });
        
        const imgMesh = new THREE.Mesh(imgGeom, imgMat);
        imgMesh.position.z = 0.045; // slightly in front of the inner border
        imgMesh.castShadow = true;
        this.imgMesh = imgMesh; // Store a reference
        
        // 5. Hint Text ("👆 Tekan untuk melihat detail")
        const hintCanvas = document.createElement('canvas');
        hintCanvas.width = 512;
        hintCanvas.height = 128;
        const hintCtx = hintCanvas.getContext('2d');
        hintCtx.fillStyle = 'rgba(255, 248, 231, 0.85)'; // semi-transparent background
        hintCtx.beginPath();
        hintCtx.roundRect(40, 30, 432, 68, 34);
        hintCtx.fill();
        hintCtx.fillStyle = '#D32F2F'; // Red text
        hintCtx.font = 'italic bold 28px Georgia, serif';
        hintCtx.textAlign = 'center';
        hintCtx.textBaseline = 'middle';
        hintCtx.fillText('👆 Tekan untuk melihat detail', 256, 66);
        
        const hintTex = new THREE.CanvasTexture(hintCanvas);
        hintTex.colorSpace = THREE.SRGBColorSpace;
        
        const hintPlaneW = w * 0.8;
        const hintPlaneH = hintPlaneW * (128 / 512);
        const hintGeom = new THREE.PlaneGeometry(hintPlaneW, hintPlaneH);
        hintGeom.translate(0, hintPlaneH / 2, 0);
        
        const hintMat = new THREE.MeshBasicMaterial({
            map: hintTex,
            transparent: true
        });
        
        const hintMesh = new THREE.Mesh(hintGeom, hintMat);
        // Place it just above the top of the frame
        hintMesh.position.set(0, frameH - 0.2, 0.07);

        // Assemble group
        this.mesh.add(frameMesh);
        this.mesh.add(borderMesh);
        this.mesh.add(leftFoot);
        this.mesh.add(rightFoot);
        this.mesh.add(imgMesh);
        this.mesh.add(hintMesh);

        // Apply interactive data to all children for raycasting
        this.mesh.children.forEach(child => {
            child.userData = { ...this.mesh.userData };
        });
    }

    updateContent(data) {
        const interactData = {
            flatRotX: -Math.PI / 2,
            standRotX: -0.05,
            type: 'popup',
            rawTitle: data.title || data.header || 'Bagan',
            rawText: data.text || '',
            audio: data.audio || null,
            links: data.links || [],
            qrcode: data.qrcode || '',
            image: data.image || null
        };
        this.mesh.userData = interactData;
        this.mesh.children.forEach(child => {
            child.userData = { ...interactData };
        });

        // ── Order Number Badge ──
        if (this.badgeMesh) {
            this.mesh.remove(this.badgeMesh);
            this.badgeMesh = null;
        }

        if (data.orderNum) {
            const bSize = 128;
            const bCanvas = document.createElement('canvas');
            bCanvas.width = bSize;
            bCanvas.height = bSize;
            const bCtx = bCanvas.getContext('2d');
            
            // Draw shadow/border
            bCtx.fillStyle = '#8B2500';
            bCtx.beginPath();
            bCtx.arc(bSize/2, bSize/2 + 2, bSize/2 - 2, 0, Math.PI * 2);
            bCtx.fill();

            // Draw circle
            bCtx.fillStyle = '#D32F2F';
            bCtx.beginPath();
            bCtx.arc(bSize/2, bSize/2 - 2, bSize/2 - 6, 0, Math.PI * 2);
            bCtx.fill();

            // Draw text
            bCtx.fillStyle = '#FFFFFF';
            bCtx.font = 'bold 50px Georgia, serif';
            bCtx.textAlign = 'center';
            bCtx.textBaseline = 'middle';
            bCtx.fillText(data.orderNum, bSize/2, bSize/2);

            const bTex = new THREE.CanvasTexture(bCanvas);
            bTex.colorSpace = THREE.SRGBColorSpace;
            
            const bGeom = new THREE.PlaneGeometry(0.35, 0.35);
            const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
            this.badgeMesh = new THREE.Mesh(bGeom, bMat);
            
            // Top-left of the frame
            const frameH = this.h + 0.4;
            this.badgeMesh.position.set(-this.w / 2, frameH - 0.2, 0.08);
            this.badgeMesh.userData = { ...interactData };
            this.mesh.add(this.badgeMesh);
        }

        if (data.image && this.imgMesh) {
            const loader = new THREE.TextureLoader();
            loader.load(data.image, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                this.imgMesh.material.map = tex;
                this.imgMesh.material.needsUpdate = true;
            });
        }
    }
}
