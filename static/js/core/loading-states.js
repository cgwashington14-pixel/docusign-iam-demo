/* Skeleton loaders + retry helpers for live API surfaces */

function dsSkeletonBlock(lines = 3) {
  return `<div class="ds-skeleton-wrap" aria-busy="true" aria-label="Loading">
    ${Array.from({ length: lines }, (_, i) =>
      `<div class="ds-skeleton-line" style="width:${i === lines - 1 ? '60%' : '100%'}"></div>`).join('')}
  </div>`;
}

function dsErrorRetry(message, retryFnName, retryArgs = '') {
  const safeMsg = String(message || 'Something went wrong').replace(/</g, '&lt;');
  return `<div class="ds-load-error" role="alert">
    <p>${safeMsg}</p>
    <button type="button" class="btn btn-secondary btn-sm" onclick="${retryFnName}(${retryArgs})">Try again</button>
  </div>`;
}

window.dsSkeletonBlock = dsSkeletonBlock;
window.dsErrorRetry = dsErrorRetry;
