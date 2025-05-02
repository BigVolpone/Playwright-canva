const fs = require('fs');
const { chromium } = require('playwright');

app.post('/run', async (req, res) => {
  const { template, citations } = req.body;

  const templates = {
    A: process.env.TEMPLATE_A_URL,
    B: process.env.TEMPLATE_B_URL,
    C: process.env.TEMPLATE_C_URL,
    D: process.env.TEMPLATE_D_URL
  };

  const templateUrl = templates[template];

  if (!templateUrl) return res.status(400).send('❌ Template inconnu');
  if (!Array.isArray(citations) || citations.length === 0)
    return res.status(400).send('❌ Aucune citation fournie');

  // Check if state.json exists
  const storageStatePath = 'state.json';
  const storageStateExists = fs.existsSync(storageStatePath);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    storageStateExists ? { storageState: storageStatePath } : {}
  );
  const page = await context.newPage();

  try {
    console.log('🌐 Connexion à Canva…');
    await page.goto(templateUrl, { timeout: 60000 });

    // If state.json is missing, perform login
    if (!storageStateExists) {
      console.log('🔑 Aucun état de session trouvé, connexion requise');
      await page.click('text=Inscrire');
      await page.waitForSelector('text=Continuer avec un e-mail');
      await page.click('text=Continuer avec un e-mail');

      await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
      await page.click('text=Continuer');
      await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
      await page.click('text=Connexion');
      console.log('✅ Connexion réussie');

      // Save the session state
      await context.storageState({ path: storageStatePath });
      console.log('✅ État de session sauvegardé');
    }

    // Saisie des citations
    console.log(`✍️ Ajout des citations (${citations.length})`);
    for (let i = 0; i < citations.length; i++) {
      const textBox = await page.waitForSelector('[data-testid="text-box"]');
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