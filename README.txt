ATLAS AI TRADING 0.2
- index.html: dashboard, calcolatore XTB, chiamate sperimentali MarketAPI free e GDELT DOC API.
- manifest.json e sw.js: base PWA.

Per provare: pubblicare i file su hosting HTTPS e aprire il sito in Safari.
Le API vengono chiamate dal browser; se il provider non consente CORS, serve un backend HTTPS.
MarketAPI free endpoint: limite dichiarato 10 richieste/minuto, 1000/giorno per IP e fino a 5 simboli per richiesta.
La copertura dei ticker XAUUSD, EURUSD, US100, XAGUSD va verificata dalla risposta effettiva.
GDELT: notizie, non prezzi; non è un motore di previsione.
FRED non è ancora integrato e richiede una chiave gratuita da tenere lato server.
Non genera segnali di trading, non manda push, non si collega a XTB e non esegue ordini.
I dati XTB nel calcolatore provengono dagli screenshot e sono riferimenti da verificare.
