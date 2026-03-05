/**
 * NEUS Verify Widget — standalone browser bundle
 *
 * Zero dependencies. Works on any page.
 *
 * Embed:
 *   <script src="https://verify.neus.network/widget.js"></script>
 *   <div data-neus-proof="qHash123"></div>
 *
 * Optional data attributes (per element):
 *   data-neus-proof       qHash / proofId (required)
 *   data-neus-api-url     Override API base  (default: https://api.neus.network)
 *   data-neus-ui-base     Override proof viewer URL (default: https://neus.network)
 *   data-neus-size        "sm" | "md"  (default: "sm")
 *   data-neus-show-chains "true" to append chain count
 *
 * Manual API (all methods safe to call before DOMContentLoaded — they self-defer):
 *   NeusWidget.mount(element, { proofId, apiUrl, uiBase, size, showChains })
 *   NeusWidget.mountAll(root?)   // re-scan subtree (default: document)
 *   NeusWidget.unmount(element)
 *
 * @license Apache-2.0
 */
(function (global) {
  'use strict';

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------
  var ATTR_PROOF   = 'data-neus-proof';
  var ATTR_QHASH   = 'data-neus-qhash';
  var ATTR_API_URL = 'data-neus-api-url';
  var ATTR_UI_BASE = 'data-neus-ui-base';
  var ATTR_SIZE    = 'data-neus-size';
  var ATTR_CHAINS  = 'data-neus-show-chains';

  var DEFAULT_API  = 'https://api.neus.network';
  var DEFAULT_UI   = 'https://neus.network';

  // 16×16 NEUS mark — base64 PNG (520 bytes on disk, CSP-safe data URL)
  var LOGO_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABz0lEQVR4nK1Tv2sUYRB9M9/sXjYJYoTkLCWg10gKsbBSJP4BYuBqC9HSXpG9w06wsrGWVButhBCrQ0W7iCIGzwQDh6ClSszt7e43Y3E/cndREsHXzce8x+PN+4AxmBnBjMbf/xl2SBEZHpLEHI5vHpufPPmdiHKYEYisL7iy8iEANny1WvV9DgNAHBsDgJQ3FyMXrH3Z3br37O3XKdCek6fr61FQLpUn5hdmANCIAGqD4QyYK8R0dffHzt0kAfeXNZ09qqqXix2aBWAjAj0+FCZElKual0CuubnmDSJSMyMt0nOT09O3yfjusGsejYQKIgiAlvf+VxCUbj1+3jxPRAbmEyLhFAmOAECtNuRgQGdOwzAihT1Q1bqIzAQs95+82poDrE1EgJIf5owImFcjgmdju3Lh1MNO2l6WIFyg3D+C0VJedLwx9K9nBCMrfMFgzQAg1yxGzhUncsl7/9PnhRK0+JMD66rJRidtv1SljwBQvXj6m2b+JoCmcy7yvlDAtfZlQL2yhCLvVfUOq3wGusVaWqy8yzW/zuxeqNflzAVvAKBe3zvlAI1GQxrb2xNJkrhBLr0iJa9b0erqp9I+0mEQxzEfvHUAuk7+wy8dx2+RCM6+Njvn5QAAAABJRU5ErkJggg==';

  // Track mounted elements to avoid double-mounting
  var mounted = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  var mountedFallback = [];

  function isMounted(el) {
    if (mounted) return mounted.has(el);
    return mountedFallback.indexOf(el) !== -1;
  }

  function markMounted(el) {
    if (mounted) { mounted.add(el); return; }
    mountedFallback.push(el);
  }

  function markUnmounted(el) {
    if (mounted) { mounted.delete(el); return; }
    var i = mountedFallback.indexOf(el);
    if (i !== -1) mountedFallback.splice(i, 1);
  }

  // -------------------------------------------------------------------------
  // Badge DOM builder — aligned with NeusProofBadgePill (bg-accent-blue/10, border-accent-blue/20, text-accent-blue-light)
  // Design tokens: --neus-rgb-accent-primary 152 192 239
  // -------------------------------------------------------------------------
  var ACCENT_BG   = 'rgba(152,192,239,0.1)';
  var ACCENT_BORD = 'rgba(152,192,239,0.2)';
  var ACCENT_TEXT = 'rgb(152,192,239)';
  var STATUS_STYLES = {
    verified: { text: ACCENT_TEXT, label: 'Verified' },
    pending:  { text: 'rgb(234,179,8)', label: 'Verifying…' },
    failed:   { text: 'rgb(239,68,68)', label: 'Unverified' },
    unknown:  { text: 'rgba(255,255,255,0.68)', label: 'Unknown' },
  };

  function buildBadge(opts) {
    var size    = opts.size === 'md' ? 'md' : 'sm';
    var logoSz  = size === 'md' ? 14 : 12;
    var fontSize = size === 'md' ? 11 : 10;
    var padX    = size === 'md' ? '8px' : '6px';
    var padY    = size === 'md' ? '3px' : '2px';

    var a = document.createElement('a');
    a.href   = opts.href || opts.uiBase + '/proof/' + opts.proofId;
    a.target = '_blank';
    a.rel    = 'noreferrer noopener';
    a.title  = 'View proof on NEUS';
    a.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'text-decoration:none',
      'padding:' + padY + ' ' + padX,
      'border-radius:0.5rem',
      'border:1px solid ' + ACCENT_BORD,
      'background:' + ACCENT_BG,
      'color:' + ACCENT_TEXT,
      'font-family:inherit',
      'font-weight:500',
      'font-size:' + fontSize + 'px',
      'line-height:1',
      'white-space:nowrap',
      'cursor:pointer',
      'transition:opacity 0.15s ease',
      'box-sizing:border-box',
    ].join(';');

    var img = document.createElement('img');
    img.src    = LOGO_URL;
    img.alt    = '';
    img.width  = logoSz;
    img.height = logoSz;
    img.style.cssText = 'width:' + logoSz + 'px;height:' + logoSz + 'px;display:block;border-radius:2px;flex-shrink:0;object-fit:contain';

    var span = document.createElement('span');
    span.style.cssText = 'color:' + STATUS_STYLES.pending.text;
    span.textContent   = STATUS_STYLES.pending.label;

    a.appendChild(img);
    a.appendChild(span);

    // Update when status is resolved
    function setStatus(status, chainCount) {
      var st = STATUS_STYLES[status] || STATUS_STYLES.unknown;
      span.style.color = st.text;
      var label = st.label;
      if (opts.showChains && chainCount && chainCount > 0) {
        label += ' \xB7 ' + chainCount + ' chain' + (chainCount === 1 ? '' : 's');
      }
      span.textContent = label;
    }

    return { element: a, setStatus: setStatus };
  }

  // -------------------------------------------------------------------------
  // Proof status fetch
  // -------------------------------------------------------------------------
  function fetchStatus(proofId, apiUrl, callback) {
    var url = apiUrl + '/api/v1/verification/status/' + encodeURIComponent(proofId);
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        try {
          if (xhr.status < 200 || xhr.status >= 300) { callback('failed', 0); return; }
          var json = JSON.parse(xhr.responseText);
          var st   = (json && json.data && json.data.status) ? String(json.data.status).toLowerCase() : '';
          var status = st.indexOf('verified') !== -1 ? 'verified'
                     : (st.indexOf('processing') !== -1 || st.indexOf('pending') !== -1) ? 'pending'
                     : 'failed';
          var cc    = json && json.data && json.data.crosschain;
          var chains = cc ? (cc.totalChains || 0) : 0;
          callback(status, chains);
        } catch (_) {
          callback('failed', 0);
        }
      };
      xhr.onerror = function () { callback('failed', 0); };
      xhr.send();
    } catch (_) {
      callback('failed', 0);
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Mount a badge into el.
   * opts: { proofId, apiUrl, uiBase, size, showChains }
   * Falls back to data-neus-* attributes on the element.
   */
  function mount(el, opts) {
    if (isMounted(el)) return;
    opts = opts || {};

    var proofId    = opts.proofId   || el.getAttribute(ATTR_PROOF)   || el.getAttribute(ATTR_QHASH)  || '';
    var apiUrl     = opts.apiUrl    || el.getAttribute(ATTR_API_URL)  || DEFAULT_API;
    var uiBase     = (opts.uiBase   || el.getAttribute(ATTR_UI_BASE)  || DEFAULT_UI).replace(/\/$/, '');
    var size       = opts.size      || el.getAttribute(ATTR_SIZE)     || 'sm';
    var showChains = typeof opts.showChains === 'boolean'
                   ? opts.showChains
                   : el.getAttribute(ATTR_CHAINS) === 'true';

    if (!proofId) return;
    markMounted(el);

    var badge = buildBadge({ proofId: proofId, uiBase: uiBase, size: size, showChains: showChains });
    el.innerHTML = '';
    el.appendChild(badge.element);

    fetchStatus(proofId, apiUrl, function (status, chainCount) {
      if (isMounted(el)) badge.setStatus(status, chainCount);
    });
  }

  /**
   * Remove the badge and mark element as unmounted.
   */
  function unmount(el) {
    el.innerHTML = '';
    markUnmounted(el);
  }

  /**
   * Scan root (default: document) for all data-neus-proof / data-neus-qhash
   * elements and mount badges.
   */
  function mountAll(root) {
    var container = root || document;
    var selector  = '[' + ATTR_PROOF + '],[' + ATTR_QHASH + ']';
    var els = container.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  // -------------------------------------------------------------------------
  // Auto-init
  // -------------------------------------------------------------------------
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { mountAll(); });
    } else {
      mountAll();
    }
  }

  // -------------------------------------------------------------------------
  // Expose public API
  // -------------------------------------------------------------------------
  var NeusWidget = { mount: mount, unmount: unmount, mountAll: mountAll };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeusWidget;
  } else {
    global.NeusWidget = NeusWidget;
  }

}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
