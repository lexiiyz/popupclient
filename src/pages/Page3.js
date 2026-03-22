import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page3 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        this.signW = this.W * 0.6;
        this.signH = this.H * 0.4;
        
        // 1. Styling text
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 22
        };

        // 2. Setup Assets
        const assets = [
            { url: '/assets/images/page3/5.png', x:  w * 0.4,  y: h * 0.6, z: -h * 0.2, scale: 0.05 },
            { url: '/assets/images/page3/4.png', x:  0.15,        y: h * 0.25,        z: -h * 0.1, scale: 0.4 },
            { url: '/assets/images/page3/3.png', x:  w * 0.2,  y: h * 0.15,        z:  0,       scale: 0.4 },
            { url: '/assets/images/page3/2.png', x:  w * 0.3, y: h * 0.1,        z:  h * 0.1, scale: 0.25 },
            { url: '/assets/images/page3/1.png', x:  w * 0.4,  y: 0,        z:  h * 0.2, scale: 0.2 }
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

    // 3. Function untuk Positioning Sign
    _generatePositions(count) {
        const { W, H } = this;
        const positions = [];
 
        const col1 = -W * 0.92;
        const col2 = -W * 0.30;
        const col3 =  W * 0.32;

        const yAtas = H * 0.35;
        const yBawah = 0; 
        
        const zBawah = H * 0.45;
        const zAtas = H * 0.20;

        if (count > 0) positions.push({ x: col1, y: yBawah, z: zBawah });
        if (count > 1) positions.push({ x: col2, y: yBawah, z: zBawah });
        if (count > 2) positions.push({ x: col2, y: yAtas,  z: zAtas });
        if (count > 3) positions.push({ x: col3, y: yBawah, z: zBawah });
        if (count > 4) positions.push({ x: col1, y: yAtas,  z: zAtas });
        if (count > 5) positions.push({ x: col3, y: yAtas,  z: zAtas });

        return positions;
    }
}
