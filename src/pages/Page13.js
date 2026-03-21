import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page13 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // Custom Sign Dimensions
        this.signW = this.W * 0.8;
        this.signH = this.H * 0.4;
        
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 20
        };

        const W = this.W;
        const H = this.H;
        
        // Frontmost: 1.png (z = h * 0.25)
        // Aligned with popup: 2.png (z = h * 0.1)
        // Back: 3.png (z = -h * 0.05)
        // Backmost and elevated: 4.png (z = -h * 0.2, y = h * 0.25)
        const assets = [
            { url: '/assets/images/page13/4.png', x: 0, y: h * 0.4, z: -h * 0.2,   scale: 0.8 },
            { url: '/assets/images/page13/3.png', x: 0, y: 0,        z: -h * 0.05,  scale: 0.8 },
            { url: '/assets/images/page13/2.png', x: 0, y: 0,        z: h * 0.1,    scale: 0.8 },
            { url: '/assets/images/page13/1.png', x: 0, y: 0,        z: h * 0.25,   scale: 0.8 }
        ];

        assets.forEach(asset => {
            const mesh = this._createImageMesh(w * asset.scale, h * asset.scale, asset.url);
            mesh.position.set(asset.x, asset.y, asset.z);
            this.group.add(mesh);
            this.group.userData.elements.push(mesh);
        });
    }

    _createImageMesh(imgW, imgH, url) {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        const geom = new THREE.PlaneGeometry(imgW, imgH);
        geom.translate(0, imgH / 2, 0);
        
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
        // Put the popup at the very front
        return [
            { x: 0, y: 0.05, z: H * 0.4 }
        ];
    }
}
