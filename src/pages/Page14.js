import * as THREE from 'three';
import { PageBase } from './PageBase.js';
import { BaganSign } from '../BaganSign.js';

export class Page14 extends PageBase {
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
        
        // Middle Top = Bagan (component) with 1.png
        this.baganSign = new BaganSign(W * 1.4, H * 0.45, '/assets/images/page14/1.png');
        this.baganSign.mesh.position.set(0, 1.2, -H * 0.15);
        this.group.add(this.baganSign.mesh);
        this.group.userData.elements.push(this.baganSign.mesh);
        
        // Middle Bottom = 1 image 2.png dibuat lebar
        const imgW = W * 1.8;
        const imgH = H * 1.0;
        const imgMesh = this._createImageMesh(imgW, imgH, '/assets/images/page14/2.png');
        imgMesh.position.set(0, 0.001, H * 0.25); 
        this.group.add(imgMesh);
        this.group.userData.elements.push(imgMesh);
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
        return [
            { x: 0, y: 0.05, z: H * 0.35 }
        ];
    }
}
