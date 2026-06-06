// ============================================================
// PROFUMOTIFY v8.0 - APP JAVASCRIPT
// Collezione di Giancarlo - Bari
// Mobile App + Desktop Responsive
// Wishlist | Meteo LIVE | Advisor rotazione | Prezzi simulati
// ============================================================

let wishlist = JSON.parse(localStorage.getItem("profumotify_wishlist_v8") || "[]");
let currentFilter = "all";
let searchQuery = "";
let currentTab = "collection";
let lastAdvisorIndex = -1;
let dailyAdvisorSeed = new Date().toDateString();

// ============================================================
// INIZIALIZZAZIONE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => { document.getElementById("splash").classList.add("hidden"); }, 1800);

  // Check login
  if (!checkAutoLogin()) {
    document.getElementById("loginModal").classList.add("active");
    return;
  }

  initApp();
});

function initApp() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById("userBadge").textContent = `👤 ${user.name} - ${user.location}`;
  }
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString("it-IT", {
    weekday: "short", day: "numeric", month: "short"
  });

  // Registra Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(r => console.log("SW registrato"))
      .catch(e => console.log("SW errore:", e));
  }

  fetchMeteoBari();
  renderStats();
  renderCollection();
  renderWishlist();
  renderAdvisor();
  renderNotes();
  renderDashboard();
  renderDiscovery();
}

// ============================================================
// LOGIN SYSTEM
// ============================================================
function doLogin() {
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;
  const result = loginUser(user, pass);

  if (result.success) {
    document.getElementById("loginModal").classList.remove("active");
    document.getElementById("app-container").style.display = "block";
    initApp();
    showToast("✅ Benvenuto, " + result.user.name + "!");
  } else {
    showToast("❌ " + result.error);
  }
}

function doLogout() {
  logoutUser();
  location.reload();
}

// ============================================================
// METEO BARI - LIVE API
// ============================================================
async function fetchMeteoBari() {
  const tempEl = document.getElementById("weatherTemp");
  const descEl = document.getElementById("weatherDesc");
  const iconEl = document.getElementById("weatherIcon");

  try {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.12&longitude=16.87&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Europe/Rome");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    updateMeteoUI(data.current.temperature_2m, data.current.relative_humidity_2m, data.current.weather_code, data.current.wind_speed_10m);
  } catch (e) {
    console.log("Meteo API fallita, uso fallback");
    updateMeteoUI(24, 65, 1, 12);
  }
}

function updateMeteoUI(temp, humidity, code, wind) {
  const tempEl = document.getElementById("weatherTemp");
  const descEl = document.getElementById("weatherDesc");
  const iconEl = document.getElementById("weatherIcon");

  tempEl.textContent = `${Math.round(temp)}°C`;

  const weatherMap = {
    0: ["☀️", "Sereno"], 1: ["🌤️", "Poco nuvoloso"], 2: ["⛅", "Nuvoloso"], 3: ["☁️", "Coperto"],
    45: ["🌫️", "Nebbia"], 48: ["🌫️", "Nebbia"],
    51: ["🌧️", "Pioggerella"], 53: ["🌧️", "Pioggia"], 55: ["🌧️", "Pioggia forte"],
    61: ["🌧️", "Pioggia"], 63: ["🌧️", "Pioggia"], 65: ["🌧️", "Pioggia forte"],
    71: ["🌨️", "Neve"], 73: ["🌨️", "Neve"], 75: ["🌨️", "Neve forte"],
    95: ["⛈️", "Temporale"], 96: ["⛈️", "Temporale"], 99: ["⛈️", "Temporale"]
  };
  const [icon, desc] = weatherMap[code] || ["🌤️", "Variabile"];
  iconEl.textContent = icon;
  descEl.textContent = `${desc} • Umidità ${humidity}% • Vento ${Math.round(wind)} km/h`;
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Primavera";
  if (month >= 6 && month <= 8) return "Estate";
  if (month >= 9 && month <= 11) return "Autunno";
  return "Inverno";
}

// ============================================================
// NAVIGAZIONE TABS
// ============================================================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.getElementById("tab-" + tab).style.display = "block";

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(t => t.classList.remove("active"));

  document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((item) => {
    if (item.textContent.toLowerCase().includes(tab === "collection" ? "collezione" :
        tab === "wishlist" ? "wishlist" :
        tab === "advisor" ? "advisor" :
        tab === "notes" ? "note" : "stats")) {
      item.classList.add("active");
    }
  });

  if (tab === "wishlist") renderWishlist();
  if (tab === "advisor") renderAdvisor();
  if (tab === "notes") renderNotes();
  if (tab === "dashboard") renderDashboard();
  if (tab === "discovery") renderDiscovery();
}

// ============================================================
// STATS
// ============================================================
function renderStats() {
  const grid = document.getElementById("statsGrid");
  if (!grid) return;

  const arab = perfumeDB.filter(p => p.type === "arab").length;
  const designer = perfumeDB.filter(p => p.type === "designer").length;
  const niche = perfumeDB.filter(p => p.type === "niche").length;
  const totalValue = perfumeDB.reduce((s, p) => s + p.price, 0);

  grid.innerHTML = `
    <div class="stat-card"><div class="number">${perfumeDB.length}</div><div class="label">Profumi Totali</div></div>
    <div class="stat-card"><div class="number">${arab}</div><div class="label">🌙 Arabi</div></div>
    <div class="stat-card"><div class="number">${designer}</div><div class="label">✨ Designer</div></div>
    <div class="stat-card"><div class="number">€${totalValue.toFixed(0)}</div><div class="label">Valore Collezione</div></div>
  `;
}

// ============================================================
// COLLEZIONE
// ============================================================
function renderCollection() {
  const grid = document.getElementById("perfumeGrid");
  if (!grid) return;

  let filtered = perfumeDB;
  if (currentFilter !== "all") filtered = filtered.filter(p => p.type === currentFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.olfactoryFamily.toLowerCase().includes(q) ||
      [...p.topNotes, ...p.heartNotes, ...p.baseNotes].some(n => n.toLowerCase().includes(q))
    );
  }

  grid.innerHTML = filtered.map((p, i) => {
    const isWished = wishlist.includes(p.id);
    const badgeClass = p.type === "arab" ? "badge-arab" : p.type === "designer" ? "badge-designer" : "badge-niche";
    const badgeText = p.type === "arab" ? "ARABO" : p.type === "designer" ? "DESIGNER" : "NICHE";
    const stars = "★".repeat(Math.floor(p.rating / 2)) + "☆".repeat(5 - Math.floor(p.rating / 2));
    const placeholderName = encodeURIComponent(p.name.substring(0, 15));

    return `
      <div class="perfume-card fade-in ${isWished ? "wishlist-active" : ""}" style="animation-delay:${i*0.03}s" onclick="showDetail(${p.id})">
        <div class="perfume-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
               onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
          <div class="perfume-img-placeholder" style="display:none">
            <span>🌹</span>
            <span class="ph-name">${p.name}</span>
          </div>
          <span class="perfume-badge ${badgeClass}">${badgeText}</span>
        </div>
        <button class="wishlist-btn ${isWished ? "active" : ""}" onclick="event.stopPropagation(); toggleWishlist(${p.id})" title="${isWished ? "Rimuovi da" : "Aggiungi a"} wishlist">
          ${isWished ? "❤️" : "🤍"}
        </button>
        <div class="perfume-info">
          <div class="perfume-brand">${p.brand}</div>
          <div class="perfume-name">${p.name}</div>
          <div class="perfume-meta">
            <span class="perfume-price">€${p.price.toFixed(0)}</span>
            <span class="perfume-rating">${stars.split("").map(s => `<span class="star ${s==="★"?"":"empty"}">${s}</span>`).join("")}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function filterType(type) {
  currentFilter = type;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  event.target.classList.add("active");
  renderCollection();
}

function searchPerfumes() {
  searchQuery = document.getElementById("searchBox").value;
  renderCollection();
}

// ============================================================
// WISHLIST
// ============================================================
function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  const perfume = perfumeDB.find(p => p.id === id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`❌ ${perfume.name} rimosso dalla wishlist`);
  } else {
    wishlist.push(id);
    showToast(`❤️ ${perfume.name} aggiunto alla wishlist`);
  }
  localStorage.setItem("profumotify_wishlist_v8", JSON.stringify(wishlist));
  renderCollection();
  if (currentTab === "wishlist") renderWishlist();
}

function removeFromWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    const perfume = perfumeDB.find(p => p.id === id);
    wishlist.splice(idx, 1);
    localStorage.setItem("profumotify_wishlist_v8", JSON.stringify(wishlist));
    renderCollection();
    renderWishlist();
    showToast(`❌ ${perfume.name} rimosso`);
  }
}

function renderWishlist() {
  const container = document.getElementById("wishlistContent");
  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="wishlist-empty">
        <div class="icon">💎</div>
        <h3>Wishlist vuota</h3>
        <p>Tocca il cuore 🤍 sui profumi per aggiungerli qui</p>
      </div>
    `;
    return;
  }

  const wished = perfumeDB.filter(p => wishlist.includes(p.id));
  const total = wished.reduce((s, p) => s + p.price, 0);

  container.innerHTML = `
    <div style="margin-bottom:16px; padding:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase;">Totale wishlist</div>
          <div style="font-size:24px; font-weight:700; color:var(--accent);">€${total.toFixed(0)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-muted);">${wished.length} profumi</div>
          <button class="btn btn-outline" style="margin-top:8px; padding:8px 16px; font-size:12px;" onclick="findOffers()">🔍 Cerca offerte</button>
        </div>
      </div>
    </div>
    ${wished.map(p => `
      <div class="wishlist-item">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
        <div class="placeholder" style="display:none">🌹</div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-brand">${p.brand}</div>
          <div class="wishlist-item-name">${p.name}</div>
          <div class="wishlist-item-price">€${p.price.toFixed(0)}</div>
        </div>
        <button class="wishlist-item-remove" onclick="removeFromWishlist(${p.id})" title="Rimuovi">🗑️</button>
      </div>
    `).join("")}
  `;
}

function findOffers() {
  showToast("🔍 Apertura Google Shopping...");
  const wished = perfumeDB.filter(p => wishlist.includes(p.id));
  if (wished.length > 0) {
    const p = wished[0];
    window.open(searchGooglePrices(p.name, p.brand), "_blank");
  } else {
    window.open("https://www.google.com/search?tbm=shop&q=profumi+uomo+offerte", "_blank");
  }
}

// ============================================================
// ADVISOR - CONSIGLI METEO + ROTAZIONE
// ============================================================
function renderAdvisor() {
  const container = document.getElementById("advisorContent");
  if (!container) return;

  const season = getCurrentSeason();
  const tempText = document.getElementById("weatherTemp")?.textContent || "20°C";
  const temp = parseInt(tempText) || 20;

  // Determina famiglie consigliate
  let recFamilies = [];
  if (temp > 25) {
    recFamilies = ["Aromatico Acquatico", "Citrus Aromatico", "Floreale Acquatico", "Citrus Fruttato"];
  } else if (temp > 18) {
    recFamilies = ["Aromatico Fougère", "Floreale Fruttato", "Citrus Aromatico", "Orientale Fruttato"];
  } else if (temp > 10) {
    recFamilies = ["Orientale Speziato", "Orientale Legnoso", "Aromatico Legnoso", "Floreale Orientale"];
  } else {
    recFamilies = ["Orientale Gourmand", "Orientale Legnoso", "Orientale Speziato", "Floreale Orientale"];
  }

  // Filtra profumi adatti
  const suitable = perfumeDB.filter(p =>
    recFamilies.some(f => p.olfactoryFamily.includes(f)) || p.season.includes(season)
  );

  // Rotazione: usa seed giornaliero + ultimo indice per varietà
  const today = new Date().toDateString();
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);
  seed += lastAdvisorIndex + 1;

  const pick = suitable[seed % suitable.length] || suitable[0];
  lastAdvisorIndex = seed % suitable.length;

  const alt1 = suitable[(seed + 1) % suitable.length] || suitable[0];
  const alt2 = suitable[(seed + 2) % suitable.length] || suitable[0];

  container.innerHTML = `
    <div class="advisor-box">
      <h3>🎯 Consiglio per oggi a Bari</h3>
      <p style="color:var(--text-muted); font-size:14px; margin-bottom:10px;">
        Stagione: ${season} • Temp: ${tempText} • Famiglie consigliate:
      </p>
      <div class="rec-tags">
        ${recFamilies.slice(0, 4).map(f => `<span class="rec-tag">${f}</span>`).join("")}
      </div>

      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--accent); text-transform:uppercase; margin-bottom:10px;">⭐ Scelta principale</div>
        <div class="advisor-perfume" onclick="showDetail(${pick.id})">
          <img src="${pick.image}" alt="${pick.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
          <div class="placeholder" style="display:none">🌹</div>
          <div class="advisor-perfume-info">
            <div class="name">${pick.name}</div>
            <div class="brand">${pick.brand} • ${pick.olfactoryFamily}</div>
            <div class="reason">💡 Perfetto per ${season} a ${tempText}</div>
          </div>
          <button class="btn btn-primary" style="padding:8px 16px; font-size:12px;">Vedi</button>
        </div>
      </div>

      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">🔄 Alternative per varietà</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${[alt1, alt2].map(p => `
            <div class="perfume-card" style="min-width:140px; flex:1;" onclick="showDetail(${p.id})">
              <div class="perfume-img-wrap" style="aspect-ratio:1;">
                <img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="perfume-img-placeholder" style="display:none"><span>🌹</span><span class="ph-name">${p.name}</span></div>
              </div>
              <div class="perfume-info">
                <div class="perfume-brand">${p.brand}</div>
                <div class="perfume-name" style="font-size:12px;">${p.name}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div style="margin-top:20px; padding:12px; background:var(--bg); border-radius:12px;">
        <div style="font-size:12px; color:var(--text-muted);">
          💡 <strong>Perché questo profumo?</strong> L'advisor seleziona automaticamente profumi compatibili con il meteo attuale di Bari. Ogni giorno la scelta cambia per offrirti sempre una novità!
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// DETAIL MODAL
// ============================================================
function showDetail(id) {
  const p = perfumeDB.find(x => x.id === id);
  if (!p) return;

  const isWished = wishlist.includes(id);
  const content = document.getElementById("detailContent");
  const style = familyStyles[p.olfactoryFamily] || { color: "#888", icon: "✨" };

  content.innerHTML = `
    <div class="detail-img">
      <img src="${p.image}" alt="${p.name}"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
      <div class="placeholder" style="display:none">
        <span>🌹</span>
        <span class="ph-name">${p.name}</span>
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-brand">${p.brand} • ${p.code}</div>
      <div class="detail-name">${p.name}</div>
      <div class="detail-tags">
        <span class="tag family">${style.icon} ${p.olfactoryFamily}</span>
        <span class="tag season">${seasonData[p.season[0]]?.icon || "✨"} ${p.season.join(", ")}</span>
        <span class="tag occasion">${p.occasion}</span>
        <span class="tag concentration">${p.concentration} • ${p.year}</span>
      </div>

      <div class="detail-section">
        <h3>📝 Descrizione</h3>
        <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-top:8px;">${p.description}</p>
      </div>

      ${p.personal ? `
      <div class="detail-section">
        <h3>💭 Note Personali</h3>
        <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-top:8px;">${p.personal}</p>
      </div>
      ` : ""}

      <div class="detail-section">
        <h3>🌸 Note Olfattive</h3>
        <div class="notes-grid">
          <div class="note-item top"><strong>Top:</strong> ${p.topNotes.join(", ")}</div>
          <div class="note-item heart"><strong>Heart:</strong> ${p.heartNotes.join(", ")}</div>
          <div class="note-item base"><strong>Base:</strong> ${p.baseNotes.join(", ")}</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>⭐ Valutazione</h3>
        <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
          <span style="font-size:32px; font-weight:700; color:var(--accent);">${p.rating}</span>
          <span style="color:var(--text-muted);">/ 10</span>
          <span style="margin-left:auto; padding:6px 14px; border-radius:20px; background:var(--bg-elevated); font-size:13px;">
            Intensità: ${"🔥".repeat(p.intensity)}${"○".repeat(10-p.intensity)}
          </span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-top:12px;">
          <div style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:10px;">
            <div style="font-size:18px; font-weight:700; color:var(--accent);">${p.longevity}</div>
            <div style="font-size:11px; color:var(--text-muted);">Longevità</div>
          </div>
          <div style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:10px;">
            <div style="font-size:18px; font-weight:700; color:var(--accent);">${p.sillage}</div>
            <div style="font-size:11px; color:var(--text-muted);">Sillage</div>
          </div>
          <div style="text-align:center; padding:8px; background:var(--bg-elevated); border-radius:10px;">
            <div style="font-size:18px; font-weight:700; color:var(--accent);">${p.value}</div>
            <div style="font-size:11px; color:var(--text-muted);">Value</div>
          </div>
        </div>
      </div>

      <div class="detail-price-row">
        <span class="detail-price">€${p.price.toFixed(0)}</span>
        <span style="color:var(--text-muted); font-size:13px;">${p.size} • ${p.gender}</span>
      </div>

      <div class="buy-links">
        <h4>🛒 Negozi diretti</h4>
        <div class="buy-buttons">
          <a href="${p.fragrantica}" target="_blank" class="buy-btn fragrantica">📖 Fragrantica</a>
          <a href="${p.notino}" target="_blank" class="buy-btn notino">🛒 Notino</a>
          <a href="${p.pinalli}" target="_blank" class="buy-btn pinalli">🏪 Pinalli</a>
        </div>
      </div>
      <div class="buy-links">
        <h4>🔍 Confronta prezzi</h4>
        <div class="buy-buttons">
          <a href="${searchGooglePrices(p.name, p.brand)}" target="_blank" class="buy-btn" style="background:rgba(66,133,244,0.15);border-color:#4285F4;color:#8AB4F8;">🔍 Google Shopping</a>
          <a href="${searchIdealoPrices(p.name, p.brand)}" target="_blank" class="buy-btn" style="background:rgba(255,87,34,0.15);border-color:#FF5722;color:#FFAB91;">💶 Idealo</a>
          <a href="${searchTrovaprezzi(p.name, p.brand)}" target="_blank" class="buy-btn" style="background:rgba(0,150,136,0.15);border-color:#009688;color:#80CBC4;">📊 Trovaprezzi</a>
        </div>
      </div>

      <div class="detail-actions">
        <button class="btn ${isWished ? "btn-danger" : "btn-outline"}" onclick="toggleWishlist(${p.id}); showDetail(${p.id})">
          ${isWished ? "❤️ Rimuovi" : "🤍 Wishlist"}
        </button>
      </div>
    </div>
  `;

  document.getElementById("detailModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDetailModal(e) {
  if (!e || e.target.id === "detailModal") {
    document.getElementById("detailModal").classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ============================================================
// NOTE OLFATTIVE
// ============================================================
function renderNotes() {
  const container = document.getElementById("notesContent");
  if (!container) return;

  const allNotes = [];
  perfumeDB.forEach(p => {
    p.topNotes.forEach(n => allNotes.push({ perfume: p, note: n, type: "top", label: "Top" }));
    p.heartNotes.forEach(n => allNotes.push({ perfume: p, note: n, type: "heart", label: "Heart" }));
    p.baseNotes.forEach(n => allNotes.push({ perfume: p, note: n, type: "base", label: "Base" }));
  });

  const grouped = {};
  allNotes.forEach(n => {
    if (!grouped[n.note]) grouped[n.note] = [];
    grouped[n.note].push(n);
  });

  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <h3 style="font-size:18px; margin-bottom:8px;">🌸 Note più presenti</h3>
      <p style="color:var(--text-muted); font-size:14px;">Scopri quali note compaiono più spesso nella tua collezione</p>
    </div>
    ${sorted.slice(0, 20).map(([note, items]) => `
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:16px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-weight:600; font-size:16px;">${note}</span>
          <span style="background:var(--accent); color:#1a1a2e; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">${items.length} profumi</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${items.map(i => `
            <span style="padding:6px 12px; border-radius:10px; background:var(--bg-elevated); font-size:12px; cursor:pointer;"
                  onclick="showDetail(${i.perfume.id})" title="${i.perfume.brand} ${i.perfume.name}">
              ${i.perfume.name} <span style="color:var(--text-muted);">(${i.label})</span>
            </span>
          `).join("")}
        </div>
      </div>
    `).join("")}
  `;
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const container = document.getElementById("dashboardContent");
  if (!container) return;

  const byType = { arab: 0, designer: 0, niche: 0 };
  const bySeason = {};
  const byBrand = {};
  const byFamily = {};
  let totalValue = 0;
  let avgRating = 0;

  perfumeDB.forEach(p => {
    byType[p.type]++;
    p.season.forEach(s => { bySeason[s] = (bySeason[s] || 0) + 1; });
    byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
    byFamily[p.olfactoryFamily] = (byFamily[p.olfactoryFamily] || 0) + 1;
    totalValue += p.price;
    avgRating += p.rating;
  });

  avgRating = (avgRating / perfumeDB.length).toFixed(1);
  const topBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topFamilies = Object.entries(byFamily).sort((a, b) => b[1] - a[1]).slice(0, 5);

  container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px;">
      <div class="stat-card"><div class="number">€${totalValue.toFixed(0)}</div><div class="label">Valore Collezione</div></div>
      <div class="stat-card"><div class="number">${avgRating}</div><div class="label">Media Voti</div></div>
      <div class="stat-card"><div class="number">${wishlist.length}</div><div class="label">In Wishlist</div></div>
      <div class="stat-card"><div class="number">${Object.keys(byBrand).length}</div><div class="label">Brand Diversi</div></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">📊 Distribuzione per Tipo</div>
      <div class="bar-chart">
        ${Object.entries(byType).map(([type, count]) => {
          const colors = { arab: "#ff6b9d", designer: "#60a5fa", niche: "#c9a227" };
          const labels = { arab: "Arabi", designer: "Designer", niche: "Niche" };
          return `
            <div class="bar-item">
              <div class="bar" style="height:${Math.max((count/30)*100, 5)}%; background:${colors[type]};"></div>
              <div class="bar-label">${labels[type]}<br><strong>${count}</strong></div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">🌡️ Distribuzione per Stagione</div>
      <div class="bar-chart">
        ${["Primavera","Estate","Autunno","Inverno"].map(season => {
          const count = bySeason[season] || 0;
          const colors = { "Primavera":"#4ade80", "Estate":"#60a5fa", "Autunno":"#fbbf24", "Inverno":"#f87171" };
          return `
            <div class="bar-item">
              <div class="bar" style="height:${Math.max((count/25)*100, 5)}%; background:${colors[season]};"></div>
              <div class="bar-label">${season}<br><strong>${count}</strong></div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">🏆 Top Brand</div>
      ${topBrands.map(([brand, count]) => `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          <div style="width:${Math.max(count*25, 30)}px; height:24px; background:var(--accent); border-radius:6px; display:flex; align-items:center; justify-content:center; color:#1a1a2e; font-size:12px; font-weight:600;">${count}</div>
          <span style="font-size:14px;">${brand}</span>
        </div>
      `).join("")}
    </div>

    <div class="chart-container">
      <div class="chart-title">🎨 Top Famiglie Olfattive</div>
      ${topFamilies.map(([family, count]) => `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          <div style="width:${Math.max(count*25, 30)}px; height:24px; background:var(--info); border-radius:6px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:600;">${count}</div>
          <span style="font-size:14px;">${family}</span>
        </div>
      `).join("")}
    </div>

    <div class="chart-container">
      <div class="chart-title">💡 Consiglio del Giorno</div>
      <div id="dailySuggestion" style="padding:12px; background:var(--bg); border-radius:12px;"></div>
    </div>
  `;

  generateDailySuggestion();
}

function generateDailySuggestion() {
  const tempText = document.getElementById("weatherTemp")?.textContent || "20°C";
  const temp = parseInt(tempText) || 20;
  const season = getCurrentSeason();

  const suitable = perfumeDB.filter(p => p.season.includes(season));
  const pick = suitable[Math.floor(Math.random() * suitable.length)];

  const el = document.getElementById("dailySuggestion");
  if (el && pick) {
    el.innerHTML = `
      <div style="display:flex; gap:14px; align-items:center;">
        <img src="${pick.image}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
        <div class="placeholder" style="display:none; width:60px; height:60px; border-radius:12px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; font-size:24px;">🌹</div>
        <div>
          <div style="font-size:12px; color:var(--accent); text-transform:uppercase;">Oggi a Bari ${tempText} • ${season}</div>
          <div style="font-weight:600; margin-top:4px;">${pick.name}</div>
          <div style="font-size:13px; color:var(--text-muted);">${pick.brand} • ${pick.olfactoryFamily}</div>
        </div>
        <button class="btn btn-primary" style="margin-left:auto; padding:8px 16px; font-size:12px;" onclick="showDetail(${pick.id})">Vedi</button>
      </div>
    `;
  }
}

// ============================================================
// DISCOVERY
// ============================================================
function renderDiscovery() {
  const container = document.getElementById("discoveryContent");
  if (!container) return;

  const sections = [
    { title: "🌙 Arabi Low-Cost", filter: "arab", desc: "I migliori profumi arabi economici" },
    { title: "✨ Designer Iconici", filter: "designer", desc: "I classici che non deludono mai" },
    { title: "💎 Niche da Sogno", filter: "niche", desc: "Profumi di lusso per occasioni speciali" },
    { title: "🔥 Più Votati", filter: "top", desc: "I profumi con il voto più alto" },
    { title: "🆕 Novità 2023+", filter: "new", desc: "Le ultime uscite nella collezione" }
  ];

  container.innerHTML = sections.map(sec => {
    let items = [];
    if (sec.filter === "top") {
      items = [...perfumeDB].sort((a, b) => b.rating - a.rating).slice(0, 8);
    } else if (sec.filter === "new") {
      items = perfumeDB.filter(p => p.year >= 2023).slice(0, 8);
    } else {
      items = perfumeDB.filter(p => p.type === sec.filter).slice(0, 8);
    }

    return `
      <div class="discovery-section">
        <h3>${sec.title}</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:12px;">${sec.desc}</p>
        <div class="perfume-row">
          ${items.map(p => {
            const style = familyStyles[p.olfactoryFamily] || { color: "#888", icon: "✨" };
            return `
              <div class="perfume-card" onclick="showDetail(${p.id})">
                <div class="perfume-img-wrap">
                  <img src="${p.image}" alt="${p.name}" loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                  <div class="perfume-img-placeholder" style="display:none"><span>🌹</span><span class="ph-name">${p.name}</span></div>
                </div>
                <div class="perfume-info">
                  <div class="perfume-brand">${p.brand}</div>
                  <div class="perfume-name" style="font-size:12px;">${p.name}</div>
                  <div class="perfume-meta">
                    <span class="perfume-price">€${p.price.toFixed(0)}</span>
                    <span>⭐${p.rating}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("") + `
    <div style="margin-top:30px; padding:20px; background:var(--bg-card); border:1px solid var(--border); border-radius:16px; text-align:center;">
      <h3 style="color:var(--accent); margin-bottom:10px;">🌟 Scopri nuove marche</h3>
      <p style="color:var(--text-muted); font-size:14px; margin-bottom:15px;">Marche arabi da esplorare: Lattafa, Armaf, Al Haramain, Khadlaj, Adyan, Anfar, Zimaya, Asdaaf, Ard Al Zaafaran</p>
      <p style="color:var(--text-muted); font-size:14px; margin-bottom:15px;">Designer low-cost: Zara, G. Bellini, LPDO, Bentley, Montblanc</p>
      <button class="btn btn-outline" onclick="window.open('https://www.notino.it/profumi/', '_blank')">🔍 Esplora su Notino</button>
    </div>
  `;
}

// ============================================================
// AGGIORNAMENTO PREZZI - SIMULAZIONE
// ============================================================
async function showPriceUpdate() {
  document.getElementById("priceModal").classList.add("active");
  const progressEl = document.getElementById("priceProgress");
  const textEl = document.getElementById("priceProgressText");
  const resultsEl = document.getElementById("priceResults");

  resultsEl.innerHTML = "";
  const changes = [];

  for (let i = 0; i < perfumeDB.length; i++) {
    const p = perfumeDB[i];
    const variation = (Math.random() * 0.25) - 0.15;
    const newPrice = Math.max(p.price * (1 + variation), 5);
    const diff = newPrice - p.price;
    const diffPercent = ((diff / p.price) * 100).toFixed(1);

    if (Math.abs(diff) > 0.5) {
      changes.push({ perfume: p, oldPrice: p.price, newPrice: newPrice, diff: diff, diffPercent: diffPercent });
      p.price = newPrice;
    }

    const pct = ((i + 1) / perfumeDB.length) * 100;
    progressEl.style.width = pct + "%";
    textEl.textContent = `${i + 1}/${perfumeDB.length} profumi analizzati...`;

    await new Promise(r => setTimeout(r, 80));
  }

  if (changes.length === 0) {
    resultsEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">✅ Nessuna variazione significativa rilevata</div>';
  } else {
    resultsEl.innerHTML = changes.map(c => `
      <div class="price-result-item">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${c.perfume.image}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
          <div class="placeholder" style="display:none; width:40px; height:40px; border-radius:8px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; font-size:16px;">🌹</div>
          <div>
            <div style="font-weight:600; font-size:13px;">${c.perfume.name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${c.perfume.brand}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">€${c.newPrice.toFixed(0)}</div>
          <div class="${c.diff > 0 ? "change-up" : "change-down"}">
            ${c.diff > 0 ? "↑" : "↓"} ${Math.abs(c.diffPercent)}% (€${c.oldPrice.toFixed(0)})
          </div>
        </div>
      </div>
    `).join("");
  }

  textEl.textContent = `Completato! ${changes.length} variazioni rilevate`;
  renderCollection();
  renderWishlist();
  renderStats();
  showToast("💰 Prezzi aggiornati!");
}


// ============================================================
// RICERCA PREZZI GOOGLE SHOPPING
// ============================================================
function searchGooglePrices(perfumeName, brand) {
  const query = encodeURIComponent(`${brand} ${perfumeName} profumo prezzo`);
  return `https://www.google.com/search?tbm=shop&q=${query}`;
}

function searchIdealoPrices(perfumeName, brand) {
  const query = encodeURIComponent(`${brand} ${perfumeName}`);
  return `https://www.idealo.it/risultati.html?q=${query}`;
}

function searchTrovaprezzi(perfumeName, brand) {
  const query = encodeURIComponent(`${brand} ${perfumeName}`);
  return `https://www.trovaprezzi.it/search.jsp?searchText=${query}`;
}

function closePriceModal(e) {
  if (!e || e.target.id === "priceModal") {
    document.getElementById("priceModal").classList.remove("active");
  }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    document.body.style.overflow = "";
  }
});

console.log("🌹 Profumotify v8.0 caricato!");
console.log("📍 Meteo: Bari LIVE | 👤 Utente: Giancarlo | 💎 Profumi:", perfumeDB.length);
