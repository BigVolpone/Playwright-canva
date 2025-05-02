require('dotenv').config();
const fs = require('fs');
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
    D: process.env.TEMPLATE_D_URL,
  };

  const templateUrl = templates[template];
  if (!templateUrl) return res.status(400).send('❌ Template inconnu');
  if (!Array.isArray(citations) || citations.length === 0)
    return res.status(400).send('❌ Aucune citation fournie');

  const storageStatePath = 'state.json';
  const storageStateExists = fs.existsSync(storageStatePath);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    storageStateExists ? { storageState: storageStatePath } : {}
  );
  const page = await context.newPage();

  try {
    // Masquer les automatisations
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.navigator.chrome = {};
    });

    // Définir un User-Agent valide
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36');

    // Timeout global
    page.setDefaultTimeout(60000);

    console.log('🌐 Connexion à Canva…');
    await page.goto(templateUrl, { timeout: 60000 });

    if (!storageStateExists) {
      console.log('🔑 Aucun état de session trouvé, connexion requise');
      await page.click('text=Inscrire', { timeout: 60000 });
      await page.waitForSelector('text=Continuer avec un e-mail', { timeout: 60000 });
      await page.click('text=Continuer avec un e-mail');

      await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
      await page.click('text=Continuer');
      await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
      await page.click('text=Connexion');
      console.log('✅ Connexion réussie');

      await context.storageState({ path: storageStatePath });
      console.log('✅ État de session sauvegardé');
    }

    console.log(`✍️ Ajout des citations (${citations.length})`);
    for (let i = 0; i < citations.length; i++) {
      await page.waitForTimeout(Math.random() * 2000 + 1000); // Délai aléatoire
      const textBox = await page.waitForSelector('[data-testid="text-box"]', { timeout: 60000 });
      await textBox.click();
      await page.keyboard.type(citations[i], { delay: 100 });
      console.log(`✅ Citation ${i + 1}/${citations.length} ajoutée : ${citations[i]}`);
    }

    res.send('✅ Citations ajoutées au template Canva');
  } catch (err) {
    console.error('❌ Erreur Playwright :', err);
    res.status(500).send('Erreur d’exécution du script');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));