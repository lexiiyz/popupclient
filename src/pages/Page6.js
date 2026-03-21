import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page6 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // Sesuaikan ukuran pop-up sign jika perlu
        this.signW = this.W * 0.65;
        this.signH = this.H * 0.45;
        
        // Memperbesar ukuran tulisan di pop-up
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 22
        };

        // Custom Page 6 images
        const assets = [
            { url: '/assets/images/page6/2.png', x: 0, y: h * 0.001, z: -h * 0.25, scale: 0.7 },
            { url: '/assets/images/page6/1.png', x: 0, y: h * 0.05, z: -h * 0.05, scale: 0.4 } 
        ];

        assets.forEach(asset => {
            const mesh = this._createImageMesh(w * asset.scale, h * asset.scale, asset.url);
            mesh.position.set(asset.x, asset.y, asset.z);
            this.group.add(mesh);
            this.group.userData.elements.push(mesh);
        });
    }

    _createImageMesh(w, h, url) {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        const geom = new THREE.PlaneGeometry(w, h);
        geom.translate(0, h / 2, 0);
        
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5
        });
        
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.userData = {
            flatRotX: -Math.PI / 2,
            standRotX: 0
        };
        
        return mesh;
    }

    _generatePositions(count) {
        const { W, H } = this;
        const positions = [];
 
        // 2 popups: satu di kiri, satu di kanan.
        const leftX = -W * 0.6;
        const rightX = W * 0.6;
        const posY = 0.05; 
        const posZ = H * 0.30; // agak ke depan

        if (count > 0) positions.push({ x: leftX, y: posY, z: posZ }); // 0: Kiri
        if (count > 1) positions.push({ x: rightX, y: posY, z: posZ }); // 1: Kanan

        // Jika lebih dari 2 (sebagai fallback)
        if (count > 2) positions.push({ x: leftX, y: posY + H*0.3, z: posZ - H*0.2 });
        if (count > 3) positions.push({ x: rightX, y: posY + H*0.3, z: posZ - H*0.2 });

        return positions;
    }
}
