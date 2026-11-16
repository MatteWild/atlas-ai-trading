'use strict';
const $=id=>document.getElementById(id), ids=['capital','risk','daily','used','rr','fresh','goldOrder','goldMinimum'], contractIds=['point','minimum','step','margin','spread','cost'];
const num=id=>Number($(id).value), setText=(id,t)=>$(id).textContent=t, fmt=n=>Number(n).toLocaleString('it-IT',{maximumFractionDigits:2}), euro=n=>Number(n).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
const valid=id=>$(id).value.trim()!==''&&Number.isFinite(num(id))&&num(id)>=0;
const symbols={'XAU/USD':'GOLD · XAU/USD spot','EURUSD=X':'EUR/USD · Spot indicativo','NQ=F':'US100 · Futures indicativi','SI=F':'SILVER · Futures indicativi'};
function store(){try{localStorage.setItem('neo3settings',JSON.stringify(Object.fromEntries(ids.map(id=>[id,$(id).value]))))}catch{}}
try{const x=JSON.parse(localStorage.getItem('neo3settings')||'{}');ids.forEach(id=>{if(x[id]!=null)$(id).value=x[id]})}catch{}
function budget(){const cap=valid('capital')?num('capital'):0,r=valid('risk')?num('risk'):0;setText('budget',euro(cap*r/100));store()}
ids.forEach(id=>$(id).addEventListener('change',budget));budget();
async function api(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('./data/' + path + '.json', {
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!response.ok) throw Error('Feed GitHub Pages non disponibile (HTTP ' + response.status + ')');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
function contractKey(){return 'neo3contract:'+ $('contract').value}function loadContract(){let d={};try{d=JSON.parse(localStorage.getItem(contractKey())||'{}')}catch{}contractIds.forEach(id=>$(id).value=d[id]??'');setText('contractStatus',contractIds.every(id=>d[id]!==undefined&&d[id]!=='')?'Specifiche salvate · verificare con XTB':'Specifiche incomplete: volume disabilitato')}
$('contract').onchange=loadContract;loadContract();$('saveContract').onclick=()=>{localStorage.setItem(contractKey(),JSON.stringify(Object.fromEntries(contractIds.map(id=>[id,$(id).value]))));loadContract()};
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
function analyze(q){const c=(q.closes||[]).filter(Number.isFinite),p=Number(q.price),ts=Number(q.time);if(q.status==='UNAVAILABLE'||c.length<50||!Number.isFinite(p)||p<=0||!Number.isFinite(ts)||ts<=0)return {error:'NO TRADE · dati insufficienti'};const age=(Date.now()-ts)/60000;if(age< -2||age>num('fresh'))return {error:'NO TRADE · dati non aggiornati ('+Math.round(age)+' min)'};const sma20=mean(c.slice(-20)),sma50=mean(c.slice(-50)),slice=c.slice(-21),vol=mean(slice.slice(1).map((v,i)=>Math.abs(v-slice[i])));if(!(vol>0))return {error:'NO TRADE · volatilità non misurabile'};const side=p>sma20&&sma20>sma50?'BUY':p<sma20&&sma20<sma50?'SELL':null;if(!side)return {error:'NO TRADE · trend non allineato'};const d=Math.max(vol*1.5,p*.0005),stop=d*1.5,entry=side==='BUY'?p-d:p+d,sl=side==='BUY'?entry-stop:entry+stop,tp=side==='BUY'?entry+stop*num('rr'):entry-stop*num('rr');return {side,entry,sl,tp,stop,age:Math.round(age),decimals:Math.max(0,Math.min(6,q.decimals??2))}}
function goldPlan(signal, spot, fx, settings) {
  const fresh = time => Number.isFinite(time) &&
    time <= settings.now + 120000 && settings.now - time <= settings.maxAge * 60000;
  if (!spot || !fresh(spot.time)) return { error: 'NO TRADE · quotazione spot XAU/USD non disponibile o datata' };
  if (!fx || fx.status !== 'INDICATIVE' || !Number.isFinite(fx.price) || fx.price <= 0 || !fresh(fx.time)) {
    return { error: 'NO TRADE · cambio EUR/USD non disponibile o datato' };
  }
  const direction = signal.side === 'BUY' ? 1 : -1;
  const order = settings.order === 'STOP' ? 'STOP' : 'LIMIT';
  const entryDirection = order === 'STOP' ? direction : -direction;
  const distance = Math.abs(spot.price - signal.entry);
  const cents = Math.round(spot.price * 100) + entryDirection * Math.max(1, Math.ceil(distance * 100));
  const stopCents = Math.max(1, Math.ceil(signal.stop * 100));
  const entry = cents / 100;
  const sl = (cents - direction * stopCents) / 100;
  const tp = (cents + direction * Math.round(stopCents * settings.rr)) / 100;
  if (!(entry > 0 && sl > 0 && tp > 0)) return { error: 'NO TRADE · livelli non validi' };
  const usdPerLot = 100;
  const spreadBuffer = 0.70;
  const lossPerLot = (stopCents / 100 + spreadBuffer) * usdPerLot / fx.price;
  const marginPerLot = entry * usdPerLot * 0.05 / fx.price;
  const units = Math.floor(Math.min(settings.risk / lossPerLot, settings.capital / marginPerLot) * 1000);
  if (units < settings.minUnits) return { error: 'NO TRADE · il lotto minimo supera il rischio o il margine stimato' };
  const lots = units / 1000;
  return { entry, sl, tp, order, lots, margin: lots * marginPerLot, loss: lots * lossPerLot };
}

function sizing(a){if(contractIds.some(id=>!valid(id))||num('point')<=0||num('minimum')<=0||num('step')<=0||num('margin')<=0)return {error:'Volume non disponibile · mancano specifiche XTB verificate'};const cap=num('capital'),risk=cap*num('risk')/100,remaining=cap*num('daily')/100-num('used'),budget=Math.min(risk,remaining);if(!(budget>0))return {error:'NO TRADE · limite giornaliero raggiunto'};const lossLot=(a.stop+num('spread'))*num('point')+num('cost');if(!(lossLot>0))return {error:'NO TRADE · costo per lotto non valido'};const limit=Math.min(budget/lossLot,cap/num('margin')),min=num('minimum'),step=num('step');const lots=limit>=min?Number((min+Math.floor((limit-min+1e-9)/step)*step).toFixed(8)):0;if(lots<min)return {error:'NO TRADE · lotto minimo supera il rischio o il margine disponibile'};return {lots,loss:lots*lossLot,margin:lots*num('margin')}}
let last='';async function scanMarkets(goldOnly = false){last='';$('copy').disabled=true;$('signals').replaceChildren();if(!valid('capital')||num('capital')<=0||!valid('risk')||num('risk')<=0||num('risk')>5||!valid('daily')||num('daily')<=0||!valid('used')){setText('scanStatus','Correggi capitale e limiti di rischio');return}setText('scanStatus','Analisi in corso…');try{const j=await api('quotes');if(!Array.isArray(j.quotes))throw Error('Risposta feed non valida');const gold=j.quotes.find(q=>q.symbol==='XAU/USD');
if(!gold)throw Error('Attendi il deploy del feed XAU/USD');
const markets=goldOnly?[gold]:j.quotes;
const available=markets.filter(q=>q.status!=='UNAVAILABLE').length;
setText('goldPrice',gold.status==='INDICATIVE'
  ? fmt(gold.price)+' USD/oncia · chiusura '+new Date(gold.time).toLocaleString('it-IT')
  : (gold.reason||'Quotazione non disponibile'));
const plans=[];const goldSignal=analyze(gold);for(const q of markets){const a=q===gold?goldSignal:analyze(q),div=document.createElement('div');div.className='signal';const title=document.createElement('strong');title.textContent=symbols[q.symbol]||q.symbol;div.append(title);if(q===gold&&!a.error){
  const risk=Math.min(5,num('capital')*num('risk')/100,num('capital')*num('daily')/100-num('used'));
  const plan=goldPlan(a,q,j.quotes.find(quote=>quote.symbol==='EURUSD=X'),{
    now:Date.now(),maxAge:num('fresh'),rr:num('rr'),order:$('goldOrder').value,
    capital:num('capital'),risk,minUnits:Number($('goldMinimum').value)
  });
  const row=document.createElement('p');
  if(plan.error){
    row.className='bad';row.textContent=plan.error;
  }else{
    const f=x=>x.toFixed(2);
    row.textContent=[a.side+' '+plan.order,'Ingresso '+f(plan.entry),'SL '+f(plan.sl),'TP '+f(plan.tp),
      'Volume '+plan.lots.toFixed(3)+' lotti','Margine stimato '+euro(plan.margin),'Rischio stimato '+euro(plan.loss)].join(' · ');
    plans.push('GOLD XTB · stima su spot | '+row.textContent+' | Verifica con il ticket XTB');
  }
  div.append(row);$('signals').append(div);continue;
}const p=document.createElement('p');p.className=a.error?'bad':'warn';p.textContent=(q.status==='UNAVAILABLE'?'NO TRADE · '+(q.reason||'quotazione non disponibile'):a.error)||a.side+' LIMIT · proposta tecnica indicativa';div.append(p);if(!a.error){const f=x=>x.toFixed(a.decimals),detail=document.createElement('p');detail.textContent='Ingresso '+f(a.entry)+' · SL '+f(a.sl)+' · TP '+f(a.tp)+' · R/R 1:'+num('rr')+' · dato '+a.age+' min';div.append(detail);const size=document.createElement('p');size.className='sub';if($('contract').value!==q.symbol){size.textContent='Seleziona questo contratto nella sezione XTB per calcolare il volume.'}else{const s=sizing(a);size.textContent=s.error||'Volume '+s.lots+' lotti · Margine stimato '+euro(s.margin)+' · Rischio pianificato '+euro(s.loss);if(!s.error)plans.push([symbols[q.symbol],a.side+' LIMIT','Ingresso '+f(a.entry),'SL '+f(a.sl),'TP '+f(a.tp),'Volume '+s.lots,'Margine '+euro(s.margin),'Rischio '+euro(s.loss),'Confrontare sempre con ticket XTB'].join(' | '))}div.append(size)}$('signals').append(div)}last=plans.join('\n');$('copy').disabled=!last;setText('scanStatus',available ? 'Analisi completata · '+available+'/'+markets.length+' mercati con dati. Proposte indicative.' : 'NO TRADE · nessun mercato disponibile');setText('feedState',available ? 'Dati ricevuti' : 'Feed non disponibile')}catch(e){setText('scanStatus','NO TRADE · '+e.message);setText('feedState','Feed non disponibile');setText('goldPrice','Feed GOLD non disponibile')}}
$('scan').onclick=()=>scanMarkets();
$('scanGold').onclick=()=>scanMarkets(true);
$('copy').onclick=async()=>{if(!last)return;try{await navigator.clipboard.writeText(last);alert('Piano copiato')}catch{alert(last)}};
$('newsBtn').onclick=async()=>{setText('newsStatus','Caricamento notizie…');$('news').replaceChildren();try{const j=await api('news');if(j.error)throw Error(j.error);const arts=(j.articles||[]).filter(a=>/^https:\/\//.test(a.url||'')).slice(0,15);for(const a of arts){const p=document.createElement('p'),link=document.createElement('a');link.href=a.url;link.textContent=a.title||a.url;link.target='_blank';link.rel='noopener noreferrer';p.append(link);$('news').append(p)}setText('newsStatus',arts.length+' notizie · '+(j.source||'Rassegna')+' · '+new Date(j.fetchedAt).toLocaleString('it-IT'))}catch(e){setText('newsStatus','Notizie non disponibili: '+e.message)}};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

async function loadCalendar() {
  try {
    const payload = await api('calendar');
    if (payload.error) throw Error(payload.error);
    if (!Array.isArray(payload.events)) throw Error('Formato calendario non valido');
    const events = payload.events.filter(event => Date.parse(event.time) >= Date.now()).slice(0, 4);
    const list = $('macroEvents');
    list.replaceChildren();
    for (const event of events) {
      const item = document.createElement('li');
      const time = new Date(event.time).toLocaleString('it-IT', {
        dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome'
      });
      item.textContent = time + ' · ' + event.title;
      list.append(item);
    }
    setText('macroStatus', events.length ? 'BLS · ora italiana' : 'Nessun evento BLS rilevante nel periodo pubblicato');
  } catch (error) {
    setText('macroStatus', 'Calendario BLS non disponibile');
  }
}

scanMarkets(true);
loadCalendar();
