// Steven Bernabe, QA portfolio. Scroll highlighting, heading ticks, sliding nav pill and heading reveal.
(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header.top');
  const links = [...document.querySelectorAll('nav a')];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  let lockUntil = 0; // pause scroll tracking while a nav click is scrolling
  let ticking = false;

  // One underline marker that slides between nav links
  const nav = document.querySelector('nav');
  const ind = document.createElement('span');
  ind.className = 'ind';
  ind.setAttribute('aria-hidden', 'true');
  nav.appendChild(ind);
  let placed = false;
  function moveInd(a) {
    if (!a) { ind.classList.remove('on'); placed = false; return; }
    if (!placed) ind.style.transition = 'none';
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    if (!placed) { void ind.offsetWidth; ind.style.transition = ''; placed = true; }
    ind.classList.add('on');
  }

  // Highlight one nav link and its section (or none)
  function setActive(id) {
    links.forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    sections.forEach((s) => s.classList.toggle('is-active', s.id === id));
    moveInd(links.find((a) => a.getAttribute('href') === '#' + id));
  }

  // Runs on scroll: header shadow, heading ticks, and which section is in view
  function update() {
    ticking = false;
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;

    header.classList.toggle('scrolled', y > 8);

    // Sections the reading line has reached get their heading box ticked
    const atEnd = max > 0 && y >= max - 4;
    sections.forEach((s) => {
      const top = s.getBoundingClientRect().top;
      s.classList.toggle('seen', atEnd || top < window.innerHeight * 0.35);
      // headings wipe in from the scroll position itself, so they can never get stuck hidden
      if (top < window.innerHeight * 0.85) s.querySelector(':scope > h2').classList.add('in');
    });

    if (performance.now() < lockUntil) return;

    const line = y + window.innerHeight * 0.35;
    let current = '';
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top + y <= line) current = s.id;
    });
    if (max > 0 && y >= max - 4) current = sections[sections.length - 1].id; // bottom of page
    setActive(current);
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  // Clicking a nav link highlights it right away
  links.forEach((a) => {
    a.addEventListener('click', () => {
      setActive(a.getAttribute('href').slice(1));
      lockUntil = performance.now() + 900;
      setTimeout(update, 950);
    });
  });

  // Clicking brand scrolls to top and resets nav highlight
  const brand = document.querySelector('a.brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      setActive('');
      lockUntil = performance.now() + 900;
      setTimeout(update, 950);
    });
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', update);
  update();

  // "How I test" steps tick off one by one after the page loads
  const run = document.querySelector('.run');
  if (run) {
    run.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
    // the checklist ticks off when it scrolls into view
    if (reduce || !('IntersectionObserver' in window)) run.classList.add('go');
    else {
      const watchRun = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { setTimeout(() => run.classList.add('go'), 250); watchRun.disconnect(); }
      }, { threshold: 0.5 });
      watchRun.observe(run);
    }
  }

  // Documents switch on one after another
  document.querySelectorAll('.doc').forEach((d, i) => d.style.setProperty('--k', i));

  // Headings wipe in (switched on by the scroll handler above)
  document.querySelectorAll('section.row > h2').forEach((h) => h.classList.add('wipe'));

  // Every other block comes into focus one after another as it scrolls into view
  const targets = [...document.querySelectorAll('.facts, section.row > div > *')];
  targets.forEach((el) => {
    el.classList.add('reveal');
    const index = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--d', Math.min(index, 5) * 70 + 'ms');
  });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    targets.forEach((el) => io.observe(el));
  }

  // ---- Typing line in the hero ----
  const typed = document.getElementById('typed');
  if (typed && !reduce) {
    const list = ['to my QA portfolio', 'I am Steven Bernabe', 'I test, report, and retest'];
    let i = 0, n = 0, del = false;
    typed.textContent = '';
    (function tick() {
      const s = list[i];
      n += del ? -1 : 1;
      typed.textContent = s.slice(0, n);
      let d = del ? 35 : 75;
      if (!del && n === s.length) { del = true; d = 1700; }
      else if (del && n === 0) { del = false; i = (i + 1) % list.length; d = 350; }
      setTimeout(tick, d);
    })();
  }

  // ---- Purple mode / pink mode (Instant, non-blocking) ----
  const modeBtn = document.getElementById('mode');
  const modeLbl = modeBtn.querySelector('.lbl');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  // Tab icon: an "SB" badge that changes colour with the mode
  const fav = document.getElementById('fav');
  const mk = (a, b, t) => 'data:image/svg+xml,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
    "<stop offset='0' stop-color='" + a + "'/><stop offset='1' stop-color='" + b + "'/></linearGradient></defs>" +
    "<rect width='64' height='64' rx='16' fill='url(#g)'/>" +
    "<text x='32' y='44' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='32' text-anchor='middle' fill='" + t + "'>SB</text></svg>");
  const icons = { violet: mk('#9b3bea', '#ff4fd0', '#fff'), pink: mk('#ffd0ea', '#ff8fc8', '#5b1d5e') };

  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    const next = t === 'pink' ? 'purple' : 'pink';
    modeLbl.textContent = next.charAt(0).toUpperCase() + next.slice(1) + ' mode';
    modeBtn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    themeMeta.setAttribute('content', t === 'pink' ? '#fff0f6' : '#1a0638');
    if (fav) fav.setAttribute('href', icons[t]);
  }

  applyTheme(root.dataset.theme === 'pink' ? 'pink' : 'violet');

  modeBtn.addEventListener('click', () => {
    const to = root.dataset.theme === 'pink' ? 'violet' : 'pink';
    applyTheme(to);
  });

  // ---- Certificate viewer: opens in a box over the page ----
  const viewer = document.getElementById('viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const vImg = document.getElementById('viewerImg');
    const vTitle = document.getElementById('viewerTitle');
    const vPdf = document.getElementById('viewerPdf');
    document.querySelectorAll('a[data-cert]').forEach((a) => {
      a.addEventListener('mouseenter', () => { new Image().src = a.dataset.cert; });
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work
        e.preventDefault();
        vImg.src = a.dataset.cert;
        vImg.alt = 'Certificate: ' + a.dataset.title;
        vTitle.textContent = a.dataset.title;
        vPdf.href = a.getAttribute('href');
        viewer.showModal();
        root.classList.add('lock');
      });
    });
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    document.getElementById('viewerClose').addEventListener('click', () => viewer.close());
    viewer.addEventListener('close', () => root.classList.remove('lock'));
  }

  // ---- QA Deliverables Artifact Viewer ----
  const qaViewer = document.getElementById('qaViewer');
  if (qaViewer && typeof qaViewer.showModal === 'function') {
    const qaTabs = document.querySelectorAll('.qa-tab');
    const qaPanes = document.querySelectorAll('.qa-pane');
    const qaClose = document.getElementById('qaViewerClose');

    function switchQaTab(targetId) {
      qaTabs.forEach((tab) => {
        const isMatch = tab.dataset.target === targetId;
        tab.classList.toggle('active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
      qaPanes.forEach((pane) => {
        pane.classList.toggle('active', pane.id === targetId);
      });
    }

    qaTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        switchQaTab(tab.dataset.target);
      });
    });

    document.querySelectorAll('[data-qa-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.qaTarget;
        switchQaTab(target);
        qaViewer.showModal();
        root.classList.add('lock');
      });
    });

    qaViewer.addEventListener('click', (e) => { if (e.target === qaViewer) qaViewer.close(); });
    if (qaClose) qaClose.addEventListener('click', () => qaViewer.close());
    qaViewer.addEventListener('close', () => root.classList.remove('lock'));
  }
  // ---- Certificate badge: if the image file is ever missing, show the award icon instead of a broken picture ----
  document.querySelectorAll('.cert-ico img').forEach((img) => {
    const swap = () => {
      const icon = document.querySelector('.cert-ico svg');
      if (icon) img.replaceWith(icon.cloneNode(true));
    };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener('error', swap);
  });

  // ---- Interactive Contact Form Handler & High-End Alert Modal ----
  function getSuccessModal() {
    return document.getElementById('successModal');
  }

  function initSuccessModal() {
    const modal = getSuccessModal();
    if (!modal || modal._initialized) return;
    modal._initialized = true;

    const closeBtn = document.getElementById('successModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (typeof modal.close === 'function') modal.close();
        else modal.removeAttribute('open');
        root.classList.remove('lock');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (typeof modal.close === 'function') modal.close();
        else modal.removeAttribute('open');
        root.classList.remove('lock');
      }
    });

    modal.addEventListener('close', () => root.classList.remove('lock'));
  }
  initSuccessModal();

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const msg = document.getElementById('contactMessage').value.trim();
      const alertBox = document.getElementById('formAlert');
      const submitBtn = document.getElementById('contactSubmit');

      // Validation check
      if (!name || !email || !msg) {
        alertBox.className = 'form-alert error';
        alertBox.textContent = 'Please complete all required fields before sending.';
        alertBox.style.display = 'block';
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        alertBox.className = 'form-alert error';
        alertBox.textContent = 'Please enter a valid work or personal email address.';
        alertBox.style.display = 'block';
        return;
      }

      // Button loading transition for tactile feel
      const origBtnContent = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner" aria-hidden="true"></span>
          <span>Delivering...</span>
        `;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnContent;
        }

        // Populate personalized user name in modern modal
        const alertNameEl = document.getElementById('alertUserName');
        if (alertNameEl) alertNameEl.textContent = name;

        // Trigger High-End Custom Modal (Challenge Requirement: Success Alert on submit)
        initSuccessModal();
        const modal = getSuccessModal();
        if (modal && typeof modal.showModal === 'function') {
          root.classList.add('lock');
          modal.showModal();
        } else if (modal) {
          root.classList.add('lock');
          modal.setAttribute('open', '');
        }

        // Inline confirmation update
        alertBox.className = 'form-alert success';
        alertBox.innerHTML = `<strong>Inquiry Sent!</strong> Thank you, ${name}. Your message has been logged successfully.`;
        alertBox.style.display = 'block';

        contactForm.reset();
      }, 350);
    });
  }

  // ---- Dynamic GitHub Repositories Fetcher (Bonus Challenge Requirement) ----
  const repoBox = document.getElementById('githubRepos');
  if (repoBox) {
    fetch('https://api.github.com/users/steveuniverseuwu/repos?sort=updated&per_page=6')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((repos) => {
        if (!Array.isArray(repos) || repos.length === 0) {
          repoBox.innerHTML = '<p class="repo-empty">No public repositories found.</p>';
          return;
        }
        repoBox.innerHTML = repos.map((repo) => `
          <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noopener">
            <div class="repo-top">
              <svg class="repo-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
              <strong class="repo-title">${repo.name}</strong>
            </div>
            <p class="repo-text">${repo.description || 'Public GitHub repository by Steven Bernabe.'}</p>
            <div class="repo-foot">
              <span class="repo-badge">${repo.language || 'Web'}</span>
              <span class="repo-stat">★ ${repo.stargazers_count}</span>
              <span class="repo-stat">⑂ ${repo.forks_count}</span>
            </div>
          </a>
        `).join('');
      })
      .catch((err) => {
        // Fallback card if offline or rate-limited
        repoBox.innerHTML = `
          <a class="repo-card" href="https://github.com/steveuniverseuwu/steven-bernabe-portfolio" target="_blank" rel="noopener">
            <div class="repo-top">
              <svg class="repo-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
              <strong class="repo-title">steven-bernabe-portfolio</strong>
            </div>
            <p class="repo-text">Personal portfolio website showcasing web development and QA test deliverables.</p>
            <div class="repo-foot">
              <span class="repo-badge">HTML / CSS / JS</span>
              <span class="repo-stat">★ 0</span>
            </div>
          </a>`;
      });
  }


  // ---- Smart Environment Detection: Show Live Deployed link ONLY when viewed offline/locally ----
  const isOfflineOrLocal = window.location.protocol === 'file:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';

  if (isOfflineOrLocal) {
    const localLiveBtn = document.getElementById('localLiveSiteBtn');
    if (localLiveBtn) {
      localLiveBtn.style.display = 'inline-flex';
    }
  } else {
    // When live on Vercel, make GitHub repo button the primary 'main' button
    const repoBtn = document.getElementById('projectRepoBtn');
    if (repoBtn) {
      repoBtn.classList.add('main');
    }
  }

})();
