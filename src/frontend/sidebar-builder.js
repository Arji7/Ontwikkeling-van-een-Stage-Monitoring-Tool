// Bouwt de sidebar-navigatie dynamisch op basis van de rollen van de ingelogde gebruiker.
// Elke pagina stelt window.SIDEBAR_PAGE en window.FRONTEND_ROOT in vóór dit script laadt.
(function () {
  function init() {
    var user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    var rollen = user.rollen || (user.role ? [user.role] : []);

    var isDocent    = rollen.indexOf('docent') !== -1;
    var isCommissie = rollen.indexOf('commissielid') !== -1 || rollen.indexOf('admin') !== -1;
    var isCombined  = isDocent && isCommissie;

    var root        = window.FRONTEND_ROOT || '../../';
    var currentPage = window.SIDEBAR_PAGE  || '';

    var nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    nav.innerHTML = '';

    if (isCombined) {
      addLabel(nav, 'Docent');
      addLink(nav, root + 'Docent/dashboard/dashboard.html',          'Dashboard',       currentPage === 'docent-dashboard');
      addLink(nav, root + 'Docent/mijn-studenten/mijn-studenten.html','Mijn studenten',  ['mijn-studenten','logboek-inkijken','student-detail','rubriek'].indexOf(currentPage) !== -1);
      addLabel(nav, 'Stagecommissie');
      addLink(nav, root + 'Commisie/aanvragen.overzicht/aanvragen.overzicht.html', 'Stageaanvragen', ['commissie-aanvragen','commissie-beoordeling'].indexOf(currentPage) !== -1);
      addLink(nav, '#', 'Lopende stages', false);

    } else if (isDocent) {
      addLink(nav, root + 'Docent/dashboard/dashboard.html',          'Dashboard',      currentPage === 'docent-dashboard');
      addLink(nav, root + 'Docent/mijn-studenten/mijn-studenten.html','Mijn studenten', ['mijn-studenten','logboek-inkijken','student-detail','rubriek'].indexOf(currentPage) !== -1);

    } else if (isCommissie) {
      addLink(nav, root + 'Commisie/aanvragen.overzicht/aanvragen.overzicht.html', 'Aanvragen',    ['commissie-aanvragen','commissie-beoordeling'].indexOf(currentPage) !== -1);
      addLink(nav, '#', 'Lopende stages', false);
    }

    // Rolnaam in sidebar footer aanpassen
    var roleEl = document.querySelector('.user-role');
    if (roleEl) {
      if (isCombined)       roleEl.textContent = 'Docent · Commissie';
      else if (isDocent)    roleEl.textContent = 'Docent';
      else if (isCommissie) roleEl.textContent = 'Stagecommissie';
    }

    // Naam + avatar invullen (beide ID-conventies worden ondersteund)
    var name = user.name || '';
    var initials = name ? name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : '??';
    ['userName', 'sidebarUserName'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && name) el.textContent = name;
    });
    ['userAvatar', 'sidebarUserAvatar'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = initials;
    });
  }

  function addLabel(nav, text) {
    var span = document.createElement('span');
    span.className = 'nav-group-label';
    span.textContent = text;
    nav.appendChild(span);
  }

  function addLink(nav, href, label, isActive) {
    var a = document.createElement('a');
    a.href = href;
    a.className = 'nav-item' + (isActive ? ' active' : '');
    a.textContent = label;
    nav.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
