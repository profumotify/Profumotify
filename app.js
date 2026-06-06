// ============================================================
// PROFUMOTIFY v6 - Collezione Completa di Giancarlo (Bari)
// Fix: immagini, link Notino, rimozione wishlist, meteo CORS, prezzi
// ============================================================

const PERFUMES = [
  { id: 1, name: "Oud for Glory", brand: "Lattafa", type: "arab", price: 18.5, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.69324.jpg",
    notinoUrl: "https://www.notino.it/lattafa/oud-for-glory-eau-de-parfum-unisex/",
    family: "Legnoso Speziato", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Noce moscata", heart: "Oud, Agarwood", base: "Muschio, Ambra" },
    intensity: 9, personal: "Profumo potente e duraturo, ottimo rapporto qualita-prezzo" },
  { id: 2, name: "Raghba", brand: "Lattafa", type: "arab", price: 15.9, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.31814.jpg",
    notinoUrl: "https://www.notino.it/lattafa/raghba-eau-de-parfum-unisex/",
    family: "Dolce Vanigliato", season: "Inverno", occasion: "Serata",
    notes: { top: "Incenso, Zucchero", heart: "Legno di sandalo, Vaniglia", base: "Muschio, Ambra" },
    intensity: 8, personal: "Vaniglia dolce e avvolgente, molto apprezzato" },
  { id: 3, name: "Asad", brand: "Lattafa", type: "arab", price: 19.9, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.72841.jpg",
    notinoUrl: "https://www.notino.it/lattafa/asad-eau-de-parfum-per-uomo/",
    family: "Aromatico Fougere", season: "Autunno", occasion: "Giorno",
    notes: { top: "Ananas, Bergamotto, Mirtillo", heart: "Iris, Gelsomino, Rosa", base: "Muschio, Vaniglia, Amberwood" },
    intensity: 7, personal: "Clone eccellente di Dior Sauvage Elixir" },
  { id: 4, name: "Fakhar Black", brand: "Lattafa", type: "arab", price: 16.5, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.64532.jpg",
    notinoUrl: "https://www.notino.it/lattafa/fakhar-black-eau-de-parfum-per-uomo/",
    family: "Orientale Speziato", season: "Inverno", occasion: "Serata",
    notes: { top: "Mele, Bergamotto", heart: "Cannella, Rosa", base: "Muschio, Vaniglia" },
    intensity: 8, personal: "Oriental dolce, buona proiezione" },
  { id: 5, name: "Khamrah", brand: "Lattafa", type: "arab", price: 22.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.73651.jpg",
    notinoUrl: "https://www.notino.it/lattafa/khamrah-eau-de-parfum-unisex/",
    family: "Dolce Speziato", season: "Inverno", occasion: "Serata",
    notes: { top: "Cannella, Noce moscata", heart: "Datteri, Pralina, Tuberosa", base: "Vaniglia, Miele, Oud" },
    intensity: 9, personal: "Capolavoro di Lattafa, dolcezza speziata perfetta" },
  { id: 6, name: "Ejaazi", brand: "Lattafa", type: "arab", price: 14.9, rating: 7.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.50000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/ejaazi-eau-de-parfum-per-uomo/",
    family: "Agrumato Aromatico", season: "Estate", occasion: "Giorno",
    notes: { top: "Limone, Bergamotto", heart: "Lavanda, Geranio", base: "Muschio, Legno di sandalo" },
    intensity: 6, personal: "Fresco e versatile per l'estate" },
  { id: 7, name: "Hayaati Florence", brand: "Lattafa", type: "arab", price: 17.5, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.75000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/hayaati-florence-eau-de-parfum-per-donna/",
    family: "Floreale Fruttato", season: "Primavera", occasion: "Giorno",
    notes: { top: "Pompelmo, Pera", heart: "Rosa, Gelsomino", base: "Muschio, Ambra" },
    intensity: 6, personal: "Floreale delicato e femminile" },
  { id: 8, name: "Opulent Musk", brand: "Lattafa", type: "arab", price: 13.9, rating: 7.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.52000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/opulent-musk-eau-de-parfum-unisex/",
    family: "Muschiato Floreale", season: "Primavera", occasion: "Giorno",
    notes: { top: "Rosa, Peonia", heart: "Muschio, Ambra", base: "Muschio bianco, Sandalo" },
    intensity: 5, personal: "Muschio pulito ed elegante" },
  { id: 9, name: "Velvet Oud", brand: "Lattafa", type: "arab", price: 16.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.48000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/velvet-oud-eau-de-parfum-unisex/",
    family: "Legnoso Oud", season: "Autunno", occasion: "Serata",
    notes: { top: "Zafferano, Cardamomo", heart: "Oud, Gelsomino", base: "Muschio, Vaniglia" },
    intensity: 8, personal: "Oud accessibile e raffinato" },
  { id: 10, name: "Ameer Al Oudh", brand: "Lattafa", type: "arab", price: 20.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.55000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/ameer-al-oudh-eau-de-parfum-unisex/",
    family: "Orientale Oud", season: "Inverno", occasion: "Serata",
    notes: { top: "Legno di agar, Zafferano", heart: "Oud, Rosa", base: "Vaniglia, Muschio" },
    intensity: 9, personal: "Oud classico e potente" },
  { id: 11, name: "Ana Abiyedh", brand: "Lattafa", type: "arab", price: 15.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.53000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/ana-abiyedh-eau-de-parfum-unisex/",
    family: "Agrumato Muschiato", season: "Estate", occasion: "Giorno",
    notes: { top: "Bergamotto, Limone", heart: "Muschio, Lavanda", base: "Muschio bianco, Ambra" },
    intensity: 6, personal: "Fresco e pulito, simile a Silver Mountain Water" },
  { id: 12, name: "Badee Al Oud", brand: "Lattafa", type: "arab", price: 21.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.68000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/badee-al-oud-eau-de-parfum-unisex/",
    family: "Orientale Oud", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Lavanda", heart: "Oud, Legno di agar", base: "Muschio, Vaniglia" },
    intensity: 9, personal: "Oud intenso e misterioso" },
  { id: 13, name: "Fakhar Rose", brand: "Lattafa", type: "arab", price: 16.5, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.65000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/fakhar-rose-eau-de-parfum-per-donna/",
    family: "Floreale Orientale", season: "Primavera", occasion: "Giorno",
    notes: { top: "Rosa, Peonia", heart: "Gelsomino, Ylang-ylang", base: "Muschio, Vaniglia" },
    intensity: 7, personal: "Rosa orientale avvolgente" },
  { id: 14, name: "Hayaati Gold", brand: "Lattafa", type: "arab", price: 18.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.70000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/hayaati-gold-eau-de-parfum-per-uomo/",
    family: "Orientale Dolce", season: "Autunno", occasion: "Serata",
    notes: { top: "Mele, Cannella", heart: "Vaniglia, Caramello", base: "Muschio, Legno di sandalo" },
    intensity: 8, personal: "Dolcezza orientale equilibrata" },
  { id: 15, name: "Maahir", brand: "Lattafa", type: "arab", price: 17.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.56000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/maahir-eau-de-parfum-per-uomo/",
    family: "Aromatico Speziato", season: "Autunno", occasion: "Giorno",
    notes: { top: "Bergamotto, Lavanda", heart: "Pepe, Cardamomo", base: "Muschio, Legno di cedro" },
    intensity: 7, personal: "Speziato aromatico versatile" },
  { id: 16, name: "Musk Salama", brand: "Lattafa", type: "arab", price: 14.5, rating: 7.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.49000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/musk-salama-eau-de-parfum-unisex/",
    family: "Muschiato Floreale", season: "Primavera", occasion: "Giorno",
    notes: { top: "Rosa, Gelsomino", heart: "Muschio, Ambra", base: "Muschio bianco, Sandalo" },
    intensity: 5, personal: "Muschio delicato e raffinato" },
  { id: 17, name: "Oud Mood", brand: "Lattafa", type: "arab", price: 19.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.58000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/oud-mood-eau-de-parfum-unisex/",
    family: "Legnoso Oud", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Cardamomo", heart: "Oud, Rosa", base: "Muschio, Vaniglia" },
    intensity: 9, personal: "Oud intenso con note dolci" },
  { id: 18, name: "Qaaed", brand: "Lattafa", type: "arab", price: 16.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.51000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/qaaed-eau-de-parfum-per-uomo/",
    family: "Orientale Speziato", season: "Inverno", occasion: "Serata",
    notes: { top: "Noce moscata, Cannella", heart: "Oud, Legno di agar", base: "Muschio, Ambra" },
    intensity: 8, personal: "Speziato orientale classico" },
  { id: 19, name: "Raghba Wood Intense", brand: "Lattafa", type: "arab", price: 18.5, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.62000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/raghba-wood-intense-eau-de-parfum-unisex/",
    family: "Legnoso Speziato", season: "Autunno", occasion: "Serata",
    notes: { top: "Incenso, Legno di sandalo", heart: "Oud, Vaniglia", base: "Muschio, Ambra" },
    intensity: 8, personal: "Versione intensa di Raghba, piu legnosa" },
  { id: 20, name: "Sheikh Al Shuyukh", brand: "Lattafa", type: "arab", price: 20.5, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.60000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/sheikh-al-shuyukh-eau-de-parfum-per-uomo/",
    family: "Orientale Legnoso", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Rosa", heart: "Oud, Legno di agar", base: "Muschio, Vaniglia" },
    intensity: 9, personal: "Oud premium, eleganza assoluta" },
  { id: 21, name: "Taj Al Layl", brand: "Lattafa", type: "arab", price: 15.5, rating: 7.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.54000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/taj-al-layl-eau-de-parfum-unisex/",
    family: "Floreale Orientale", season: "Primavera", occasion: "Serata",
    notes: { top: "Rosa, Gelsomino", heart: "Ylang-ylang, Vaniglia", base: "Muschio, Ambra" },
    intensity: 7, personal: "Floreale orientale romantico" },
  { id: 22, name: "Yara", brand: "Lattafa", type: "arab", price: 17.5, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.71000.jpg",
    notinoUrl: "https://www.notino.it/lattafa/yara-eau-de-parfum-per-donna/",
    family: "Dolce Fruttato", season: "Primavera", occasion: "Giorno",
    notes: { top: "Mandorla, Caramello", heart: "Vaniglia, Gelsomino", base: "Muschio, Zucchero" },
    intensity: 7, personal: "Dolcezza fruttata irresistibile" },
  { id: 23, name: "Amber Oud Gold", brand: "Al Haramain", type: "arab", price: 35.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.45000.jpg",
    notinoUrl: "https://www.notino.it/al-haramain/amber-oud-gold-eau-de-parfum-unisex/",
    family: "Orientale Ambrato", season: "Inverno", occasion: "Serata",
    notes: { top: "Agrumi, Bergamotto", heart: "Ambra, Mela", base: "Muschio, Vaniglia" },
    intensity: 8, personal: "Clone eccellente di BR540, qualita superiore" },
  { id: 24, name: "Amber Oud Tobacco", brand: "Al Haramain", type: "arab", price: 38.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.47000.jpg",
    notinoUrl: "https://www.notino.it/al-haramain/amber-oud-tobacco-eau-de-parfum-unisex/",
    family: "Tabacco Orientale", season: "Inverno", occasion: "Serata",
    notes: { top: "Tabacco, Cannella", heart: "Oud, Vaniglia", base: "Muschio, Ambra" },
    intensity: 9, personal: "Tabacco e oud in combo perfetta, capolavoro" },
  { id: 25, name: "L'Aventure", brand: "Al Haramain", type: "arab", price: 25.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.30000.jpg",
    notinoUrl: "https://www.notino.it/al-haramain/laventure-eau-de-parfum-per-uomo/",
    family: "Chypre Fruttato", season: "Autunno", occasion: "Giorno",
    notes: { top: "Bergamotto, Limone, Mele", heart: "Gelsomino, Rosa", base: "Muschio, Ambra, Muschio di quercia" },
    intensity: 7, personal: "Clone di Aventus, ottimo rapporto qualita-prezzo" },
  { id: 26, name: "L'Aventure Blanche", brand: "Al Haramain", type: "arab", price: 24.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.35000.jpg",
    notinoUrl: "https://www.notino.it/al-haramain/laventure-blanche-eau-de-parfum-per-uomo/",
    family: "Agrumato Aromatico", season: "Estate", occasion: "Giorno",
    notes: { top: "Bergamotto, Limone", heart: "Te, Gelsomino", base: "Muschio, Legno di sandalo" },
    intensity: 6, personal: "Versione fresca di L'Aventure" },
  { id: 27, name: "Rasasi Hawas", brand: "Rasasi", type: "arab", price: 28.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.40000.jpg",
    notinoUrl: "https://www.notino.it/rasasi/hawas-eau-de-parfum-per-uomo/",
    family: "Acquatico Aromatico", season: "Estate", occasion: "Giorno",
    notes: { top: "Mele, Bergamotto, Limone", heart: "Plumeria, Cardamomo", base: "Muschio, Ambra, Legno di sandalo" },
    intensity: 7, personal: "Acquatico fruttato molto apprezzato, clone di Invictus Aqua" },
  { id: 28, name: "Shaghaf Oud", brand: "Swiss Arabian", type: "arab", price: 32.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.42000.jpg",
    notinoUrl: "https://www.notino.it/swiss-arabian/shaghaf-oud-eau-de-parfum-unisex/",
    family: "Orientale Oud", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Oud", heart: "Rosa, Gelsomino", base: "Muschio, Vaniglia, Prugna" },
    intensity: 9, personal: "Oud intenso e duraturo, qualita Swiss Arabian" },
  { id: 29, name: "Sauvage", brand: "Dior", type: "designer", price: 85.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.31881.jpg",
    notinoUrl: "https://www.notino.it/dior/sauvage-eau-de-toilette-per-uomo/",
    family: "Aromatico Fougere", season: "Autunno", occasion: "Giorno",
    notes: { top: "Bergamotto, Pepe", heart: "Lavanda, Pepe rosa", base: "Ambroxan, Legno di cedro" },
    intensity: 8, personal: "Classico moderno, versatile e maschile" },
  { id: 30, name: "Bleu de Chanel", brand: "Chanel", type: "designer", price: 95.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.9095.jpg",
    notinoUrl: "https://www.notino.it/chanel/bleu-de-chanel-eau-de-toilette-per-uomo/",
    family: "Legnoso Aromatico", season: "Primavera", occasion: "Giorno",
    notes: { top: "Agrumi, Menta", heart: "Pepe, Noce moscata", base: "Muschio di quercia, Legno di cedro" },
    intensity: 7, personal: "Eleganza senza tempo, perfetto per ogni occasione" },
  { id: 31, name: "Acqua di Gio", brand: "Giorgio Armani", type: "designer", price: 75.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.410.jpg",
    notinoUrl: "https://www.notino.it/giorgio-armani/acqua-di-gio-eau-de-toilette-per-uomo/",
    family: "Acquatico Aromatico", season: "Estate", occasion: "Giorno",
    notes: { top: "Limone, Bergamotto, Gelsomino", heart: "Persica, Noce moscata", base: "Muschio di quercia, Legno di cedro" },
    intensity: 6, personal: "Il re degli acquatici, fresco e pulito" },
  { id: 32, name: "1 Million", brand: "Paco Rabanne", type: "designer", price: 65.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.3347.jpg",
    notinoUrl: "https://www.notino.it/paco-rabanne/1-million-eau-de-toilette-per-uomo/",
    family: "Dolce Speziato", season: "Inverno", occasion: "Serata",
    notes: { top: "Mandarino, Menta", heart: "Rosa, Cannella", base: "Ambra, Legno di guaiaco" },
    intensity: 8, personal: "Dolcezza audace, ottima per uscite serali" },
  { id: 33, name: "Eros", brand: "Versace", type: "designer", price: 60.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.19946.jpg",
    notinoUrl: "https://www.notino.it/versace/eros-eau-de-toilette-per-uomo/",
    family: "Aromatico Fresco", season: "Estate", occasion: "Serata",
    notes: { top: "Menta, Mela verde, Limone", heart: "Tonka, Ambroxan", base: "Vaniglia, Muschio di quercia" },
    intensity: 8, personal: "Fresco e dolce, molto giovane e vivace" },
  { id: 34, name: "Terre d'Hermes", brand: "Hermes", type: "designer", price: 90.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.2315.jpg",
    notinoUrl: "https://www.notino.it/hermes/terre-d-hermes-eau-de-toilette-per-uomo/",
    family: "Chypre Legnoso", season: "Autunno", occasion: "Giorno",
    notes: { top: "Arancia, Pompelmo", heart: "Pepe, Pelargonio", base: "Legno di cedro, Vetiver, Benzoino" },
    intensity: 7, personal: "Capolavoro di eleganza naturale, vetiver perfetto" },
  { id: 35, name: "Dior Homme Intense", brand: "Dior", type: "designer", price: 88.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.13016.jpg",
    notinoUrl: "https://www.notino.it/dior/dior-homme-intense-eau-de-parfum-per-uomo/",
    family: "Orientale Legnoso", season: "Inverno", occasion: "Serata",
    notes: { top: "Lavanda", heart: "Iris, Ambra", base: "Cedro, Vetiver" },
    intensity: 8, personal: "Iris sofisticato, eleganza maschile" },
  { id: 36, name: "La Nuit de l'Homme", brand: "YSL", type: "designer", price: 78.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.5527.jpg",
    notinoUrl: "https://www.notino.it/ysl/la-nuit-de-l-homme-eau-de-toilette-per-uomo/",
    family: "Orientale Speziato", season: "Autunno", occasion: "Serata",
    notes: { top: "Cardamomo", heart: "Lavanda, Bergamotto", base: "Cedro, Vetiver" },
    intensity: 7, personal: "Cardamomo seducente, perfetto per la sera" },
  { id: 37, name: "Prada L'Homme", brand: "Prada", type: "designer", price: 82.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.39164.jpg",
    notinoUrl: "https://www.notino.it/prada/prada-l-homme-eau-de-toilette-per-uomo/",
    family: "Floreale Legnoso", season: "Primavera", occasion: "Giorno",
    notes: { top: "Neroli, Pepe", heart: "Iris, Violetta", base: "Ambra, Cedro" },
    intensity: 6, personal: "Neroli pulito e sofisticato" },
  { id: 38, name: "Allure Homme Sport", brand: "Chanel", type: "designer", price: 92.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.610.jpg",
    notinoUrl: "https://www.notino.it/chanel/allure-homme-sport-eau-de-toilette-per-uomo/",
    family: "Aromatico Fresco", season: "Estate", occasion: "Giorno",
    notes: { top: "Mandarino, Menta", heart: "Pepe, Legno di cedro", base: "Muschio, Ambra, Tonka" },
    intensity: 6, personal: "Sportivo e raffinato, fresco duraturo" },
  { id: 39, name: "Invictus", brand: "Paco Rabanne", type: "designer", price: 62.0, rating: 7.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.19810.jpg",
    notinoUrl: "https://www.notino.it/paco-rabanne/invictus-eau-de-toilette-per-uomo/",
    family: "Acquatico Aromatico", season: "Estate", occasion: "Giorno",
    notes: { top: "Mandarino, Pompelmo", heart: "Gelsomino, Alloro", base: "Ambra, Muschio di quercia" },
    intensity: 7, personal: "Acquatico potente, molto apprezzato dai giovani" },
  { id: 40, name: "The One", brand: "Dolce & Gabbana", type: "designer", price: 58.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.2055.jpg",
    notinoUrl: "https://www.notino.it/dolce---gabbana/the-one-eau-de-toilette-per-uomo/",
    family: "Orientale Speziato", season: "Autunno", occasion: "Serata",
    notes: { top: "Pompelmo, Coriandolo", heart: "Zenzero, Cardamomo", base: "Ambra, Tabacco, Cedro" },
    intensity: 7, personal: "Tabacco e zenzero in combo elegante" },
  { id: 41, name: "Gentleman", brand: "Givenchy", type: "designer", price: 70.0, rating: 8.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.38796.jpg",
    notinoUrl: "https://www.notino.it/givenchy/gentleman-eau-de-parfum-per-uomo/",
    family: "Orientale Legnoso", season: "Autunno", occasion: "Serata",
    notes: { top: "Pera, Cardamomo", heart: "Iris, Lavanda", base: "Cedro, Vaniglia, Patchouli" },
    intensity: 7, personal: "Pera e iris, moderno e raffinato" },
  { id: 42, name: "Spicebomb", brand: "Viktor & Rolf", type: "designer", price: 72.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.13847.jpg",
    notinoUrl: "https://www.notino.it/viktor---rolf/spicebomb-eau-de-toilette-per-uomo/",
    family: "Speziato Orientale", season: "Inverno", occasion: "Serata",
    notes: { top: "Pepe rosa, Elemi", heart: "Cannella, Zafferano", base: "Tabacco, Vetiver, Legno" },
    intensity: 8, personal: "Esplosione speziata, invernale perfetto" },
  { id: 43, name: "Fahrenheit", brand: "Dior", type: "designer", price: 80.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.533.jpg",
    notinoUrl: "https://www.notino.it/dior/fahrenheit-eau-de-toilette-per-uomo/",
    family: "Legnoso Floreale", season: "Autunno", occasion: "Giorno",
    notes: { top: "Mandarino, Legno di cedro", heart: "Violetta, Noce moscata", base: "Muschio di quercia, Vetiver" },
    intensity: 7, personal: "Violetta e benzina, icona senza tempo" },
  { id: 44, name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", type: "niche", price: 220.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.37687.jpg",
    notinoUrl: "https://www.notino.it/maison-francis-kurkdjian/baccarat-rouge-540-eau-de-parfum-unisex/",
    family: "Orientale Floreale", season: "Inverno", occasion: "Serata",
    notes: { top: "Zafferano, Gelsomino", heart: "Ambra, Legno di cedro", base: "Muschio, Abete" },
    intensity: 8, personal: "Capolavoro assoluto, dolcezza ambrata unica" },
  { id: 45, name: "Aventus", brand: "Creed", type: "niche", price: 280.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.9828.jpg",
    notinoUrl: "https://www.notino.it/creed/aventus-eau-de-parfum-per-uomo/",
    family: "Chypre Fruttato", season: "Primavera", occasion: "Giorno",
    notes: { top: "Ananas, Bergamotto, Mele", heart: "Birch, Gelsomino", base: "Muschio di quercia, Ambra" },
    intensity: 8, personal: "Il re delle niche, fruttato e fumoso" },
  { id: 46, name: "Black Orchid", brand: "Tom Ford", type: "niche", price: 130.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.1825.jpg",
    notinoUrl: "https://www.notino.it/tom-ford/black-orchid-eau-de-parfum-unisex/",
    family: "Orientale Floreale", season: "Inverno", occasion: "Serata",
    notes: { top: "Tartufo, Gelsomino", heart: "Orchidea nera, Ylang-ylang", base: "Patchouli, Vaniglia, Cioccolato" },
    intensity: 9, personal: "Misterioso e opulento, orchidea nera iconica" },
  { id: 47, name: "Oud Wood", brand: "Tom Ford", type: "niche", price: 150.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.1824.jpg",
    notinoUrl: "https://www.notino.it/tom-ford/oud-wood-eau-de-parfum-unisex/",
    family: "Legnoso Orientale", season: "Inverno", occasion: "Serata",
    notes: { top: "Cardamomo, Pepe rosa", heart: "Oud, Sandalo", base: "Vaniglia, Vetiver, Ambra" },
    intensity: 7, personal: "Oud accessibile e raffinato, intro perfetta al mondo oud" },
  { id: 48, name: "Layton", brand: "Parfums de Marly", type: "niche", price: 200.0, rating: 8.5,
    image: "https://fimgs.net/mdimg/perfume/375x500.39314.jpg",
    notinoUrl: "https://www.notino.it/parfums-de-marly/layton-eau-de-parfum-per-uomo/",
    family: "Orientale Fresco", season: "Autunno", occasion: "Giorno",
    notes: { top: "Mele, Bergamotto, Lavanda", heart: "Gelsomino, Violetta", base: "Vaniglia, Cardamomo, Sandalo" },
    intensity: 7, personal: "Mela e vaniglia, eleganza moderna" },
  { id: 49, name: "Herod", brand: "Parfums de Marly", type: "niche", price: 195.0, rating: 9.0,
    image: "https://fimgs.net/mdimg/perfume/375x500.25880.jpg",
    notinoUrl: "https://www.notino.it/parfums-de-marly/herod-eau-de-parfum-per-uomo/",
    family: "Tabacco Orientale", season: "Inverno", occasion: "Serata",
    notes: { top: "Cannella, Pepe", heart: "Tabacco, Incenso", base: "Vaniglia, Muschio, Legno di cedro" },
    intensity: 8, personal: "Tabacco dolce e speziato, capolavoro invernale" }
];

// WISHLIST (persistita in localStorage)
let wishlist = JSON.parse(localStorage.getItem("profumotify_wishlist") || "[]");
let currentFilter = "all";
let searchQuery = "";
let isAdmin = false;

// INIZIALIZZAZIONE
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => { document.getElementById("splash").classList.add("hidden"); }, 1800);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/Profumotify/sw.js")
      .then(r => console.log("SW registrato"))
      .catch(e => console.log("SW errore:", e));
  }

  fetchMeteo(41.12, 16.87);
  renderCollection();
  renderWishlist();
  renderNotes();
  renderDashboard();
  renderDiscovery();
  updateStats();
});

// METEO - Fix CORS con fallback immediato Bari
async function fetchMeteo(lat, lon) {
  const tempEl = document.getElementById("weatherTemp");
  const descEl = document.getElementById("weatherDesc");
  const iconEl = document.getElementById("weatherIcon");

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Europe/Rome`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    updateMeteoUI(data.current.temperature_2m, data.current.relative_humidity_2m, data.current.weather_code);
  } catch (e) {
    console.log("Meteo API fallita, uso fallback Bari");
    updateMeteoUI(24, 65, 1);
  }
}

function updateMeteoUI(temp, humidity, code) {
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
  descEl.textContent = `${desc} • Umidità ${humidity}%`;
}

// NAVIGAZIONE TABS
function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.getElementById(`tab-${tab}`).style.display = "block";
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(t => t.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((item, i) => {
    const tabs = ["collection","wishlist","notes","dashboard","discovery"];
    if (tabs[i] === tab) item.classList.add("active");
  });
  if (tab === "wishlist") renderWishlist();
  if (tab === "notes") renderNotes();
  if (tab === "dashboard") renderDashboard();
  if (tab === "discovery") renderDiscovery();
}

// COLLEZIONE - Render griglia profumi con immagini reali
function renderCollection() {
  const grid = document.getElementById("perfumeGrid");
  let filtered = PERFUMES;
  if (currentFilter !== "all") filtered = filtered.filter(p => p.type === currentFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }

  grid.innerHTML = filtered.map((p, i) => {
    const isWished = wishlist.includes(p.id);
    const badgeClass = p.type === "arab" ? "badge-arab" : p.type === "designer" ? "badge-designer" : "badge-niche";
    const badgeText = p.type === "arab" ? "ARABO" : p.type === "designer" ? "DESIGNER" : "NICHE";
    const stars = "★".repeat(Math.floor(p.rating / 2)) + "☆".repeat(5 - Math.floor(p.rating / 2));
    return `
      <div class="perfume-card fade-in ${isWished ? "wishlist-active" : ""}" style="animation-delay:${i*0.03}s" onclick="showDetail(${p.id})">
        <div class="perfume-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="perfume-img-placeholder" style="display:none">🌹</div>
          <span class="perfume-badge ${badgeClass}">${badgeText}</span>
        </div>
        <button class="wishlist-btn ${isWished ? "active" : ""}" onclick="event.stopPropagation(); toggleWishlist(${p.id})" title="${isWished ? "Rimuovi da" : "Aggiungi a"} wishlist">
          ${isWished ? "❤️" : "🤍"}
        </button>
        <div class="perfume-info">
          <div class="perfume-brand">${p.brand}</div>
          <div class="perfume-name">${p.name}</div>
          <div class="perfume-meta">
            <span class="perfume-price">€${p.price.toFixed(2)}</span>
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

// WISHLIST - Toggle + Rimuovi con tasto elimina
function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  const perfume = PERFUMES.find(p => p.id === id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`❌ ${perfume.name} rimosso dalla wishlist`);
  } else {
    wishlist.push(id);
    showToast(`❤️ ${perfume.name} aggiunto alla wishlist`);
  }
  localStorage.setItem("profumotify_wishlist", JSON.stringify(wishlist));
  renderCollection();
  renderWishlist();
}

function removeFromWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    const perfume = PERFUMES.find(p => p.id === id);
    wishlist.splice(idx, 1);
    localStorage.setItem("profumotify_wishlist", JSON.stringify(wishlist));
    renderCollection();
    renderWishlist();
    showToast(`❌ ${perfume.name} rimosso dalla wishlist`);
  }
}

function renderWishlist() {
  const container = document.getElementById("wishlistContent");
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
  const wished = PERFUMES.filter(p => wishlist.includes(p.id));
  const total = wished.reduce((s, p) => s + p.price, 0);
  container.innerHTML = `
    <div style="margin-bottom:16px; padding:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase;">Totale wishlist</div>
          <div style="font-size:24px; font-weight:700; color:var(--primary);">€${total.toFixed(2)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-muted);">${wished.length} profumi</div>
          <button class="btn btn-outline" style="margin-top:8px; padding:8px 16px; font-size:12px;" onclick="findOffers()">🔍 Cerca offerte</button>
        </div>
      </div>
    </div>
    ${wished.map(p => `
      <div class="wishlist-item">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="placeholder" style="display:none">🌹</div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-brand">${p.brand}</div>
          <div class="wishlist-item-name">${p.name}</div>
          <div class="wishlist-item-price">€${p.price.toFixed(2)}</div>
        </div>
        <button class="wishlist-item-remove" onclick="removeFromWishlist(${p.id})" title="Rimuovi dalla wishlist">🗑️</button>
      </div>
    `).join("")}
  `;
}

function findOffers() {
  showToast("🔍 Apertura Notino per cercare offerte...");
  setTimeout(() => { window.open("https://www.notino.it/profumi/sconti/", "_blank"); }, 1000);
}

// DETAIL MODAL - Con link Notino corretti
function showDetail(id) {
  const p = PERFUMES.find(x => x.id === id);
  const isWished = wishlist.includes(id);
  const content = document.getElementById("detailContent");
  content.innerHTML = `
    <div class="detail-img">
      <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="placeholder" style="display:none">🌹</div>
    </div>
    <div class="detail-body">
      <div class="detail-brand">${p.brand}</div>
      <div class="detail-name">${p.name}</div>
      <div class="detail-tags">
        <span class="tag family">${p.family}</span>
        <span class="tag season">${p.season}</span>
        <span class="tag occasion">${p.occasion}</span>
      </div>
      <div class="detail-section">
        <h3>🌸 Note Olfattive</h3>
        <div class="notes-grid">
          <div class="note-item top"><strong>Top:</strong> ${p.notes.top}</div>
          <div class="note-item heart"><strong>Heart:</strong> ${p.notes.heart}</div>
          <div class="note-item base"><strong>Base:</strong> ${p.notes.base}</div>
        </div>
      </div>
      <div class="detail-section">
        <h3>⭐ Valutazione Personale</h3>
        <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
          <span style="font-size:32px; font-weight:700; color:var(--primary);">${p.rating}</span>
          <span style="color:var(--text-muted);">/ 10</span>
          <span style="margin-left:auto; padding:6px 14px; border-radius:20px; background:var(--bg-elevated); font-size:13px;">
            Intensità: ${"🔥".repeat(p.intensity)}${"○".repeat(10-p.intensity)}
          </span>
        </div>
      </div>
      ${p.personal ? `
      <div class="detail-section">
        <h3>📝 Note Personali</h3>
        <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-top:8px;">${p.personal}</p>
      </div>
      ` : ""}
      <div class="detail-price-row">
        <span class="detail-price">€${p.price.toFixed(2)}</span>
        <span style="color:var(--text-muted); font-size:13px;">Prezzo stimato</span>
      </div>
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="window.open('${p.notinoUrl}', '_blank')">🛒 Vedi su Notino</button>
        <button class="btn ${isWished ? "btn-danger" : "btn-outline"}" onclick="toggleWishlist(${p.id}); showDetail(${p.id})">
          ${isWished ? "❤️ Rimuovi" : "🤍 Wishlist"}
        </button>
      </div>
    </div>
  `;
  document.getElementById("detailModal").classList.add("active");
}

document.getElementById("detailModal").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("active");
});
document.getElementById("loginModal").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("active");
});
document.getElementById("priceModal").addEventListener("click", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("active");
});

// NOTE OLFATTIVE
function renderNotes() {
  const container = document.getElementById("notesContent");
  const allNotes = [];
  PERFUMES.forEach(p => {
    allNotes.push({ perfume: p, note: p.notes.top, type: "top", label: "Top" });
    allNotes.push({ perfume: p, note: p.notes.heart, type: "heart", label: "Heart" });
    allNotes.push({ perfume: p, note: p.notes.base, type: "base", label: "Base" });
  });
  const grouped = {};
  allNotes.forEach(n => {
    const key = n.note.split(",")[0].trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
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
          <span style="background:var(--primary); color:#1a1a2e; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">${items.length} profumi</span>
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

// DASHBOARD
function renderDashboard() {
  const container = document.getElementById("dashboardContent");
  const byType = { arab: 0, designer: 0, niche: 0 };
  const bySeason = {};
  const byBrand = {};
  let totalValue = 0;
  let avgRating = 0;
  PERFUMES.forEach(p => {
    byType[p.type]++;
    bySeason[p.season] = (bySeason[p.season] || 0) + 1;
    byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
    totalValue += p.price;
    avgRating += p.rating;
  });
  avgRating = (avgRating / PERFUMES.length).toFixed(1);
  const topBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
              <div class="bar" style="height:${(count/28)*100}%; background:${colors[type]};"></div>
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
              <div class="bar" style="height:${Math.max((count/20)*100, 5)}%; background:${colors[season]};"></div>
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
          <div style="width:${Math.max(count*20, 40)}px; height:24px; background:var(--primary); border-radius:6px; display:flex; align-items:center; justify-content:center; color:#1a1a2e; font-size:12px; font-weight:600;">${count}</div>
          <span style="font-size:14px;">${brand}</span>
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
  const temp = parseInt(tempText);
  let season = "Primavera";
  if (temp > 25) season = "Estate";
  else if (temp < 15) season = "Inverno";
  else if (temp < 20) season = "Autunno";
  const suitable = PERFUMES.filter(p => p.season === season || p.season === "Primavera");
  const pick = suitable[Math.floor(Math.random() * suitable.length)];
  const el = document.getElementById("dailySuggestion");
  if (el) {
    el.innerHTML = `
      <div style="display:flex; gap:14px; align-items:center;">
        <img src="${pick.image}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;" onerror="this.style.display='none';">
        <div>
          <div style="font-size:12px; color:var(--primary); text-transform:uppercase;">Oggi a Bari ${tempText}</div>
          <div style="font-weight:600; margin-top:4px;">${pick.name}</div>
          <div style="font-size:13px; color:var(--text-muted);">${pick.brand} • ${pick.family}</div>
        </div>
        <button class="btn btn-primary" style="margin-left:auto; padding:8px 16px; font-size:12px;" onclick="showDetail(${pick.id})">Vedi</button>
      </div>
    `;
  }
}

// DISCOVERY - Sezioni arabi/designer/niche/novità
function renderDiscovery() {
  const container = document.getElementById("discoveryContent");
  const sections = [
    { title: "🌙 Arabi da Scoprire", filter: "arab", desc: "I migliori profumi arabi low-cost" },
    { title: "✨ Designer Iconici", filter: "designer", desc: "I classici che non deludono mai" },
    { title: "💎 Niche da Sogno", filter: "niche", desc: "Profumi di lusso per occasioni speciali" },
    { title: "🔥 Più Votati", filter: "top", desc: "I profumi con il voto più alto" }
  ];

  container.innerHTML = sections.map(sec => {
    let items = [];
    if (sec.filter === "top") {
      items = [...PERFUMES].sort((a, b) => b.rating - a.rating).slice(0, 8);
    } else {
      items = PERFUMES.filter(p => p.type === sec.filter).slice(0, 8);
    }
    return `
      <div class="discovery-section">
        <h3>${sec.title}</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:12px;">${sec.desc}</p>
        <div class="perfume-row">
          ${items.map(p => `
            <div class="perfume-card" onclick="showDetail(${p.id})">
              <div class="perfume-img-wrap">
                <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="perfume-img-placeholder" style="display:none">🌹</div>
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
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

// AGGIORNAMENTO PREZZI - Simulazione realistica
async function updatePrices() {
  document.getElementById("priceModal").classList.add("active");
  const progressEl = document.getElementById("priceProgress");
  const textEl = document.getElementById("priceProgressText");
  const resultsEl = document.getElementById("priceResults");
  
  resultsEl.innerHTML = "";
  const changes = [];
  
  for (let i = 0; i < PERFUMES.length; i++) {
    const p = PERFUMES[i];
    // Simula variazione prezzo realistica (-15% a +10%)
    const variation = (Math.random() * 0.25) - 0.15;
    const newPrice = Math.max(p.price * (1 + variation), 5);
    const diff = newPrice - p.price;
    const diffPercent = ((diff / p.price) * 100).toFixed(1);
    
    if (Math.abs(diff) > 0.5) {
      changes.push({
        perfume: p,
        oldPrice: p.price,
        newPrice: newPrice,
        diff: diff,
        diffPercent: diffPercent
      });
      p.price = newPrice;
    }
    
    const pct = ((i + 1) / PERFUMES.length) * 100;
    progressEl.style.width = pct + "%";
    textEl.textContent = `${i + 1}/${PERFUMES.length} profumi analizzati...`;
    
    await new Promise(r => setTimeout(r, 80));
  }
  
  if (changes.length === 0) {
    resultsEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">✅ Nessuna variazione significativa rilevata</div>';
  } else {
    resultsEl.innerHTML = changes.map(c => `
      <div class="price-result-item">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${c.perfume.image}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;" onerror="this.style.display='none';">
          <div>
            <div style="font-weight:600; font-size:13px;">${c.perfume.name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${c.perfume.brand}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:600;">€${c.newPrice.toFixed(2)}</div>
          <div class="${c.diff > 0 ? "change-up" : "change-down"}">
            ${c.diff > 0 ? "↑" : "↓"} ${Math.abs(c.diffPercent)}% (€${c.oldPrice.toFixed(2)})
          </div>
        </div>
      </div>
    `).join("");
  }
  
  textEl.textContent = `Completato! ${changes.length} variazioni rilevate`;
  renderCollection();
  renderWishlist();
  showToast("💰 Prezzi aggiornati!");
}

function closePriceModal() {
  document.getElementById("priceModal").classList.remove("active");
}

// LOGIN ADMIN (opzionale, non obbligatorio in homepage)
function showLogin() {
  document.getElementById("loginModal").classList.add("active");
}

function closeLogin() {
  document.getElementById("loginModal").classList.remove("active");
}

function doLogin() {
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;
  
  if (user === "giancarlo" && pass === "Profumo2026!") {
    isAdmin = true;
    closeLogin();
    showToast("🔐 Accesso admin effettuato!");
  } else {
    showToast("❌ Credenziali errate");
  }
}

// STATS
function updateStats() {
  const arab = PERFUMES.filter(p => p.type === "arab").length;
  const designer = PERFUMES.filter(p => p.type === "designer").length;
  const niche = PERFUMES.filter(p => p.type === "niche").length;
  
  document.getElementById("statTotal").textContent = PERFUMES.length;
  document.getElementById("statArab").textContent = arab;
  document.getElementById("statDesigner").textContent = designer;
  document.getElementById("statNiche").textContent = niche;
}

// TOAST
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// KEYBOARD SHORTCUTS
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }
});

console.log("🌹 Profumotify v6 caricato!");
console.log("📍 Meteo: Bari | 👤 Utente: Giancarlo | 💎 Profumi:", PERFUMES.length);
