// Store-Weiche fuer die Bio-Links (/go/tt/, /go/ig/, /go/fb/).
// iPhone und iPad -> App Store, Android -> Play Store mit Herkunft (utm),
// alles andere bleibt auf der Seite mit beiden Knoepfen.
(function (wurzel) {
  var APP_STORE = 'https://apps.apple.com/de/app/id6780292694';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=de.linup.app';
  var QUELLEN = ['tiktok', 'instagram', 'facebook'];

  function ziel(ua, quelle, touchPunkte) {
    var text = String(ua || '');
    var herkunft = QUELLEN.indexOf(quelle) >= 0 ? quelle : 'bio';
    var istIos = /iPhone|iPad|iPod/.test(text) || (/Macintosh/.test(text) && touchPunkte > 1);
    if (istIos) return APP_STORE;
    if (/Android/.test(text)) {
      var referrer = 'utm_source=' + herkunft + '&utm_medium=bio&utm_campaign=bio-link';
      return PLAY_STORE + '&referrer=' + encodeURIComponent(referrer);
    }
    return null;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { ziel: ziel };
    return;
  }
  var quelle = wurzel.document.documentElement.getAttribute('data-quelle');
  var url = ziel(wurzel.navigator.userAgent, quelle, wurzel.navigator.maxTouchPoints || 0);
  if (url) wurzel.location.replace(url);
})(typeof window !== 'undefined' ? window : this);
