import * as THREE from 'three';
import { PageBase } from './PageBase.js';
import { BaganSign } from '../BaganSign.js';

export class Page8 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // 1. Styling Sign
        this.signW = this.W * 0.7;
        this.signH = this.H * 0.4;
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 22
        };

        // 2. Setup Bagan & Asset
        this.baganSign = new BaganSign(this.W * 0.9, this.H * 0.35);
        this.baganSign.mesh.position.set(0, 1.2, -this.H * 0.15);
        this.group.add(this.baganSign.mesh);
        this.group.userData.elements.push(this.baganSign.mesh);
        
        const imgMesh = this._createImageMesh(this.W * 0.5, this.H * 0.35, '/assets/images/page8/2.png');
        imgMesh.position.set(0, 0.001, this.H * 0.2); 
        this.group.add(imgMesh);
        this.group.userData.elements.push(imgMesh);
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
 
        const leftX = -W * 0.65;
        const rightX = W * 0.65;
        const posY = 0.05; 
        const posZ = H * 0.20; 

        if (count > 0) positions.push({ x: leftX, y: posY, z: posZ });
        if (count > 1) positions.push({ x: rightX, y: posY, z: posZ });

        if (count > 2) positions.push({ x: leftX, y: posY + H*0.3, z: posZ - H*0.2 });
        if (count > 3) positions.push({ x: rightX, y: posY + H*0.3, z: posZ - H*0.2 });

        return positions;
    }

    update(data) {
        let cinemaPopups = [];
        let baganPopup = {};
        if (data.popups && data.popups.length > 0) {
            cinemaPopups = data.popups.slice(0, 2);
            if (data.popups.length > 2) baganPopup = data.popups[2];
        }
        super.update({ ...data, popups: cinemaPopups });

        if (this.baganSign) {
            this.baganSign.updateContent({
                title: baganPopup.header || data.title || 'Bagan',
                audio: baganPopup.audio || null,
                text: baganPopup.text || '',
                links: baganPopup.links || [],
                qrcode: baganPopup.qrcode || '',
                image: baganPopup.image || null
            });
        }
    }
}
