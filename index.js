const express = require('express');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;

  console.log("📩 Requête reçue avec template:", template);
  console.log("🧠 Citations reçues:", citations);

  const templates = {
    A: process.env.TEMPLATE_A,
    B: process.env.TEMPLATE_B
  };

  const templateUrl = templates[template];

  if (!templateUrl) {
    console.error("❌ Template inconnu :", template);
    return res.status(400).send('Template inconnu');
  }

  if (!Array.isArray(citations) || citations.length === 0) {
    console.error("❌ Citations manquantes ou vides");
    return res.status(400).send('Aucune citation fournie');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Connexion à Canva...");
    await page.goto('https://www.canva.com/login');

    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);

    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 20000 });

    console.log("✅ Connexion réussie. Ouverture du template...");
    await page.goto(templateUrl);
    await page.waitForTimeout(5000);

    console.log("✍️ Insertion des citations...");
    for (let i = 0; i < citations.length; i++) {
      await page.click('[data-testid="text-box"]');
      await page.keyboard.type(citations[i]);
      await page.keyboard.press('Tab');
    }

    console.log("📤 Téléchargement...");
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Citations appliquées et vidéo exportée');
  } catch (err) {
    console.error('🔥 Erreur Playwright :', err);
    res.status(500).send('Erreur lors de l\'exécution du script.');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
