/**
 * HelpModal — Manages the help/guide overlay for the Pop-up Book.
 * 
 * Fetches guide steps from /api/help (managed via admin-help.html).
 * Falls back to a default mobile-focused guide if fetch fails.
 * Usage: import and call `initHelp()` once after DOM is ready.
 */

const HELP_API = '/api/help';

const FALLBACK_STEPS = {
  mobile: [
    { text: 'Tekan tombol <strong>"📖 Buka Buku"</strong> di bagian bawah layar untuk membuka halaman depan buku pop-up 3D.' },
    { text: 'Gunakan tombol <strong>"← Sebelumnya"</strong> dan <strong>"Berikutnya →"</strong> di baris atas untuk berpindah antar halaman materi.' },
    { text: 'Di setiap halaman terdapat <strong>papan informasi 3D</strong> yang bisa ditekan. Cari tulisan <strong>"👆 Tekan untuk melihat detail"</strong> pada papan tersebut.' },
    { text: 'Setelah menekan papan, akan muncul <strong>pop-up detail</strong> berisi materi lengkap, tautan video/dokumen, QR Code, atau audio pembelajaran.' },
    { text: 'Pada halaman tertentu terdapat tombol <strong>"🔊 Putar Audio Halaman"</strong> untuk mendengarkan narasi audio materi.' },
    { text: 'Anda dapat <strong>memutar dan memperbesar</strong> tampilan buku 3D dengan cara:<br>• <strong>Sentuh + geser</strong> dengan satu jari untuk memutar<br>• <strong>Pinch</strong> (cubit) dengan dua jari untuk zoom in/out' },
    { text: 'Setelah selesai menjelajahi materi, tekan tombol <strong>"📕 Tutup Buku"</strong> untuk menutup buku kembali.' }
  ],
  desktop: [
    { text: 'Tekan tombol <strong>"📖 Buka Buku"</strong> di bagian bawah layar untuk membuka halaman depan buku pop-up 3D.' },
    { text: 'Gunakan tombol <strong>"← Sebelumnya"</strong> dan <strong>"Berikutnya →"</strong> di baris atas untuk berpindah antar halaman materi.' },
    { text: 'Di setiap halaman terdapat <strong>papan informasi 3D</strong> yang bisa ditekan. Cari tulisan <strong>"👆 Tekan untuk melihat detail"</strong> pada papan tersebut.' },
    { text: 'Setelah menekan papan, akan muncul <strong>pop-up detail</strong> berisi materi lengkap, tautan video/dokumen, QR Code, atau audio pembelajaran.' },
    { text: 'Pada halaman tertentu terdapat tombol <strong>"🔊 Putar Audio Halaman"</strong> untuk mendengarkan narasi audio materi.' },
    { text: 'Anda dapat <strong>memutar dan memperbesar</strong> tampilan buku 3D dengan cara:<br>• <strong>Klik kiri + geser</strong> mouse untuk memutar<br>• <strong>Scroll wheel</strong> mouse untuk zoom in/out<br>• <strong>Klik kanan + geser</strong> untuk menggeser posisi buku' },
    { text: 'Setelah selesai menjelajahi materi, tekan tombol <strong>"📕 Tutup Buku"</strong> untuk menutup buku kembali.' }
  ]
};

const TIP_TEXT = '💡 <strong>Tips:</strong> Buku ini dirancang sebagai media pembelajaran interaktif materi Drama Kelas XI. Jelajahi setiap halaman untuk menemukan materi, video, dan aktivitas menarik!';

async function _fetchSteps() {
  try {
    const res = await fetch(HELP_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.mobile && data.desktop) return data;
    return FALLBACK_STEPS;
  } catch (e) {
    console.warn('Help API unavailable, using fallback:', e.message);
    return FALLBACK_STEPS;
  }
}

function _buildStepsHTML(steps) {
  if (!steps || steps.length === 0) return '<div style="text-align:center;color:#999;padding:20px;">Belum ada petunjuk.</div>';
  return steps.map((step, i) => `
    <div class="guide-step">
      <div class="guide-step-num">${i + 1}</div>
      <div class="guide-step-text">${step.text}</div>
    </div>
  `).join('');
}

function _injectHTML(helpData) {
  // Determine initial tab based on window width
  const isMobile = window.innerWidth <= 768;
  const initialData = isMobile ? helpData.mobile : helpData.desktop;

  // Help button
  const btn = document.createElement('button');
  btn.id = 'help-btn';
  btn.title = 'Petunjuk Penggunaan';
  btn.innerHTML = 'Panduan !!';
  document.body.appendChild(btn);

  // Help modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2>📖 Petunjuk Penggunaan</h2>
      
      <div class="help-tabs">
        <button class="help-tab ${isMobile ? 'active' : ''}" data-target="mobile">📱 HP / Tablet</button>
        <button class="help-tab ${!isMobile ? 'active' : ''}" data-target="desktop">💻 Laptop / PC</button>
      </div>

      <div class="divider" style="margin-top:0"></div>
      
      <div id="help-steps-scroll">
        <div id="help-steps-container">
          ${_buildStepsHTML(initialData)}
        </div>
        <div class="guide-note">${TIP_TEXT}</div>
      </div>
      
      <button class="overlay-close" id="help-close">Mengerti</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Bind tab switching
  const tabs = overlay.querySelectorAll('.help-tab');
  const container = overlay.querySelector('#help-steps-container');
  const scrollArea = overlay.querySelector('#help-steps-scroll');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      container.innerHTML = _buildStepsHTML(helpData[target]);
      scrollArea.scrollTop = 0;
    });
  });
}

function _bindEvents() {
  const btn = document.getElementById('help-btn');
  const overlay = document.getElementById('help-overlay');
  const closeBtn = document.getElementById('help-close');

  if (btn && overlay) {
    btn.addEventListener('click', () => overlay.classList.add('active'));
  }
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }
}

/**
 * Initialize the help modal system.
 * Fetches steps from the CMS API, then injects the UI.
 * Call once after the DOM is loaded.
 */
export async function initHelp() {
  const helpData = await _fetchSteps();
  _injectHTML(helpData);
  _bindEvents();
}
