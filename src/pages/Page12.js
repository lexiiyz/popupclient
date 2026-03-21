import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page12 extends PageBase {
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

        // Custom Page 12: Big images on the right page
        const W = this.W;
        const H = this.H;
        
        const assets = [
            { url: '/assets/images/page12/2.png', x: W * 0.3, y: 0, z: -H * 0.1,  scaleX: 1.5, scaleY: 1.0 },
            { url: '/assets/images/page12/1.png', x: W * 0.3, y: 0, z: H * 0.1,   scaleX: 1.5, scaleY: 1.0 }
        ];

        assets.forEach(asset => {
            const mesh = this._createImageMesh(w * 0.5 * asset.scaleX, h * asset.scaleY, asset.url);
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
        geom.translate(0.5, imgH / 2, 0);
        
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
        // The user requested the popup to be on the left
        return [
            { x: -W * 0.5, y: 0.05, z: H * 0.4 }
        ];
    }
}
