// ============================================================
// PROFUMOTIFY v10.2 - APP JAVASCRIPT
// Collezione di Giancarlo - Bari
// Mobile App + Desktop Responsive
// Wishlist | Meteo LIVE | Advisor rotazione | Prezzi simulati
// ============================================================

let wishlist = [];
try {
  wishlist = JSON.parse(localStorage.getItem("profumotify_wishlist_v8") || "[]");
} catch (e) {
  console.warn("Wishlist parse error, using empty array:", e);
  wishlist = [];
}
let currentFilter = "all";
let searchQuery = "";
let currentTab = "collection";
let priceHistory = {}; // popolato da price-history.json (prezzi reali Notino, aggiornati dalla GitHub Action giornaliera)

// ============================================================
// INIZIALIZZAZIONE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => { document.getElementById("splash").classList.add("hidden"); }, 1800);

  // Check login
  if (!checkAutoLogin()) {
    document.getElementById("app-container").style.display = "none";
    document.getElementById("loginModal").classList.add("active");
    return;
  }

  document.getElementById("app-container").style.display = "block";
  document.getElementById("loginModal").classList.remove("active");
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
  // Service Worker temporarily disabled in v10.2 for cache stability

  loadPriceHistory().then(() => {
    // I prezzi reali arrivano via fetch dopo il primo render: quando
    // sono pronti, aggiorna le viste che mostrano un prezzo.
    renderCollection();
    renderWishlist();
    renderDiscovery();
  });
  fetchMeteo();
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
// METEO - POSIZIONE LIVE (con fallback Bari)
// ============================================================
const BARI_COORDS = { lat: 41.12, lon: 16.87, city: "Bari" };

function getUserLocation() {
  if (!navigator.geolocation) return Promise.resolve(BARI_COORDS);

  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(BARI_COORDS), 6000);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        clearTimeout(timer);
        const { latitude, longitude } = pos.coords;
        let city = "La tua posizione";
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=it`);
          if (res.ok) {
            const geo = await res.json();
            city = geo.city || geo.locality || geo.principalSubdivision || city;
          }
        } catch (e) {
          console.log("Reverse geocoding fallito:", e.message);
        }
        resolve({ lat: latitude, lon: longitude, city });
      },
      () => { clearTimeout(timer); resolve(BARI_COORDS); },
      { timeout: 5000, maximumAge: 600000 }
    );
  });
}

// ============================================================
// STORICO PREZZI REALI (price-history.json, generato dalla
// GitHub Action scripts/check-prices.js una volta al giorno)
// ============================================================
async function loadPriceHistory() {
  try {
    const res = await fetch("price-history.json?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    priceHistory = await res.json();
  } catch (e) {
    console.log("Storico prezzi non disponibile:", e.message);
    priceHistory = {};
  }
}

// Ultimo prezzo reale rilevato per un profumo, con la tendenza rispetto
// alla rilevazione precedente ALLA STESSA taglia (per non confondere un
// cambio di confezione con una variazione di prezzo). Torna null se il
// profumo non è ancora monitorato.
function getRealPriceInfo(id) {
  const hist = priceHistory[id]?.history;
  if (!hist || hist.length === 0) return null;
  const last = hist[hist.length - 1];
  const sameSizeBefore = hist.slice(0, -1).filter(h => h.sizeMl === last.sizeMl);
  const prev = sameSizeBefore[sameSizeBefore.length - 1] || null;
  let trend = null;
  if (prev) {
    if (last.price < prev.price - 0.005) trend = "down";
    else if (last.price > prev.price + 0.005) trend = "up";
    else trend = "same";
  }
  return { price: last.price, sizeMl: last.sizeMl, date: last.date, trend };
}

// Prezzo da mostrare: quello reale se lo conosciamo, altrimenti il
// prezzo di riferimento statico del database come fallback.
function getDisplayPrice(p) {
  const real = getRealPriceInfo(p.id);
  return real ? real.price : p.price;
}

function trendTriangle(trend, size) {
  const s = size || "13px";
  if (trend === "down") return `<span style="color:#4ade80; font-size:${s};" title="Prezzo sceso dall'ultimo controllo">▼</span>`;
  if (trend === "up") return `<span style="color:#f87171; font-size:${s};" title="Prezzo salito dall'ultimo controllo">▲</span>`;
  if (trend === "same") return `<span style="color:#fbbf24; font-size:${s};" title="Prezzo invariato dall'ultimo controllo">●</span>`;
  return "";
}

async function fetchMeteo() {
  const locationEl = document.getElementById("weatherLocationText");
  if (locationEl) locationEl.textContent = "Rilevamento...";

  const loc = await getUserLocation();
  if (locationEl) locationEl.textContent = loc.city;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("API error: " + res.status);
    const data = await res.json();

    if (data && data.current) {
      updateMeteoUI(
        data.current.temperature_2m,
        data.current.relative_humidity_2m,
        data.current.weather_code,
        data.current.wind_speed_10m,
        false
      );
      localStorage.setItem("profumotify_meteo_cache", JSON.stringify({
        temp: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        code: data.current.weather_code,
        wind: data.current.wind_speed_10m,
        city: loc.city,
        timestamp: Date.now()
      }));
    } else {
      throw new Error("Invalid data structure");
    }
  } catch (e) {
    console.log("Meteo API fallita:", e.message);
    const cached = localStorage.getItem("profumotify_meteo_cache");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 3600000) {
          if (locationEl && data.city) locationEl.textContent = data.city;
          updateMeteoUI(data.temp, data.humidity, data.code, data.wind, true);
          return;
        }
      } catch(e) {}
    }
    const season = getCurrentSeason();
    const seasonalTemps = { "Primavera": 18, "Estate": 28, "Autunno": 20, "Inverno": 12 };
    const seasonalHumidity = { "Primavera": 65, "Estate": 70, "Autunno": 72, "Inverno": 75 };
    updateMeteoUI(seasonalTemps[season] || 20, seasonalHumidity[season] || 65, 1, 12, true);
  }
}

function updateMeteoUI(temp, humidity, code, wind, isFallback = false) {
  const tempEl = document.getElementById("weatherTemp");
  const descEl = document.getElementById("weatherDesc");
  const iconEl = document.getElementById("weatherIcon");

  tempEl.textContent = `${Math.round(temp)}°C`;
  const fallbackIndicator = isFallback ? ' [stimato]' : '';

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
  descEl.textContent = `${desc}${fallbackIndicator} • Umidità ${humidity}% • Vento ${Math.round(wind)} km/h`;
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Primavera";
  if (month >= 6 && month <= 8) return "Estate";
  if (month >= 9 && month <= 11) return "Autunno";
  return "Inverno";
}

function getWeatherLocationLabel() {
  return document.getElementById("weatherLocationText")?.textContent || "Bari";
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
    const itemText = item.textContent.toLowerCase();
    const tabMap = {
      "collection": "collezione",
      "wishlist": "wishlist",
      "advisor": "advisor",
      "notes": "note",
      "dashboard": "stats",
      "discovery": "discovery",
      "diary": "diario"
    };
    if (itemText.includes(tabMap[tab] || tab)) {
      item.classList.add("active");
    }
  });

  if (tab === "wishlist") renderWishlist();
  if (tab === "advisor") renderAdvisor();
  if (tab === "notes") renderNotes();
  if (tab === "dashboard") renderDashboard();
  if (tab === "discovery") renderDiscovery();
  if (tab === "diary") renderDiary();
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
    const realInfo = getRealPriceInfo(p.id);
    const cardPrice = realInfo ? realInfo.price : p.price;

    return `
      <div class="perfume-card fade-in ${isWished ? "wishlist-active" : ""}" style="animation-delay:${i*0.03}s" onclick="showDetail(${p.id})">
        <div class="perfume-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="handleImageError(this)"
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
            <span class="perfume-price">€${cardPrice.toFixed(0)} ${realInfo ? trendTriangle(realInfo.trend, "11px") : ""}</span>
            <span class="perfume-rating">${stars.split("").map(s => `<span class="star ${s==="★"?"":"empty"}">${s}</span>`).join("")}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function filterType(type, btn) {
  currentFilter = type;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  btn?.classList.add("active");
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
  try {
    localStorage.setItem("profumotify_wishlist_v8", JSON.stringify(wishlist));
  } catch (e) {
    console.warn("Could not save wishlist:", e);
  }
  renderCollection();
  if (currentTab === "wishlist") renderWishlist();
}

function removeFromWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    const perfume = perfumeDB.find(p => p.id === id);
    wishlist.splice(idx, 1);
    try {
    localStorage.setItem("profumotify_wishlist_v8", JSON.stringify(wishlist));
  } catch (e) {
    console.warn("Could not save wishlist:", e);
  }
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
    ${wished.map(p => {
      const realInfo = getRealPriceInfo(p.id);
      const itemPrice = realInfo ? realInfo.price : p.price;
      return `
      <div class="wishlist-item">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="handleImageError(this)" onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
        <div class="placeholder" style="display:none">🌹</div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-brand">${p.brand}</div>
          <div class="wishlist-item-name">${p.name}</div>
          <div class="wishlist-item-price">€${itemPrice.toFixed(0)} ${realInfo ? trendTriangle(realInfo.trend, "11px") : ""}</div>
        </div>
        <button class="wishlist-item-remove" onclick="removeFromWishlist(${p.id})" title="Rimuovi">🗑️</button>
        <button class="btn btn-primary" style="padding:8px 16px; font-size:12px; margin-left:8px;" onclick="addToCollectionFromWishlist(${p.id})" title="Sposta in collezione">🎉 Acquistato</button>
      </div>
    `;
    }).join("")}
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

// ============================================================
// ADVISOR SUPER SMART v9.0
// Suggerimenti approfonditi basati su meteo, occasioni, layering
// ============================================================

function renderSmartAdvisor() {
  const container = document.getElementById("advisorContent");
  if (!container) return;

  const season = getCurrentSeason();
  const tempText = document.getElementById("weatherTemp")?.textContent || "20°C";
  const temp = parseInt(tempText) || 20;
  const humidityText = document.getElementById("weatherDesc")?.textContent || "";
  const humidity = humidityText.includes("65") ? 65 : (humidityText.includes("70") ? 70 : 60);

  // Determina condizioni meteo dettagliate
  let weatherCondition = "mild";
  if (temp > 28) weatherCondition = "hot";
  else if (temp > 23) weatherCondition = "warm";
  else if (temp < 12) weatherCondition = "cold";
  else if (temp < 18) weatherCondition = "cool";

  // Determina famiglie consigliate basate su meteo DETTAGLIATO
  let recFamilies = [];
  let reasons = [];
  let layeringSuggestion = null;

  if (weatherCondition === "hot") {
    recFamilies = ["Aromatico Acquatico", "Citrus Aromatico", "Floreale Acquatico"];
    reasons = [
      "🌡️ Temperatura alta: profumi freschi evaporano meglio",
      "💧 Note acquatiche rinfrescano la pelle",
      "🍋 Agrumi durano di più col caldo"
    ];
    if (humidity > 65) {
      reasons.push('💦 Umidità alta: evita note pesanti che "appiccicano"');
      layeringSuggestion = { base: "Cool Water", enhancer: "Soul Sea", effect: "Effetto mare raddoppiato" };
    }
  } else if (weatherCondition === "warm") {
    recFamilies = ["Aromatico Fougère", "Floreale Fruttato", "Citrus Fruttato"];
    reasons = [
      "🌤️ Clima mite: versatile, quasi tutto funziona",
      "🌿 Fougère per ufficio, Fruttato per sera"
    ];
  } else if (weatherCondition === "cool") {
    recFamilies = ["Orientale Speziato", "Orientale Legnoso", "Aromatico Legnoso"];
    reasons = [
      "🍂 Freschezza: spezie e legni riscaldano",
      "🔥 Ambra e patchouli durano di più sul maglione"
    ];
  } else if (weatherCondition === "cold") {
    recFamilies = ["Orientale Gourmand", "Orientale Legnoso", "Orientale Speziato"];
    reasons = [
      '❄️ Freddo intenso: solo profumi "beast mode"',
      "🍯 Gourmand proiettano meglio sotto il cappotto",
      "🪵 Oud e legni resistono al freddo"
    ];
    layeringSuggestion = { base: "Oud Mood Silver", enhancer: "Opulent Oud", effect: "Oud bomb invernale" };
  }

  // Filtra profumi adatti
  const suitable = perfumeDB.filter(p =>
    recFamilies.some(f => p.olfactoryFamily.includes(f)) || p.season.includes(season)
  );

  // Rotazione: non ripetere per 7 giorni
  const today = new Date().toDateString();
  let recentPicks = JSON.parse(localStorage.getItem("profumotify_recent_advisor") || "[]");
  recentPicks = recentPicks.filter(d => {
    const diff = (new Date(today) - new Date(d.date)) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });
  const recentIds = recentPicks.map(d => d.id);

  const available = suitable.filter(p => !recentIds.includes(p.id));
  const pool = available.length > 0 ? available : suitable;

  // Pick principale
  const seed = today.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  const pick = pool[seed % pool.length];
  const alt1 = pool[(seed + 1) % pool.length];
  const alt2 = pool[(seed + 2) % pool.length];

  // Salva pick recente
  recentPicks.push({ date: today, id: pick.id });
  localStorage.setItem("profumotify_recent_advisor", JSON.stringify(recentPicks));

  // Occasione speciale
  const hour = new Date().getHours();
  let occasion = "giorno";
  if (hour >= 18 && hour < 22) occasion = "serata";
  if (hour >= 22 || hour < 6) occasion = "notte";

  const occasionPerfumes = perfumeDB.filter(p => 
    p.occasion.toLowerCase().includes(occasion) || 
    (occasion === "serata" && p.olfactoryFamily.includes("Orientale"))
  );
  const occasionPick = occasionPerfumes[seed % occasionPerfumes.length] || pick;

  // Profumi con note simili al pick (per "famiglia olfattiva")
  const pickNotes = [...pick.topNotes, ...pick.heartNotes, ...pick.baseNotes];
  const similar = perfumeDB.filter(p => {
    if (p.id === pick.id) return false;
    const pNotes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes];
    const common = pNotes.filter(n => pickNotes.includes(n));
    return common.length >= 3;
  }).slice(0, 3);

  container.innerHTML = `
    <div class="advisor-box">
      <h3>🎯 Consiglio Intelligente per Oggi a ${getWeatherLocationLabel()}</h3>

      <div style="background:var(--bg-elevated); border-radius:12px; padding:16px; margin:16px 0;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <span style="font-size:32px;">${getWeatherIcon(weatherCondition)}</span>
          <div>
            <div style="font-weight:600;">${tempText} • ${season} • ${occasion}</div>
            <div style="font-size:13px; color:var(--text-muted);">Umidità ${humidity}% • Condizione: ${weatherCondition}</div>
          </div>
        </div>
        <div style="font-size:13px; color:var(--text-muted); line-height:1.6;">
          ${reasons.map(r => `<div style="margin-bottom:6px;">${r}</div>`).join('')}
        </div>
      </div>

      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--accent); text-transform:uppercase; margin-bottom:10px; font-weight:600;">⭐ Scelta Principale</div>
        <div class="advisor-perfume" onclick="showDetail(${pick.id})" style="cursor:pointer;">
          <img src="${pick.image}" alt="${pick.name}" onerror="handleImageError(this)" onload="this.style.display='block'; this.nextElementSibling.style.display='none';" style="width:80px; height:80px; border-radius:12px; object-fit:cover;">
          <div class="placeholder" style="display:none; width:80px; height:80px; border-radius:12px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; font-size:32px;">🌹</div>
          <div class="advisor-perfume-info" style="flex:1;">
            <div class="name" style="font-size:18px; font-weight:700;">${pick.name}</div>
            <div class="brand" style="font-size:14px; color:var(--text-muted);">${pick.brand} • ${pick.olfactoryFamily}</div>
            <div class="reason" style="font-size:13px; color:var(--accent); margin-top:6px;">
              💡 Perfetto per ${season} a ${tempText} • ${pick.longevity}h longevità
            </div>
            <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
              ${pick.season.map(s => `<span style="padding:4px 10px; border-radius:10px; background:var(--bg); font-size:11px; color:var(--text-muted);">${s}</span>`).join('')}
            </div>
          </div>
          <button class="btn btn-primary" style="padding:10px 20px; font-size:13px;">Vedi</button>
        </div>
      </div>

      ${layeringSuggestion ? `
      <div style="margin-top:20px; background:linear-gradient(135deg, rgba(201,162,39,0.1), transparent); border:1px dashed var(--accent); border-radius:12px; padding:16px;">
        <div style="font-size:12px; color:var(--accent); text-transform:uppercase; margin-bottom:10px; font-weight:600;">🧪 Layering Suggerito</div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">1️⃣ ${layeringSuggestion.base}</span>
          <span style="font-size:20px;">+</span>
          <span style="font-size:24px;">2️⃣ ${layeringSuggestion.enhancer}</span>
          <span style="font-size:20px;">=</span>
          <span style="font-size:16px; color:var(--accent); font-weight:600;">${layeringSuggestion.effect}</span>
        </div>
      </div>
      ` : ''}

      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px; font-weight:600;">🔄 Alternative per Varietà</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${[alt1, alt2].map(p => `
            <div class="perfume-card" style="min-width:140px; flex:1; cursor:pointer;" onclick="showDetail(${p.id})">
              <div class="perfume-img-wrap" style="aspect-ratio:1;">
                <img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"
                  onerror="handleImageError(this)"
                  onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="perfume-img-placeholder" style="display:none"><span>🌹</span><span class="ph-name">${p.name}</span></div>
              </div>
              <div class="perfume-info">
                <div class="perfume-brand">${p.brand}</div>
                <div class="perfume-name" style="font-size:12px;">${p.name}</div>
                <div style="font-size:11px; color:var(--accent);">⭐ ${p.rating}/10</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px; font-weight:600;">🌙 Consiglio per la Serata</div>
        <div class="advisor-perfume" onclick="showDetail(${occasionPick.id})" style="cursor:pointer; background:linear-gradient(135deg, rgba(255,107,157,0.1), transparent); border-color:var(--rose);">
          <img src="${occasionPick.image}" alt="${occasionPick.name}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;"
            onerror="handleImageError(this)">
          <div class="advisor-perfume-info">
            <div class="name">${occasionPick.name}</div>
            <div class="brand">${occasionPick.brand} • ${occasionPick.olfactoryFamily}</div>
            <div class="reason" style="color:var(--rose);">🌙 Ideale per ${occasion}</div>
          </div>
          <button class="btn btn-outline" style="padding:8px 16px; font-size:12px; border-color:var(--rose); color:var(--rose);">Vedi</button>
        </div>
      </div>

      ${similar.length > 0 ? `
      <div style="margin-top:20px;">
        <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px; font-weight:600;">👥 Profumi Simili (stesse note)</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${similar.map(p => `
            <span style="padding:8px 14px; border-radius:20px; background:var(--bg-elevated); border:1px solid var(--border); font-size:12px; cursor:pointer;"
                  onclick="showDetail(${p.id})">${p.name} <span style="color:var(--text-muted);">(${p.brand})</span></span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div style="margin-top:20px; padding:12px; background:var(--bg); border-radius:12px;">
        <div style="font-size:12px; color:var(--text-muted); line-height:1.6;">
          💡 <strong>Perché questo profumo?</strong> L'advisor analizza temperatura (${tempText}), umidità (${humidity}%), stagione (${season}) e ora del giorno per suggerire il profumo perfetto. La rotazione evita ripetizioni per 7 giorni.
        </div>
      </div>
    </div>
  `;
}

function getWeatherIcon(condition) {
  const icons = { hot: "🔥", warm: "🌤️", mild: "⛅", cool: "🍂", cold: "❄️" };
  return icons[condition] || "🌡️";
}


function renderAdvisor() {
  renderSmartAdvisor();
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

  const realInfo = getRealPriceInfo(id);
  const realHistory = priceHistory[id]?.history || [];
  const mainPrice = realInfo ? realInfo.price : p.price;
  const mainPriceMeta = realInfo
    ? `${realInfo.sizeMl ? realInfo.sizeMl + "ml" : p.size} • aggiornato il ${new Date(realInfo.date).toLocaleDateString("it-IT")}`
    : `${p.size} • ${p.gender} • prezzo di riferimento (non ancora monitorato)`;

  const realPriceSection = realHistory.length > 0 ? `
      <div class="chart-container" style="margin:0 0 16px;">
        <div class="chart-title">📈 Andamento prezzo Notino</div>
        <div id="priceChart-${id}"></div>
        ${realHistory.length === 1
          ? `<p style="color:var(--text-muted); font-size:12px; margin-top:8px;">Primo rilevamento: il grafico si popolerà con i controlli dei prossimi giorni.</p>`
          : `<p style="color:var(--text-muted); font-size:12px; margin-top:8px;">Minimo storico: €${Math.min(...realHistory.map(h => h.price)).toFixed(2)} • ${realHistory.length} rilevazioni</p>`
        }
      </div>
    ` : `
      <div class="chart-container" style="margin:0 0 16px; border-color:var(--border);">
        <div class="chart-title">📈 Prezzo reale su Notino</div>
        <p style="color:var(--text-muted); font-size:12px; margin-top:8px;">Non ancora monitorato in automatico per questo profumo (serve un link Notino diretto confermato).</p>
      </div>
    `;

  content.innerHTML = `
    <div class="detail-img">
      <img src="${p.image}" alt="${p.name}"
        onerror="handleImageError(this)"
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
        <span class="detail-price">€${mainPrice.toFixed(2)}</span> ${realInfo ? trendTriangle(realInfo.trend, "16px") : ""}
        <span style="color:var(--text-muted); font-size:13px;">${mainPriceMeta}</span>
      </div>

      ${realPriceSection}

      <div class="buy-links">
        <h4>🛒 Negozi</h4>
        <div class="buy-buttons">
          <a href="${p.fragrantica}" target="_blank" class="buy-btn fragrantica">📖 Fragrantica</a>
          <a href="${p.notino}" target="_blank" class="buy-btn notino">🛒 Notino</a>
          <a href="${p.pinalli}" target="_blank" class="buy-btn pinalli">🏪 Pinalli (ricerca)</a>
        </div>
        <div class="buy-buttons" style="margin-top:8px;">
          <a href="${getFragranticaSearchUrl(p.brand, p.name)}" target="_blank" class="buy-btn" style="padding:6px 12px; font-size:11px; opacity:0.75;">🔍 Se il link Fragrantica non è quello giusto, cerca</a>
          <a href="${getNotinoSearchUrl(p.brand, p.name)}" target="_blank" class="buy-btn" style="padding:6px 12px; font-size:11px; opacity:0.75;">🔍 Se il link Notino non è quello giusto, cerca</a>
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

  if (realHistory.length > 0) drawPriceChart(`priceChart-${id}`, realHistory);

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

// ============================================================
// STATS AVANZATE v9.0 - GRAFICI INTERATTIVI
// ============================================================

function renderAdvancedStats() {
  const container = document.getElementById("dashboardContent");
  if (!container) return;

  // Calcola statistiche
  const byType = { arab: 0, designer: 0, niche: 0 };
  const bySeason = { "Primavera": 0, "Estate": 0, "Autunno": 0, "Inverno": 0 };
  const byFamily = {};
  const byBrand = {};
  const allNotes = {};
  let totalValue = 0;
  let avgRating = 0;
  let totalLongevity = 0;
  let totalSillage = 0;

  perfumeDB.forEach(p => {
    byType[p.type]++;
    p.season.forEach(s => bySeason[s] = (bySeason[s] || 0) + 1);
    byFamily[p.olfactoryFamily] = (byFamily[p.olfactoryFamily] || 0) + 1;
    byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
    totalValue += p.price;
    avgRating += p.rating;
    totalLongevity += p.longevity;
    totalSillage += p.sillage;

    [...p.topNotes, ...p.heartNotes, ...p.baseNotes].forEach(n => {
      allNotes[n] = (allNotes[n] || 0) + 1;
    });
  });

  avgRating = (avgRating / perfumeDB.length).toFixed(1);
  const avgLongevity = (totalLongevity / perfumeDB.length).toFixed(1);
  const avgSillage = (totalSillage / perfumeDB.length).toFixed(1);

  // Top note mancanti (note comuni che non hai)
  const commonNotes = ["Oud", "Rosa", "Vaniglia", "Muschio", "Ambra", "Patchouli", "Iris", "Ylang-ylang", "Sandalwood", "Cedro"];
  const missingNotes = commonNotes.filter(n => !allNotes[n]).map(n => `🌸 ${n}`);

  // Famiglie mancanti
  const allFamilies = Object.keys(familyStyles || {});
  const yourFamilies = Object.keys(byFamily);
  const missingFamilies = allFamilies.filter(f => !yourFamilies.includes(f)).map(f => `🎨 ${f}`);

  container.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px;">
      <div class="stat-card"><div class="number">${perfumeDB.length}</div><div class="label">Profumi Totali</div></div>
      <div class="stat-card"><div class="number">€${totalValue.toFixed(0)}</div><div class="label">Valore Collezione</div></div>
      <div class="stat-card"><div class="number">${avgRating}</div><div class="label">Media Voti</div></div>
      <div class="stat-card"><div class="number">${avgLongevity}</div><div class="label">Longevità Media</div></div>
      <div class="stat-card"><div class="number">${avgSillage}</div><div class="label">Sillage Medio</div></div>
      <div class="stat-card"><div class="number">${Object.keys(byBrand).length}</div><div class="label">Brand Diversi</div></div>
    </div>

    <!-- GRAFICO A TORTA: Distribuzione per Tipo -->
    <div class="chart-container">
      <div class="chart-title">📊 Distribuzione per Tipo</div>
      <div class="pie-chart" id="pieType"></div>
      <div class="pie-legend">
        <span class="pie-legend-item"><span class="pie-color" style="background:#ff6b9d"></span> Arabi (${byType.arab})</span>
        <span class="pie-legend-item"><span class="pie-color" style="background:#60a5fa"></span> Designer (${byType.designer})</span>
        <span class="pie-legend-item"><span class="pie-color" style="background:#c9a227"></span> Niche (${byType.niche || 0})</span>
      </div>
    </div>

    <!-- GRAFICO A TORTA: Distribuzione per Stagione -->
    <div class="chart-container">
      <div class="chart-title">🌡️ Distribuzione per Stagione</div>
      <div class="pie-chart" id="pieSeason"></div>
      <div class="pie-legend">
        <span class="pie-legend-item"><span class="pie-color" style="background:#4ade80"></span> Primavera (${bySeason["Primavera"] || 0})</span>
        <span class="pie-legend-item"><span class="pie-color" style="background:#60a5fa"></span> Estate (${bySeason["Estate"] || 0})</span>
        <span class="pie-legend-item"><span class="pie-color" style="background:#fbbf24"></span> Autunno (${bySeason["Autunno"] || 0})</span>
        <span class="pie-legend-item"><span class="pie-color" style="background:#f87171"></span> Inverno (${bySeason["Inverno"] || 0})</span>
      </div>
    </div>

    <!-- GRAFICO RADAR: Profilo Collezione -->
    <div class="chart-container">
      <div class="chart-title">🎯 Profilo Collezione (Radar)</div>
      <div class="radar-chart" id="radarChart"></div>
      <div style="display:flex; justify-content:center; gap:20px; margin-top:10px; font-size:12px; color:var(--text-muted);">
        <span>Longevità: ${avgLongevity}/10</span>
        <span>Sillage: ${avgSillage}/10</span>
        <span>Value: ${(totalValue/perfumeDB.length/10).toFixed(1)}/10</span>
      </div>
    </div>

    <!-- TOP NOTE -->
    <div class="chart-container">
      <div class="chart-title">🌸 Top 10 Note più Presenti</div>
      <div class="notes-bar-chart">
        ${Object.entries(allNotes).sort((a,b) => b[1]-a[1]).slice(0,10).map(([note, count], i) => `
          <div class="note-bar-item">
            <span class="note-name">${note}</span>
            <div class="note-bar-wrap">
              <div class="note-bar" style="width:${(count/5)*100}%; background:hsl(${200 + i*15}, 70%, 50%);"></div>
            </div>
            <span class="note-count">${count}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- NOTE MANCANTI -->
    <div class="chart-container" style="border-color:var(--warning);">
      <div class="chart-title">⚠️ Note Mancanti nella Tua Collezione</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
        ${missingNotes.length > 0 ? missingNotes.map(n => `
          <span style="padding:8px 14px; border-radius:20px; background:var(--bg-elevated); border:1px solid var(--warning); color:var(--warning); font-size:13px;">${n}</span>
        `).join('') : '<span style="color:var(--success);">🎉 Hai una collezione completa!</span>'}
      </div>
      ${missingNotes.length > 0 ? `<p style="color:var(--text-muted); font-size:13px; margin-top:10px;">💡 Cerca profumi con queste note per arricchire la collezione</p>` : ''}
    </div>

    <!-- FAMIGLIE MANCANTI -->
    <div class="chart-container" style="border-color:var(--info);">
      <div class="chart-title">🎨 Famiglie Olfattive Mancanti</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
        ${missingFamilies.length > 0 ? missingFamilies.map(f => `
          <span style="padding:8px 14px; border-radius:20px; background:var(--bg-elevated); border:1px solid var(--info); color:var(--info); font-size:13px;">${f}</span>
        `).join('') : '<span style="color:var(--success);">🎉 Copertura completa!</span>'}
      </div>
    </div>

    <!-- BILANCIAMENTO STAGIONALE -->
    <div class="chart-container">
      <div class="chart-title">🌍 Bilanciamento Stagionale</div>
      <div class="season-balance">
        ${["Primavera", "Estate", "Autunno", "Inverno"].map(season => {
          const count = bySeason[season] || 0;
          const pct = Math.round((count / perfumeDB.length) * 100);
          const colors = { "Primavera":"#4ade80", "Estate":"#60a5fa", "Autunno":"#fbbf24", "Inverno":"#f87171" };
          const icons = { "Primavera":"🌸", "Estate":"☀️", "Autunno":"🍂", "Inverno":"❄️" };
          return `
            <div class="season-item">
              <div class="season-icon">${icons[season]}</div>
              <div class="season-bar-wrap">
                <div class="season-bar" style="width:${pct}%; background:${colors[season]};"></div>
              </div>
              <div class="season-pct">${pct}%</div>
              <div class="season-label">${season}</div>
            </div>
          `;
        }).join('')}
      </div>
      ${(bySeason["Estate"] || 0) / perfumeDB.length > 0.4 ? '<p style="color:var(--warning); font-size:13px; margin-top:10px;">⚠️ Hai troppi profumi estivi, bilancia con autunnali/invernali</p>' : ''}
      ${(bySeason["Inverno"] || 0) / perfumeDB.length > 0.4 ? '<p style="color:var(--warning); font-size:13px; margin-top:10px;">⚠️ Hai troppi profumi invernali, bilancia con primaverili/estivi</p>' : ''}
    </div>

    <!-- TIMELINE AGGIUNTE -->
    <div class="chart-container">
      <div class="chart-title">📈 Timeline Aggiunte (Simulato)</div>
      <div class="timeline-chart">
        ${generateTimelineData().map(item => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">${item.date}</div>
              <div class="timeline-name">${item.name}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- WORD CLOUD NOTE -->
    <div class="chart-container">
      <div class="chart-title">☁️ Word Cloud Note Olfattive</div>
      <div class="word-cloud">
        ${Object.entries(allNotes).sort((a,b) => b[1]-a[1]).slice(0,20).map(([note, count]) => {
          const size = 12 + count * 3;
          const opacity = 0.5 + (count / 10);
          return `<span class="word-cloud-item" style="font-size:${size}px; opacity:${opacity};">${note}</span>`;
        }).join('')}
      </div>
    </div>
  `;

  // Disegna grafici SVG
  drawPieChart("pieType", [byType.arab, byType.designer, byType.niche || 0], ["#ff6b9d", "#60a5fa", "#c9a227"]);
  drawPieChart("pieSeason", [bySeason["Primavera"], bySeason["Estate"], bySeason["Autunno"], bySeason["Inverno"]], ["#4ade80", "#60a5fa", "#fbbf24", "#f87171"]);
  drawRadarChart("radarChart", [avgLongevity, avgSillage, avgRating, (totalValue/perfumeDB.length/10).toFixed(1), 7, 8]);
}

function drawPieChart(id, values, colors) {
  const container = document.getElementById(id);
  if (!container) return;
  const total = values.reduce((a,b) => a+b, 0);
  if (total === 0) return;

  let currentAngle = 0;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.width = "150px";
  svg.style.height = "150px";

  values.forEach((val, i) => {
    if (val === 0) return;
    const angle = (val / total) * 360;
    const x1 = 50 + 40 * Math.cos((currentAngle - 90) * Math.PI / 180);
    const y1 = 50 + 40 * Math.sin((currentAngle - 90) * Math.PI / 180);
    const x2 = 50 + 40 * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
    const y2 = 50 + 40 * Math.sin((currentAngle + angle - 90) * Math.PI / 180);
    const largeArc = angle > 180 ? 1 : 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`);
    path.setAttribute("fill", colors[i]);
    path.setAttribute("stroke", "var(--bg-card)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);
    currentAngle += angle;
  });

  container.appendChild(svg);
}

function drawRadarChart(id, values) {
  const container = document.getElementById(id);
  if (!container) return;
  const labels = ["Longevità", "Sillage", "Rating", "Value", "Intensità", "Versatilità"];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.style.width = "200px";
  svg.style.height = "200px";

  // Disegna griglia
  for (let i = 1; i <= 5; i++) {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = [];
    for (let j = 0; j < 6; j++) {
      const angle = (j * 60 - 90) * Math.PI / 180;
      const r = (i / 5) * 80;
      points.push(`${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`);
    }
    polygon.setAttribute("points", points.join(" "));
    polygon.setAttribute("fill", "none");
    polygon.setAttribute("stroke", "var(--border)");
    polygon.setAttribute("stroke-width", "1");
    svg.appendChild(polygon);
  }

  // Disegna dati
  const dataPoints = [];
  values.forEach((val, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180;
    const r = (val / 10) * 80;
    dataPoints.push(`${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`);
  });

  const dataPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  dataPolygon.setAttribute("points", dataPoints.join(" "));
  dataPolygon.setAttribute("fill", "rgba(201,162,39,0.3)");
  dataPolygon.setAttribute("stroke", "var(--accent)");
  dataPolygon.setAttribute("stroke-width", "2");
  svg.appendChild(dataPolygon);

  container.appendChild(svg);
}

// Grafico a linea dell'andamento prezzi reali di un profumo (history:
// [{date, price, sizeMl}, ...] da price-history.json, in ordine cronologico).
function drawPriceChart(id, history) {
  const container = document.getElementById(id);
  if (!container || !history || history.length === 0) return;

  const W = 280, H = 90, PAD = 10;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.width = "100%";
  svg.style.height = "90px";

  if (history.length === 1) {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", W / 2);
    dot.setAttribute("cy", H / 2);
    dot.setAttribute("r", 4);
    dot.setAttribute("fill", "var(--accent)");
    svg.appendChild(dot);
    container.appendChild(svg);
    return;
  }

  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((h.price - min) / range) * (H - PAD * 2);
    return [x, y];
  });

  const area = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  area.setAttribute("points", `${PAD},${H - PAD} ` + points.map(pt => pt.join(",")).join(" ") + ` ${W - PAD},${H - PAD}`);
  area.setAttribute("fill", "rgba(201,162,39,0.15)");
  svg.appendChild(area);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("points", points.map(pt => pt.join(",")).join(" "));
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "var(--accent)");
  line.setAttribute("stroke-width", "2");
  svg.appendChild(line);

  const [lastX, lastY] = points[points.length - 1];
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", lastX);
  dot.setAttribute("cy", lastY);
  dot.setAttribute("r", 3);
  dot.setAttribute("fill", "var(--accent)");
  svg.appendChild(dot);

  container.appendChild(svg);
}

function generateTimelineData() {
  // Simula timeline basata su ID (più recenti = ID più alti)
  return perfumeDB.slice().sort((a,b) => b.id - a.id).slice(0, 8).map(p => ({
    date: `202${Math.floor(Math.random() * 4 + 3)}`,
    name: p.name
  }));
}


function renderDashboard() {
  renderAdvancedStats();
  // Aggiungi il consiglio del giorno in fondo
  const container = document.getElementById("dashboardContent");
  if (container) {
    container.innerHTML += `
      <div class="chart-container">
        <div class="chart-title">💡 Consiglio del Giorno</div>
        <div id="dailySuggestion" style="padding:12px; background:var(--bg); border-radius:12px;"></div>
      </div>
    `;
    generateDailySuggestion();
    // Aggiungi badge collezionista
    container.innerHTML += renderBadges();
  }
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
          onerror="handleImageError(this)"
          onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
        <div class="placeholder" style="display:none; width:60px; height:60px; border-radius:12px; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; font-size:24px;">🌹</div>
        <div>
          <div style="font-size:12px; color:var(--accent); text-transform:uppercase;">Oggi a ${getWeatherLocationLabel()} ${tempText} • ${season}</div>
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
function renderDiary() {
  const container = document.getElementById("diaryContent");
  if (!container) return;

  const logs = scentLog.slice().reverse();
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today);

  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <h3 style="font-size:18px; margin-bottom:8px;">📓 Diario Olfattivo</h3>
      <p style="color:var(--text-muted); font-size:14px;">Traccia quali profumi usi e come performano</p>
    </div>

    <div class="chart-container" style="border-color:var(--accent);">
      <div class="chart-title">📅 Oggi (${new Date().toLocaleDateString("it-IT")})</div>
      ${todayLogs.length > 0 ? todayLogs.map(l => `
        <div style="display:flex; align-items:center; gap:12px; padding:10px; background:var(--bg); border-radius:10px; margin-bottom:8px;">
          <span style="font-size:24px;">🌹</span>
          <div style="flex:1;">
            <div style="font-weight:600;">${l.name}</div>
            <div style="font-size:12px; color:var(--text-muted);">${l.sprays || 3} spray • ${l.weather || 'N/A'}</div>
          </div>
          <span style="font-size:12px; color:var(--accent);">${l.action === 'acquired' ? '🎉 Acquistato' : '✨ Indossato'}</span>
        </div>
      `).join('') : '<div style="color:var(--text-muted); text-align:center; padding:20px;">Nessun profumo loggato oggi</div>'}
    </div>

    <div class="chart-container">
      <div class="chart-title">📈 Storico Utilizzo</div>
      <div class="timeline-chart">
        ${logs.slice(0, 15).map(l => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">${new Date(l.date).toLocaleDateString("it-IT", {day:'numeric', month:'short'})}</div>
              <div class="timeline-name">${l.name} ${l.action === 'acquired' ? '🎉' : '✨'} ${l.sprays ? `(${l.sprays} spray)` : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">🏆 Statistiche Utilizzo</div>
      ${perfumeDB.slice(0, 5).map(p => {
        const stats = getUsageStats(p.id);
        return `
          <div style="display:flex; align-items:center; gap:12px; padding:10px; border-bottom:1px solid var(--border);">
            <img src="${p.image}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;" onerror="this.style.display='none'">
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:600;">${p.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">Indossato ${stats.totalWears} volte • Ultimo: ${stats.lastWorn}</div>
            </div>
            <button class="btn btn-outline" style="padding:6px 12px; font-size:11px;" onclick="logPerfumeUsage(${p.id}, 3)">📝 Logga</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

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

    if (items.length === 0) return "";

    return `
      <div class="discovery-section">
        <h3>${sec.title}</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:12px;">${sec.desc}</p>
        <div class="perfume-row">
          ${items.map(p => {
            const style = familyStyles[p.olfactoryFamily] || { color: "#888", icon: "✨" };
            const realInfo = getRealPriceInfo(p.id);
            const itemPrice = realInfo ? realInfo.price : p.price;
            return `
              <div class="perfume-card" onclick="showDetail(${p.id})">
                <div class="perfume-img-wrap">
                  <img src="${p.image}" alt="${p.name}" loading="lazy"
                    onerror="handleImageError(this)"
                    onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                  <div class="perfume-img-placeholder" style="display:none"><span>🌹</span><span class="ph-name">${p.name}</span></div>
                </div>
                <div class="perfume-info">
                  <div class="perfume-brand">${p.brand}</div>
                  <div class="perfume-name" style="font-size:12px;">${p.name}</div>
                  <div class="perfume-meta">
                    <span class="perfume-price">€${itemPrice.toFixed(0)} ${realInfo ? trendTriangle(realInfo.trend, "11px") : ""}</span>
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
      <p style="color:var(--text-muted); font-size:14px; margin-bottom:15px;">Marche arabi da esplorare: Lattafa, Armaf, Al Haramain, Khadlaj, Adyan, Anfar London, Zimaya, Asdaaf, Ard Al Zaafaran</p>
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
            onerror="handleImageError(this)"
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


// ============================================================
// LOGIN SYSTEM FUNCTIONS (FIX v8.1)
// ============================================================
const users = {
  "giancarlo": { name: "Giancarlo", password: "bari2024", location: "Bari" },
  "ospite": { name: "Ospite", password: "ospite", location: "Bari" }
};

function checkAutoLogin() {
  const saved = localStorage.getItem("profumotify_user_v8");
  if (saved) {
    try {
      const user = JSON.parse(saved);
      return user && user.name;
    } catch(e) {
      return false;
    }
  }
  return false;
}

function loginUser(username, password) {
  const user = users[username.toLowerCase()];
  if (!user) {
    return { success: false, error: "Utente non trovato" };
  }
  if (user.password !== password) {
    return { success: false, error: "Password errata" };
  }
  const userData = { name: user.name, location: user.location, username: username.toLowerCase() };
  localStorage.setItem("profumotify_user_v8", JSON.stringify(userData));
  return { success: true, user: userData };
}

function logoutUser() {
  localStorage.removeItem("profumotify_user_v8");
}

function getCurrentUser() {
  const saved = localStorage.getItem("profumotify_user_v8");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {
      return null;
    }
  }
  return null;
}


// ============================================================
// LINK AUTOMATICI FRAGRANTICA (FIX v8.1)
// Genera link di ricerca dal nome profumo invece di ID fissi
// ============================================================
function getFragranticaSearchUrl(brand, name) {
  const query = encodeURIComponent(brand + " " + name);
  return `https://www.fragrantica.com/search/?q=${query}`;
}

function getNotinoSearchUrl(brand, name) {
  const query = encodeURIComponent(brand + " " + name);
  return `https://www.notino.it/search/?q=${query}`;
}

function getPinalliSearchUrl(brand, name) {
  const query = encodeURIComponent(brand + " " + name);
  return `https://www.pinalli.it/search?q=${query}`;
}


// ============================================================
// GESTIONE IMMAGINI MULTIPLE (FIX v8.1)
// Prova Fragrantica → Notino → Placeholder
// ============================================================
function handleImageError(img) {
  // La foto originale non è disponibile: mostra il placeholder 🌹
  img.style.display = 'none';
  const placeholder = img.nextElementSibling;
  if (placeholder) placeholder.style.display = 'flex';
}


// ============================================================
// RICERCA GLOBALE PROFUMI (FIX v8.1)
// Cerca su Fragrantica, Notino, Google Shopping
// ============================================================
function searchPerfumeGlobal(brand, name) {
  const query = encodeURIComponent(brand + " " + name);
  return {
    fragrantica: `https://www.fragrantica.com/search/?q=${query}`,
    notino: `https://www.notino.it/search/?q=${query}`,
    google: `https://www.google.com/search?tbm=shop&q=${query}`,
    idealo: `https://www.idealo.it/risultati.html?q=${query}`
  };
}

function addToWishlistFromSearch(brand, name) {
  // Cerca nel database se esiste
  const found = perfumeDB.find(p => 
    p.name.toLowerCase() === name.toLowerCase() || 
    p.brand.toLowerCase() === brand.toLowerCase()
  );
  if (found) {
    toggleWishlist(found.id);
    showToast(`❤️ ${found.name} aggiunto alla wishlist`);
  } else {
    showToast(`⚠️ ${name} non trovato nella collezione`);
  }
}


// ============================================================
// WISHLIST → COLLEZIONE ONE-CLICK v9.0
// Diario Olfattivo + Gamification
// ============================================================

// Diario olfattivo (log giornaliero)
let scentLog = JSON.parse(localStorage.getItem("profumotify_scent_log_v9") || "[]");

function addToCollectionFromWishlist(id) {
  const perfume = perfumeDB.find(p => p.id === id);
  if (!perfume) return;

  // Rimuovi da wishlist
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    localStorage.setItem("profumotify_wishlist_v8", JSON.stringify(wishlist));
  }

  // Aggiungi log "acquistato"
  scentLog.push({
    date: new Date().toISOString(),
    perfumeId: id,
    action: "acquired",
    name: perfume.name,
    brand: perfume.brand
  });
  localStorage.setItem("profumotify_scent_log_v9", JSON.stringify(scentLog));

  // Aggiorna stats
  renderStats();
  renderDashboard();
  renderCollection();
  renderWishlist();

  showToast(`🎉 ${perfume.name} aggiunto alla collezione! Stats aggiornate.`);
}

function logPerfumeUsage(id, sprays = 3, feedback = "") {
  const perfume = perfumeDB.find(p => p.id === id);
  if (!perfume) return;

  const today = new Date().toDateString();
  const existing = scentLog.find(l => l.perfumeId === id && new Date(l.date).toDateString() === today);

  if (existing) {
    existing.sprays += sprays;
    if (feedback) existing.feedback = feedback;
  } else {
    scentLog.push({
      date: new Date().toISOString(),
      perfumeId: id,
      action: "worn",
      name: perfume.name,
      brand: perfume.brand,
      sprays: sprays,
      feedback: feedback,
      weather: document.getElementById("weatherTemp")?.textContent || "N/A"
    });
  }

  localStorage.setItem("profumotify_scent_log_v9", JSON.stringify(scentLog));
  showToast(`📝 Loggato: ${perfume.name} (${sprays} spray)`);
}

function getUsageStats(id) {
  const logs = scentLog.filter(l => l.perfumeId === id);
  const totalWears = logs.filter(l => l.action === "worn").length;
  const totalSprays = logs.reduce((s, l) => s + (l.sprays || 0), 0);
  const lastWorn = logs.filter(l => l.action === "worn").pop();

  return { totalWears, totalSprays, lastWorn: lastWorn ? new Date(lastWorn.date).toLocaleDateString("it-IT") : "Mai" };
}

function getCollectionBadges() {
  const badges = [];
  const arabCount = perfumeDB.filter(p => p.type === "arab").length;
  const designerCount = perfumeDB.filter(p => p.type === "designer").length;
  const gourmandCount = perfumeDB.filter(p => p.olfactoryFamily.includes("Gourmand")).length;
  const oudCount = perfumeDB.filter(p => [...p.topNotes, ...p.heartNotes, ...p.baseNotes].includes("Oud")).length;

  if (arabCount >= 10) badges.push({ icon: "🌙", name: "Sultano degli Oud", desc: "10+ profumi arabi" });
  if (arabCount >= 20) badges.push({ icon: "👑", name: "Emiro del Deserto", desc: "20+ profumi arabi" });
  if (designerCount >= 5) badges.push({ icon: "✨", name: "Maestro Designer", desc: "5+ profumi designer" });
  if (gourmandCount >= 5) badges.push({ icon: "🍯", name: "Gourmand Guru", desc: "5+ profumi gourmand" });
  if (oudCount >= 5) badges.push({ icon: "🪵", name: "Cacciatore di Oud", desc: "5+ profumi con Oud" });
  if (perfumeDB.length >= 40) badges.push({ icon: "💎", name: "Collezionista Elite", desc: "40+ profumi totali" });
  if (wishlist.length >= 10) badges.push({ icon: "🎯", name: "Sognatore", desc: "10+ in wishlist" });

  return badges;
}

function renderBadges() {
  const badges = getCollectionBadges();
  if (badges.length === 0) return '';

  return `
    <div class="chart-container" style="border-color:var(--accent);">
      <div class="chart-title">🏆 Badge Collezionista</div>
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;">
        ${badges.map(b => `
          <div style="display:flex; align-items:center; gap:8px; padding:10px 16px; background:linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.05)); border:1px solid var(--accent); border-radius:12px;">
            <span style="font-size:24px;">${b.icon}</span>
            <div>
              <div style="font-weight:600; font-size:13px;">${b.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${b.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

console.log("🌹 Profumotify v10.2 caricato!");
console.log("📍 Meteo: posizione live (fallback Bari) | 👤 Utente: Giancarlo | 💎 Profumi:", perfumeDB.length);
