// 📁 script: canva_script_playwright/index.js
const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: false }); // mettre true en prod
  const context = await browser.newContext();
  const page = await context.newPage();

  // Étape 1 : Connexion à Canva
  await page.goto('https://www.canva.com/login');
  await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
  await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // Étape 2 : Ouvrir le template Canva
  await page.goto(process.env.TEMPLATE_URL);
  await page.waitForTimeout(5000); // temps de chargement du template

  // Étape 3 : Insérer les citations (⚠️ adapter les sélecteurs CSS !)
  await page.click('[data-testid="text-box"]'); // exemple générique
  await page.keyboard.type(process.env.CITATION_1);
  // Répéter pour Citation2, Citation3 selon le template

  // Étape 4 : Exporter la vidéo
  await page.click('button:has-text("Partager")');
  await page.click('button:has-text("Télécharger")');
  await page.click('button:has-text("Télécharger")'); // Confirmer

  await page.waitForTimeout(10000); // attendre la fin du téléchargement
  await browser.close();
})();

// 📁 .env (à créer à la racine du projet)
// CANVA_EMAIL=ton@email.com
// CANVA_PASSWORD=tonmotdepasse
// TEMPLATE_URL=https://www.canva.com/design/.../view?...
// CITATION_1=Ta citation ici
// CITATION_2=...
// CITATION_3=...
