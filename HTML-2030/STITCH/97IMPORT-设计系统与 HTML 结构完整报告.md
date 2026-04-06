# 97IMPORT：设计系统与 HTML 结构完整报告（可导出 PDF）

我直接帮你把**完整报告做成可复制、可直接导出PDF的干净排版版本**，你复制到 Word / WPS 一键保存成 PDF 就行，格式不会乱。

---

# 97IMPORT – Design System & Structure HTML

## Rapport technique complet (prêt pour PDF)

---

## 1. Décomposition de la structure de la page

### 1.1 Header (Barre de navigation)

- Zone fixe en haut

- Contient : Logo complet + Menu de navigation

- Hauteur : 80px

- Fond : blanc avec ombre portée

### 1.2 Hero Section

- Zone visuelle principale

- Fond dégradé bleu

- Éléments : Bateau + globe + texte + maison modulaire

- Hauteur : 400px

### 1.3 Barre de recherche

- Champ de saisie + bouton RECHERCHER

- Largeur : 600px

- Hauteur : 48px

### 1.4 Cartes catégories

- Grille de 5 cartes

- Chaque carte : image + titre + description + bouton prix

- Fond blanc, ombre douce

### 1.5 Footer

- Informations légales

- Réseaux sociaux

- Boutons de contact (WhatsApp / Email)

- Copyright

---

## 2. Liste des assets (images & icônes)

### 2.1 Logo

- logo_full.png / logo_full.svg → Logo complet (globe + bateau + texte)

- logo_globe_only.png / logo_globe_only.svg → Globe seul

- logo_ship_only.png / logo_ship_only.svg → Bateau seul

- logo_text_only.png / logo_text_only.svg → Texte [97import.com](http://97import.com) seul

### 2.2 Icônes de navigation (SVG obligatoire)

- icon_home.svg → Accueil

- icon_excavator.svg → Mini-pelle

- icon_house.svg → Maisons modulaires

- icon_solar.svg → Solaire

- icon_agri.svg → Machines agricoles

- icon_misc.svg → Divers

- icon_services.svg → Services

- icon_contact.svg → Contact

- icon_cart.svg → Panier

- icon_user.svg → Connexion

### 2.3 Hero Section

- hero_ship_globe.png → Bateau + globe HD

- hero_modular_house.png → Maison modulaire

- hero_bg_gradient.css → Dégradé CSS

### 2.4 Catégories

- category_excavator.png → Mini-pelle

- category_house.png → Maison modulaire

- category_solar.png → Panneaux solaires

- category_agri.png → Machine agricole

- category_misc.png → Produits divers

### 2.5 Composants UI

- ui_button_search.svg → Bouton rechercher

- ui_button_price.svg → Bouton prix

- ui_input_search.svg → Champ recherche

- icon_tiktok.svg / icon_instagram.svg → Réseaux sociaux

---

## 3. Design System Complet

### 3.1 Couleurs

|Usage|HEX|RGB|
|---|---|---|
|Primary (bleu)|#0099FF|rgb(0, 153, 255)|
|Secondary (orange)|#FF9933|rgb(255, 153, 51)|
|Bouton principal|#0066FF|rgb(0, 102, 255)|
|Bouton hover|#0052CC|rgb(0, 82, 204)|
|Bouton prix|#FFB366|rgb(255, 179, 102)|
|Bouton prix hover|#FFA64D|rgb(255, 166, 77)|
|Fond page|#F0F8FF|rgb(240, 248, 255)|
|Fond carte|#FFFFFF|rgb(255, 255, 255)|
|Texte principal|#000000|rgb(0, 0, 0)|
|Texte secondaire|#0066CC|rgb(0, 102, 204)|
|Texte blanc|#FFFFFF|rgb(255, 255, 255)|
### 3.2 Typographie

- Police principale : Montserrat

- Police fallback : Arial, sans-serif

- Police corps : Open Sans

#### Tailles

- Menu : 18px

- H1 (Hero) : 36px

- H2 (Cartes) : 24px

- Texte normal : 16px

- Boutons : 20px

- Footer : 14px

### 3.3 Tailles et espacements

- Hauteur header : 80px

- Logo : hauteur max 70px, largeur auto

- Padding boutons : 12px 24px

- Border-radius boutons : 8px

- Border-radius cartes : 12px

- Box-shadow cartes : 0 4px 12px rgba(0,0,0,0.1)

- Espacement sections : 32px

- Espacement cartes : 16px

- Padding cartes : 20px

- Hauteur Hero : 400px

- Barre recherche : 600px × 48px

---

## 4. Structure HTML complète

```HTML

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>97IMPORT</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>

<header class="header">
  <div class="container">
    <a href="/" class="logo">
      <img src="assets/logo_full.svg" alt="97IMPORT" style="height:70px;width:auto;">
    </a>
    <nav class="nav">
      <a href="#" class="nav-item">Accueil</a>
      <a href="#" class="nav-item">Mini-Pelle</a>
      <a href="#" class="nav-item">Maisons Modulaires</a>
      <a href="#" class="nav-item">Solaire</a>
      <a href="#" class="nav-item">Machines Agricoles</a>
      <a href="#" class="nav-item">Divers</a>
      <a href="#" class="nav-item">Services</a>
      <a href="#" class="nav-item">Contact</a>
      <a href="#" class="nav-item">Panier</a>
      <a href="#" class="nav-item">Connexion</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="hero-inner">
    <img src="assets/hero_ship_globe.png" alt="Ship">
    <h1>L'importation simplifiée de la Chine vers les Antilles.</h1>
    <img src="assets/hero_modular_house.png" alt="Maison">
  </div>
  <div class="search-bar">
    <input type="text" placeholder="Rechercher..." class="search-input">
    <button class="btn btn-primary">RECHERCHER</button>
  </div>
</section>

<section class="categories">
  <div class="grid">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
</section>

<footer class="footer">
  <div class="container">
    <div class="col">INFORMATIONS & MENTIONS</div>
    <div class="col">NOUS SUIVRE</div>
    <div class="buttons">
      <button class="btn whatsapp">Contact WhatsApp</button>
      <button class="btn info">INFO@97IMPORT.COM</button>
    </div>
  </div>
  <p class="copyright">© 2026 97IMPORT. Tous droits réservés.</p>
</footer>

</body>
</html>
```

---

## 5. Fichier CSS de base

```CSS

/* Reset */
* {margin:0;padding:0;box-sizing:border-box;}
body {font-family:'Open Sans',sans-serif;background:#F0F8FF;color:#000;}
.header {height:80px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08);}
.hero {background:linear-gradient(#0099FF,#66CCFF);min-height:400px;}
.search-bar {display:flex;margin-top:30px;}
.search-input {width:600px;height:48px;padding:0 16px;border:none;border-radius:8px 0 0 8px;}
.btn {border:none;border-radius:8px;font-weight:600;cursor:pointer;}
.btn-primary {background:#0066FF;color:#fff;padding:12px 24px;}
.categories {max-width:1440px;margin:32px auto;}
.grid {display:grid;grid-template-columns:repeat(5,1fr);gap:16px;}
.card {background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.1);padding:20px;}
.footer {background:#F0F8FF;padding:32px 20px;}
```

---

## 6. Design System JSON (Figma‑ready)

```JSON

{
  "name": "97IMPORT Design System",
  "version": "1.0.0",
  "colors": {
    "primary": "#0099FF",
    "secondary": "#FF9933",
    "button_primary": "#0066FF",
    "bg_page": "#F0F8FF",
    "text_primary": "#000000"
  },
  "typography": {
    "font_main": "Montserrat",
    "font_body": "Open Sans"
  },
  "spacing": {
    "header_height": "80px",
    "logo_height": "70px",
    "card_radius": "12px"
  }
}
 

 