ATLAS AI TRADING · NEO INDEX 3.0 PRO
Proprietà di Matteo Arcuri

INSTALLAZIONE
1. Carica nella root di GitHub Pages index.html, app.js, sw.js, manifest.json, README.txt e worker.js.
2. worker.js NON viene eseguito da GitHub Pages: pubblicalo su Cloudflare Workers (Workers & Pages > Create > Worker > Edit code > Deploy).
3. Copia l'URL HTTPS *.workers.dev in Configurazione feed dell'app e premi Salva e Verifica.
4. Nella sezione Contratti XTB inserisci i dati reali del singolo contratto (valore EUR per variazione di prezzo di 1.00 per lotto, lotto minimo, step, margine per lotto, spread e stima dei costi). L'app li memorizza separatamente per simbolo nel dispositivo.
5. Imposta capitale e limiti, premi Analizza tutti i mercati. Nessun ordine viene inviato.

LIMITAZIONI
La release 3.0 e' un prototipo avanzato: il feed Yahoo e' indicativo e potrebbe non funzionare da Cloudflare. I simboli GC=F, NQ=F, SI=F sono futures e non CFD XTB. I prezzi non sono eseguibili su XTB. I livelli e i lotti sono condizionati ai dati del contratto e devono essere verificati sul ticket XTB. L'analisi news e' un elenco di notizie, non un modello predittivo o un filtro automatico per eventi macro. Lo stop loss non garantisce la perdita massima in caso di gap/slippage. Non esiste garanzia di profitti. La pubblicazione Cloudflare e la verifica end-to-end restano da fare.
