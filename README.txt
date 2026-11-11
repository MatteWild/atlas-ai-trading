# Neo Index 1.1

## Contenuto
- `index.html`: interfaccia web installabile su iPhone.
- `worker.js`: backend Cloudflare Worker per quotazioni indicative e news.
- `manifest.json` e `sw.js`: installazione PWA e cache offline.

## Pubblicazione del backend (necessaria per feed)
1. Crea un account Cloudflare (piano gratuito sufficiente per un test).
2. Apri **Workers & Pages** → **Create** → **Worker**.
3. Incolla il contenuto di `worker.js` nell'editor del Worker e fai Deploy.
4. Copia l'URL assegnato, ad esempio `https://nome-worker.nome-account.workers.dev`.
5. Apri Neo Index → Mercati → incolla l'URL nel campo backend → **Salva collegamento** → **Verifica connessione**.
6. Aggiorna quotazioni e notizie.

## Pubblicazione della PWA
Pubblica `index.html`, `manifest.json` e `sw.js` su un hosting HTTPS statico (ad esempio GitHub Pages). Il Worker è separato e va pubblicato su Cloudflare.

## Fonti e limiti
- Quotazioni: Yahoo Finance chart endpoint, via Worker. Sono indicative e possono essere ritardate; `GC=F`, `NQ=F` e `SI=F` sono futures, `EURUSD=X` è un cambio spot indicativo. Non sono quotazioni del CFD XTB.
- News: GDELT DOC API.
- L'analisi tecnica usa SMA20/SMA50 e RSI14 sui prezzi storici restituiti. Le etichette BIAS LONG/SHORT sono filtri didattici, non segnali AI né raccomandazioni.
- Il backend restituisce `UNAVAILABLE` per strumenti non disponibili e non inventa prezzi.
- XTB resta l'unica fonte per prezzo eseguibile, spread, margine, valore del punto, volume minimo e step del contratto.
- Nessun ordine viene inviato a XTB.

## Controlli da fare prima dell'uso
- Verificare `/api/health`.
- Verificare che `/api/quotes` restituisca prezzi e timestamp per i simboli.
- Verificare `/api/news`.
- Confrontare i prezzi indicativi con il ticket XTB e annotare differenze.
- Testare il calcolatore con dati contrattuali verificati e controllare manualmente il rischio.

## Nota
Questa versione non include ancora un modello linguistico AI, notifiche push, sincronizzazione cloud o collegamento al conto XTB. Queste funzioni richiedono servizi e credenziali aggiuntivi; non sono simulate nell'interfaccia.
