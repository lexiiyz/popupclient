import * as THREE from 'three';

export class BaganSign {
    constructor(w, h, url = '/assets/images/page8/1.png') {
        this.w = w;
        this.h = h;
        
        // Group holds both frame and image
        this.mesh = new THREE.Group();
        this.mesh.userData = {
            flatRotX: -Math.PI / 2,
            standRotX: -0.05 // slight tilt back for better 3D effect
        };

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
        
        // Assemble group
        this.mesh.add(frameMesh);
        this.mesh.add(borderMesh);
        this.mesh.add(leftFoot);
        this.mesh.add(rightFoot);
        this.mesh.add(imgMesh);
    }
}
