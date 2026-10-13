/* WATW Idea Inbox v1.3.1 – kein Build-System, keine externen Libraries */
'use strict';
const VERSION = '1.3.1';
const DB_NAME = 'watw_idea_inbox_v1';
const STORE = 'notes';
const SETTINGS_KEY = 'watw_idea_settings_v1';
const DRAFT_KEY = 'watw_idea_draft_v1';
const CATEGORIES = ['Sonstiges','Quiz & Produkte','Guides & MAG','Marketing & Social Media','Website & Technik','Wein & Reisen','Business & Partnerschaften'];
const AUTHORS = ['Birgit','Thomas'];

const $ = (id) => document.getElementById(id);
let database;
let notes = [];
let activeFilter = 'pending';
let searchTerm = '';
let editingId = null;
let syncBusy = false;
let settings = readJSON(SETTINGS_KEY,{ author:'', scriptUrl:'', exportKey:'' });
let toastTimer = null;
let confirmAction = null;

function readJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
function storeSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
function storeDraft(){localStorage.setItem(DRAFT_KEY,JSON.stringify({editingId, text:$('note-text').value,title:$('note-title').value,category:$('note-category').value,author:$('note-author').value}));}
function clearDraft(){localStorage.removeItem(DRAFT_KEY);}
function esc(input){return String(input??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function autoTitle(s){return (String(s).trim().split(/[\n.!?]/)[0].trim()||'Ohne Titel').slice(0,80);}
function stamp(iso){const d=new Date(iso);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short'}).format(d):'–';}
function uuid(){return crypto.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,x=>{const r=crypto.getRandomValues(new Uint8Array(1))[0] & 15;return (x==='x'?r:((r&3)|8)).toString(16);});}
function toast(msg){const el=$('toast');clearTimeout(toastTimer);el.textContent=msg;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function pending(note){return !(note.syncedRevision>=note.revision);}

function openDatabase(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function dbRequest(method, value){return new Promise((resolve,reject)=>{const tx=database.transaction(STORE,method==='getAll'?'readonly':'readwrite');const st=tx.objectStore(STORE);const req=method==='getAll'?st.getAll():method==='delete'?st.delete(value):st.put(value);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function loadNotes(){notes=await dbRequest('getAll');notes.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));renderNotes();}
function updateConnectivity(){$('online-indicator').textContent=navigator.onLine?'● Auf diesem iPhone gespeichert':'● Offline – lokale Speicherung aktiv';$('online-indicator').classList.toggle('offline',!navigator.onLine);}

function renderNotes(){
  const unsynced=notes.filter(pending).length, synced=notes.length-unsynced;
  $('total-count').textContent=notes.length;$('pending-count').textContent=unsynced;$('synced-count').textContent=synced;
  $('sync-label').textContent=syncBusy?'Übertrage …':unsynced?`${unsynced} übertragen`:'Alles übertragen';
  $('sync-button').disabled=syncBusy||!unsynced;
  $('clean-synced').disabled=syncBusy||!synced;
  for(const btn of document.querySelectorAll('[data-filter]')){btn.classList.toggle('active',btn.dataset.filter===activeFilter);btn.setAttribute('aria-pressed',String(btn.dataset.filter===activeFilter));}
  const shown=notes.filter(n=>activeFilter==='all'||(activeFilter==='pending'?pending(n):!pending(n))).filter(n=>!searchTerm||[n.text,n.title,n.category,n.author].join(' ').toLocaleLowerCase('de').includes(searchTerm));
  if(!shown.length){$('note-list').innerHTML=`<div class="empty-state"><div class="big-symbol">✦</div><strong>${searchTerm?'Keine Treffer':activeFilter==='pending'?'Keine offenen Notizen':'Noch keine Notizen in dieser Ansicht'}</strong><span>${searchTerm?'Versuche einen anderen Suchbegriff.':activeFilter==='pending'?'Neue Gedanken erscheinen hier, bis sie bestätigt im Sheet sind.':'Im Bereich „Offen“ findest du unübertragene Ideen.'}</span></div>`;return;}
  $('note-list').innerHTML=shown.map(n=>`
   <article class="note-card" data-id="${esc(n.id)}"><div class="note-card-header"><h3 class="note-card-title">${esc(n.title||autoTitle(n.text))}</h3><span class="sync-state ${pending(n)?'pending':'synced'}">${pending(n)?'◌ Offen':'✓ Übertragen'}</span></div>
   <div class="note-card-text">${esc(n.text)}</div><div class="note-meta"><span class="note-chip">${esc(n.category||'Sonstiges')}</span><span>· ${esc(n.author)}</span><span>· ${esc(stamp(n.createdAt))}</span></div>
   <div class="note-card-actions"><button type="button" data-action="edit" data-id="${esc(n.id)}">Bearbeiten</button><button type="button" class="delete-note" data-action="delete" data-id="${esc(n.id)}">Löschen</button></div></article>`).join('');
}

function syncChoiceUI(field){
 const chosen=$(field).value;
 document.querySelectorAll(`[data-choice-for="${field}"]`).forEach(button=>{
  const selected=button.dataset.choiceValue===chosen;
  button.classList.toggle('selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function syncFormChoices(){['note-category','note-author','settings-author'].forEach(syncChoiceUI);}
function selectChoice(field,value){
 $(field).value=value;
 syncChoiceUI(field);
 $(field).dispatchEvent(new Event('input',{bubbles:true}));
 // Der Standardautor gilt nur für neue Ideen, nicht für die Bearbeitung alter Ideen.
 if(field==='note-author' && !editingId && AUTHORS.includes(value)){
  settings.author=value;
  storeSettings();
 }
}

function resetForm(){editingId=null;$('note-form').reset();$('note-category').value='Sonstiges';$('note-author').value=settings.author||'';$('save-label').textContent='Idee speichern';$('editing-label').textContent='';$('cancel-edit').classList.add('hidden');syncFormChoices();clearDraft();}
function restoreDraft(){const d=readJSON(DRAFT_KEY,null);if(!d)return;const isEdit=!!(d.editingId && notes.some(n=>n.id===d.editingId));editingId=isEdit?d.editingId:null;$('note-text').value=String(d.text||'');$('note-title').value=String(d.title||'');$('note-category').value=CATEGORIES.includes(d.category)?d.category:'Sonstiges';$('note-author').value=AUTHORS.includes(d.author)?d.author:(settings.author||'');if(isEdit){$('save-label').textContent='Änderung speichern';$('editing-label').textContent='Notiz bearbeiten';$('cancel-edit').classList.remove('hidden');}syncFormChoices();}
function editNote(id){const n=notes.find(x=>x.id===id);if(!n)return;editingId=n.id;$('note-text').value=n.text;$('note-title').value=n.manualTitle?n.title:'';$('note-category').value=n.category;$('note-author').value=n.author;$('save-label').textContent='Änderung speichern';$('editing-label').textContent='Notiz bearbeiten';$('cancel-edit').classList.remove('hidden');syncFormChoices();storeDraft();window.scrollTo({top:0,behavior:'smooth'});$('note-text').focus({preventScroll:true});}
async function saveNote(event){event.preventDefault();const text=$('note-text').value.trim();const author=$('note-author').value;const now=new Date().toISOString();if(!text){toast('Bitte schreibe oder diktiere zuerst eine Idee.');$('note-text').focus();return;}if(!AUTHORS.includes(author)){toast('Bitte Birgit oder Thomas als Autor auswählen.');$('note-author').focus();return;}const manualTitle=$('note-title').value.trim();const old=notes.find(n=>n.id===editingId);
 const n={id:old?.id||uuid(),createdAt:old?.createdAt||now,updatedAt:now,revision:(old?.revision||0)+1,syncedRevision:old?.syncedRevision||0,lastSyncedAt:old?.lastSyncedAt||null,author,category:CATEGORIES.includes($('note-category').value)?$('note-category').value:'Sonstiges',title:manualTitle||autoTitle(text),manualTitle:Boolean(manualTitle),text};
 if(old && ['text','title','category','author','manualTitle'].every(key=>old[key]===n[key])){toast('Keine Änderungen vorhanden.');resetForm();return;}
 try{await dbRequest('put',n);if(!old){settings.author=author;storeSettings();}resetForm();await loadNotes();toast(old?'Änderung lokal gespeichert.':'Idee lokal gespeichert.');}catch(e){toast('Speichern fehlgeschlagen – bitte Backup prüfen.');console.error(e);}
}

function confirmDialog(title,message,action,verb='Löschen'){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-yes').textContent=verb;confirmAction=action;$('confirm-dialog').showModal();}
function deleteNote(id){const n=notes.find(x=>x.id===id);if(!n)return;const isPending=pending(n);confirmDialog(isPending?'Nicht übertragene Idee löschen?':'Notiz vom iPhone löschen?',isPending?'Diese Idee ist noch NICHT im Google Sheet bestätigt. Wenn du sie jetzt löschst, geht sie möglicherweise unwiederbringlich verloren. Trotzdem löschen?':'Die Idee wurde im Google Sheet bestätigt. Sie wird nur auf diesem iPhone gelöscht; die Zeile im Sheet bleibt bestehen.',async()=>{await dbRequest('delete',id);if(editingId===id)resetForm();await loadNotes();toast('Notiz auf diesem iPhone gelöscht.');});}
function cleanSynced(){const toDelete=notes.filter(n=>!pending(n));if(!toDelete.length)return;confirmDialog(`${toDelete.length} übertragene Notizen entfernen?`,'Nur erfolgreich im Google Sheet bestätigte Notizen werden auf diesem iPhone gelöscht. Alle offenen Ideen bleiben erhalten. Das Sheet wird nicht verändert.',async()=>{for(const note of toDelete)await dbRequest('delete',note.id);if(toDelete.some(n=>n.id===editingId))resetForm();await loadNotes();toast(`${toDelete.length} übertragene Notizen aufgeräumt.`);},'Aufräumen');}

function connected(){return !!(settings.scriptUrl&&settings.exportKey);}
function normalizedUrl(url){try{const u=new URL(url.trim());if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(u.pathname))return null;u.search='';u.hash='';return u.href;}catch{return null;}}
async function syncNotes(){if(syncBusy)return;let batch=notes.filter(pending);if(!batch.length){toast('Alle Notizen wurden bereits übertragen.');return;}if(!connected()){openSettings();toast('Bitte zuerst die Google-Sheets-Verbindung einrichten.');return;}if(!normalizedUrl(settings.scriptUrl)){toast('Bitte die Apps-Script-Adresse prüfen.');openSettings();return;}if(!navigator.onLine){toast('Offline: Deine Ideen bleiben auf dem iPhone gespeichert.');return;}
 syncBusy=true;renderNotes();let success=0;let failures=0;
 try{
  for(let start=0;start<batch.length;start+=20){const group=batch.slice(start,start+20);let acknowledged=[];
   try{
    const payload={key:settings.exportKey,notes:group.map(n=>({id:n.id,createdAt:n.createdAt,updatedAt:n.updatedAt,revision:n.revision,author:n.author,category:n.category,title:n.title,text:n.text}))};
    // Apps Script liefert ohne CORS-Freigabe keine lesbare POST-Antwort. Deshalb IMMER per JSONP gegenprüfen.
    await fetch(settings.scriptUrl,{method:'POST',mode:'no-cors',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    for(let retry=0;retry<3;retry++){
      await new Promise(r=>setTimeout(r,650+retry*950));
      const verification=await jsonpVerify(settings.scriptUrl,settings.exportKey,group.map(n=>n.id));
      if(!verification.ok)throw Error('Verifikation fehlgeschlagen.');
      acknowledged=group.filter(n=>Number(verification.revisions?.[n.id]||0)>=n.revision);
      if(acknowledged.length===group.length)break;
    }
    for(const n of acknowledged){const latest=notes.find(x=>x.id===n.id);if(!latest)continue;const stored={...latest,syncedRevision:Math.max(latest.syncedRevision||0,n.revision),lastSyncedAt:new Date().toISOString()};await dbRequest('put',stored);success++;}
    failures+=group.length-acknowledged.length;
   }catch(err){console.warn('Übertragung konnte nicht bestätigt werden:',err);failures+=group.length;}
   await loadNotes();
  }
  toast(failures?`${success} bestätigt, ${failures} noch offen. Erneut versuchen.`:`${success} Idee${success===1?'':'n'} im Google Sheet bestätigt.`);
 }finally{syncBusy=false;await loadNotes();}
}

function jsonpVerify(url,key,ids){return new Promise((resolve,reject)=>{
 const callback='__watwAck_'+Date.now()+'_'+Math.random().toString(36).slice(2,10);
 let finished=false;const tag=document.createElement('script');let timer;
 function done(error,value){if(finished)return;finished=true;clearTimeout(timer);tag.remove();delete window[callback];error?reject(error):resolve(value);}
 window[callback]=(data)=>done(null,data);
 const query=new URLSearchParams({action:'verify',key,ids:ids.join(','),callback,_:String(Date.now())});
 tag.src=url+'?'+query.toString();tag.async=true;tag.onerror=()=>done(new Error('Bestätigung nicht erreichbar'));
 timer=setTimeout(()=>done(new Error('Bestätigung dauert zu lange')),15000);document.head.appendChild(tag);
 });}

function openSettings(){$('settings-author').value=settings.author;syncChoiceUI('settings-author');$('settings-url').value=settings.scriptUrl;$('settings-key').value=settings.exportKey;$('settings-dialog').showModal();}
function saveSettings(){const author=$('settings-author').value,url=$('settings-url').value.trim(),key=$('settings-key').value.trim();if((url||key)&&(!normalizedUrl(url)||key.length<24)){toast('Bitte eine gültige /exec-Adresse und einen Schlüssel mit mindestens 24 Zeichen eintragen.');return;}settings={author:AUTHORS.includes(author)?author:'',scriptUrl:normalizedUrl(url)||'',exportKey:key};storeSettings();if(!editingId){$('note-author').value=settings.author;syncChoiceUI('note-author');}$('settings-dialog').close();toast('Einstellungen auf diesem Gerät gespeichert.');}
function clearConnection(){confirmDialog('Sheet-Verbindung entfernen?','Nur die auf diesem Gerät gespeicherte Adresse und der private Schlüssel werden gelöscht. Lokale Notizen und Google Sheet bleiben unverändert.',()=>{settings.scriptUrl='';settings.exportKey='';storeSettings();$('settings-url').value='';$('settings-key').value='';toast('Verbindung auf diesem Gerät entfernt.');},'Entfernen');}
function saveFile(text,filename,mime){const blob=new Blob([text],{type:mime});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);}
function exportBackup(){const data={app:'watw-idea-inbox',formatVersion:1,exportedAt:new Date().toISOString(),notes};saveFile(JSON.stringify(data,null,2),`WATW-Ideen-Backup-${new Date().toISOString().slice(0,10)}.json`,'application/json');toast('Backup zum Speichern vorbereitet.');}
async function importBackup(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=='watw-idea-inbox'||!Array.isArray(data.notes))throw Error('Ungültiger Dateityp');let count=0;for(const raw of data.notes){if(!raw||!/^[-a-zA-Z0-9_]{8,80}$/.test(raw.id)||typeof raw.text!=='string'||!raw.text.trim()||!AUTHORS.includes(raw.author))continue;const existing=notes.find(n=>n.id===raw.id);if(existing&&String(existing.updatedAt)>=String(raw.updatedAt))continue;const n={id:raw.id,text:raw.text.slice(0,30000),title:String(raw.title||autoTitle(raw.text)).slice(0,140),manualTitle:Boolean(raw.manualTitle),author:raw.author,category:CATEGORIES.includes(raw.category)?raw.category:'Sonstiges',createdAt:raw.createdAt||new Date().toISOString(),updatedAt:raw.updatedAt||new Date().toISOString(),revision:Math.max(1,Number(raw.revision)||1),syncedRevision:0,lastSyncedAt:null};await dbRequest('put',n);count++;}await loadNotes();toast(`${count} Notizen importiert – zur Sicherheit erneut zu übertragen.`);}catch(err){console.error(err);toast('Backup konnte nicht gelesen werden.');}finally{$('backup-file').value='';}}

function wire(){
 $('note-form').addEventListener('submit',saveNote);
 document.querySelectorAll('button[data-choice-for]').forEach(button=>button.addEventListener('click',()=>selectChoice(button.dataset.choiceFor,button.dataset.choiceValue))); 
 for(const id of ['note-text','note-title','note-category','note-author'])$(id).addEventListener('input',storeDraft);
 $('cancel-edit').addEventListener('click',()=>{resetForm();toast('Bearbeitung abgebrochen.');});
 document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.filter;renderNotes();}));
 $('note-search').addEventListener('input',e=>{searchTerm=e.target.value.toLocaleLowerCase('de').trim();renderNotes();});
 $('note-list').addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;const id=btn.dataset.id;if(btn.dataset.action==='edit')editNote(id);if(btn.dataset.action==='delete')deleteNote(id);});
 $('sync-button').addEventListener('click',syncNotes);$('clean-synced').addEventListener('click',cleanSynced);
 $('settings-open').addEventListener('click',openSettings);$('settings-close').addEventListener('click',()=>$('settings-dialog').close());
 $('save-settings').addEventListener('click',saveSettings);$('clear-connection').addEventListener('click',clearConnection);
 $('export-backup').addEventListener('click',exportBackup);$('import-backup').addEventListener('click',()=>$('backup-file').click());$('backup-file').addEventListener('change',e=>importBackup(e.target.files?.[0]));
 $('confirm-cancel').addEventListener('click',()=>$('confirm-dialog').close());$('confirm-yes').addEventListener('click',async()=>{const fn=confirmAction;confirmAction=null;$('confirm-dialog').close();if(fn)try{await fn();}catch(e){console.error(e);toast('Aktion fehlgeschlagen.');}});
 window.addEventListener('online',updateConnectivity);window.addEventListener('offline',updateConnectivity);
}
async function main(){wire();$('version').textContent='v'+VERSION;updateConnectivity();try{database=await openDatabase();await loadNotes();$('note-author').value=AUTHORS.includes(settings.author)?settings.author:'';syncFormChoices();restoreDraft();}catch(e){console.error(e);toast('Lokaler Speicher nicht verfügbar. Bitte Safari-Einstellungen prüfen.');$('save-note').disabled=true;}if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline-Cache nicht aktiv:',err));}
main();