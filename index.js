const express = require('express');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations, templateUrls } = req.body;

  if (!template || !citations || !Array.isArray(citations)) {
    return res.status(400).send('❌ Données manquantes ou mal formatées.');
  }

  const templateUrl = templateUrls?.[template];

  if (!templateUrl) {
    return res.status(400).send(`❌ URL introuvable pour le template : ${template}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Connexion à Canva
    await page.goto('https://www.canva.com/login');
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Charger le template
    await page.goto(templateUrl);
    await page.waitForTimeout(6000); // Laisse le temps au template de charger

    // Insérer les citations
    for (let i = 0; i < citations.length; i++) {
      await page.click('[data-testid="text-box"]'); // À ajuster selon ton template
      await page.keyboard.type(citations[i]);
      await page.keyboard.press('Tab'); // Pour passer au champ suivant
    }

    // Télécharger
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Script exécuté avec succès !');
  } catch (err) {
    console.error('Erreur Playwright :', err);
    res.status(500).send('❌ Erreur d\'exécution Playwright.');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
