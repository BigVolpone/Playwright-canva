// index.js
require('dotenv').config();
const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;

  const templates = {
    A: process.env.TEMPLATE_A_URL,
    B: process.env.TEMPLATE_B_URL,
    C: process.env.TEMPLATE_C_URL,
    // Ajoute ici les autres templates selon besoin
  };

  const templateUrl = templates[template];

  if (!templateUrl) {
    return res.status(400).send('Template inconnu');
  }

  if (!Array.isArray(citations) || citations.length === 0) {
    return res.status(400).send('Aucune citation fournie');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("📩 Requête reçue avec template:", template);
    console.log("🧠 Citations reçues:", citations);

    // Aller sur Canva et cliquer sur "Se connecter"
    await page.goto('https://www.canva.com/', { timeout: 60000 });
    await page.click('text=Se connecter');
    await page.waitForTimeout(2000);

    // Choisir "Continuer avec un e-mail"
    await page.click('text=Continuer avec un e-mail');
    await page.waitForTimeout(2000);

    // Entrer l'e-mail
    await page.fill('input[type="email"]', process.env.CANVA_EMAIL);
    await page.click('text=Continuer');
    await page.waitForTimeout(3000);

    // Entrer le mot de passe
    await page.fill('input[type="password"]', process.env.CANVA_PASSWORD);
    await page.click('text=Connexion');
    await page.waitForNavigation({ timeout: 20000 });

    // Aller sur le template choisi
    await page.goto(templateUrl, { timeout: 60000 });
    await page.waitForTimeout(5000);

    // Insérer les citations (à ajuster selon les sélecteurs Canva réels)
    for (let i = 0; i < citations.length; i++) {
      await page.click(`[data-testid="text-box"]:nth-of-type(${i + 1})`, { timeout: 5000 });
      await page.keyboard.press('Control+A');
      await page.keyboard.type(citations[i]);
      await page.waitForTimeout(1000);
    }

    // Export vidéo
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Citations appliquées et vidéo exportée');
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur lors de l\'exécution du script.');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
