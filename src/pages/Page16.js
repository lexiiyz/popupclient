import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page16 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // Custom Sign Dimensions
        this.signW = this.W * 0.8;
        this.signH = this.H * 0.6;
        
        // Memperbesar ukuran tulisan di pop-up
        this.signStyle = {
            headerFontSize: 28,
            contentFontSize: 20
        };

    }

    _generatePositions(count) {
        const { H } = this;
        return [
            { x: 0, y: 0.05, z: H * 0.35 }
        ];
    }
}
