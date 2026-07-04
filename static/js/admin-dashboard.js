(function () {
  const filter = document.getElementById('admin-page-filter');
  const table = document.getElementById('admin-page-table');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const checkedAt = document.getElementById('admin-checked-at');

  if (filter && table) {
    filter.addEventListener('change', () => {
      const val = filter.value;
      table.querySelectorAll('tbody tr').forEach((row) => {
        const level = row.dataset.backend;
        row.dataset.hidden = val === 'all' || level === val ? 'false' : 'true';
      });
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing…';
      try {
        const res = await fetch('/api/admin/status');
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        if (checkedAt && data.checked_at) {
          checkedAt.textContent = 'Last checked: ' + data.checked_at;
        }
        window.location.reload();
      } catch (_) {
        refreshBtn.textContent = '↻ Refresh status';
        refreshBtn.disabled = false;
      }
    });
  }
})();
