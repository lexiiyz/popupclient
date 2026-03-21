import * as THREE from 'three';
import { PageBase } from './PageBase.js';
import { ActivitySign } from '../ActivitySign.js';

export class Page10 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // 1. Create the new ActivitySign for Page 10
        this.activitySign = new ActivitySign(
            this.W * 0.8, 
            this.H * 0.35, 
            {}, 
            "AKTIVITAS 4",
            "Kaidah Kebahasan Naskah Drama" 
        );
        
        // Position it at the top/back of the right page
        this.activitySign.mesh.position.set(this.W * 0.5, 3.7, this.H * 0.1);
        this.group.add(this.activitySign.mesh);
        this.group.userData.elements.push(this.activitySign.mesh);

        // Custom Sign Dimensions & Style
        this.signW = this.W * 0.65;
        this.signH = this.H * 0.45;
        this.signStyle = {
            headerFontSize: 22,
            contentFontSize: 16
        };
    }

    _generatePositions(count) {
        const { W, H } = this;
        const positions = [];
        
        const R = W * 0.85;
        const rowY = [0.01, 1.4, 2.7]; 
        const rowZScale = 0.75; 

        const leftAngles = [135, 180, 225]; 
        for (let i = 0; i < 3 && i < count; i++) {
            const rad = leftAngles[i] * Math.PI / 180;
            let targetX = R * Math.cos(rad);
            let targetZ = R * Math.sin(rad) * rowZScale + (H * 0.1);
            if (i === 1) {
                targetX -= W * 0.15; 
            }

            positions.push({
                x: targetX,
                y: rowY[i],
                z: targetZ
            });
        }

        if (count > 3) {
            positions.push({ x: W * 0.2, y: 0.05, z: H * 0.4 }); 
        }
        if (count > 4) {
            positions.push({ x: W * 0.8, y: 0.05, z: H * 0.4 }); 
        }

        return positions;
    }

}
