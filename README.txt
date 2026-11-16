ATLAS AI TRADING · Neo Index
Proprietà di Matteo Arcuri

PUBBLICAZIONE SU GITHUB PAGES
1. Estrai questo ZIP sul PC. Copia i file nella radice del repository
   MatteWild/atlas-ai-trading, incluse le cartelle .github e scripts, e fai
   commit su main. Il workflow deve risultare nel percorso
   .github/workflows/atlas-pages.yml.
2. In Settings > Pages > Build and deployment, imposta Source su GitHub Actions.
3. In Actions > ATLAS Pages, scegli Run workflow sul ramo main.
4. Dopo il deploy apri https://mattewild.github.io/atlas-ai-trading/ e prova
   Analizza tutti i mercati e Aggiorna notizie.

Il workflow aggiorna i dati ogni 10 minuti circa. Le esecuzioni pianificate
possono subire ritardi. La pagina verifica l'età dei dati prima di proporre
un piano. Le news vengono da GDELT, le candele indicative da Yahoo Finance.
La scheda XAU/USD spot usa Gold API. I segnali GOLD usano il future GC=F.
