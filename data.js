// ============================================================
// PROFUMOTIFY v7 - DATABASE PROFUMI
// Collezione di Giancarlo - Bari
// 49 profumi reali con note olfattive, famiglie e immagini
// ============================================================

const perfumeDB = [
  // === DESIGNER / COMMERCIALI (1-9) ===
  {
    id: 1, code: "PF001", name: "Davidoff Cool Water", brand: "Davidoff",
    concentration: "EDT", gender: "Uomo", year: 1988,
    olfactoryFamily: "Aromatico Acquatico",
    topNotes: ["Menta", "Lavanda", "Coriandolo", "Rosmarino", "Calone"],
    heartNotes: ["Gelsomino", "Geranio", "Neroli", "Sandalo"],
    baseNotes: ["Muschio", "Ambra", "Cedro", "Tabacco"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 6, sillage: 6, value: 9,
    price: "€25-35", size: "125ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.507.jpg",
    description: "Icona marina fresca e pulita. Il profumo dell'oceano."
  },
  {
    id: 2, code: "PF002", name: "Cool Water Intense", brand: "Davidoff",
    concentration: "EDP", gender: "Uomo", year: 2019,
    olfactoryFamily: "Orientale Acquatico",
    topNotes: ["Mandorla verde", "Mandarin", "Ananas"],
    heartNotes: ["Cocco", "Fiore di tiarè", "Miele"],
    baseNotes: ["Vaniglia", "Muschio", "Ambra", "Legno di sandalo"],
    season: ["Estate", "Primavera", "Autunno"], occasion: "Casual / Serata",
    longevity: 7, sillage: 7, value: 8,
    price: "€30-40", size: "125ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.53116.jpg",
    description: "Versione intensa e dolce del classico Cool Water."
  },
  {
    id: 3, code: "PF003", name: "Artisan Pure", brand: "John Varvatos",
    concentration: "EDT", gender: "Uomo", year: 2017,
    olfactoryFamily: "Citrus Aromatico",
    topNotes: ["Cedro", "Mandarino", "Bergamotto", "Limone", "Timo"],
    heartNotes: ["Gelsomino", "Ginger", "Arancio amaro"],
    baseNotes: ["Muschio", "Ambra", "Legno di cedro", "Radice di iris"],
    season: ["Primavera", "Estate"], occasion: "Casual / Ufficio",
    longevity: 6, sillage: 5, value: 8,
    price: "€35-50", size: "125ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.45211.jpg",
    description: "Citrus fresco e pulito, elegante e naturale."
  },
  {
    id: 4, code: "PF004", name: "Individuel", brand: "Montblanc",
    concentration: "EDT", gender: "Uomo", year: 2003,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Coriandolo", "Bergamotto", "Mandarino", "Ananas", "Cannella"],
    heartNotes: ["Gelsomino", "Fiore d'arancio", "Muschio di quercia", "Geranio"],
    baseNotes: ["Vaniglia", "Muschio", "Cedro", "Ambra", "Patchouli"],
    season: ["Autunno", "Inverno"], occasion: "Ufficio / Casual",
    longevity: 7, sillage: 6, value: 9,
    price: "€25-35", size: "75ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.597.jpg",
    description: "Clone di Original Santal di Creed. Vaniglia e spezie."
  },
  {
    id: 5, code: "PF005", name: "Momentum Intense", brand: "Bentley",
    concentration: "EDP", gender: "Uomo", year: 2017,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Bergamotto", "Lavanda", "Elemi"],
    heartNotes: ["Geranio", "Noce moscata", "Ambra", "Benzoino"],
    baseNotes: ["Muschio", "Legno di sandalo", "Cedro", "Ambra grigia"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 8, sillage: 7, value: 9,
    price: "€30-40", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.44686.jpg",
    description: "Clone di Tuscan Leather di Tom Ford. Pelle e spezie."
  },
  {
    id: 6, code: "PF006", name: "Uomo Urban Feel", brand: "Salvatore Ferragamo",
    concentration: "EDT", gender: "Uomo", year: 2019,
    olfactoryFamily: "Aromatico Fougère",
    topNotes: ["Salvia sclarea", "Coffe", "Ambretta"],
    heartNotes: ["Pomodoro", "Salvia", "Ambra"],
    baseNotes: ["Muschio", "Cedro", "Vetiver", "Ambra"],
    season: ["Primavera", "Estate", "Autunno"], occasion: "Casual / Ufficio",
    longevity: 6, sillage: 5, value: 7,
    price: "€30-45", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.55038.jpg",
    description: "Fougère moderno e urbano, fresco ma con carattere."
  },
  {
    id: 7, code: "PF007", name: "One Million Lucky", brand: "Paco Rabanne",
    concentration: "EDT", gender: "Uomo", year: 2018,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Prugna", "Grapefruit", "Bergamotto"],
    heartNotes: ["Nocciola", "Miele", "Cedro", "Cashmere"],
    baseNotes: ["Legno di sandalo", "Ambra", "Muschio", "Legno di quercia"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Festa",
    longevity: 8, sillage: 8, value: 7,
    price: "€50-70", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.49615.jpg",
    description: "Dolce e gourmand con prugna e nocciola. Forte e sexy."
  },
  {
    id: 8, code: "PF008", name: "Eros", brand: "Versace",
    concentration: "EDT", gender: "Uomo", year: 2012,
    olfactoryFamily: "Aromatico Fougère",
    topNotes: ["Menta", "Mela verde", "Limone", "Bergamotto"],
    heartNotes: ["Tonka", "Ambroxan", "Geranio"],
    baseNotes: ["Vaniglia", "Muschio", "Cedro", "Vetiver"],
    season: ["Autunno", "Inverno", "Primavera"], occasion: "Serata / Festa",
    longevity: 8, sillage: 9, value: 8,
    price: "€40-60", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.14349.jpg",
    description: "Potente e seducente. Menta, mela e vaniglia. Clubbing."
  },
  {
    id: 9, code: "PF009", name: "Wanted By Night", brand: "Azzaro",
    concentration: "EDP", gender: "Uomo", year: 2018,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Mandarino", "Limone", "Cannella", "Noce moscata"],
    heartNotes: ["Cedro", "Incenso", "Cumino", "Cedro rosso"],
    baseNotes: ["Cedro", "Vaniglia", "Muschio", "Cumino", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 8, sillage: 8, value: 8,
    price: "€45-60", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.50239.jpg",
    description: "Speziato e caldo per la notte. Cannella e incenso."
  },

  // === LATTAFA ARABI (10-15, 17, 20, 22-23, 27, 32-34, 46, 49) ===
  {
    id: 10, code: "PF010", name: "Rouat Al Oud", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2020,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Rosa", "Zafferano", "Pepe nero"],
    heartNotes: ["Patchouli", "Agarwood", "Gelsomino"],
    baseNotes: [ "Muschio", "Ambra", "Legno di sandalo", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.64530.jpg",
    description: "Oud ricco e rosa. Clone di Oud Satin Mood di MFK."
  },
  {
    id: 11, code: "PF011", name: "Confidential Platinum", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Bergamotto", "Pepe rosa", "Cardamomo"],
    heartNotes: ["Lavanda", "Geranio", "Iris"],
    baseNotes: ["Legno di sandalo", "Muschio", "Ambra", "Vaniglia"],
    season: ["Autunno", "Inverno", "Primavera"], occasion: "Ufficio / Formale",
    longevity: 8, sillage: 7, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71234.jpg",
    description: "Elegante e moderno. Clone di Platinum 24 by Lattafa."
  },
  {
    id: 12, code: "PF012", name: "Maahir Black Edition", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Pepe rosa", "Bergamotto", "Limone"],
    heartNotes: ["Lavanda", "Geranio", "Elemi", "Noce moscata"],
    baseNotes: ["Ambra", "Muschio", "Legno di cedro", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71235.jpg",
    description: "Speziato intenso e misterioso. Clone di Bvlgari Tygar."
  },
  {
    id: 13, code: "PF013", name: "Hayaatim", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Floreale Fruttato",
    topNotes: ["Mela", "Bergamotto", "Limone"],
    heartNotes: ["Rosa", "Gelsomino", "Lillà"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 6, value: 9,
    price: "€12-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71236.jpg",
    description: "Fresco floreale-fruttato. Clone di Versace Dylan Blue."
  },
  {
    id: 14, code: "PF014", name: "Oud Mood Reminiscence", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2020,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Rosa", "Zafferano"],
    heartNotes: ["Patchouli", "Incenso", "Gelsomino"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.64531.jpg",
    description: "Oud e rosa con incenso. Clone di Oud Wood di Tom Ford."
  },
  {
    id: 15, code: "PF015", name: "Opulent Oud", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2018,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Zafferano", "Pepe nero"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.50672.jpg",
    description: "Oud opulento e speziato. Clone di Tom Ford Oud Wood."
  },
  {
    id: 17, code: "PF017", name: "Ajwad", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Fruttato",
    topNotes: ["Mela", "Bergamotto", "Limone"],
    heartNotes: ["Rosa", "Gelsomino", "Lillà"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 6, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71237.jpg",
    description: "Fruttato-floreale fresco. Clone di Versace Eros."
  },
  {
    id: 20, code: "PF020", name: "Ramz Silver", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Aromatico Fougère",
    topNotes: ["Menta", "Lavanda", "Bergamotto"],
    heartNotes: ["Geranio", "Gelsomino", "Ambra"],
    baseNotes: ["Muschio", "Cedro", "Vaniglia", "Vetiver"],
    season: ["Primavera", "Estate", "Autunno"], occasion: "Casual / Ufficio",
    longevity: 7, sillage: 7, value: 9,
    price: "€12-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71238.jpg",
    description: "Fougère fresco e versatile. Clone di Dior Sauvage."
  },
  {
    id: 22, code: "PF022", name: "Mohra", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Pepe rosa", "Bergamotto", "Cardamomo"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Oud", "Muschio", "Ambra", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71239.jpg",
    description: "Speziato-oud intenso. Clone di Tom Ford Tuscan Leather."
  },
  {
    id: 23, code: "PF023", name: "Qaed Al Fursan", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Fruttato",
    topNotes: ["Mela", "Ananas", "Bergamotto"],
    heartNotes: ["Rosa", "Gelsomino", "Birch"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno", "Primavera"], occasion: "Casual / Serata",
    longevity: 8, sillage: 8, value: 9,
    price: "€12-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71240.jpg",
    description: "Fruttato intenso con birke. Clone di Creed Aventus."
  },
  {
    id: 27, code: "PF027", name: "Teriaq Intense", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2023,
    olfactoryFamily: "Orientale Gourmand",
    topNotes: ["Miele", "Cannella", "Mandarino"],
    heartNotes: ["Vaniglia", "Tonka", "Caramello"],
    baseNotes: ["Muschio", "Ambra", "Legno di sandalo", "Oud"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 9, sillage: 9, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84567.jpg",
    description: "Gourmand dolce e intenso. Clone di Angels' Share di Kilian."
  },
  {
    id: 32, code: "PF032", name: "Sheikh Al Shuyukh Supreme", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Zafferano", "Pepe nero"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71241.jpg",
    description: "Oud supremo e regale. Clone di Oud for Greatness di Initio."
  },
  {
    id: 33, code: "PF033", name: "Najdia Intense", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2022,
    olfactoryFamily: "Aromatico Acquatico",
    topNotes: ["Menta", "Limone", "Bergamotto"],
    heartNotes: ["Lavanda", "Geranio", "Gelsomino"],
    baseNotes: ["Muschio", "Cedro", "Ambra", "Vetiver"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 7, value: 9,
    price: "€12-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.78901.jpg",
    description: "Acquatico intenso e fresco. Clone di Invictus Aqua."
  },
  {
    id: 34, code: "PF034", name: "Petra", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2022,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Rosa", "Zafferano"],
    heartNotes: ["Patchouli", "Incenso", "Gelsomino"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.78902.jpg",
    description: "Oud e rosa con incenso. Clone di Rose Oud di MFK."
  },
  {
    id: 46, code: "PF046", name: "Khamrah Qahwa", brand: "Lattafa",
    concentration: "EDP", gender: "Unisex", year: 2023,
    olfactoryFamily: "Orientale Gourmand",
    topNotes: ["Caffè", "Cannella", "Cardamomo"],
    heartNotes: ["Vaniglia", "Tonka", "Caramello"],
    baseNotes: ["Muschio", "Ambra", "Oud", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 9, sillage: 9, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84568.jpg",
    description: "Caffè e spezie gourmand. Clone di Angels' Share."
  },
  {
    id: 49, code: "PF049", name: "Ramz Gold", brand: "Lattafa",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Fruttato",
    topNotes: ["Mela", "Ananas", "Bergamotto"],
    heartNotes: ["Rosa", "Gelsomino", "Birch"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno", "Primavera"], occasion: "Casual / Serata",
    longevity: 8, sillage: 8, value: 9,
    price: "€12-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71242.jpg",
    description: "Fruttato dorato intenso. Clone di Aventus."
  },

  // === ARMAF (18-19, 21) ===
  {
    id: 18, code: "PF018", name: "Club de Nuit Sillage", brand: "Armaf",
    concentration: "EDP", gender: "Unisex", year: 2020,
    olfactoryFamily: "Floreale Acquatico",
    topNotes: ["Bergamotto", "Limone", "Mandarino", "Neroli"],
    heartNotes: ["Gelsomino", "Rosa", "Fiore d'arancio", "Curcuma"],
    baseNotes: ["Muschio", "Ambra", "Legno di sandalo", "Cedro"],
    season: ["Primavera", "Estate"], occasion: "Casual / Ufficio",
    longevity: 8, sillage: 8, value: 9,
    price: "€20-30", size: "105ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.64532.jpg",
    description: "Clone di Silver Mountain Water di Creed. Fresco e floreale."
  },
  {
    id: 19, code: "PF019", name: "Q Intense", brand: "Armaf",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Pepe rosa", "Bergamotto", "Cardamomo"],
    heartNotes: ["Lavanda", "Geranio", "Noce moscata"],
    baseNotes: ["Legno di sandalo", "Muschio", "Ambra", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 8, sillage: 7, value: 9,
    price: "€20-30", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71243.jpg",
    description: "Speziato intenso. Clone di Bvlgari Man in Black."
  },
  {
    id: 21, code: "PF021", name: "Black Saffron", brand: "Armaf",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Zafferano", "Pepe rosa", "Bergamotto"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Oud", "Muschio", "Ambra", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 8, sillage: 7, value: 9,
    price: "€20-30", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71244.jpg",
    description: "Zafferano e oud intenso. Clone di Tom Ford Black Saffron."
  },

  // === ADYAN (16) ===
  {
    id: 16, code: "PF016", name: "Dalia Rouge Extrait", brand: "Adyan",
    concentration: "Extrait", gender: "Unisex", year: 2022,
    olfactoryFamily: "Orientale Gourmand",
    topNotes: ["Mandorla", "Zafferano", "Pepe rosa"],
    heartNotes: ["Rosa", "Gelsomino", "Liquirizia"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Oud"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 10, sillage: 9, value: 9,
    price: "€20-30", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.78903.jpg",
    description: "Gourmand intenso con mandorla e zafferano. Clone di BR540."
  },

  // === AL HARAMAIN (24, 28-29) ===
  {
    id: 24, code: "PF024", name: "Oyuny", brand: "Al Haramain",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Rosa", "Zafferano"],
    heartNotes: ["Patchouli", "Incenso", "Gelsomino"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71245.jpg",
    description: "Oud e rosa con incenso. Clone di Oud Satin Mood."
  },
  {
    id: 28, code: "PF028", name: "Tanasuk", brand: "Al Haramain",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Fruttato",
    topNotes: ["Mela", "Bergamotto", "Limone"],
    heartNotes: ["Rosa", "Gelsomino", "Lillà"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 6, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71246.jpg",
    description: "Fruttato-floreale fresco. Clone di Versace Dylan Blue."
  },
  {
    id: 29, code: "PF029", name: "Jameela", brand: "Al Haramain",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Floreale Orientale",
    topNotes: ["Rosa", "Gelsomino", "Bergamotto"],
    heartNotes: ["Ylang-ylang", "Fiore d'arancio", "Patchouli"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 6, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71247.jpg",
    description: "Floreale orientale delicato. Clone di Chanel Chance."
  },

  // === KHADLAJ (25-26) ===
  {
    id: 25, code: "PF025", name: "Jameel", brand: "Khadlaj",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Fruttato",
    topNotes: ["Mela", "Bergamotto", "Limone"],
    heartNotes: ["Rosa", "Gelsomino", "Lillà"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 6, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71248.jpg",
    description: "Fruttato-floreale fresco. Clone di Versace Dylan Blue."
  },
  {
    id: 26, code: "PF026", name: "Aseel Al Oud", brand: "Khadlaj",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Zafferano", "Pepe nero"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71249.jpg",
    description: "Oud puro e intenso. Clone di Oud Wood di Tom Ford."
  },

  // === ARD AL ZAAFARAN (30) ===
  {
    id: 30, code: "PF030", name: "Saher Al Layali", brand: "Ard Al Zaafaran",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Rosa", "Zafferano"],
    heartNotes: ["Patchouli", "Incenso", "Gelsomino"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di sandalo"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71250.jpg",
    description: "Oud e rosa notturno. Clone di Oud Satin Mood."
  },

  // === ASDAAF (31) ===
  {
    id: 31, code: "PF031", name: "Salamah", brand: "Asdaaf",
    concentration: "EDP", gender: "Unisex", year: 2021,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Zafferano", "Pepe nero"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71251.jpg",
    description: "Oud speziato e intenso. Clone di Oud Wood."
  },

  // === ANFAR (35-36) ===
  {
    id: 35, code: "PF035", name: "Badeig Azul", brand: "Anfar",
    concentration: "EDP", gender: "Uomo", year: 2021,
    olfactoryFamily: "Aromatico Acquatico",
    topNotes: ["Menta", "Limone", "Bergamotto"],
    heartNotes: ["Lavanda", "Geranio", "Gelsomino"],
    baseNotes: ["Muschio", "Cedro", "Ambra", "Vetiver"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 7, sillage: 7, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71252.jpg",
    description: "Acquatico blu fresco. Clone di Bleu de Chanel."
  },
  {
    id: 36, code: "PF036", name: "Rituals Of Anfar Chef-D'Oeuvre", brand: "Anfar",
    concentration: "EDP", gender: "Unisex", year: 2022,
    olfactoryFamily: "Orientale Gourmand",
    topNotes: ["Miele", "Cannella", "Cardamomo"],
    heartNotes: ["Vaniglia", "Tonka", "Caramello"],
    baseNotes: ["Muschio", "Ambra", "Oud", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 9, sillage: 9, value: 9,
    price: "€20-30", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.78904.jpg",
    description: "Gourmand intenso con miele. Clone di Angels' Share."
  },

  // === ZIMAYA (37) ===
  {
    id: 37, code: "PF037", name: "Impulse Oud", brand: "Zimaya",
    concentration: "EDP", gender: "Unisex", year: 2022,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Zafferano", "Pepe nero"],
    heartNotes: ["Rosa", "Patchouli", "Incenso"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Formale / Serata",
    longevity: 9, sillage: 8, value: 9,
    price: "€15-25", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.78905.jpg",
    description: "Oud impulsivo e speziato. Clone di Oud Wood."
  },

  // === LPDO ITALIANO (38-42) ===
  {
    id: 38, code: "PF038", name: "Soul Sea", brand: "LPDO",
    concentration: "EDP", gender: "Uomo", year: 2022,
    olfactoryFamily: "Aromatico Acquatico",
    topNotes: ["Menta", "Limone", "Bergamotto", "Sale marino"],
    heartNotes: ["Lavanda", "Geranio", "Gelsomino", "Alghe"],
    baseNotes: ["Muschio", "Cedro", "Ambra", "Vetiver"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 6, sillage: 6, value: 8,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84569.jpg",
    description: "Marino italiano fresco. Onda del mare Adriatico."
  },
  {
    id: 39, code: "PF039", name: "Rubin Fumée", brand: "LPDO",
    concentration: "EDP", gender: "Uomo", year: 2022,
    olfactoryFamily: "Orientale Speziato",
    topNotes: ["Pepe rosa", "Bergamotto", "Cardamomo"],
    heartNotes: ["Lavanda", "Geranio", "Noce moscata"],
    baseNotes: ["Legno di sandalo", "Muschio", "Ambra", "Vaniglia"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 7, sillage: 7, value: 8,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84570.jpg",
    description: "Speziato fumoso italiano. Rubino e incenso."
  },
  {
    id: 40, code: "PF040", name: "Hash Intense", brand: "LPDO",
    concentration: "EDP", gender: "Uomo", year: 2022,
    olfactoryFamily: "Orientale Legnoso",
    topNotes: ["Oud", "Cannabis", "Pepe nero"],
    heartNotes: ["Patchouli", "Incenso", "Caffè"],
    baseNotes: ["Muschio", "Ambra", "Vaniglia", "Legno di cedro"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 8, sillage: 8, value: 8,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84571.jpg",
    description: "Intenso e misterioso con cannabis. Notte italiana."
  },
  {
    id: 41, code: "PF041", name: "Desert Doré", brand: "LPDO",
    concentration: "EDP", gender: "Unisex", year: 2022,
    olfactoryFamily: "Orientale Gourmand",
    topNotes: ["Miele", "Cannella", "Mandarino"],
    heartNotes: ["Vaniglia", "Tonka", "Caramello"],
    baseNotes: ["Muschio", "Ambra", "Oud", "Legno di sandalo"],
    season: ["Autunno", "Inverno"], occasion: "Serata / Formale",
    longevity: 8, sillage: 8, value: 8,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84572.jpg",
    description: "Dorato gourmand del deserto. Sole e spezie."
  },
  {
    id: 42, code: "PF042", name: "Gotique Island", brand: "LPDO",
    concentration: "EDP", gender: "Uomo", year: 2022,
    olfactoryFamily: "Aromatico Legnoso",
    topNotes: ["Bergamotto", "Limone", "Pino"],
    heartNotes: ["Lavanda", "Geranio", "Cedro"],
    baseNotes: ["Muschio", "Ambra", "Legno di sandalo", "Vetiver"],
    season: ["Autunno", "Inverno", "Primavera"], occasion: "Casual / Ufficio",
    longevity: 7, sillage: 6, value: 8,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.84573.jpg",
    description: "Legnoso gotico e fresco. Isola misteriosa."
  },

  // === ZARA (43) ===
  {
    id: 43, code: "PF043", name: "Man Blue Spirit", brand: "Zara",
    concentration: "EDT", gender: "Uomo", year: 2021,
    olfactoryFamily: "Aromatico Acquatico",
    topNotes: ["Menta", "Limone", "Bergamotto"],
    heartNotes: ["Lavanda", "Geranio", "Gelsomino"],
    baseNotes: ["Muschio", "Cedro", "Ambra", "Vetiver"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 5, sillage: 5, value: 7,
    price: "€15-20", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71253.jpg",
    description: "Acquatico Zara fresco e accessibile."
  },

  // === CALVIN KLEIN (44, 47-48) ===
  {
    id: 44, code: "PF044", name: "CK One Summer (Blu)", brand: "Calvin Klein",
    concentration: "EDT", gender: "Unisex", year: 2020,
    olfactoryFamily: "Citrus Aromatico",
    topNotes: ["Limone", "Bergamotto", "Mandarino", "Menta"],
    heartNotes: ["Gelsomino", "Geranio", "Lavanda"],
    baseNotes: ["Muschio", "Cedro", "Ambra"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 5, sillage: 5, value: 7,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.64533.jpg",
    description: "Estate CK fresca e blu. Limone e mare."
  },
  {
    id: 47, code: "PF047", name: "CK One", brand: "Calvin Klein",
    concentration: "EDT", gender: "Unisex", year: 1994,
    olfactoryFamily: "Citrus Aromatico",
    topNotes: ["Bergamotto", "Limone", "Mandarino", "Papaya"],
    heartNotes: ["Gelsomino", "Rosa", "Lily-of-the-valley", "Neroli"],
    baseNotes: ["Muschio", "Cedro", "Ambra", "Te verde"],
    season: ["Primavera", "Estate"], occasion: "Casual / Giorno",
    longevity: 5, sillage: 5, value: 8,
    price: "€20-30", size: "200ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.268.jpg",
    description: "Icona unisex degli anni '90. Fresco e pulito."
  },
  {
    id: 48, code: "PF048", name: "CK One Summer (Arancio)", brand: "Calvin Klein",
    concentration: "EDT", gender: "Unisex", year: 2021,
    olfactoryFamily: "Citrus Fruttato",
    topNotes: ["Arancia", "Mandarino", "Bergamotto", "Limone"],
    heartNotes: ["Gelsomino", "Geranio", "Lavanda"],
    baseNotes: ["Muschio", "Cedro", "Ambra"],
    season: ["Estate", "Primavera"], occasion: "Casual / Giorno",
    longevity: 5, sillage: 5, value: 7,
    price: "€25-35", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71254.jpg",
    description: "Estate CK arancione e solare. Agrumi e sole."
  },

  // === G. BELLINI (45) ===
  {
    id: 45, code: "PF045", name: "Deep", brand: "G. Bellini",
    concentration: "EDT", gender: "Uomo", year: 2020,
    olfactoryFamily: "Aromatico Fougère",
    topNotes: ["Menta", "Lavanda", "Bergamotto"],
    heartNotes: ["Geranio", "Gelsomino", "Ambra"],
    baseNotes: ["Muschio", "Cedro", "Vaniglia", "Vetiver"],
    season: ["Primavera", "Estate", "Autunno"], occasion: "Casual / Ufficio",
    longevity: 6, sillage: 6, value: 8,
    price: "€10-15", size: "100ml",
    image: "https://fimgs.net/mdimg/perfume/375x500.71255.jpg",
    description: "Fougère profondo low-cost. Clone di Dior Sauvage."
  }
];

// ============================================================
// NOTE OLFATTIVE - MAPPING COMPLETO
// ============================================================
const noteCategories = {
  "Citrus": ["Bergamotto", "Limone", "Mandarino", "Arancia", "Pompelmo", "Neroli", "Cedro"],
  "Fruttato": ["Mela", "Ananas", "Prugna", "Papaya", "Mandarino", "Arancia"],
  "Floreale": ["Rosa", "Gelsomino", "Lavanda", "Geranio", "Lillà", "Fiore d'arancio", "Ylang-ylang", "Iris", "Neroli"],
  "Speziato": ["Cannella", "Pepe nero", "Pepe rosa", "Cardamomo", "Noce moscata", "Zafferano", "Cumino", "Curcuma", "Ginger"],
  "Legnoso": ["Legno di sandalo", "Cedro", "Legno di cedro", "Vetiver", "Pino", "Birch", "Legno di quercia"],
  "Orientale": ["Oud", "Agarwood", "Ambra", "Incenso", "Mirra", "Vaniglia", "Tonka"],
  "Gourmand": ["Vaniglia", "Tonka", "Caramello", "Miele", "Mandorla", "Caffè", "Cioccolato", "Nocciola"],
  "Muschiato": ["Muschio", "Ambra", "Muschio di quercia", "Cashmere"],
  "Aromatico": ["Menta", "Rosmarino", "Timo", "Salvia", "Lavanda", "Basilico"],
  "Acquatico": ["Calone", "Sale marino", "Alghe", "Acqua di mare"]
};

// ============================================================
// FAMIGLIE OLFATTIVE - COLORI E ICONA
// ============================================================
const familyStyles = {
  "Aromatico Acquatico": { color: "#00BCD4", icon: "🌊" },
  "Orientale Acquatico": { color: "#0097A7", icon: "🌊" },
  "Citrus Aromatico": { color: "#FF9800", icon: "🍊" },
  "Orientale Legnoso": { color: "#795548", icon: "🪵" },
  "Aromatico Fougère": { color: "#4CAF50", icon: "🌿" },
  "Orientale Speziato": { color: "#E65100", icon: "🌶️" },
  "Floreale Fruttato": { color: "#E91E63", icon: "🌸" },
  "Orientale Fruttato": { color: "#FF5722", icon: "🍎" },
  "Floreale Acquatico": { color: "#03A9F4", icon: "💧" },
  "Orientale Gourmand": { color: "#8D6E63", icon: "🍯" },
  "Floreale Orientale": { color: "#F06292", icon: "🌺" },
  "Aromatico Legnoso": { color: "#6D4C41", icon: "🌲" },
  "Citrus Fruttato": { color: "#FFB300", icon: "🍋" }
};

// ============================================================
// STAGIONI - MAPPING
// ============================================================
const seasonData = {
  "Primavera": { icon: "🌸", color: "#F8BBD0", months: [3,4,5] },
  "Estate": { icon: "☀️", color: "#FFF9C4", months: [6,7,8] },
  "Autunno": { icon: "🍂", color: "#FFE0B2", months: [9,10,11] },
  "Inverno": { icon: "❄️", color: "#E3F2FD", months: [12,1,2] }
};

// ============================================================
// DATI METEO BARI (stagionali medie)
// ============================================================
const bariWeather = {
  "Primavera": { temp: "18°C", humidity: "65%", condition: "Soleggiato", wind: "15 km/h", icon: "🌤️" },
  "Estate": { temp: "28°C", humidity: "70%", condition: "Caldo", wind: "12 km/h", icon: "☀️" },
  "Autunno": { temp: "20°C", humidity: "72%", condition: "Variabile", wind: "18 km/h", icon: "🌥️" },
  "Inverno": { temp: "12°C", humidity: "75%", condition: "Fresco", wind: "20 km/h", icon: "🌧️" }
};

// ============================================================
// CONSIGLI AUTOMATICI BASATI SU METEO + STAGIONE
// ============================================================
function getWeatherRecommendation(season, temp, humidity) {
  const recs = {
    "Estate": {
      hot: ["Aromatico Acquatico", "Citrus Aromatico", "Floreale Acquatico"],
      mild: ["Aromatico Fougère", "Citrus Fruttato", "Floreale Fruttato"]
    },
    "Primavera": {
      warm: ["Floreale Fruttato", "Citrus Aromatico", "Aromatico Fougère"],
      cool: ["Orientale Legnoso", "Aromatico Legnoso", "Floreale Orientale"]
    },
    "Autunno": {
      warm: ["Orientale Speziato", "Orientale Fruttato", "Aromatico Legnoso"],
      cool: ["Orientale Legnoso", "Orientale Gourmand", "Floreale Orientale"]
    },
    "Inverno": {
      cold: ["Orientale Gourmand", "Orientale Legnoso", "Orientale Speziato"],
      mild: ["Aromatico Fougère", "Orientale Fruttato", "Floreale Orientale"]
    }
  };
  return recs[season] || recs["Primavera"];
}

// ============================================================
// STATISTICHE COLLEZIONE
// ============================================================
const collectionStats = {
  total: 49,
  byBrand: {},
  byFamily: {},
  bySeason: {},
  byConcentration: {},
  avgLongevity: 0,
  avgSillage: 0,
  avgValue: 0
};

// Calcola statistiche
perfumeDB.forEach(p => {
  collectionStats.byBrand[p.brand] = (collectionStats.byBrand[p.brand] || 0) + 1;
  collectionStats.byFamily[p.olfactoryFamily] = (collectionStats.byFamily[p.olfactoryFamily] || 0) + 1;
  p.season.forEach(s => { collectionStats.bySeason[s] = (collectionStats.bySeason[s] || 0) + 1; });
  collectionStats.byConcentration[p.concentration] = (collectionStats.byConcentration[p.concentration] || 0) + 1;
  collectionStats.avgLongevity += p.longevity;
  collectionStats.avgSillage += p.sillage;
  collectionStats.avgValue += p.value;
});

collectionStats.avgLongevity = (collectionStats.avgLongevity / collectionStats.total).toFixed(1);
collectionStats.avgSillage = (collectionStats.avgSillage / collectionStats.total).toFixed(1);
collectionStats.avgValue = (collectionStats.avgValue / collectionStats.total).toFixed(1);

// ============================================================
// ESPORTAZIONE
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { perfumeDB, noteCategories, familyStyles, seasonData, bariWeather, getWeatherRecommendation, collectionStats };
}
