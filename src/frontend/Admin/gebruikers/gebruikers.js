(function () {
  let allGebruikers = [];

  const tableBody    = document.getElementById('tableBody');
  const table        = document.getElementById('gebruikersTable');
  const spinner      = document.getElementById('loadingSpinner');
  const emptyMsg     = document.getElementById('emptyMsg');
  const footer       = document.getElementById('tableFooter');
  const searchInput  = document.getElementById('searchInput');
  const rolFilter    = document.getElementById('rolFilter');
  const statusFilter = document.getElementById('statusFilter');

  var token = sessionStorage.getItem('token');

  async function laadGebruikers() {
    try {
      var res = await fetch(API_BASE + '/admin/gebruikers', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = res.ok ? await res.json() : [];
      allGebruikers = data.map(function (g) {
        return {
          id: g.id,
          naam: (g.voornaam || '') + ' ' + (g.achternaam || ''),
          email: g.email,
          actief: g.actief === 1 || g.actief === true,
          rollen: g.rollen ? g.rollen.split(', ') : []
        };
      });
    } catch (e) {
      allGebruikers = [];
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await laadGebruikers();
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
      g.rollen.includes('mentor') || g.rollen.includes('commissielid') || g.rollen.includes('bedrijf')
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
    const verwijderKnop = `<button class="btn-action btn-delete" onclick="verwijderGebruiker(${g.id}, '${escAttr(g.naam)}')">Verwijderen</button>`;

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
            <a href="gebruiker-bewerken.html?id=${g.id}" class="btn-action btn-edit">Bewerken</a>
            ${verwijderKnop}
          </div>
        </td>
      </tr>`;
  }

  window.verwijderGebruiker = async function (id, naam) {
    const zeker = confirm(
      'Weet je zeker dat je "' + naam + '" definitief wilt verwijderen?\n\n' +
      'Deze actie verwijdert de gebruiker uit de database.'
    );
    if (!zeker) return;

    try {
      const res = await fetch(API_BASE + '/admin/gebruikers/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Verwijderen mislukt.');

      await laadGebruikers();
      vulStats();
      render();
    } catch (e) {
      alert(e.message || 'Fout bij verwijderen.');
    }
  };

  function rolBadgeClass(rol) {
    const map = {
      student: 'badge-student', docent: 'badge-docent',
      mentor: 'badge-stagementor', commissielid: 'badge-commissie',
      bedrijf: 'badge-bedrijf', admin: 'badge-admin',
    };
    return map[rol] || '';
  }

  function rolLabel(rol) {
    const map = {
      student: 'Student', docent: 'Docent',
      mentor: 'Stagementor', commissielid: 'Commissie', bedrijf: 'Bedrijf', admin: 'Admin',
    };
    return map[rol] || rol;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return escHtml(str).replace(/'/g, '&#39;');
  }
})();
