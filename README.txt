NEO INDEX 2.0 PRO - ISTRUZIONI

1. Sostituisci index.html, manifest.json, sw.js e README.txt nella root della repository GitHub Pages. worker.js e' il backend e deve anche essere pubblicato separatamente su Cloudflare Workers.
2. Cloudflare Dashboard > Workers & Pages > Create Worker > Edit code: incolla worker.js e premi Deploy.
3. Copia l'URL HTTPS workers.dev in Neo Index > Collegamento dati > Salva indirizzo > Verifica.
4. Seleziona un contratto e inserisci i valori REALI del ticket XTB: valore EUR per movimento di prezzo 1.00 per lotto, lotto minimo, step, margine EUR per lotto, spread e costi stimati. Le specifiche devono corrispondere al contratto selezionato.
5. Inserisci capitale e limiti di rischio, quindi Analizza mercato. I segnali sono INDICATIVI e NON vanno copiati su XTB senza confrontare i prezzi e il tipo di contratto.

LIMITAZIONI: Yahoo Finance non fornisce prezzi eseguibili XTB. GC=F, NQ=F, SI=F sono futures, non CFD XTB. Il feed puo' essere ritardato o indisponibile. L'app non verifica automaticamente il calendario macro, non predice le news, non invia ordini e non garantisce profitti o limiti di perdita. Le quotazioni vecchie oltre 45 minuti sono rifiutate. Il rischio effettivo puo' superare lo stop per slippage e gap. Non pubblicare credenziali o chiavi API in GitHub. La pubblicazione Cloudflare non avviene automaticamente caricando worker.js su GitHub.
