const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (doit être avant les routes)
app.use(express.static(__dirname, {
    index: false, // Ne pas servir index.html automatiquement
    extensions: ['html', 'css', 'js', 'jpeg', 'jpg', 'png', 'gif', 'svg', 'ico']
}));

// Chemins des fichiers de base de données
// Sur Vercel, utiliser /tmp pour l'écriture, sinon utiliser __dirname
const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const dbDir = isVercel ? '/tmp' : __dirname;
const ADIEU_DB = path.join(dbDir, 'adieu.bd');
const FLEUR_DB = path.join(dbDir, 'fleur.bd');

// Copier les fichiers initiaux depuis __dirname vers /tmp si on est sur Vercel
if (isVercel) {
    const sourceAdieu = path.join(__dirname, 'adieu.bd');
    const sourceFleur = path.join(__dirname, 'fleur.bd');
    
    if (fs.existsSync(sourceAdieu) && !fs.existsSync(ADIEU_DB)) {
        try {
            fs.copyFileSync(sourceAdieu, ADIEU_DB);
        } catch (error) {
            console.error('Erreur copie adieu.bd:', error);
        }
    }
    
    if (fs.existsSync(sourceFleur) && !fs.existsSync(FLEUR_DB)) {
        try {
            fs.copyFileSync(sourceFleur, FLEUR_DB);
        } catch (error) {
            console.error('Erreur copie fleur.bd:', error);
        }
    }
}

// Fonction pour lire un fichier JSON
function lireBD(chemin) {
    try {
        if (fs.existsSync(chemin)) {
            const contenu = fs.readFileSync(chemin, 'utf8');
            return contenu.trim() ? JSON.parse(contenu) : [];
        }
        return [];
    } catch (error) {
        console.error(`Erreur lecture ${chemin}:`, error);
        return [];
    }
}

// Fonction pour écrire dans un fichier JSON
function ecrireBD(chemin, donnees) {
    try {
        fs.writeFileSync(chemin, JSON.stringify(donnees, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Erreur écriture ${chemin}:`, error);
        return false;
    }
}

// Routes pour les messages d'adieu
app.get('/api/messages', (req, res) => {
    const messages = lireBD(ADIEU_DB);
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    const messages = lireBD(ADIEU_DB);
    const nouveauMessage = {
        id: Date.now().toString(),
        texte: message.trim(),
        date: new Date().toISOString()
    };
    
    messages.push(nouveauMessage);
    
    if (ecrireBD(ADIEU_DB, messages)) {
        res.json({ success: true, message: nouveauMessage });
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// Routes pour les fleurs
app.get('/api/fleurs', (req, res) => {
    const fleurs = lireBD(FLEUR_DB);
    res.json(fleurs);
});

app.post('/api/fleurs', (req, res) => {
    const fleurs = lireBD(FLEUR_DB);
    const nouvelleFleur = {
        id: Date.now().toString(),
        date: new Date().toISOString()
    };
    
    fleurs.push(nouvelleFleur);
    
    if (ecrireBD(FLEUR_DB, fleurs)) {
        res.json({ success: true, fleur: nouvelleFleur });
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// Routes explicites pour les fichiers statiques (fallback)
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'), {
        headers: { 'Content-Type': 'text/css' }
    });
});

app.get('/rose.jpeg', (req, res) => {
    res.sendFile(path.join(__dirname, 'rose.jpeg'), {
        headers: { 'Content-Type': 'image/jpeg' }
    });
});

app.get('/char.jpeg', (req, res) => {
    res.sendFile(path.join(__dirname, 'char.jpeg'), {
        headers: { 'Content-Type': 'image/jpeg' }
    });
});

app.get('/plan-de-localisation.jpeg', (req, res) => {
    res.sendFile(path.join(__dirname, 'plan-de-localisation.jpeg'), {
        headers: { 'Content-Type': 'image/jpeg' }
    });
});

app.get('/jesus.mp3', (req, res) => {
    res.sendFile(path.join(__dirname, 'jesus.mp3'), {
        headers: { 'Content-Type': 'audio/mpeg' }
    });
});

// Route pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export pour Vercel
module.exports = app;

// Démarrer le serveur en local uniquement
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
}

