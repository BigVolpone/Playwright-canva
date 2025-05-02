const { chromium } = require('playwright');
require('dotenv').config();

const EMAIL = process.env.CANVA_EMAIL;
const PASSWORD = process.env.CANVA_PASSWORD;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Ouverture de Canva...');
    await page.goto('https://www.canva.com/', { timeout: 60000 });

    console.log('🔘 Clic sur "Se connecter"...');
    await page.click('text=Se connecter', { timeout: 15000 });

    console.log('📧 Clic sur "Continuer avec un e-mail"...');
    await page.click('text=Continuer avec un e-mail', { timeout: 15000 });

    console.log('⌨️ Saisie de l'adresse e-mail...');
    await page.fill('input[type="email"]', EMAIL, { timeout: 15000 });
    await page.click('text=Continuer');

    console.log('🔒 Saisie du mot de passe...');
    await page.fill('input[type="password"]', PASSWORD, { timeout: 15000 });
    await page.click('text=Connexion');

    // Attente de redirection post-login ou élément clé
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    console.log('✅ Connexion réussie !');

    // Le reste du script viendra ici : chargement du template, édition, etc.
  } catch (error) {
    console.error('❌ Erreur pendant la connexion :', error);
  } finally {
    await browser.close();
  }
})();
