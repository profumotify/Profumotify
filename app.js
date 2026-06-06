// ============================================================
// PROFUMOTIFY v7 - APP JAVASCRIPT
// Collezione di Giancarlo - Bari
// ============================================================

let currentSeason = getCurrentSeason();
let currentTab = 'collection';

// ============================================================
// INIZIALIZZAZIONE
// ============================================================
function init() {
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  renderWeather();
  renderStats();
  renderFilters();
  renderPerfumes(perfumeDB);
  renderCharts();
  renderNotesPyramid();
  renderRecommendations();
  showRecommendationBox();
}

// ============================================================
// UTILITIES
// ============================================================
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Primavera';
  if (month >= 6 && month <= 8) return 'Estate';
  if (month >= 9 && month <= 11) return 'Autunno';
  return 'Inverno';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// METEO BARI
// ============================================================
function renderWeather() {
  const bar = document.getElementById('weather-bar');
  if (!bar) return;
  bar.innerHTML = '';
  Object.entries(bariWeather).forEach(([season, data]) => {
    const card = document.createElement('div');
    card.className = 'weather-card' + (season === currentSeason ? ' active' : '');
    card.innerHTML = `
      <div class="icon">${data.icon}</div>
      <div class="season-name">${season}</div>
      <div class="temp">${data.temp}</div>
      <div class="condition">${data.condition}</div>
    `;
    card.onclick = () => {
      currentSeason = season;
      renderWeather();
      filterBySeason(season);
    };
    bar.appendChild(card);
  });
}

// ============================================================
// STATISTICHE
// ============================================================
function renderStats() {
  const bar = document.getElementById('stats-bar');
  if (!bar) return;
  const stats = [
    { n: collectionStats.total, l: 'Profumi Totali' },
    { n: Object.keys(collectionStats.byBrand).length, l: 'Brand' },
    { n: Object.keys(collectionStats.byFamily).length, l: 'Famiglie' },
    { n: collectionStats.avgLongevity, l: 'Longevit\u00e0 Media' },
    { n: collectionStats.avgSillage, l: 'Sillage Medio' },
    { n: collectionStats.avgValue, l: 'Value Medio' },
  ];
  bar.innerHTML = stats.map(s => `
    <div class="stat-box">
      <div class="number">${s.n}</div>
      <div class="label">${s.l}</div>
    </div>
  `).join('');
}

// ============================================================
// FILTRI
// ============================================================
function renderFilters() {
  const brandSelect = document.getElementById('brand-filter');
  const familySelect = document.getElementById('family-filter');
  if (!brandSelect || !familySelect) return;

  const brands = [...new Set(perfumeDB.map(p => p.brand))].sort();
  const families = [...new Set(perfumeDB.map(p => p.olfactoryFamily))].sort();

  brandSelect.innerHTML = '<option value="">Tutti i brand</option>' +
    brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');

  familySelect.innerHTML = '<option value="">Tutte le famiglie</option>' +
    families.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
}

function filterPerfumes() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();
  const brand = document.getElementById('brand-filter')?.value || '';
  const family = document.getElementById('family-filter')?.value || '';
  const season = document.getElementById('season-filter')?.value || '';

  const filtered = perfumeDB.filter(p => {
    const allNotes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes];
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.olfactoryFamily.toLowerCase().includes(search) ||
      allNotes.some(n => n.toLowerCase().includes(search));
    const matchBrand = !brand || p.brand === brand;
    const matchFamily = !family || p.olfactoryFamily === family;
    const matchSeason = !season || p.season.includes(season);
    return matchSearch && matchBrand && matchFamily && matchSeason;
  });

  renderPerfumes(filtered);
}

function resetFilters() {
  const searchInput = document.getElementById('search-input');
  const brandFilter = document.getElementById('brand-filter');
  const familyFilter = document.getElementById('family-filter');
  const seasonFilter = document.getElementById('season-filter');

  if (searchInput) searchInput.value = '';
  if (brandFilter) brandFilter.value = '';
  if (familyFilter) familyFilter.value = '';
  if (seasonFilter) seasonFilter.value = '';

  renderPerfumes(perfumeDB);
}

function filterBySeason(season) {
  const seasonFilter = document.getElementById('season-filter');
  if (seasonFilter) seasonFilter.value = season;
  filterPerfumes();
  switchTab('collection');
}

// ============================================================
// GRID PROFUMI
// ============================================================
function renderPerfumes(list) {
  const grid = document.getElementById('perfume-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;grid-column:1/-1;">Nessun profumo trovato.</p>';
    return;
  }

  grid.innerHTML = list.map(p => {
    const style = familyStyles[p.olfactoryFamily] || { color: '#888', icon: '\u2728' };
    const placeholderUrl = `https://via.placeholder.com/375x500/1a1a2e/c9a227?text=${encodeURIComponent(p.name.replace(/ /g, '+'))}`;

    return `
    <div class="perfume-card" onclick="openModal(${p.id})">
      <span class="price-tag">${escapeHtml(p.price)}</span>
      <img class="card-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"
        onerror="this.onerror=null;this.src='${placeholderUrl}'">
      <div class="card-body">
        <span class="brand-tag">${escapeHtml(p.brand)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="concentration">${escapeHtml(p.concentration)} \u2022 ${p.year} \u2022 ${escapeHtml(p.gender)}</p>
        <span class="family-badge" style="background:${style.color}22; color:${style.color}; border:1px solid ${style.color}44;">
          ${style.icon} ${escapeHtml(p.olfactoryFamily)}
        </span>
        <div class="notes-preview">
          ${p.topNotes.slice(0, 3).map(n => `<span class="note-chip">${escapeHtml(n)}</span>`).join('')}
        </div>
        <div class="season-tags">
          ${p.season.map(s => `<span class="season-tag">${seasonData[s]?.icon || '\u2728'} ${escapeHtml(s)}</span>`).join('')}
        </div>
        <div class="metrics">
          <div class="metric"><div class="value">${p.longevity}</div><div class="label">Longevit\u00e0</div></div>
          <div class="metric"><div class="value">${p.sillage}</div><div class="label">Sillage</div></div>
          <div class="metric"><div class="value">${p.value}</div><div class="label">Value</div></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// MODAL DETTAGLI
// ============================================================
function openModal(id) {
  const p = perfumeDB.find(x => x.id === id);
  if (!p) return;

  const modalImg = document.getElementById('modal-img');
  const modalBody = document.getElementById('modal-body');
  if (!modalImg || !modalBody) return;

  modalImg.src = p.image;
  modalImg.alt = p.name;

  const style = familyStyles[p.olfactoryFamily] || { color: '#888', icon: '\u2728' };
  const placeholderUrl = `https://via.placeholder.com/700x300/1a1a2e/c9a227?text=${encodeURIComponent(p.name.replace(/ /g, '+'))}`;

  modalImg.onerror = function() {
    this.onerror = null;
    this.src = placeholderUrl;
  };

  modalBody.innerHTML = `
    <h2>${escapeHtml(p.name)}</h2>
    <p class="modal-brand">${escapeHtml(p.brand)} \u2022 ${escapeHtml(p.concentration)} \u2022 ${p.year} \u2022 ${escapeHtml(p.gender)}</p>
    <span class="family-badge" style="background:${style.color}22; color:${style.color}; border:1px solid ${style.color}44; padding:6px 14px; border-radius:20px; font-weight:600; display:inline-flex; align-items:center; gap:5px;">
      ${style.icon} ${escapeHtml(p.olfactoryFamily)}
    </span>
    <p style="margin:15px 0; color:var(--text-muted); line-height:1.7;">${escapeHtml(p.description)}</p>

    <div class="note-section">
      <h4>\u{1F51D} Note di Testa</h4>
      <div class="note-list">${p.topNotes.map(n => `<span class="note-item top">${escapeHtml(n)}</span>`).join('')}</div>
    </div>
    <div class="note-section">
      <h4>\u{1F496} Note di Cuore</h4>
      <div class="note-list">${p.heartNotes.map(n => `<span class="note-item heart">${escapeHtml(n)}</span>`).join('')}</div>
    </div>
    <div class="note-section">
      <h4>\u{1FA78} Note di Fondo</h4>
      <div class="note-list">${p.baseNotes.map(n => `<span class="note-item base">${escapeHtml(n)}</span>`).join('')}</div>
    </div>

    <div class="info-grid">
      <div class="info-item"><div class="label">Stagioni</div><div class="value">${p.season.map(s => seasonData[s]?.icon || '').join(' ')}</div></div>
      <div class="info-item"><div class="label">Occasione</div><div class="value">${escapeHtml(p.occasion)}</div></div>
      <div class="info-item"><div class="label">Longevit\u00e0</div><div class="value">${p.longevity}/10</div></div>
      <div class="info-item"><div class="label">Sillage</div><div class="value">${p.sillage}/10</div></div>
      <div class="info-item"><div class="label">Value</div><div class="value">${p.value}/10</div></div>
      <div class="info-item"><div class="label">Prezzo</div><div class="value">${escapeHtml(p.price)}</div></div>
      <div class="info-item"><div class="label">Taglia</div><div class="value">${escapeHtml(p.size)}</div></div>
    </div>
  `;

  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (!e || e.target.id === 'modal') {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Chiudi modal con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============================================================
// TABS
// ============================================================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

  const clickedTab = event?.target;
  if (clickedTab) clickedTab.classList.add('active');

  const content = document.getElementById('tab-' + tab);
  if (content) content.style.display = 'block';

  if (tab === 'stats') renderCharts();
  if (tab === 'notes') renderNotesPyramid();
  if (tab === 'recommend') renderRecommendations();
}

// ============================================================
// CHARTS
// ============================================================
function renderCharts() {
  renderBarChart('brand-chart', collectionStats.byBrand);
  renderBarChart('family-chart', collectionStats.byFamily);
  renderBarChart('season-chart', collectionStats.bySeason);
  renderBarChart('concentration-chart', collectionStats.byConcentration);
}

function renderBarChart(id, data) {
  const container = document.getElementById(id);
  if (!container) return;

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) { container.innerHTML = '<p style="color:var(--text-muted)">Nessun dato</p>'; return; }

  const max = Math.max(...entries.map(e => e[1]));

  container.innerHTML = entries.map(([label, value]) => `
    <div class="bar-row">
      <div class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max * 100).toFixed(1)}%"></div></div>
      <div class="bar-value">${value}</div>
    </div>
  `).join('');
}

// ============================================================
// PIRAMIDE NOTE
// ============================================================
function renderNotesPyramid() {
  const container = document.getElementById('notes-pyramid');
  if (!container) return;

  const allTop = perfumeDB.flatMap(p => p.topNotes);
  const allHeart = perfumeDB.flatMap(p => p.heartNotes);
  const allBase = perfumeDB.flatMap(p => p.baseNotes);

  const count = arr => {
    const c = {};
    arr.forEach(n => c[n] = (c[n] || 0) + 1);
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15);
  };

  container.innerHTML = `
    <div class="pyramid">
      <h4 style="color:#FF9800; margin-bottom:10px;">\u{1F51D} Note di Testa (pi\u00f9 frequenti)</h4>
      <div class="pyramid-level top">${count(allTop).map(([n, c]) => `<span class="pyramid-note">${escapeHtml(n)} (${c})</span>`).join('')}</div>

      <h4 style="color:#E91E63; margin:15px 0 10px;">\u{1F496} Note di Cuore (pi\u00f9 frequenti)</h4>
      <div class="pyramid-level heart">${count(allHeart).map(([n, c]) => `<span class="pyramid-note">${escapeHtml(n)} (${c})</span>`).join('')}</div>

      <h4 style="color:#795548; margin:15px 0 10px;">\u{1FA78} Note di Fondo (pi\u00f9 frequenti)</h4>
      <div class="pyramid-level base">${count(allBase).map(([n, c]) => `<span class="pyramid-note">${escapeHtml(n)} (${c})</span>`).join('')}</div>
    </div>
  `;
}

// ============================================================
// CONSIGLI AUTOMATICI
// ============================================================
function renderRecommendations() {
  const content = document.getElementById('recommendations-content');
  if (!content) return;

  const rec = getWeatherRecommendation(currentSeason);
  const families = rec.hot || rec.cold || rec.warm || rec.mild || [];

  const recs = perfumeDB.filter(p =>
    families.some(f => p.olfactoryFamily.includes(f))
  );

  content.innerHTML = `
    <div class="recommendation-box">
      <h3>\u{1F321}\uFE0F Stagione attuale: ${currentSeason}</h3>
      <p style="color:var(--text-muted); margin-bottom:10px;">Famiglie olfattive consigliate per il meteo di Bari:</p>
      <div class="rec-tags">${families.map(f => `<span class="rec-tag">${escapeHtml(f)}</span>`).join('')}</div>
    </div>
    <h3 style="margin:25px 0 15px; color:var(--accent); font-family:'Playfair Display',serif;">
      Profumi consigliati per ${currentSeason}
    </h3>
    <div class="perfume-grid">${recs.slice(0, 8).map(p => {
      const style = familyStyles[p.olfactoryFamily] || { color: '#888', icon: '\u2728' };
      const placeholderUrl = `https://via.placeholder.com/375x500/1a1a2e/c9a227?text=${encodeURIComponent(p.name.replace(/ /g, '+'))}`;
      return `
      <div class="perfume-card" onclick="openModal(${p.id})">
        <span class="price-tag">${escapeHtml(p.price)}</span>
        <img class="card-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy"
          onerror="this.onerror=null;this.src='${placeholderUrl}'">
        <div class="card-body">
          <span class="brand-tag">${escapeHtml(p.brand)}</span>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="concentration">${escapeHtml(p.concentration)} \u2022 ${escapeHtml(p.olfactoryFamily)}</p>
          <div class="season-tags">${p.season.map(s => `<span class="season-tag">${seasonData[s]?.icon || ''} ${escapeHtml(s)}</span>`).join('')}</div>
        </div>
      </div>`;
    }).join('')}</div>
  `;
}

function showRecommendationBox() {
  const box = document.getElementById('recommendation-box');
  const tags = document.getElementById('rec-tags');
  if (!box || !tags) return;

  const rec = getWeatherRecommendation(currentSeason);
  const families = rec.hot || rec.cold || rec.warm || rec.mild || [];

  box.style.display = 'block';
  tags.innerHTML = families.map(f => `<span class="rec-tag">${escapeHtml(f)}</span>`).join('');
}

// ============================================================
// AVVIO
// ============================================================
document.addEventListener('DOMContentLoaded', init);
