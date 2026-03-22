import * as THREE from 'three';
import { PageBase } from './PageBase.js';
import { ActivitySign } from '../ActivitySign.js';
import { BaganSign } from '../BaganSign.js';

export class Page15 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        this.activitySign = new ActivitySign(
            this.W * 0.8, 
            this.H * 0.4, 
            {}, 
            "AKTIVITAS 5",
            "Menulis Naskah Drama"
        );
        
        this.activitySign.mesh.position.set(-this.W * 0.5, this.H * 0.25, -this.H * 0.2);
        this.group.add(this.activitySign.mesh);
        this.group.userData.elements.push(this.activitySign.mesh);

        this.signW = this.W * 0.7;
        this.signH = this.H * 0.35; 
        this.signStyle = {
            headerFontSize: 24,
            contentFontSize: 20
        };

        const W = this.W;
        const H = this.H;
        
        const assets = [
            { url: '/assets/images/page15/1.png', x: W * 0.6, y: H * 0.25, z: -H * 0.2,  scaleX: 1.3, scaleY: 0.4 }
        ];

        this.bagans = [];
        assets.forEach(asset => {
            const bagan = new BaganSign(w * 0.5 * asset.scaleX, h * asset.scaleY, asset.url);
            bagan.mesh.position.set(asset.x, asset.y, asset.z);
            this.group.add(bagan.mesh);
            this.group.userData.elements.push(bagan.mesh);
            this.bagans.push(bagan);
        });
    }

    _generatePositions(count) {
        const { W, H } = this;
        const positions = [
            { x: -W * 0.7, y: 0.05, z: H * 0.25 }, 
            { x: 0, y: 0.05, z: H * 0.25 },        
            { x: W * 0.7, y: 0.05, z: H * 0.25 }   
        ];
        return positions.slice(0, count);
    }

    update(data) {
        let cinemaPopups = [];
        let baganPopup = {};
        if (data.popups && data.popups.length > 0) {
            cinemaPopups = data.popups.slice(0, 3);
            if (data.popups.length > 3) baganPopup = data.popups[3];
        }
        super.update({ ...data, popups: cinemaPopups });

        if (this.bagans && this.bagans.length > 0) {
            this.bagans[0].updateContent({
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
