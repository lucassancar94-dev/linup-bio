// Eltern-Seite: Sprache aus ?l=, Token aus #t=, fragt die Funktion "eltern" und zeigt
// genau einen Zustand. Der Token lebt nur im Speicher dieser Seite: nicht in der
// Adresszeile, nicht im Verlauf, nicht im Browser-Speicher, nie in einem Log.
// Erst ein Knopf entscheidet. Das Oeffnen des Links allein fragt nur den Stand ab,
// damit Mail-Programme, die Links vorab pruefen, nichts zustimmen.
(function () {
  var L = window.ELTERN_LOGIK;
  var URL_API = 'https://vbxahjnbcjmexqnxacxs.supabase.co/functions/v1/eltern';
  // Oeffentlicher Anon-Schluessel, derselbe wie in web/umfrage. Allein findet er keine
  // Zeile: die Funktion braucht den Token aus der Mail.
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieGFoam5iY2ptZXhxbnhhY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTg4MDgsImV4cCI6MjA5NjA5NDgwOH0.NC5_FKULzVm2s6Zx16J-0vU3fgp4AayTlwD0T2Kc8gY';
  var WARTEN_MS = 15000;

  var params = new URLSearchParams(location.search);
  var sprache = L.spracheWaehlen([params.get('l')].concat(navigator.languages || [navigator.language]));
  var TEXTE = window.ELTERN_TEXTE || {};
  var T = TEXTE[sprache] || TEXTE[L.RUECKFALL];
  var token = L.tokenAusFragment(location.hash);
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  document.documentElement.lang = sprache;
  document.title = T.titel_seite;
  document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = T[el.dataset.t]; });

  var knoepfe = document.querySelectorAll('button');
  var frageKnopf = document.getElementById('frage-ok');
  var beschaeftigt = false;
  var vorDerFrage = 'offen';
  var frageAntwort = 'nein';

  function zeige(name) {
    document.querySelectorAll('[data-zustand]').forEach(function (s) {
      s.hidden = s.dataset.zustand !== name;
    });
    window.scrollTo(0, 0);
    var titel = document.querySelector('[data-zustand="' + name + '"] h1');
    if (titel) titel.focus();
  }

  function sperre(an) {
    beschaeftigt = an;
    knoepfe.forEach(function (k) { k.disabled = an; });
  }

  function rufe(daten) {
    var abbruch = typeof AbortController === 'function' ? new AbortController() : null;
    var uhr = abbruch ? setTimeout(function () { abbruch.abort(); }, WARTEN_MS) : null;
    return fetch(URL_API, {
      method: 'POST',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: abbruch ? abbruch.signal : undefined,
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: token }, daten)),
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) {
        return L.zustandAusAntwort(r.status, d);
      });
    }).catch(function () {
      return { name: 'fehler' };
    }).then(function (z) {
      clearTimeout(uhr);
      return z;
    });
  }

  function anwenden(z) {
    if (z.name === 'offen') document.getElementById('offen-text').textContent = L.offenText(T, z, sprache);
    sperre(false);
    zeige(z.name);
  }

  function laden() {
    zeige('laden');
    rufe({ aktion: 'seite' }).then(anwenden);
  }

  function entscheiden(antwort, knopf) {
    if (beschaeftigt) return;
    sperre(true);
    knopf.textContent = T.laden;
    rufe({ aktion: 'entscheiden', antwort: antwort }).then(function (z) {
      knopf.textContent = T[knopf.dataset.t];
      anwenden(z);
    });
  }

  // Rueckfrage vor allem, was das Konto loescht.
  function frage(antwort) {
    frageAntwort = antwort;
    vorDerFrage = antwort === 'nein' ? 'offen' : 'danke';
    document.getElementById('frage-titel').textContent = antwort === 'nein' ? T.frage_nein_titel : T.frage_zurueck_titel;
    frageKnopf.dataset.t = antwort === 'nein' ? 'frage_nein_knopf' : 'frage_zurueck_knopf';
    frageKnopf.textContent = T[frageKnopf.dataset.t];
    zeige('frage');
  }

  document.getElementById('ja').addEventListener('click', function () { entscheiden('ja', this); });
  document.getElementById('nein').addEventListener('click', function () { frage('nein'); });
  document.getElementById('zuruecknehmen').addEventListener('click', function () { frage('zuruecknehmen'); });
  document.getElementById('abbrechen').addEventListener('click', function () { zeige(vorDerFrage); });
  frageKnopf.addEventListener('click', function () { entscheiden(frageAntwort, this); });
  // "Nochmal" fragt erst den Stand neu ab und wiederholt nie blind eine Loeschung.
  document.getElementById('nochmal').addEventListener('click', laden);

  if (token) laden();
  else zeige('ohne_link');
})();
