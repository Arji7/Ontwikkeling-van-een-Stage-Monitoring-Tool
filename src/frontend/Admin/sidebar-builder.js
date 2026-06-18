(function () {
  function init() {
    var user    = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    var rollen  = user.rollen || (user.role ? [user.role] : []);

    var isAdmin     = rollen.indexOf('admin') !== -1;
    var hasCommissie = rollen.indexOf('commissielid') !== -1;

    var root        = window.FRONTEND_ROOT || '../';
    var currentPage = window.SIDEBAR_PAGE  || '';

    var nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    nav.innerHTML = '';

    if (isAdmin) {
      // ── Volledig Admin menu ──────────────────────────────────
      addLabel(nav, 'Algemeen');
      addLink(nav, root + 'Admin/Dashboard/dashboard.html', 'Dashboard', currentPage === 'dashboard');

      addLabel(nav, 'Stagecommissie');
      addLink(nav, root + 'Commisie/aanvragen.overzicht/aanvragen.overzicht.html', 'Aanvragen',      currentPage === 'aanvragen' || currentPage === 'commissie-aanvragen');
      addLink(nav, root + 'Commisie/lopende-stages/lopende-stages.html',           'Lopende stages', currentPage === 'lopende-stages' || currentPage === 'commissie-lopende-stages');
      addLink(nav, '#', 'Evaluaties',   currentPage === 'evaluaties');
      addLink(nav, '#', 'Competenties', currentPage === 'competenties');

      addLabel(nav, 'Beheer');
      addLink(nav, root + 'Admin/gebruikers/gebruikers.html', 'Gebruikers', currentPage === 'gebruikers');
      addLink(nav, root + 'Admin/bedrijven/bedrijven.html', 'Bedrijven', currentPage === 'bedrijven');

      addLabel(nav, 'Systeem');
      addLink(nav, '#', 'Rapporten', currentPage === 'rapporten');
    } else {
      // ── Commissielid menu (zonder admin) ────────────────────
      addLink(nav, root + 'Commisie/aanvragen.overzicht/aanvragen.overzicht.html', 'Aanvragen',      currentPage === 'aanvragen' || currentPage === 'commissie-aanvragen');
      addLink(nav, root + 'Commisie/lopende-stages/lopende-stages.html',           'Lopende stages', currentPage === 'lopende-stages' || currentPage === 'commissie-lopende-stages');
      addLink(nav, '#', 'Evaluaties', currentPage === 'evaluaties');
    }

    // ── Footer info ───────────────────────────────────────────
    var naam = user.name || '';
    var initialen = naam
      ? naam.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase()
      : '??';

    var rolLabel = rollen
      .map(function (r) {
        if (r === 'admin')        return 'Administratie';
        if (r === 'commissielid') return 'Stagecommissie';
        return r;
      })
      .join(' + ') || 'Administratie';

    setEl('sidebarUserName',  naam);
    setEl('sidebarUserAvatar', initialen);
    setEl('sidebarRoles',      rolLabel);
    setEl('sidebarUserRole',   rolLabel);
    setEl('adminVoornaam',     naam.split(' ')[0] || 'Admin');
  }

  function addLabel(nav, text) {
    var span = document.createElement('span');
    span.className   = 'nav-group-label';
    span.textContent = text;
    nav.appendChild(span);
  }

  function addLink(nav, href, label, isActive) {
    var a = document.createElement('a');
    a.href      = href;
    a.className = 'nav-item' + (isActive ? ' active' : '');
    a.textContent = label;
    nav.appendChild(a);
  }

  function setEl(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
