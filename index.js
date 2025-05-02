require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

// Route principale pour exécuter le script
app.post('/run', async (req, res) => {
    console.log("📩 Requête reçue :", req.body);

    const { template, citations } = req.body;

    // Définir les URLs des templates
    const templates = {
        A: process.env.TEMPLATE_A_URL,
        B: process.env.TEMPLATE_B_URL,
        C: process.env.TEMPLATE_C_URL,
        D: process.env.TEMPLATE_D_URL,
    };

    const templateUrl = templates[template];
    if (!templateUrl) {
        console.log("❌ Template inconnu");
        return res.status(400).send('❌ Template inconnu');
    }

    if (!Array.isArray(citations) || citations.length === 0) {
        console.log("❌ Aucune citation fournie");
        return res.status(400).send('❌ Aucune citation fournie');
    }

    const storageStatePath = 'state.json';
    const storageStateExists = fs.existsSync(storageStatePath);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext(
        storageStateExists ? { storageState: storageStatePath } : {}
    );

    // Démarrer le traçage
    console.log("🟢 Démarrage du traçage...");
    await context.tracing.start({ screenshots: true, snapshots: true });

    const page = await context.newPage();

    try {
        page.setDefaultTimeout(180000); // Augmente le délai global

        console.log("🌐 Connexion à Canva...");
        await page.goto(templateUrl, { timeout: 180000 });
        console.log("✅ Navigation effectuée, attente de l'état 'networkidle'...");
        await page.waitForLoadState('networkidle', { timeout: 180000 });

        console.log(`✍️ Ajout des citations (${citations.length})`);
        for (let i = 0; i < citations.length; i++) {
            console.log(`💡 Ajout de la citation n°${i + 1}: ${citations[i]}`);
            await page.waitForTimeout(Math.random() * 2000 + 1000);
            const textBox = await page.waitForSelector('[data-testid="text-box"]', { timeout: 60000 });
            await textBox.click();
            await page.keyboard.type(citations[i], { delay: 100 });
            console.log(`✅ Citation ${i + 1} ajoutée.`);
        }

        res.send('✅ Citations ajoutées au template Canva');
    } catch (err) {
        console.error("❌ Erreur pendant l'exécution :", err);
        res.status(500).send('Erreur d’exécution du script');
    } finally {
        try {
            // Arrêter et sauvegarder le traçage
            console.log("🛑 Arrêt du traçage...");
            await context.tracing.stop({ path: 'trace.zip' });
            console.log("✅ Traçage sauvegardé dans trace.zip");
        } catch (traceErr) {
            console.error("❌ Erreur lors de l'arrêt du traçage :", traceErr);
        }

        await browser.close();
        console.log("🖐️ Navigateur fermé.");
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));