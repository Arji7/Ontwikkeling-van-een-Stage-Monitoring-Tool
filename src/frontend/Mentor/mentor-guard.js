(function () {
  var token = sessionStorage.getItem('token');
  var user  = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var rollen = user.rollen || (user.role ? [user.role] : []);

  if (!token) { window.location.replace('../../inloggen/inloggen.html'); return; }

  if (rollen.indexOf('mentor') === -1) {
    var dashboards = {
      student:      '../../Student/empty-stage/empty-stage.html',
      docent:       '../../Docent/dashboard/dashboard.html',
      commissielid: '../../Commisie/aanvragen.overzicht/aanvragen.overzicht.html',
      admin:        '../../Commisie/aanvragen.overzicht/aanvragen.overzicht.html',
    };
    window.location.replace(dashboards[user.role] || '../../inloggen/inloggen.html');
  }
})();
