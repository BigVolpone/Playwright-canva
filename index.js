require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;
  console.log(`📩 Requête reçue avec template: ${template}`);
  console.log('🧠 Citations reçues:', citations);

  const templates = {
    A: process.env.TEMPLATE_A_URL,
    B: process.env.TEMPLATE_B_URL,
    C: process.env.TEMPLATE_C_URL,
  };

  if (!templates[template]) {
    console.error('❌ Template inconnu.');
    return res.status(400).send('Template inconnu');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Connexion à Canva...');
    await page.goto('https://www.canva.com/fr_fr/', { timeout: 60000 });

    await page.click('text=Se connecter', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.click('text=Continuer avec un e-mail', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.click('text=Continuer');
    await page.waitForTimeout(1000);

    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('text=Connexion');

    await page.waitForNavigation({ timeout: 60000 });
    console.log('✅ Connexion réussie');

    // Aller au modèle Canva directement
    await page.goto(templates[template], { timeout: 60000 });
    await page.waitForTimeout(5000); // Attente chargement complet du template

    // Injection des citations (si éléments prévisibles, à améliorer ensuite)
    for (let i = 0; i < citations.length; i++) {
      const textboxSelector = `div[contenteditable="true"] >> nth=${i}`;
      await page.fill(textboxSelector, citations[i]);
      await page.waitForTimeout(500);
    }

    console.log('🎨 Citations ajoutées avec succès.');
    await browser.close();
    res.status(200).send('Template mis à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur :', error);
    await browser.close();
    res.status(500).send("Erreur lors de l'exécution du script.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
