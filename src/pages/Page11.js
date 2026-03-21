import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page11 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // Custom Sign Dimensions
        this.signW = this.W * 0.8;
        this.signH = this.H * 0.4;
        
        // Memperbesar ukuran tulisan di pop-up
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 20
        };

        const assets = [
            { url: '/assets/images/page11/4.png', x: 0, y: h * 0, z: -h * 0.2,  scale: 0.8 },
            { url: '/assets/images/page11/3.png', x: 0, y: h * 0, z: -h * 0.05, scale: 0.8 },
            { url: '/assets/images/page11/2.png', x: 0, y: h * 0, z: h * 0.1,   scale: 0.8 },
            { url: '/assets/images/page11/1.png', x: 0, y: h * 0, z: h * 0.25,  scale: 0.8 }
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
        const { H } = this;
        return [
            { x: 0, y: 0.05, z: H * 0.4 }
        ];
    }
}
