// index.js
require("dotenv").config();
const { chromium } = require("playwright");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

const templates = {
  A: process.env.TEMPLATE_A_URL,
  B: process.env.TEMPLATE_B_URL,
  C: process.env.TEMPLATE_C_URL,
};

app.post("/run", async (req, res) => {
  const { template, citations } = req.body;

  console.log("📩 Requête reçue avec template:", template);
  console.log("🧠 Citations reçues:", citations);

  const templateUrl = templates[template];

  if (!templateUrl) {
    console.error("❌ Template inconnu");
    return res.status(400).send("Template inconnu");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(); // Nouvelle session propre
  const page = await context.newPage();

  try {
    console.log("🌐 Connexion à Canva...");
    await page.goto("https://www.canva.com/fr_fr/", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.click("text=Se connecter", { timeout: 15000 });

    // ➤ Connexion par email uniquement
    await page.click("text=Continuer avec un e-mail", { timeout: 15000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', process.env.CANVA_EMAIL);
    await page.click("text=Continuer", { timeout: 15000 });

    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', process.env.CANVA_PASSWORD);
    await page.click("text=Connexion", { timeout: 15000 });

    await page.waitForTimeout(5000); // attente post-connexion

    console.log("🔗 Accès au template");
    await page.goto(templateUrl, { timeout: 60000 });

    await page.waitForTimeout(5000); // temps de chargement

    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i];
      const frame = page.frames()[0];
      const textBox = `input[placeholder*='Votre texte ici']`;

      await frame.waitForSelector(textBox, { timeout: 15000 });
      await frame.fill(textBox, citation);
      await page.waitForTimeout(2000);
    }

    console.log("✅ Citations insérées !");
    await browser.close();
    res.send("Succès");
  } catch (err) {
    console.error("❌ Erreur :", err);
    await browser.close();
    res.status(500).send("Erreur lors de l'exécution du script.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
