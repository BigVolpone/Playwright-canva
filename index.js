// ✅ Fichier principal : index.js
// Ce fichier contient la logique de connexion à Canva et la génération à partir d’un template.

const express = require('express');
const playwright = require('playwright');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;

  if (!template || !citations || !Array.isArray(citations)) {
    return res.status(400).send('Requête invalide');
  }

  console.log(`\n📩 Requête reçue avec template: ${template}`);
  console.log('🧠 Citations reçues:', citations);

  const EMAIL = process.env.CANVA_EMAIL;
  const PASSWORD = process.env.CANVA_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    return res.status(500).send('Variables CANVA_EMAIL ou CANVA_PASSWORD manquantes');
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Connexion à Canva...');
    await page.goto('https://www.canva.com/fr_fr/');

    await page.click('text=Se connecter');
    await page.waitForTimeout(1000);

    await page.click('text=Continuer avec un e-mail');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', EMAIL);
    await page.click('text=Continuer');
    await page.waitForTimeout(2000);

    await page.fill('input[type="password"]', PASSWORD);
    await page.click('text=Connexion');
    await page.waitForTimeout(5000);

    // Simulation : attend que l’utilisateur soit bien connecté
    await page.waitForSelector('text=Créer un design', { timeout: 15000 });
    console.log('✅ Connexion réussie.');

    // ⚠️ À ce stade tu peux ajouter le code pour ouvrir un template et insérer les citations
    // Ex: await page.goto(templateUrl); puis await page.fill(), etc.

    await browser.close();
    return res.send('Succès de la connexion Canva (prochaine étape à implémenter).');

  } catch (err) {
    console.error('🔥 Erreur Playwright :', err);
    await browser.close();
    return res.status(500).send("Erreur lors de l'exécution du script.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur actif sur le port ${port}`);
});
