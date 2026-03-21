import * as THREE from 'three';
import { PageBase } from './PageBase.js';
import { ActivitySign } from '../ActivitySign.js';

export class Page7 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // 1. Create the new ActivitySign for Page 7
        // We pass the new title and text
        this.activitySign = new ActivitySign(
            this.W * 0.7, 
            this.H * 0.4, 
            {}, 
            "AKTIVITAS 2", 
        );
        
        // Position it at the center of the left page
        this.activitySign.mesh.position.set(-this.W * 0.7, 0.05, this.H * 0.25);
        this.group.add(this.activitySign.mesh);
        this.group.userData.elements.push(this.activitySign.mesh);

        // Custom Sign Dimensions & Style for the CinemaSigns
        this.signW = this.W * 0.65;
        this.signH = this.H * 0.45;
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 24
        };
    }

    _generatePositions(count) {
        const { W, H } = this;
        // Place the 2 CinemaSigns side-by-side on the right page, aligned with ActivitySign
        const positions = [
            { x: W * 0.05, y: 0.05, z: H * 0.25 }, // Petunjuk 1
            { x: W * 0.75, y: 0.05, z: H * 0.25 }  // Petunjuk 2
        ];
        return positions.slice(0, count);
    }
}
