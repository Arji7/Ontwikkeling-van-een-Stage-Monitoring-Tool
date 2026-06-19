(function () {
  let allBedrijven = [];
  var token = sessionStorage.getItem('token');

  const tableBody    = document.getElementById('tableBody');
  const table        = document.getElementById('bedrijvenTable');
  const emptyMsg     = document.getElementById('emptyMsg');
  const footer       = document.getElementById('tableFooter');
  const searchInput  = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const sectorFilter = document.getElementById('sectorFilter');

  async function laadBedrijven() {
    try {
      var res = await fetch(API_BASE + '/admin/bedrijven', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      allBedrijven = res.ok ? await res.json() : [];
    } catch (e) {
      allBedrijven = [];
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await laadBedrijven();
    vulStats();
    render();
    searchInput.addEventListener('input', render);
    statusFilter.addEventListener('change', render);
    sectorFilter.addEventListener('change', render);
  });

  function vulStats() {
    document.getElementById('statTotaal').textContent     = allBedrijven.length;
    document.getElementById('statErkend').textContent     = allBedrijven.length;
    document.getElementById('statBeoordeling').textContent = 0;
    document.getElementById('statActief').textContent     = allBedrijven.filter(function (b) { return b.aantal_stages > 0; }).length;
  }

  function render() {
    const q      = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const sector = sectorFilter.value;

    const filtered = allBedrijven.filter(function (b) {
      var zoek   = (b.naam || '').toLowerCase().includes(q) || (b.sector || '').toLowerCase().includes(q);
      var seMatch = !sector || b.sector === sector;
      return zoek && seMatch;
    });

    if (filtered.length === 0) {
      if (table.querySelector('tbody')) table.querySelector('tbody').innerHTML = '';
      emptyMsg.style.display = 'block';
      footer.textContent = '';
      return;
    }

    emptyMsg.style.display = 'none';
    tableBody.innerHTML = filtered.map(rijHtml).join('');
    footer.textContent = 'Toont 1–' + filtered.length + ' van ' + allBedrijven.length + ' bedrijven';
  }

  function rijHtml(b) {
    var initialen = (b.naam || '').trim().split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

    return '<tr>' +
      '<td><div class="bedrijf-cell"><div class="row-avatar">' + esc(initialen) + '</div>' +
        '<div><div class="row-naam">' + esc(b.naam) + '</div>' +
        '<div class="row-sub">' + esc(b.website || '') + '</div></div></div></td>' +
      '<td>' + esc(b.sector || '—') + '</td>' +
      '<td><div class="row-naam">—</div><div class="row-sub">—</div></td>' +
      '<td><div class="row-naam">' + esc(b.stad || '') + '</div>' +
        '<div class="row-sub">' + esc(b.adres || '') + '</div></td>' +
      '<td><span class="badge badge-erkend">Erkend</span></td>' +
      '<td><div class="actions">' +
        '<a href="bedrijf-bewerken.html?id=' + b.id + '" class="btn-action btn-edit">Bewerken</a>' +
        '<button class="btn-action btn-delete" onclick="verwijder(' + b.id + ')">Verwijderen</button>' +
      '</div></td></tr>';
  }

  window.verwijder = async function (id) {
    if (!confirm('Bedrijf verwijderen?')) return;
    try {
      await fetch(API_BASE + '/admin/bedrijven/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      await laadBedrijven();
      vulStats();
      render();
    } catch (e) {
      alert('Fout bij verwijderen.');
    }
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
