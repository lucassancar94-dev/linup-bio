// Besucherzähler für linupapp.de, ohne Cookies und ohne Speicher auf dem Gerät.
// Schickt nur: Seite, Herkunftsseite (nur der Name) und ob ein Store-Knopf
// angeklickt wurde. Keine Kennung. Gezählt wird in Supabase (web_zaehlen).
(function () {
  var API = 'https://vbxahjnbcjmexqnxacxs.supabase.co/rest/v1/rpc/web_zaehlen';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieGFoam5iY2ptZXhxbnhhY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTg4MDgsImV4cCI6MjA5NjA5NDgwOH0.NC5_FKULzVm2s6Zx16J-0vU3fgp4AayTlwD0T2Kc8gY';

  function quelle() {
    try {
      var q = new URLSearchParams(location.search);
      var k = q.get('utm_source') || q.get('src') || q.get('ref') || q.get('ct');
      if (k) return 'kampagne:' + String(k).toLowerCase().replace(/[^a-z0-9._\-]/g, '').slice(0, 40);
      return document.referrer ? new URL(document.referrer).hostname : '';
    } catch (e) {
      return '';
    }
  }

  var herkunft = quelle();

  function zaehlen(art) {
    try {
      fetch(API, {
        method: 'POST',
        keepalive: true,
        headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_pfad: location.pathname, p_quelle: herkunft, p_art: art })
      }).catch(function () {});
    } catch (e) {}
  }

  zaehlen('seite');

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var host = '';
    try { host = new URL(a.href).hostname; } catch (e) { return; }
    if (host === 'apps.apple.com') zaehlen('ios');
    else if (host === 'play.google.com') zaehlen('android');
  }, true);
})();
