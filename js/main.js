/* Ruta Cafeína Mérida — comportamiento del sitio
   1. Arma el menú con cada <section data-menu="Nombre">.
      Para agregar una sección nueva basta con darle id y data-menu.
   2. Abre y cierra el menú en teléfono.
   3. Botón para copiar el teléfono.
   4. Año actual en el pie.
   5. Pantallas independientes por sección.
   6. Contador de visitas. */
(function () {
  var lista = document.getElementById('menu-lista');
  var secciones = document.querySelectorAll('section[data-menu]');
  if (lista) {
    lista.innerHTML = '';
    secciones.forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.textContent = s.getAttribute('data-menu');
      li.appendChild(a);
      lista.appendChild(li);
    });
  }


  /* Pantallas: cada opción del menú abre una pantalla nueva y oculta las demás.
     Usa el hash de la dirección (#cafe, #origen…), así funcionan los botones de
     "atrás" y "adelante" y se pueden compartir enlaces a una sola pantalla.
     Para agregar una pantalla basta con una <section> dentro de <main>. */
  var pantallas = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var actual = null;
  function resolverPantalla() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (h) {
      for (var i = 0; i < pantallas.length; i++) if (pantallas[i].id === h) return pantallas[i];
      var base = h.split(/[\/?]/)[0];
      for (var j = 0; j < pantallas.length; j++) if (pantallas[j].id === base) return pantallas[j];
    }
    return pantallas[0] || null;
  }
  function mostrarPantalla(primera) {
    var s = resolverPantalla();
    if (!s || s === actual) return;
    pantallas.forEach(function (p) { p.hidden = p !== s; });
    actual = s;
    if (lista) Array.prototype.forEach.call(lista.querySelectorAll('a'), function (a) {
      if (a.getAttribute('href') === '#' + s.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!primera) {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      s.setAttribute('tabindex', '-1');
      try { s.focus({ preventScroll: true }); } catch (e) { /* sin foco */ }
    }
  }
  window.addEventListener('hashchange', function () { mostrarPantalla(false); });
  mostrarPantalla(true);

  var boton = document.getElementById('boton-menu');
  var menu = document.getElementById('menu');
  if (boton && menu) {
    boton.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.textContent = abierto ? 'CERRAR' : 'MENÚ';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && menu.classList.contains('abierto')) {
        menu.classList.remove('abierto');
        boton.setAttribute('aria-expanded', 'false');
        boton.textContent = 'MENÚ';
      }
    });
  }

  var copiar = document.getElementById('copiar-telefono');
  if (copiar) {
    copiar.addEventListener('click', function () {
      var tel = '999 259 8155';
      var listo = function () { copiar.textContent = 'Número copiado'; setTimeout(function () { copiar.textContent = 'Copiar número'; }, 2200); };
      try {
        navigator.clipboard.writeText(tel).then(listo, function () { seleccionar(); });
      } catch (e) { seleccionar(); }
      function seleccionar() {
        var t = document.querySelector('.telefono');
        var r = document.createRange(); r.selectNodeContents(t);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
    });
  }


  /* Contador de visitas. Usa el servicio gratuito Abacus (abacus.jasoncameron.dev), sin cuentas ni cookies.
     Cuenta una visita por pestaña abierta. Si el servicio no responde, el contador se oculta y el sitio sigue igual. */
  (function () {
    var caja = document.getElementById('contador-visitas'), num = document.getElementById('contador-num');
    if (!caja || !num) return;
    var BASE = 'https://abacus.jasoncameron.dev/', ESPACIO = 'jpechsulub-design.github.io', LLAVE = 'ruta-cafeina-merida-visitas';
    var contada = false;
    try { contada = sessionStorage.getItem('rc_visita_contada_v2') === '1'; } catch (e) { contada = false; }
    var url = BASE + (contada ? 'get/' : 'hit/') + ESPACIO + '/' + LLAVE;
    var terminado = false;
    function mostrar(j) {
      if (terminado) return;
      var n = Number(j && j.value);
      if (!isFinite(n)) return fallo();
      terminado = true;
      num.textContent = n.toLocaleString('es-MX');
      caja.hidden = false;
      try { sessionStorage.setItem('rc_visita_contada_v2', '1'); } catch (e) { /* sin almacenamiento */ }
    }
    function fallo() { if (!terminado) caja.hidden = true; }
    /* Plan B si el navegador bloquea la petición normal: el mismo servicio responde por JSONP. */
    function jsonp() {
      var nombre = 'rcVisitas' + Date.now(), sc = document.createElement('script');
      window[nombre] = function (j) { mostrar(j); limpiar(); };
      function limpiar() { try { delete window[nombre]; } catch (e) { window[nombre] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); }
      sc.onerror = function () { limpiar(); fallo(); };
      sc.src = url + '?callback=' + nombre;
      document.head.appendChild(sc);
      setTimeout(function () { if (!terminado) { limpiar(); fallo(); } }, 7000);
    }
    if (!window.fetch) { jsonp(); return; }
    var ctl = window.AbortController ? new AbortController() : null;
    var corte = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (r.status === 404 && contada) { /* el contador aún no existe: se crea con una visita */ return fetch(BASE + 'hit/' + ESPACIO + '/' + LLAVE, { cache: 'no-store' }).then(function (r2) { return r2.json(); }); }
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then(function (j) { clearTimeout(corte); mostrar(j); })
      .catch(function () { clearTimeout(corte); jsonp(); });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();
})();
