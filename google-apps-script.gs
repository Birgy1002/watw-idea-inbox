/**
 * WATW IDEA INBOX — Google Sheet Empfänger v1.1.1
 * Containergebundenes Script: Erweiterungen > Apps Script im eigenen Google Sheet.
 * Nach Einfügen einmal setupIdeaInbox() ausführen und das Ausführungsprotokoll öffnen.
 * Das Protokoll zeigt beim ERSTEN Ausführen den neu erzeugten privaten Schlüssel.
 */
const TAB_IDEAS = 'Ideen';
const TAB_DASHBOARD = 'Übersicht';
const KEY_PROP = 'WATW_IDEA_INBOX_KEY';
const HEADERS = ['ID','Erfasst am','Aktualisiert am','Autor','Titel','Notiz','Bereich','Revision','Importiert am','Status','Priorität','Verantwortlich','Nächster Schritt','Zieldatum','Stichworte'];
const AREAS = ['Sonstiges','Quiz & Produkte','Guides & MAG','Marketing & Social Media','Website & Technik','Wein & Reisen','Business & Partnerschaften'];

function setupIdeaInbox() {
  // Kann erneut ausgeführt werden: vorhandene Ideen und Team-Notizen bleiben erhalten.
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Bitte über Erweiterungen > Apps Script in einem Google Sheet öffnen.');
  book.setSpreadsheetTimeZone('Europe/Berlin');

  let ideas = book.getSheetByName(TAB_IDEAS);
  if (!ideas) ideas = book.insertSheet(TAB_IDEAS);
  const existingHeaders = ideas.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (existingHeaders.some(Boolean) && HEADERS.some((h, i) => existingHeaders[i] !== h)) {
    throw new Error('Blatt „Ideen“ hat andere Spaltenüberschriften. Bitte ein leeres Blatt verwenden.');
  }
  styleIdeas_(ideas);

  let overview = book.getSheetByName(TAB_DASHBOARD);
  if (!overview) overview = book.insertSheet(TAB_DASHBOARD);
  styleOverview_(overview);
  book.setActiveSheet(overview);
  book.moveActiveSheet(1);

  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty(KEY_PROP);
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(KEY_PROP, key);
    Logger.log('NEUER PRIVATER SCHLÜSSEL (niemals auf GitHub speichern): ' + key);
  } else {
    Logger.log('Vorhandener Schlüssel: Projekteinstellungen > Skripteigenschaften > ' + KEY_PROP);
  }
  Logger.log('Fertig: Google Sheet gestaltet. Für den iPhone-Export als Web-App bereitstellen.');
}

function styleIdeas_(s) {
  const wine = '#783249', rose = '#F4E8ED', ink = '#253039';
  s.setTabColor('#A85D73');
  s.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  s.setFrozenRows(1);
  s.getRange('A1:O1')
    .setBackground(wine).setFontColor('#FFFFFF').setFontFamily('Arial')
    .setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
  s.setRowHeight(1, 42);
  s.getRange('A2:O').setFontFamily('Arial').setFontSize(10).setFontColor(ink)
    .setVerticalAlignment('top');
  // Weiß/Altrosa-Streifen sind nur Layout; Daten werden beim erneuten Aufruf NICHT gelöscht.
  const existingBands = s.getBandings();
  existingBands.forEach(b => b.remove());
  s.getRange(1, 1, s.getMaxRows(), HEADERS.length)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    .setHeaderRowColor(wine)
    .setFirstRowColor('#FFFFFF')
    .setSecondRowColor('#FCF7F9');
  s.getRange('A1:O1').setFontColor('#FFFFFF');
  const widths = [100,150,150,105,260,460,205,85,145,120,115,145,300,125,190];
  widths.forEach((w,i) => s.setColumnWidth(i+1,w));
  s.getRange('B2:C').setNumberFormat('dd.mm.yyyy hh:mm');
  s.getRange('I2:I').setNumberFormat('dd.mm.yyyy hh:mm');
  s.getRange('N2:N').setNumberFormat('dd.mm.yyyy');
  s.getRange('E2:G').setWrap(true);
  s.getRange('M2:M').setWrap(true);
  s.getRange('A1:O1').setNote('Spalten A–I werden von der App gepflegt. In J–O könnt ihr gemeinsam planen.');

  function dropdown(range, options) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true).setAllowInvalid(false).build();
    s.getRange(range).setDataValidation(rule);
  }
  dropdown('G2:G', AREAS);
  dropdown('J2:J', ['Inbox','Prüfen','Geplant','In Arbeit','Erledigt','Verworfen']);
  dropdown('K2:K', ['Hoch','Mittel','Niedrig']);
  dropdown('L2:L', ['Birgit','Thomas','Beide']);
  if (!s.getFilter()) s.getRange(1,1,s.getMaxRows(),HEADERS.length).createFilter();

  const colors = [
    ['J2:J','Inbox','#F2F2F3'],['J2:J','Prüfen','#FFF2DB'],
    ['J2:J','Geplant','#E8EEF8'],['J2:J','In Arbeit','#E2EFF3'],
    ['J2:J','Erledigt','#E4F1E7'],['J2:J','Verworfen','#F0EAEC'],
    ['K2:K','Hoch','#F8DDE3'],['K2:K','Mittel','#FFF0D7'],
    ['K2:K','Niedrig','#E9F0EE']
  ];
  const rules = colors.map(([range,text,background]) => SpreadsheetApp
    .newConditionalFormatRule().whenTextEqualTo(text)
    .setBackground(background).setRanges([s.getRange(range)]).build());
  s.setConditionalFormatRules(rules);
  s.getRange('J1:O1').setBackground('#96546A').setFontColor('#FFFFFF');
  s.getRange('J1').setNote('Bearbeitungsstatus: von euch im Google Sheet ändern.');
  s.getRange('M1').setNote('Hier den konkreten nächsten Schritt eintragen.');
}

function styleOverview_(s) {
  const wine = '#783249', dark = '#272B31', pale = '#F7F1F3';
  // Bei deutschen und anderen Komma-Dezimal-Locale erwartet Sheets Semikola als Formel-Trenner.
  const locale = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetLocale();
  const semicolonLocale = /^(de|fr|it|es|pt|nl|pl|ru|tr|cs|sk|sl|hu|ro|bg|el|hr|sr|uk|lt|lv|et|fi|sv|da|nb|nn)(_|-|$)/i.test(locale);
  const localFormula = formula => semicolonLocale ? formula.replace(/,/g, ';') : formula;
  s.setTabColor(wine);
  const area = s.getRange('A1:H44');
  area.breakApart();
  area.clear(); // nur das automatisch erzeugte Dashboard, niemals das Blatt „Ideen“
  area.setFontFamily('Arial').setFontSize(10).setFontColor(dark)
    .setVerticalAlignment('middle');
  [165,95,30,150,95,30,140,95].forEach((w,i) => s.setColumnWidth(i+1,w));
  for (let r = 1; r <= 44; r++) s.setRowHeight(r, 25);
  s.setRowHeights(1,2,30);
  s.getRange('A1:H2').merge().setValue('WATW  /  IDEA INBOX')
    .setBackground(wine).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(19);
  s.getRange('A3:H3').merge().setValue('Gemeinsame Ideen sammeln · gemeinsam weiterentwickeln')
    .setFontColor('#7E5361').setFontSize(11);

  const cards = [
    ['A','B','Alle Ideen','=COUNTA(\'Ideen\'!A2:A)'],
    ['C','D','Noch prüfen','=COUNTIF(\'Ideen\'!J2:J,"Inbox")+COUNTIF(\'Ideen\'!J2:J,"Prüfen")'],
    ['E','F','In Arbeit','=COUNTIF(\'Ideen\'!J2:J,"In Arbeit")'],
    ['G','H','Erledigt','=COUNTIF(\'Ideen\'!J2:J,"Erledigt")']
  ];
  cards.forEach(([left,right,label,formula]) => {
    s.getRange(left+'5:'+right+'5').merge().setValue(label).setBackground(pale)
      .setFontColor('#715161').setFontWeight('bold');
    s.getRange(left+'6:'+right+'7').merge().setFormula(localFormula(formula))
      .setBackground(pale).setFontColor(wine).setFontWeight('bold').setFontSize(23);
  });
  s.getRange('A9:H9').merge().setValue('IDEEN NACH BEREICH · STATUS · AUTOR')
    .setFontWeight('bold').setFontSize(11).setFontColor(wine);

  function section(range,title) {
    s.getRange(range).merge().setValue(title)
      .setBackground(wine).setFontColor('#FFFFFF').setFontWeight('bold');
  }
  section('A11:B11','BEREICH');
  section('D11:E11','STATUS');
  section('G11:H11','AUTOR');
  s.getRange('A12:B12').setValues([['Bereich','Anzahl']]);
  s.getRange('D12:E12').setValues([['Status','Anzahl']]);
  s.getRange('G12:H12').setValues([['Autor','Anzahl']]);
  ['A12:B12','D12:E12','G12:H12'].forEach(r => s.getRange(r)
    .setBackground('#EDE0E5').setFontWeight('bold'));

  s.getRange(13,1,AREAS.length,1).setValues(AREAS.map(n=>[n]));
  AREAS.forEach((_,i) => s.getRange(i+13,2).setFormula(localFormula('=COUNTIF(\'Ideen\'!G2:G,A'+(i+13)+')')));
  const statuses=['Inbox','Prüfen','Geplant','In Arbeit','Erledigt','Verworfen'];
  s.getRange(13,4,statuses.length,1).setValues(statuses.map(n=>[n]));
  statuses.forEach((_,i) => s.getRange(i+13,5).setFormula(localFormula('=COUNTIF(\'Ideen\'!J2:J,D'+(i+13)+')')));
  s.getRange('G13:G14').setValues([['Birgit'],['Thomas']]);
  s.getRange('H13').setFormula(localFormula('=COUNTIF(\'Ideen\'!D2:D,G13)'));
  s.getRange('H14').setFormula(localFormula('=COUNTIF(\'Ideen\'!D2:D,G14)'));
  ['A13:B19','D13:E18','G13:H14'].forEach(r => s.getRange(r).setBackground('#FCF8F9'));
  ['B13:B19','E13:E18','H13:H14'].forEach(r => s.getRange(r).setHorizontalAlignment('center'));

  s.getRange('A22:H22').merge().setValue('SO ARBEITET IHR MIT DER IDEENLISTE')
    .setBackground(wine).setFontColor('#FFFFFF').setFontWeight('bold');
  const tips = [
    '1   Eine Idee unterwegs auf dem iPhone erfassen und speichern.',
    '2   In der App „Übertragen“ wählen – beide Geräte nutzen dasselbe Google Sheet.',
    '3   Im Blatt „Ideen“ gemeinsam Status, Priorität und nächsten Schritt pflegen.',
    '4   In der Übersicht jederzeit erkennen, was noch offen ist.'
  ];
  tips.forEach((t,i) => s.getRange('A'+(23+i)+':H'+(23+i)).merge().setValue(t)
    .setBackground(i%2===0?'#FCF8F9':'#FFFFFF'));
  s.getRange('A29:H30').merge().setValue('Hinweis: Das Löschen einer bestätigten Notiz vom iPhone entfernt keine Zeile im Google Sheet.')
    .setWrap(true).setBackground('#F7F1F3').setFontColor('#73505D');
  s.setFrozenRows(3);
}

function isAuthorized(key){const expected=PropertiesService.getScriptProperties().getProperty(KEY_PROP);return typeof key==='string'&&key.length>=24&&key===expected;}
function answer(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function jsonp(callback,data){if(!/^__watwAck_[A-Za-z0-9_]{4,80}$/.test(callback||''))return answer({ok:false,error:'Invalid callback'});return ContentService.createTextOutput(callback+'('+JSON.stringify(data)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
function ideasSheet(){const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_IDEAS);if(!s)throw new Error('Bitte zuerst setupIdeaInbox() ausführen.');return s;}
function findRows(s,ids){const map={};const last=s.getLastRow();if(last<2)return map;const wanted=new Set(ids);const data=s.getRange(2,1,last-1,8).getValues();for(let i=0;i<data.length;i++){const id=String(data[i][0]||'');if(wanted.has(id))map[id]={row:i+2,revision:Number(data[i][7])||0};}return map;}
function validNote(n){return n&&typeof n.id==='string'&&/^[-a-zA-Z0-9_]{8,80}$/.test(n.id)&&['Birgit','Thomas'].includes(n.author)&&typeof n.text==='string'&&n.text.trim().length>0&&n.text.length<=30000&&typeof n.title==='string'&&n.title.length<=140&&AREAS.includes(n.category)&&Number.isInteger(n.revision)&&n.revision>0&&n.revision<1e9&&Number.isFinite(Date.parse(n.createdAt))&&Number.isFinite(Date.parse(n.updatedAt));}
function safeText(s){const v=String(s||'');return /^[=+\-@\t\r]/.test(v)?"'"+v:v;}

function doPost(e){try{
  const payload=JSON.parse(e.postData?.contents||'{}');
  if(!isAuthorized(payload.key))return answer({ok:false,error:'Unauthorized'});
  if(!Array.isArray(payload.notes)||payload.notes.length>20||payload.notes.length===0||!payload.notes.every(validNote))return answer({ok:false,error:'Invalid notes'});
  const lock=LockService.getScriptLock();if(!lock.tryLock(25000))return answer({ok:false,error:'Busy. Try again'});
  try{
    const s=ideasSheet(),index=findRows(s,payload.notes.map(n=>n.id));let changed=0;
    for(const n of payload.notes){
      if(index[n.id]&&index[n.id].revision>=n.revision)continue;
      const row=index[n.id]?.row || (s.getLastRow()+1);
      const values=[[n.id,new Date(n.createdAt),new Date(n.updatedAt),n.author,safeText(n.title),safeText(n.text),n.category,n.revision,new Date()]];
      s.getRange(row,1,1,9).setValues(values);
      if(!index[n.id]){s.getRange(row,10).setValue('Inbox');index[n.id]={row,revision:n.revision};}
      changed++;
    }
    SpreadsheetApp.flush();return answer({ok:true,received:payload.notes.length,changed});
  }finally{lock.releaseLock();}
 }catch(error){console.error(error);return answer({ok:false,error:'Server error'});}}

/** JSONP beantwortet NUR ID + Revision. Keine Ideeninhalte werden per GET ausgegeben. */
function doGet(e){const p=e?.parameter||{}, cb=p.callback||'';
 if(p.action!=='verify')return jsonp(cb,{ok:false,error:'Unknown action'});
 if(!isAuthorized(p.key))return jsonp(cb,{ok:false,error:'Unauthorized'});
 const ids=String(p.ids||'').split(',').filter(id=>/^[-a-zA-Z0-9_]{8,80}$/.test(id)).slice(0,20);
 if(!ids.length)return jsonp(cb,{ok:false,error:'No valid IDs'});
 const index=findRows(ideasSheet(),ids),revisions={};ids.forEach(id=>{if(index[id])revisions[id]=index[id].revision;});
 return jsonp(cb,{ok:true,revisions});
}