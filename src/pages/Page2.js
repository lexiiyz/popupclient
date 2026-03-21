import * as THREE from 'three';
import { PageBase } from './PageBase.js';

export class Page2 extends PageBase {
    constructor(w, h) {
        super(w, h);
        
        // Custom Page 2 logic: Layered images on the right side
        const assets = [
            { url: '/assets/images/page2/1.png', y: 0,    z: h * 0.3,  scale: 0.02 },
            { url: '/assets/images/page2/2.png', y: 0,    z: h * 0.2,  scale: 0.4 },
            { url: '/assets/images/page2/3.png', y: h * 0.05, z: h * 0.1,  scale: 0.3 },
            { url: '/assets/images/page2/4.png', y: h * 0.4, z: h * 0.05, scale: 0.1 }
        ];

        const W = this.W;
        const H = this.H;

        // Enlarged Sign Dimensions for Page 2 🚀
        this.signW = W * 0.7;
        this.signH = H * 0.3;

        // Custom Style for Page 2
        this.signStyle = {
            headerFontSize: 24,
            contentFontSize: 19,
            frameColor: '#e01414ff', 
            headerColor: '#f40c0cff',
            contentColor: '#000000ff',
            panelColor: '#F0F8FF'  
        };

        assets.forEach(asset => {
            const mesh = this._createImageMesh(w * asset.scale, h * asset.scale, asset.url);
            // Move images to the CENTER spine
            mesh.position.set(0, asset.y || 0, asset.z); 
            this.group.add(mesh);
            this.group.userData.elements.push(mesh);
        });
    }

    _generatePositions(count) {
        const { W, H } = this;
        const positions = [];
        
        // Circular Arc parameters - perfectly symmetrical "U" shape
        const R = W * 0.9;
        const rowY = [0.01, 1.4, 2.7]; 
        const rowZScale = 0.75; // Slightly deeper Z to fill the page

        // Left Arc: (Bottom -> Middle -> Top)
        // 135deg (Bottom Left), 180deg (Far Left), 225deg (Top Left)
        const leftAngles = [135, 180, 225]; 
        for (let i = 0; i < 3 && i < count; i++) {
            const rad = leftAngles[i] * Math.PI / 180;
            positions.push({
                x: R * Math.cos(rad),
                y: rowY[i],
                z: R * Math.sin(rad) * rowZScale
            });
        }

        // Right Arc: (Top -> Middle -> Bottom)
        // -45deg or 315deg (Top Right) -> 0deg (Far Right) -> 45deg (Bottom Right)
        const rightAngles = [-45, 0, 45]; // Top (Back), Middle, Bottom (Front)
        const rightY = [2.7, 1.4, 0.01];  // Matching heights
        for (let i = 0; i < 3 && (i + 3) < count; i++) {
            const rad = rightAngles[i] * Math.PI / 180;
            positions.push({
                x: R * Math.cos(rad),
                y: rightY[i],
                z: R * Math.sin(rad) * rowZScale
            });
        }

        return positions;
    }

    _createImageMesh(targetW, targetH, url) {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        const geom = new THREE.PlaneGeometry(targetW, targetH);
        geom.translate(0, targetH / 2, 0);
        
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        });
        
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.userData = { flatRotX: -Math.PI / 2, standRotX: 0 };
        return mesh;
    }
}
