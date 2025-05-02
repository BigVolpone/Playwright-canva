const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: false, // Mode visible pour interagir
        args: [
            '--disable-blink-features=AutomationControlled', // Désactive les traces d'automatisation
            '--start-maximized',
        ],
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36', // Agent utilisateur classique
    });

    const page = await context.newPage();
    console.log("🌐 Ouvrez Canva et connectez-vous manuellement...");
    await page.goto('https://www.canva.com');
    console.log("⏳ Attendez que la connexion soit terminée...");
    await page.waitForTimeout(120000); // 2 minutes pour se connecter

    console.log("📂 Enregistrement de l'état de session...");
    await context.storageState({ path: 'state.json' });
    console.log("✅ État de session enregistré dans state.json");

    await browser.close();
})();