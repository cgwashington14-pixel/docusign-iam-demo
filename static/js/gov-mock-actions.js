/* Wire gov workflow CLM mock + business view buttons to walkthrough actions */

function gwMockToast(msg, type = 'success') {
  if (typeof showToast === 'function') showToast(msg, type);
}

function gwMockAdvance() {
  if (typeof gwStepNext === 'function') gwStepNext();
}

function gwMockOpenDocument() {
  if (typeof gwSetVisualView === 'function') gwSetVisualView('document');
}

function gwMockOpenSign() {
  if (typeof gwSetVisualView === 'function') gwSetVisualView('sign');
}

function gwMockOpenWebforms() {
  if (typeof gwSwitchTab === 'function') gwSwitchTab('webforms', null);
  if (typeof wfScrollEmbed === 'function') wfScrollEmbed();
  else document.getElementById('gw-tab-webforms')?.scrollIntoView({ behavior: 'smooth' });
}

function gwHandleClmButton(btn) {
  const label = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

  if (label.includes('open request')) {
    gwMockOpenDocument();
    gwMockToast('Request opened — document view');
    return;
  }
  if (label.includes('apply suggested redline')) {
    gwMockOpenDocument();
    gwMockToast('Suggested redline applied to Article 6');
    return;
  }
  if (label.includes('save review notes')) {
    gwMockToast('Review notes saved');
    return;
  }
  if (label.includes('clear for intent-to-award')) {
    gwMockAdvance();
    return;
  }
  if (label.includes('approve') && label.includes('route')) {
    gwMockAdvance();
    return;
  }
  if (label === 'route') {
    gwMockToast('Routed to next approver');
    gwMockAdvance();
    return;
  }
  if (label.includes('accept change')) {
    gwMockAdvance();
    return;
  }
  if (label.includes('reject') || label.includes('loop back')) {
    gwMockToast('Returned for counter-redlines', 'default');
    if (typeof gwStepPrev === 'function') gwStepPrev();
    return;
  }
  if (label.includes('review summary')) {
    gwMockOpenSign();
    gwMockToast('Executive summary ready for approval');
    return;
  }
  if (label.includes('send with docusign')) {
    window.location.href = '/embedded';
    return;
  }
  if (label.includes('post to cal eprocure')) {
    gwMockToast('Posted to Cal eProcure — RFO live');
    gwMockAdvance();
    return;
  }
  if (label.includes('deploy web form')) {
    gwMockOpenWebforms();
    return;
  }
  if (label.includes('route 3 packages')) {
    gwMockAdvance();
    return;
  }
  if (label.includes('generate ranking memo')) {
    gwMockToast('Ranking memo generated for evaluation file');
    return;
  }
  if (label.includes('publish intent-to-award')) {
    gwMockAdvance();
    return;
  }

  gwMockToast(btn.textContent.trim());
}

function gwHandleBizButton(btn) {
  const label = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

  if (label.includes('submit request')) {
    gwMockAdvance();
    return;
  }
  if (label.includes('approve')) {
    gwMockAdvance();
    return;
  }
  if (label.includes('register')) {
    gwMockOpenWebforms();
    return;
  }
  if (label.includes('open web forms')) {
    gwMockOpenWebforms();
    return;
  }

  gwMockToast(btn.textContent.trim());
}

document.addEventListener('click', (e) => {
  const clmBtn = e.target.closest('#gw-visual-canvas button.clm-btn-primary, #gw-visual-canvas button.clm-btn-sm, #gw-visual-canvas button.clm-btn-compact');
  if (clmBtn) {
    e.preventDefault();
    gwHandleClmButton(clmBtn);
    return;
  }

  const bizBtn = e.target.closest('.biz-mock-wrap button.biz-mock-btn, .biz-webform-cta button.biz-mock-btn');
  if (bizBtn && !bizBtn.getAttribute('onclick')) {
    e.preventDefault();
    gwHandleBizButton(bizBtn);
    return;
  }

  const signTab = e.target.closest('.biz-mock-sign-tab');
  if (signTab && typeof gwSetVisualView === 'function') {
    gwSetVisualView('sign');
    gwMockToast('Signing ceremony opened');
    return;
  }

  const iamNav = e.target.closest('.iam-nav-item');
  if (iamNav) {
    const text = iamNav.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (text.includes('agreement desk')) {
      if (typeof gwSetVisualView === 'function') gwSetVisualView('clm');
      gwMockToast('Agreement Desk queue');
    } else if (text.includes('agreement manager')) {
      if (typeof gwSetVisualView === 'function') gwSetVisualView('navigator');
      gwMockToast('Agreement Manager repository');
    } else if (text.includes('reports') || text.includes('insights')) {
      if (typeof gwSwitchTab === 'function') gwSwitchTab('reporting', null);
      gwMockToast('IAM Insights & Reporting');
    } else if (text.includes('documents')) {
      gwMockOpenDocument();
    } else {
      gwMockToast(iamNav.textContent.trim());
    }
    return;
  }

  const deskNav = e.target.closest('.clm-desk-nav');
  if (deskNav) {
    deskNav.parentElement.querySelectorAll('.clm-desk-nav').forEach(n => n.classList.remove('active'));
    deskNav.classList.add('active');
    gwMockToast(deskNav.textContent.replace(/\d+/g, '').trim());
  }
});
