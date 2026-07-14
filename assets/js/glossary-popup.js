/* Glossary preview popups for the web book.
 *
 * The sym: macro renders glossary terms as <a class="symbol"
 * href="/books/symbolic-language/glossary/#sym-x">. Instead of forcing the
 * reader to jump to the glossary, hovering (desktop) or tapping (touch) shows
 * the entry in a popup; the popup links to the full entry. Reuses the site's
 * .symbol-tooltip styles; the global scroll handler in default.html already
 * dismisses .symbol-tooltip elements.
 */
(function () {
  if (/\/glossary\/?$/.test(location.pathname)) return; // on the glossary itself, anchors just jump

  var links = document.querySelectorAll('a.symbol[href*="/glossary/#sym-"]');
  if (!links.length) return;

  var data = null, pending = null, hideTimer = null;

  function load() {
    pending = pending || fetch('/books/symbolic-language/glossary.json')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { data = j; return j; })
      .catch(function () { return {}; });
    return pending;
  }

  function keyOf(a) {
    var m = (a.getAttribute('href') || '').match(/#(sym-[a-z0-9-]+)/);
    return m && m[1];
  }

  function hide() {
    var t = document.querySelector('.symbol-tooltip[data-glossary]');
    if (t) t.remove();
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 180);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function show(a, entry, key) {
    hide();
    clearTimeout(hideTimer);
    var t = document.createElement('div');
    t.className = 'symbol-tooltip';
    t.setAttribute('data-glossary', key);
    t.style.pointerEvents = 'auto'; // the class disables them; the full-entry link must be clickable
    var refs = entry.refs ? '<div class="symbol-tooltip-sentence">(' + esc(entry.refs) + ')</div>' : '';
    var opposite = entry.opposite
      ? '<div class="symbol-tooltip-sentence"><em>Opposite:</em> <a href="/books/symbolic-language/glossary/#' +
        esc(entry.opposite.id) + '">' + esc(entry.opposite.term) + '</a></div>'
      : '';
    var aliases = entry.aliases && entry.aliases.length
      ? '<div class="symbol-tooltip-sentence"><em>Translation aliases:</em><br>' +
        entry.aliases.map(function (item) {
          return esc(item.label) + ' &rarr; <a href="/books/symbolic-language/glossary/#' +
            esc(item.id) + '">' + esc(item.term) + '</a>';
        }).join('<br>') + '</div>'
      : '';
    t.innerHTML =
      '<div class="symbol-tooltip-header">' + esc(entry.term) + '</div>' +
      '<div class="symbol-tooltip-meaning">' + esc(entry.def) + '</div>' + aliases + opposite + refs +
      '<div class="symbol-tooltip-sentence"><a href="' + a.getAttribute('href') + '">Full glossary entry &rarr;</a></div>';
    document.body.appendChild(t);

    var rect = a.getBoundingClientRect();
    var tr = t.getBoundingClientRect();
    var left = rect.left, top = rect.bottom + 6; // fixed positioning: viewport coords
    if (left + tr.width > window.innerWidth - 10) left = window.innerWidth - tr.width - 10;
    if (left < 10) left = 10;
    if (top + tr.height > window.innerHeight - 10) top = rect.top - tr.height - 6;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
    t.style.opacity = '1';

    t.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    t.addEventListener('mouseleave', scheduleHide);
  }

  var touchOnly = window.matchMedia && window.matchMedia('(hover: none)').matches;

  links.forEach(function (a) {
    var key = keyOf(a);
    if (!key) return;

    if (!touchOnly) {
      a.addEventListener('mouseenter', function () {
        load().then(function (d) { if (d[key]) show(a, d[key], key); });
      });
      a.addEventListener('mouseleave', scheduleHide);
    }

    a.addEventListener('click', function (ev) {
      if (!touchOnly) return; // desktop click follows the link
      var open = document.querySelector('.symbol-tooltip[data-glossary="' + key + '"]');
      if (open) return;       // second tap on the same term follows the link
      ev.preventDefault();    // first tap previews
      load().then(function (d) { if (d[key]) show(a, d[key], key); else location.href = a.href; });
    });
  });

  document.addEventListener('touchstart', function (e) {
    if (!e.target.closest('.symbol-tooltip, a.symbol')) hide();
  }, { passive: true });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();
