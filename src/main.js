import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Book } from './Book.js';

export class App {
    constructor() {
        this.container = document.getElementById('app');
        this.contentData = [];

        this._setupScene();
        this._loadBook();
        this._setupRaycasting();
        this._setupEvents();
        this._animate();
        this._fetchContent();
    }

    _setupRaycasting() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    _setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1210);
        this.scene.fog = new THREE.Fog(0x1a1210, 35, 60);

        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
        this._updateCameraForScreen();

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.enableDamping = true;
        this.controls.minAngle = Math.PI / 6;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 45; // Increased from 28 to allow further zoom out

        this.scene.add(new THREE.AmbientLight(0xffe0a0, 0.5));

        // Subtle Environmental Light for the Spread - Intensity Reduced
        const light = new THREE.PointLight(0xfff5d7, 0.25, 8);
        light.position.set(0, 2, 0); // Position it centrally above the book
        this.scene.add(light);

        const key = new THREE.DirectionalLight(0xfffbe0, 1.0);
        key.position.set(4, 14, 8);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);

        const rim = new THREE.DirectionalLight(0xffc080, 0.35);
        rim.position.set(-5, 8, -6);
        this.scene.add(rim);

        // --- Post-Processing (Bloom) ---
        const renderScene = new RenderPass(this.scene, this.camera);
        
        // Settings: strength, radius, threshold (Reduced for subtle glow)
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.45, // Strength (Reduced from 0.6)
            0.3,  // Radius (Reduced from 0.4)
            0.5   // Threshold (Increased from 0.2 to catch only brightest parts)
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
        
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    _loadBook() {
        this.book = new Book();
        this.scene.add(this.book.mesh);
    }

    async _fetchContent() {
        try {
            const res = await fetch('/api/content');
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(`Server returned ${res.status}: ${errBody.error || res.statusText}`);
            }
            this.contentData = await res.json();
            
            if (!Array.isArray(this.contentData)) {
                throw new Error('Content data is not an array');
            }

            console.log('Content loaded successfully:', this.contentData.length, 'pages');
            this.book.setContent(this.contentData);
            this._updateUI();
        } catch (e) {
            console.error('CRITICAL: Content fetch failed:', e);
            // Fallback for demo/dev if absolutely needed
            if (this.contentData.length === 0) {
                this.book.setContent([{ 
                    page: 1, 
                    title: 'Fallback Mode', 
                    text: `Error loading content: ${e.message}`, 
                    popups: [{ header: 'Error', text: e.message }] 
                }]);
            }
            this._updateUI();
        } finally {
            const el = document.getElementById('loading');
            if (el) { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 500); }
        }
    }

    _setupEvents() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth, h = window.innerHeight;
            this.camera.aspect = w / h;
            this._updateCameraForScreen(); // Adjust zoom/position on resize
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.composer.setSize(w, h);
        });

        // Open / Close cover button
        document.getElementById('open-btn')?.addEventListener('click', () => {
            if (this.book.isClosed) {
                this.book.openCover(() => this._updateUI());
                // Immediately update button to show it's animating
                const btn = document.getElementById('open-btn');
                if (btn) btn.style.display = 'none';
            } else if (this.book.isOpen && !this.book._isFlipping) {
                this.book.closeCover(() => this._updateUI());
                const btn = document.getElementById('open-btn');
                if (btn) btn.style.display = 'none';
                // Hide nav and panel during close
                document.getElementById('prev-btn').style.display = 'none';
                document.getElementById('next-btn').style.display = 'none';
                document.getElementById('page-content')?.classList.remove('active');
            }
        });

        document.getElementById('prev-btn')?.addEventListener('click', () => {
            this.book.goPrev(() => this._updateUI());
        });

        document.getElementById('next-btn')?.addEventListener('click', () => {
            this.book.goNext(() => this._updateUI());
        });

        // Raycasting for Text Cards
        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.book.raycastTargets, true);

            if (intersects.length > 0) {
                const mesh = intersects[0].object;
                if (mesh.userData.type === 'text') {
                    this._showOverlay('text', mesh.userData.rawTitle, mesh.userData.rawText);
                } else if (mesh.userData.type === 'media') {
                    this._showOverlay('media', mesh.userData.rawTitle, '', mesh.userData.links, mesh.userData.audio);
                } else if (mesh.userData.type === 'popup') {
                    this._showOverlay('popup', mesh.userData.rawTitle, mesh.userData.rawText, mesh.userData.links, mesh.userData.audio, mesh.userData.qrcode);
                }
            }
        });

        // Hover effect
        this.renderer.domElement.addEventListener('pointermove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.book.raycastTargets, true);
            this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        });

        // Overlay close
        document.getElementById('overlay-close')?.addEventListener('click', () => this._hideOverlay());
        document.getElementById('text-overlay')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('text-overlay')) this._hideOverlay();
        });
    }

    _showOverlay(type, title, text, links = [], audio = null, qrcode = '') {
        const overlay = document.getElementById('text-overlay');
        const h2 = document.getElementById('overlay-title');
        const p = document.getElementById('overlay-text');
        const mediaContainer = document.getElementById('overlay-media');
        if (!overlay || !h2 || !p || !mediaContainer) return;

        h2.textContent = title;
        
        if (type === 'text') {
            p.style.display = 'block';
            mediaContainer.style.display = 'none';
            p.textContent = text;
        } else if (type === 'popup') {
            // CinemaSign popup: show text + links + QR code
            p.style.display = text ? 'block' : 'none';
            p.textContent = text;
            mediaContainer.style.display = 'block';

            let html = '';

            // Links section
            if (links.length > 0) {
                html += `<div class="link-list">
                    ${links.map(l => `<a href="${l}" target="_blank" class="link-item">${this._linkLabel(l)}</a>`).join('')}
                </div>`;
            }

            // QR Code section
            if (qrcode) {
                html += `<div style="margin-top:20px;text-align:center;">
                    <p style="font-weight:bold;color:#8B4513;margin-bottom:10px;">📱 Scan QR Code:</p>
                    <img src="${qrcode}" alt="QR Code" style="max-width:200px;max-height:200px;border:3px solid #d4c5a1;border-radius:8px;background:white;padding:8px;">
                </div>`;
            }

            // Audio section
            if (audio) {
                html += `<div style="margin-top:20px"><audio controls src="/assets/audio/${audio}"></audio></div>`;
            }

            mediaContainer.innerHTML = html;
        } else {
            // Media card overlay
            p.style.display = 'none';
            mediaContainer.style.display = 'block';
            mediaContainer.innerHTML = `
                <div class="link-list">
                    ${links.map(l => `<a href="${l}" target="_blank" class="link-item">${this._linkLabel(l)}</a>`).join('')}
                </div>
                ${audio ? `<div style="margin-top:20px"><audio controls src="/assets/audio/${audio}"></audio></div>` : ''}
            `;
        }

        overlay.classList.add('active');
        this.controls.enabled = false;
    }

    _hideOverlay() {
        const overlay = document.getElementById('text-overlay');
        if (overlay) overlay.classList.remove('active');
        this.controls.enabled = true;
    }

    _updateUI() {
        const page = this.book.currentPage;
        const openBtn = document.getElementById('open-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Open/Close button label
        if (openBtn) {
            if (this.book.isClosed) {
                openBtn.textContent = '📖 Buka Buku';
                openBtn.style.display = '';
            } else if (this.book.isOpen) {
                openBtn.textContent = '📕 Tutup Buku';
                openBtn.style.display = '';
            } else {
                openBtn.style.display = 'none';
            }
        }

        // Nav buttons visibility
        if (prevBtn) {
            prevBtn.style.display = this.book.isOpen ? '' : 'none';
            prevBtn.disabled = page <= 1;
        }
        if (nextBtn) {
            nextBtn.style.display = this.book.isOpen ? '' : 'none';
            nextBtn.disabled = page >= 16;
        }
    }

    _linkLabel(url) {
        if (url.includes('menti'))     return '🗳️ Buka Mentimeter';
        if (url.includes('youtu'))     return '▶️ Tonton Video';
        if (url.includes('drive'))     return '📄 Buka Materi (Drive)';
        if (url.includes('heyzine'))   return '📖 Buka Naskah (Heyzine)';
        if (url.includes('wayground')) return '🎯 Buka Aktivitas';
        return '🔗 Buka Tautan';
    }

    _updateCameraForScreen() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768 || h > w; // Narrow or portrait
        
        if (isMobile) {
            // Mobile: Significantly further back and higher
            // Y=32, Z=28 ensures the whole spread fits even on thin screens
            this.camera.position.set(0, 32, 28);
            if (this.controls) this.controls.minDistance = 16;
        } else {
            // Desktop: Standard closer framing
            this.camera.position.set(0, 16, 14);
            if (this.controls) this.controls.minDistance = 6;
        }
        this.camera.lookAt(0, 0, 0);
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        this.controls.update();
        this.book.update();
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

new App();