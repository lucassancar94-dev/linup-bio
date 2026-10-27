// Reine Logik der Eltern-Seite (docs/ELTERN-ZUSTIMMUNG.md, Abschnitt Webseite).
// Kein DOM, kein Netz: im Browser als window.ELTERN_LOGIK, im Test per require.
(function (wurzel) {
  // Die 16 App-Sprachen (lib/i18n/sprachen.js). Alles andere bekommt Englisch.
  var SPRACHEN = ['bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'fr', 'hu', 'it', 'nl', 'pl', 'pt', 'ro', 'sv', 'tr'];
  var RUECKFALL = 'en';
  // Token: 32 Zufallsbytes als base64url (43 Zeichen). Etwas Spiel nach beiden Seiten.
  var TOKEN_MUSTER = /^[A-Za-z0-9_-]{16,256}={0,2}$/;

  /** Erste passende Sprache aus der Wunschliste (?l=, dann Browser), sonst Englisch. */
  function spracheWaehlen(wunsch) {
    var liste = Array.isArray(wunsch) ? wunsch : [wunsch];
    for (var i = 0; i < liste.length; i++) {
      var basis = String(liste[i] || '').toLowerCase().split(/[-_]/)[0];
      if (SPRACHEN.indexOf(basis) !== -1) return basis;
    }
    return RUECKFALL;
  }

  /** Token aus "#t=...". Alles, was nicht wie ein Token aussieht, zaehlt als fehlend. */
  function tokenAusFragment(hash) {
    var roh = new URLSearchParams(String(hash || '').replace(/^#/, '')).get('t');
    return roh && TOKEN_MUSTER.test(roh) ? roh : null;
  }

  function alterAus(wert) {
    var zahl = Number(wert);
    return Number.isInteger(zahl) && zahl > 0 && zahl < 100 ? zahl : null;
  }

  /**
   * Server-Antwort (HTTP-Status + JSON) -> Zustand der Seite.
   * Nur ein 404 mit {error:'unbekannt'} heisst "Link gilt nicht mehr". Jeder andere
   * Fehler (auch ein 404 ohne diesen Text, etwa eine fehlende Funktion) ist "fehler".
   */
  function zustandAusAntwort(status, daten) {
    var d = daten && typeof daten === 'object' ? daten : {};
    if (status === 404 && d.error === 'unbekannt') return { name: 'unbekannt' };
    if (!(status >= 200 && status < 300)) return { name: 'fehler' };
    if (d.geloescht === true) return { name: 'geloescht' };
    if (d.status === 'ja') return { name: 'danke' };
    var alter = alterAus(d.alter);
    if (d.status === 'offen' && alter) return { name: 'offen', alter: alter, angemeldetAm: d.angemeldet_am };
    return { name: 'fehler' };
  }

  /** "2026-10-26" oder ISO-Zeit -> "26. Oktober 2026" in der Seitensprache, sonst ''. */
  function datumText(wert, sprache) {
    if (typeof wert !== 'string' || !wert) return '';
    // Ein reines Datum ist ein Kalendertag: in UTC lesen und schreiben, sonst rutscht es
    // westlich von Greenwich auf den Vortag.
    var nurTag = /^\d{4}-\d{2}-\d{2}$/.test(wert);
    var zeit = new Date(nurTag ? wert + 'T00:00:00Z' : wert);
    if (isNaN(zeit.getTime())) return '';
    var art = { day: 'numeric', month: 'long', year: 'numeric' };
    if (nurTag) art.timeZone = 'UTC';
    try {
      // Geschuetzte Leerzeichen: "26. Oktober 2026" bricht nie mitten im Datum um.
      return new Intl.DateTimeFormat(sprache, art).format(zeit).replace(/\s/g, ' ');
    } catch (e) {
      return zeit.toISOString().slice(0, 10);
    }
  }

  /** Setzt {name} aus werte ein. Unbekannte Platzhalter bleiben stehen (faellt im Test auf). */
  function fuellen(text, werte) {
    return String(text).replace(/\{(\w+)\}/g, function (ganz, name) {
      return werte && werte[name] !== undefined && werte[name] !== null ? String(werte[name]) : ganz;
    });
  }

  /** Satz unter der Ueberschrift im Zustand "offen". Ohne lesbares Datum die kurze Fassung. */
  function offenText(T, zustand, sprache) {
    var datum = datumText(zustand.angemeldetAm, sprache);
    return fuellen(datum ? T.offen_text : T.offen_text_kurz, { alter: zustand.alter, datum: datum });
  }

  var logik = {
    SPRACHEN: SPRACHEN,
    RUECKFALL: RUECKFALL,
    spracheWaehlen: spracheWaehlen,
    tokenAusFragment: tokenAusFragment,
    zustandAusAntwort: zustandAusAntwort,
    datumText: datumText,
    fuellen: fuellen,
    offenText: offenText,
  };
  if (typeof module === 'object' && module.exports) module.exports = logik;
  else wurzel.ELTERN_LOGIK = logik;
})(this);
