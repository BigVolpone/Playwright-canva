// index.js
const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: false }); // passe à true en prod
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Étape 1 : Connexion
    await page.goto('https://www.canva.com/login');
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Étape 2 : Ouvrir le template
    await page.goto(process.env.TEMPLATE_URL);
    await page.waitForTimeout(5000); // attendre le chargement

    // Étape 3 : Insérer les citations
    await page.click('[data-testid="text-box"]'); // TODO: adapter ce sélecteur
    await page.keyboard.type(process.env.CITATION_1);
    await page.click('[data-testid="text-box"]');
    await page.keyboard.type(process.env.CITATION_2);
    await page.click('[data-testid="text-box"]');
    await page.keyboard.type(process.env.CITATION_3);

    // Étape 4 : Exporter la vidéo
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000); // laisser le temps de download
  } catch (err) {
    console.error('❌ Une erreur est survenue :', err);
  } finally {
    await browser.close();
  }
})();
