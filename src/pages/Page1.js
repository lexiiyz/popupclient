import * as THREE from 'three';
import { PageBase } from './PageBase.js';


export class Page1 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        if (this.mediaCard) {
            this.group.remove(this.mediaCard);
            const idx = this.group.userData.elements.indexOf(this.mediaCard);
            if (idx !== -1) this.group.userData.elements.splice(idx, 1);
            this.group.userData.mediaCard = null;
            this.mediaCard = null;
        }

        const assets = [
            { url: '/assets/images/page1/1.png', z: -h * 0.15, scale: 0.5 },
            { url: '/assets/images/page1/2.png', z: -h * 0.08, scale: 0.5 },
            { url: '/assets/images/page1/3.png', z:  h * 0.02, scale: 0.25 },
            { url: '/assets/images/page1/4.png', z:  h * 0.12, scale: 0.3 },
            { url: '/assets/images/page1/5.png', z:  h * 0.22, scale: 0.5 }
        ];

        const W = this.W;

        assets.forEach(asset => {
            const mesh = this._createImageMesh(w * asset.scale, h * asset.scale, asset.url);
            mesh.position.set(W * 0.4, 0, asset.z); 
            this.group.add(mesh);
            this.group.userData.elements.push(mesh);
        });
    }

    _createImageMesh(targetW, targetH, url) {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url, (t) => {
            const aspect = t.image.height / t.image.width;
            mesh.scale.y = aspect / (targetH / targetW);
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        
        const geom = new THREE.PlaneGeometry(targetW, targetH);
        geom.translate(0, targetH / 2, 0);
        
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            metalness: 0,
            roughness: 1
        });
        
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        
        mesh.userData = {
            flatRotX: -Math.PI / 2,
            standRotX: 0
        };
        
        return mesh;
    }
}
