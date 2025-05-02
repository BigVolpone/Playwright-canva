const express = require('express');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;

  const templates = {
    A: process.env.TEMPLATE_A,
    B: process.env.TEMPLATE_B,
  };

  const templateUrl = templates[template];

  if (!templateUrl) {
    return res.status(400).send('Template inconnu ou non défini');
  }

  if (!citations || !Array.isArray(citations)) {
    return res.status(400).send('Aucune citation fournie');
  }

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.canva.com/login');
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(templateUrl);
    await page.waitForTimeout(5000);

    for (const citation of citations) {
      await page.click('[data-testid="text-box"]');
      await page.keyboard.type(citation);
      await page.keyboard.press('Tab');
    }

    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    await browser.close();
    res.send('✅ Citations injectées et export lancé !');
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur lors de l’exécution du script');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
