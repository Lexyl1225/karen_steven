/**
 * Karen & Steven Wedding - Luxury In-Page RSVP & Live Guestbook Integration
 * Replaces broken Canva widget with a professional, fully self-hosted RSVP form
 * and real-time wedding guestbook connected to the /users API.
 * Preserves all original styles and supports multi-server deployment.
 */
(function () {
  'use strict';

  let inpageMounted = false;
  let allGuests = [];

  // Initialize in-page RSVP mounting
  initInPageRsvpWatcher();

  // Expose global helper for header/footer RSVP buttons to smoothly glide to the section
  window.openRsvpModal = window.scrollToRsvp = function () {
    const rsvpContainer = document.getElementById('inpage-rsvp-card') || document.getElementById('LB3Rg8HkTt7SKxm2');
    const scrollContainer = document.querySelector('.ZRRuDw') || window;
    
    const isMobile = window.innerWidth <= 860;
    const scrollTarget = isMobile ? 4600 : 16620;

    if (scrollContainer.scrollTo) {
      scrollContainer.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
    }

    setTimeout(() => {
      const nameInput = document.getElementById('inpage-rsvp-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 450);
  };

  // Intercept any click on Canva's old RSVP links (e.g. forms.gle or button triggers)
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href*="forms.gle"], .legacy-rsvp-link, .header-rsvp-pill, .footer-rsvp-action-btn');
    if (link && !link.classList.contains('inpage-submit-btn')) {
      e.preventDefault();
      window.scrollToRsvp();
    }
  }, true);

  /* ==========================================================================
     IN-PAGE RSVP MOUNTING
     ========================================================================== */
  function initInPageRsvpWatcher() {
    // 1. Try mounting immediately
    tryMountInPageRsvp();
    rerouteFormsGleLinks();

    // 2. MutationObserver for lazy-loaded Canva sections
    const observer = new MutationObserver(() => {
      rerouteFormsGleLinks();
      if (!inpageMounted) {
        tryMountInPageRsvp();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Fallback check on scroll
    const scrollContainer = document.querySelector('.ZRRuDw') || window;
    scrollContainer.addEventListener('scroll', () => {
      rerouteFormsGleLinks();
      if (!inpageMounted) {
        tryMountInPageRsvp();
      }
    }, { passive: true });
  }

  function rerouteFormsGleLinks() {
    document.querySelectorAll('a[href*="forms.gle"]').forEach(a => {
      a.href = 'javascript:void(0)';
      a.classList.add('legacy-rsvp-link');
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
  }

  function tryMountInPageRsvp() {
    const targetBox = document.getElementById('LB3Rg8HkTt7SKxm2') || document.querySelector('.DF_utQ:has(iframe[src*="_website-element-widget"])');
    if (!targetBox || targetBox.querySelector('.inpage-rsvp-card')) {
      return;
    }

    // Hide the unsightly Canva double black border and stray 'f'
    const borderEl = document.getElementById('LBjKpgbh6J27HkWv');
    if (borderEl) {
      borderEl.style.display = 'none';
      borderEl.style.opacity = '0';
      borderEl.style.pointerEvents = 'none';
    }
    const strayF = document.getElementById('LBHCHY651cF4gNMN');
    if (strayF) {
      strayF.style.display = 'none';
      strayF.style.opacity = '0';
    }

    // Hide any iframe inside targetBox
    const iframes = targetBox.querySelectorAll('iframe');
    iframes.forEach(f => f.style.display = 'none');

    targetBox.style.opacity = '1';
    targetBox.style.visibility = 'visible';
    targetBox.style.pointerEvents = 'auto';

    // Build and inject in-page RSVP & Guestbook Card
    targetBox.innerHTML = `
      <div class="inpage-rsvp-card" id="inpage-rsvp-card">
        <!-- Header -->
        <div class="inpage-rsvp-header">
          <div class="inpage-rsvp-header-left">
            <div class="inpage-rsvp-header-monogram">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="13" r="5" stroke="#e0c78b" stroke-width="1.8"/>
                <circle cx="15" cy="13" r="5" stroke="#c5a059" stroke-width="1.8"/>
                <path d="M12 7l1.5-2h-3L12 7z" fill="#ffd700"/>
              </svg>
            </div>
            <div>
              <h2 class="inpage-rsvp-title">RSVP &amp; Wedding Guestbook</h2>
              <p class="inpage-rsvp-sub">Karen &amp; Steven &bull; September 18, 2026 &bull; Santiago City</p>
            </div>
          </div>
          <div class="inpage-rsvp-header-right">
            <div class="inpage-guest-count-pill">
              <span>🌸</span>
              <span id="inpage-confirmed-count">0</span> Responses
            </div>
          </div>
        </div>

        <!-- Body Grid -->
        <div class="inpage-rsvp-body-grid">
          <!-- Left Column: Form -->
          <div class="inpage-rsvp-form-col">
            <h3 class="inpage-form-heading">Will You Celebrate With Us?</h3>
            <p class="inpage-form-desc">Kindly complete your RSVP on or before September 06, 2026.</p>

            <div id="inpage-status-banner" class="inpage-status-banner"></div>

            <form id="inpage-rsvp-form" autocomplete="on">
              <div class="inpage-field-group">
                <label class="inpage-label" for="inpage-rsvp-name">Your Full Name <span class="required-star">*</span></label>
                <input class="inpage-input" id="inpage-rsvp-name" name="name" type="text" placeholder="e.g. Maria Clara Santos" required autocomplete="name" />
              </div>

              <div class="inpage-field-group">
                <label class="inpage-label">Attendance Confirmation</label>
                <div class="inpage-radio-cards">
                  <label class="inpage-radio-card selected attending" id="inpage-radio-yes">
                    <input type="radio" name="inpage_attendance" value="Joyfully Attending" checked />
                    <span>✓ Joyfully Attending</span>
                  </label>
                  <label class="inpage-radio-card" id="inpage-radio-no">
                    <input type="radio" name="inpage_attendance" value="Regretfully Declining" />
                    <span>✗ Unable to Attend</span>
                  </label>
                </div>
              </div>

              <div class="inpage-field-group">
                <label class="inpage-label" for="inpage-rsvp-affiliation">Relationship with Couple</label>
                <select class="inpage-select" id="inpage-rsvp-affiliation" name="affiliation">
                  <option value="Groom &amp; Bride's Family">Groom &amp; Bride's Family</option>
                  <option value="Friends">Friends</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Special Guest">Special Guest</option>
                </select>
              </div>

              <div class="inpage-field-group">
                <label class="inpage-label" for="inpage-rsvp-wishes">Wishes for the Couple / Notes</label>
                <textarea class="inpage-textarea" id="inpage-rsvp-wishes" name="wishes" placeholder="Share your warm congratulations, blessings, or dietary notes..."></textarea>
              </div>

              <button type="submit" class="inpage-submit-btn" id="inpage-submit-btn">
                💌 Confirm My RSVP
              </button>
            </form>
          </div>

          <!-- Right Column: Live Guestbook -->
          <div class="inpage-rsvp-guestbook-col">
            <div class="inpage-guestbook-header">
              <h3 class="inpage-guestbook-title">
                <span>📖</span> Guest Wishes &amp; Blessings
              </h3>
            </div>
            <div class="inpage-guest-feed" id="inpage-guest-feed">
              <div class="inpage-guest-empty">Loading heartfelt wishes...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    inpageMounted = true;
    setupInPageInteractions();
    fetchInPageGuests();
  }

  /* ==========================================================================
     FORM & GUESTBOOK LOGIC
     ========================================================================== */
  function setupInPageInteractions() {
    const form = document.getElementById('inpage-rsvp-form');
    const statusBanner = document.getElementById('inpage-status-banner');
    const submitBtn = document.getElementById('inpage-submit-btn');
    const radioYes = document.getElementById('inpage-radio-yes');
    const radioNo = document.getElementById('inpage-radio-no');

    if (!form) return;

    // Radio Card Styles
    radioYes.querySelector('input').addEventListener('change', () => {
      radioYes.className = 'inpage-radio-card selected attending';
      radioNo.className = 'inpage-radio-card';
    });

    radioNo.querySelector('input').addEventListener('change', () => {
      radioNo.className = 'inpage-radio-card selected';
      radioYes.className = 'inpage-radio-card';
    });

    // Form Submission to /users REST API
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      statusBanner.className = 'inpage-status-banner';
      statusBanner.style.display = 'none';

      const nameInput = document.getElementById('inpage-rsvp-name');
      const name = nameInput.value.trim();
      if (!name) {
        showStatus('Please enter your full name.', 'error');
        return;
      }

      const attendance = document.querySelector('input[name="inpage_attendance"]:checked').value;
      const affiliation = document.getElementById('inpage-rsvp-affiliation').value;
      const wishes = document.getElementById('inpage-rsvp-wishes').value.trim();

      // Format description text stored in database
      let description = `${attendance} (${affiliation})`;
      if (wishes) {
        description += ` — ${wishes}`;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording Your RSVP...';

      try {
        const resp = await fetch('/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ name: name, description: description })
        });

        const data = await resp.json().catch(() => ({}));

        if (resp.ok) {
          showStatus(`✓ Thank you, ${name}! Your RSVP has been confirmed.`, 'success');
          form.reset();
          radioYes.className = 'inpage-radio-card selected attending';
          radioNo.className = 'inpage-radio-card';

          // Refresh guestbook immediately
          await fetchInPageGuests();
        } else {
          showStatus(data.error || 'Could not save RSVP. Please check your connection and try again.', 'error');
        }
      } catch (err) {
        showStatus('Could not reach the server. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '💌 Confirm My RSVP';
      }
    });

    function showStatus(msg, type) {
      statusBanner.textContent = msg;
      statusBanner.className = `inpage-status-banner ${type}`;
      statusBanner.style.display = 'block';
    }
  }

  /* ==========================================================================
     FETCH & RENDER GUESTBOOK
     ========================================================================== */
  async function fetchInPageGuests() {
    const feed = document.getElementById('inpage-guest-feed');
    const countEl = document.getElementById('inpage-confirmed-count');
    if (!feed) return;

    try {
      const resp = await fetch('/users', {
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) throw new Error('Failed to fetch');

      const users = await resp.json();
      if (Array.isArray(users)) {
        allGuests = users;
        renderInPageGuests(users);
      }
    } catch (err) {
      feed.innerHTML = `
        <div class="inpage-guest-empty">
          <p>Unable to load live wishes at this moment.</p>
        </div>
      `;
    }
  }

  function renderInPageGuests(users) {
    const feed = document.getElementById('inpage-guest-feed');
    const countEl = document.getElementById('inpage-confirmed-count');
    if (!feed) return;

    if (countEl) countEl.textContent = users.length;

    if (users.length === 0) {
      feed.innerHTML = '<div class="inpage-guest-empty">No responses yet. Be the first to RSVP and leave a blessing!</div>';
      return;
    }

    feed.innerHTML = users.map(u => {
      const name = escapeHtml(u.name || 'Anonymous Guest');
      let desc = escapeHtml(u.description || 'Confirmed attendance');

      try {
        if (desc.startsWith('{') && desc.endsWith('}')) {
          const parsed = JSON.parse(desc);
          desc = parsed.notes || desc;
        }
      } catch (e) {}

      const isDeclined = desc.toLowerCase().includes('declining') || desc.toLowerCase().includes('regret');
      const badgeClass = isDeclined ? 'inpage-guest-badge declined' : 'inpage-guest-badge attending';
      const badgeText = isDeclined ? 'Declined' : 'Attending';

      return `
        <div class="inpage-guest-card">
          <div class="inpage-guest-top">
            <span class="inpage-guest-name">🌸 ${name}</span>
            <span class="${badgeClass}">${badgeText}</span>
          </div>
          <p class="inpage-guest-msg">${desc}</p>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
})();
