(function () {
  // Mockdata — te vervangen zodra backend endpoint beschikbaar is
  const mockGebruikers = [
    { id: 1,  naam: 'Sara Janssens',     email: 'sara.janssens@ehb.be',      actief: true,  rollen: ['student'] },
    { id: 2,  naam: 'Thomas Vermeulen',  email: 'thomas.vermeulen@ehb.be',   actief: true,  rollen: ['student'] },
    { id: 3,  naam: 'Prof. Tom Aertsens',email: 'tom.aertsens@ehb.be',       actief: true,  rollen: ['docent'] },
    { id: 4,  naam: 'Prof. Jonas Martens',email:'jonas.martens@ehb.be',      actief: true,  rollen: ['docent'] },
    { id: 5,  naam: 'Karel Devos',       email: 'k.devos@techcorp.be',       actief: true,  rollen: ['stagementor'] },
    { id: 6,  naam: 'Laura Vos',         email: 'l.vos@dataworks.be',        actief: true,  rollen: ['stagementor'] },
    { id: 7,  naam: 'Marie Pieters',     email: 'm.pieters@ehb.be',          actief: true,  rollen: ['commissielid'] },
    { id: 8,  naam: 'Roos Baert',        email: 'roos.baert@ehb.be',         actief: false, rollen: ['student'] },
    { id: 9,  naam: 'Els Verheyen',      email: 'els.verheyen@ehb.be',       actief: true,  rollen: ['admin', 'commissielid'] },
  ];

  let allGebruikers = mockGebruikers;

  const tableBody    = document.getElementById('tableBody');
  const table        = document.getElementById('gebruikersTable');
  const spinner      = document.getElementById('loadingSpinner');
  const emptyMsg     = document.getElementById('emptyMsg');
  const footer       = document.getElementById('tableFooter');
  const searchInput  = document.getElementById('searchInput');
  const rolFilter    = document.getElementById('rolFilter');
  const statusFilter = document.getElementById('statusFilter');

  document.addEventListener('DOMContentLoaded', () => {
    spinner.style.display = 'none';
    vulStats();
    render();

    searchInput.addEventListener('input', render);
    rolFilter.addEventListener('change', render);
    statusFilter.addEventListener('change', render);
  });

  function vulStats() {
    document.getElementById('statTotaal').textContent    = allGebruikers.length;
    document.getElementById('statStudenten').textContent = allGebruikers.filter(g => g.rollen.includes('student')).length;
    document.getElementById('statDocenten').textContent  = allGebruikers.filter(g => g.rollen.includes('docent')).length;
    const overig = allGebruikers.filter(g =>
      g.rollen.includes('stagementor') || g.rollen.includes('commissielid')
    ).length;
    document.getElementById('statOverig').textContent = overig;
  }

  function render() {
    const q      = searchInput.value.toLowerCase();
    const rol    = rolFilter.value;
    const status = statusFilter.value;

    const filtered = allGebruikers.filter(g => {
      const zoekMatch   = g.naam.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
      const rolMatch    = !rol    || g.rollen.includes(rol);
      const statusMatch = !status ||
        (status === 'actief'   &&  g.actief) ||
        (status === 'inactief' && !g.actief);
      return zoekMatch && rolMatch && statusMatch;
    });

    if (filtered.length === 0) {
      table.style.display  = 'none';
      emptyMsg.style.display = 'block';
      footer.textContent   = '';
      return;
    }

    emptyMsg.style.display = 'none';
    table.style.display    = 'table';
    tableBody.innerHTML    = filtered.map(rijHtml).join('');
    footer.textContent     = `Toont 1–${filtered.length} van ${allGebruikers.length} gebruikers`;
  }

  function rijHtml(g) {
    const initialen   = g.naam.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const rolBadges   = g.rollen.map(r => `<span class="badge ${rolBadgeClass(r)}">${rolLabel(r)}</span>`).join(' ');
    const statusBadge = g.actief
      ? '<span class="badge badge-actief">Actief</span>'
      : '<span class="badge badge-inactief">Inactief</span>';
    const actiefKnop = g.actief
      ? `<button class="btn-action btn-deactivate" onclick="toggleStatus(${g.id}, false)">Deactiveren</button>`
      : `<button class="btn-action btn-activate"   onclick="toggleStatus(${g.id}, true)">Activeren</button>`;

    return `
      <tr>
        <td></td>
        <td>
          <div class="user-cell">
            <div class="row-avatar">${initialen}</div>
            <div>
              <div class="row-naam">${escHtml(g.naam)}</div>
              <div class="row-email">${escHtml(g.email)}</div>
            </div>
          </div>
        </td>
        <td>${escHtml(g.email)}</td>
        <td>${rolBadges || '—'}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions">
            <button class="btn-action btn-edit">Bewerken</button>
            ${actiefKnop}
          </div>
        </td>
      </tr>`;
  }

  window.toggleStatus = function (id, actief) {
    const g = allGebruikers.find(u => u.id === id);
    if (g) { g.actief = actief; vulStats(); render(); }
  };

  function rolBadgeClass(rol) {
    const map = {
      student: 'badge-student', docent: 'badge-docent',
      stagementor: 'badge-stagementor', commissielid: 'badge-commissie',
      admin: 'badge-admin',
    };
    return map[rol] || '';
  }

  function rolLabel(rol) {
    const map = {
      student: 'Student', docent: 'Docent',
      stagementor: 'Stagementor', commissielid: 'Commissie', admin: 'Admin',
    };
    return map[rol] || rol;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
