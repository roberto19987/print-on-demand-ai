require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Rotta per la pagina principale
app.get('/', (req, res) => {
    res.render('home');
});

// Rotta per generare immagini
app.post('/generate-image', async (req, res) => {
    const description = req.body.description; // Ottieni la descrizione dall'input del modulo

    try {
        // Chiama l'API di DALL-E
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: description, // Descrizione data dall'utente
            n: 1, // Numero di immagini da generare
            size: "1024x1024" // Dimensione dell'immagine
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Utilizza la variabile d'ambiente
                'Content-Type': 'application/json' // Imposta il tipo di contenuto per la richiesta
            }
        });

        const imageUrl = response.data.data[0].url; // Recupera l'URL dell'immagine generata

        // Reindirizza alla pagina di personalizzazione con l'immagine generata
        res.render('customize', { imageUrl });
    } catch (error) {
        console.error("Errore nella generazione dell'immagine:", error.response.data); // Mostra errori dettagliati
        if (error.response && error.response.data) {
            res.status(500).send(error.response.data.error.message); // Mostra il messaggio di errore specifico
        } else {
            res.status(500).send('Si è verificato un errore durante la generazione dell\'immagine.');
        }
    }
});

// Rotta per gestire l'ordine su Printful
app.post('/order', async (req, res) => {
    const imageUrl = req.body.image_url; // Ottieni l'URL dell'immagine da caricare

    // Utilizza la variabile d'ambiente per la chiave API Printful
    const API_KEY = process.env.PRINTFUL_API_KEY;

    try {
        const printfulResponse = await axios.post('https://api.printful.com/orders', {
            recipient: {
                name: "Nome Cliente",
                address1: "Indirizzo",
                city: "Città",
                state_code: "ST", // Usa state_code come richiesto da Printful
                country_code: "IT", // Usa il codice paese appropriato
                zip: "CAP"
            },
            items: [{
                variant_id: 1, // Sostituisci con un variant_id valido
                quantity: 1,
                files: [{
                    type: "default",
                    url: imageUrl // URL dell’immagine generata
                }]
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`, // Usa la variabile d'ambiente per Printful
                'Content-Type': 'application/json' // Imposta il tipo di contenuto per la richiesta
            }
        });

        res.send('Ordine inviato con successo: ' + JSON.stringify(printfulResponse.data, null, 2));
    } catch (error) {
        console.error("Errore nell'invio dell'ordine:", error.response ? error.response.data : error.message);
        res.status(500).send('Errore durante l\'invio dell\'ordine.');
    }
});

app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});
app.get('/test-printful', async (req, res) => {
    try {
        const response = await axios.get('https://api.printful.com/store/products', {
            headers: {
                'Authorization': 'Bearer TUA_CHIAVE_API_PRINTFUL' // Inserisci qui la tua chiave API Printful
            }
        });
        res.json(response.data); // Ritorna i dati del prodotto ricevuti
    } catch (error) {
        console.error("Errore nella connessione a Printful:", error.message);
        res.status(500).send('Errore durante la connessione a Printful.');
    }
});
