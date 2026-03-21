const API_URL = '/api/content';
const UPLOAD_URL = '/api/upload-qr';
const container = document.getElementById('pages-container');
const status = document.getElementById('status');
const saveBtn = document.getElementById('save-btn');

let contentData = [];

// Fetch current content
async function fetchContent() {
    try {
        const response = await fetch(API_URL);
        contentData = await response.json();

        // Ensure every page has a popups array and migrate legacy data
        contentData.forEach(page => {
            if (!page.popups) {
                // Migrate: move existing text into a single popup
                page.popups = [{ text: page.text || '' }];
            }

            // Migration: Move page-level QR/Links to the first popup if it doesn't have them
            if (page.popups.length > 0) {
                if (page.qrcode && !page.popups[0].qrcode) {
                    page.popups[0].qrcode = page.qrcode;
                    delete page.qrcode;
                }
                if (page.links && page.links.length > 0 && (!page.popups[0].links || page.popups[0].links.length === 0)) {
                    page.popups[0].links = page.links;
                    delete page.links;
                }
            }
        });

        renderEditor();
    } catch (err) {
        console.error('Error fetching content:', err);
        status.textContent = 'Error loading content. Is the backend running?';
        status.style.color = 'red';
    }
}

function renderEditor() {
    container.innerHTML = '';
    contentData.forEach((page, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-editor';

        // Header
        let html = `<h3>Page ${page.page}: ${page.title}</h3>`;
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px;">
                    <div>
                      <label>Title:</label>
                      <input type="text" value="${page.title}" onchange="updateData(${index}, 'title', this.value)">
                    </div>
                    <div>
                      <label>Background Audio:</label>
                      <input type="text" value="${page.audio || ''}" placeholder="audio_file.mp3" onchange="updateData(${index}, 'audio', this.value)">
                    </div>
                  </div>`;

        // Dynamic Popups Section
        html += `<div style="margin-top:15px;padding:12px;background:#f0f4f8;border:1px solid #d1d9e6;border-radius:8px;">
                    <label style="font-size:14px;color:#2c3e50;display:block;margin-bottom:10px;"><strong>📋 Pop-up Elements (max 6):</strong></label>
                    <div id="popups-${index}">`;

        (page.popups || []).forEach((popup, pi) => {
            const hasQR = !!popup.qrcode;
            html += `<div style="margin-bottom:15px;padding:10px;background:white;border:1px solid #ccd6e0;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                          <span style="font-weight:bold;color:#8B0000;">#${pi + 1} Pop-up</span>
                          <button type="button" onclick="removePopup(${index}, ${pi})" style="background:#ff7675;color:white;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">Hapus</button>
                        </div>
                        
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
                          <div>
                            <label style="font-size:12px;">Header Teks:</label>
                            <input type="text" style="width:100%;" value="${popup.header || ''}" placeholder="Materi Utama" onchange="updatePopup(${index}, ${pi}, 'header', this.value)">
                          </div>
                          <div>
                            <label style="font-size:12px;">Audio Pop-up:</label>
                            <input type="text" style="width:100%;" value="${popup.audio || ''}" placeholder="audio_file.mp3" onchange="updatePopup(${index}, ${pi}, 'audio', this.value)">
                          </div>
                        </div>

                        <label style="font-size:12px;">Konten Teks:</label>
                        <textarea style="height:50px;width:100%;margin-bottom:8px;" onchange="updatePopup(${index}, ${pi}, 'text', this.value)">${popup.text || ''}</textarea>
                        
                        <div style="display:grid;grid-template-columns: 1.2fr 1fr; gap:10px;">
                          <div>
                            <label style="font-size:12px;">Link khusus (satu per baris):</label>
                            <textarea style="height:70px;width:100%;font-size:11px;" onchange="updatePopup(${index}, ${pi}, 'links', this.value.split('\\n').filter(l => l.trim() !== ''))">${(popup.links || []).join('\n')}</textarea>
                          </div>
                          <div>
                            <label style="font-size:12px;">QR Code khusus:</label>
                            <div style="display:flex;flex-direction:column;gap:5px;">
                               <input type="file" accept="image/*" style="font-size:10px;" onchange="uploadQR(${index}, ${pi}, this)">
                               ${hasQR ? `<img src="${popup.qrcode}" style="width:50px;height:50px;object-fit:contain;border:1px solid #ccc;border-radius:4px;">` : '<span style="color:#999;font-size:10px;">No QR</span>'}
                            </div>
                          </div>
                        </div>
                      </div>`;
        });

        const canAdd = (page.popups || []).length < 6;
        html += `</div>
                  <button type="button" onclick="addPopup(${index})" style="background:${canAdd ? '#00b894' : '#ccc'};color:white;border:none;border-radius:4px;padding:8px 16px;cursor:${canAdd ? 'pointer' : 'default'};font-size:13px;width:100%;font-weight:bold;" ${canAdd ? '' : 'disabled'}>+ Tambah Elemen Pop-up</button>
                 </div>`;

        pageDiv.innerHTML = html;
        container.appendChild(pageDiv);
    });
}

window.updateData = (index, field, value) => {
    contentData[index][field] = value;
};

window.updatePopup = (index, popupIndex, field, value) => {
    contentData[index].popups[popupIndex][field] = value;
};

window.addPopup = (index) => {
    if (!contentData[index].popups) contentData[index].popups = [];
    if (contentData[index].popups.length >= 6) return;
    contentData[index].popups.push({ header: '', text: '', links: [], qrcode: '', audio: '' });
    renderEditor();
};

window.removePopup = (index, popupIndex) => {
    contentData[index].popups.splice(popupIndex, 1);
    renderEditor();
};

window.uploadQR = async (pageIndex, popupIndex, input) => {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('qrcode', file);
    formData.append('page', contentData[pageIndex].page);
    formData.append('popupIndex', popupIndex);

    try {
        status.textContent = 'Uploading QR code...';
        status.style.color = 'blue';
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
            contentData[pageIndex].popups[popupIndex].qrcode = data.url;
            renderEditor();
            status.textContent = 'QR code uploaded!';
            status.style.color = 'green';
        }
    } catch (err) {
        console.error('QR upload error:', err);
        status.textContent = 'Error uploading QR code.';
        status.style.color = 'red';
    }
};

saveBtn.addEventListener('click', async () => {
    status.textContent = 'Saving...';
    status.style.color = 'blue';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentData)
        });
        if (response.ok) {
            status.textContent = 'Saved successfully!';
            status.style.color = 'green';
        } else {
            throw new Error('Save failed');
        }
    } catch (err) {
        console.error('Error saving content:', err);
        status.textContent = 'Error saving content.';
        status.style.color = 'red';
    }
});

fetchContent();
