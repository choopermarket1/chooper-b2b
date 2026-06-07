// ═══════════════════════════════════════════════════════════════
// Meta(Facebook) Pixel — CHOOPER B2B
// 픽셀 ID 한 곳만 바꾸면 전 페이지에 적용됩니다.
// ID 미설정(__FB_PIXEL_ID__) 상태면 아무 동작도 하지 않습니다(안전).
// ═══════════════════════════════════════════════════════════════
(function () {
  var PIXEL_ID = '509164722956993'; // 츄퍼마켓 데이터 세트(픽셀) ID

  // ID가 아직 안 들어왔으면 픽셀 로드 자체를 건너뜀
  if (!PIXEL_ID || PIXEL_ID.indexOf('__') === 0) return;

  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
})();
