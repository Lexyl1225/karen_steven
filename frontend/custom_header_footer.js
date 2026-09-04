/**
 * Karen & Steven Wedding - Luxury Custom Header & Footer Controller
 * Provides non-intrusive luxury navigation, smooth scrolling, active link tracking,
 * and mobile drawer controls without modifying existing Canva CSS chunks.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // Mapping from logical section key to Canva section DOM IDs, indices & fallback offsets
  const SECTION_MAP = {
    home: { sectionId: "PBTV4dWWt3QjJsFh", canvaIndex: 0, approxScroll: 0, mobileScroll: 0 },
    save_the_date: { sectionId: "PBBPYTyYy0jc8Lhj", canvaIndex: 2, approxScroll: 4520, mobileScroll: 1352 },
    location: { sectionId: "PBGTY3t7lygDQX94", canvaIndex: 3, approxScroll: 5375, mobileScroll: 1596 },
    timeline: { sectionId: "PBDFdM7CtgRK2xLh", canvaIndex: 4, approxScroll: 7204, mobileScroll: 2117 },
    dress_code: { sectionId: "PBGPqs8sgl8wkbyV", canvaIndex: 5, approxScroll: 8630, mobileScroll: 2523 },
    entourage: { sectionId: "PBTnMb8ZhTyHW83s", canvaIndex: 6, approxScroll: 11093, mobileScroll: 3225 },
    reminders: { sectionId: "PBdz2kNrHdR52ss8", canvaIndex: 7, approxScroll: 13528, mobileScroll: 3919 },
    playlist: { sectionId: "PBqD6NKkNFbTJsHD", canvaIndex: 8, approxScroll: 14771, mobileScroll: 4273 },
    rsvp: { sectionId: "PBhX7YkYnDcF0CpG", canvaIndex: 9, approxScroll: 16620, mobileScroll: 4777 },
    prenup: { sectionId: "PB8CcgBgh4S3M5Bv", canvaIndex: 11, approxScroll: 17768, mobileScroll: 5880 }
  };

  initCustomHeader();
  setupScrollTracking();
  setupFooterInteractions();

  /* ==========================================================================
     HEADER MOUNTING & SETUP
     ========================================================================== */
  function initCustomHeader() {
    if (document.getElementById("custom-wedding-header")) return;

    const header = document.createElement("header");
    header.id = "custom-wedding-header";
    header.className = "custom-wedding-header";
    header.setAttribute("role", "banner");
    header.innerHTML = `
      <!-- Brand Monogram -->
      <a href="#home" class="wedding-header-brand" data-nav="home" title="Karen &amp; Steven Wedding">
        <div class="brand-monogram-circle">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="13" r="5.5" stroke="#e0c78b" stroke-width="1.8"/>
            <circle cx="15" cy="13" r="5.5" stroke="#c5a059" stroke-width="1.8"/>
            <path d="M12 7l1.5-2h-3L12 7z" fill="#ffd700"/>
          </svg>
        </div>
        <div class="brand-text-block">
          <span class="brand-names">Karen &amp; Steven</span>
          <span class="brand-date">SEP 18, 2026</span>
        </div>
      </a>

      <!-- Center Nav Links -->
      <div class="wedding-header-nav" id="wedding-header-nav">
        <a class="wedding-nav-link active" data-nav="home">Home</a>
        <a class="wedding-nav-link" data-nav="save_the_date">Save the Date</a>
        <a class="wedding-nav-link" data-nav="location">Location</a>
        <a class="wedding-nav-link" data-nav="timeline">Timeline</a>
        <a class="wedding-nav-link" data-nav="dress_code">Dress Code</a>
        <a class="wedding-nav-link" data-nav="entourage">Entourage</a>
        <a class="wedding-nav-link" data-nav="reminders">Reminders</a>
        <a class="wedding-nav-link" data-nav="playlist">Playlist</a>
        <a class="wedding-nav-link" data-nav="rsvp">RSVP</a>
        <a class="wedding-nav-link" data-nav="prenup">Prenup</a>
      </div>

      <!-- Right Action & Mobile Button -->
      <div class="wedding-header-actions">
        <button type="button" class="header-rsvp-pill" id="header-rsvp-action-btn">
          <span>💌</span>
          <span>RSVP</span>
        </button>
        <a href="/admin" class="header-admin-link" title="Admin Dashboard">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </a>
        <button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Toggle navigation menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    `;

    document.body.appendChild(header);

    // Event listeners on header nav links
    header.querySelectorAll("[data-nav]").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const targetKey = link.getAttribute("data-nav");
        navigateToSection(targetKey);
        closeMobileMenu();
      });
    });

    // RSVP button in header
    const rsvpBtn = header.querySelector("#header-rsvp-action-btn");
    if (rsvpBtn) {
      rsvpBtn.addEventListener("click", () => {
        if (typeof window.openRsvpModal === "function") {
          window.openRsvpModal();
        } else {
          navigateToSection("rsvp");
        }
        closeMobileMenu();
      });
    }

    // Mobile Hamburger toggle
    const toggleBtn = header.querySelector("#mobile-nav-toggle");
    const navMenu = header.querySelector("#wedding-header-nav");
    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener("click", e => {
        e.stopPropagation();
        const willOpen = !toggleBtn.classList.contains("open");
        toggleBtn.classList.toggle("open", willOpen);
        navMenu.classList.toggle("mobile-open", willOpen);
        header.classList.toggle("mobile-nav-active", willOpen);
        if (willOpen) {
          header.classList.remove("header-hidden");
        }
      });

      // Close mobile drawer when clicking outside
      document.addEventListener("click", e => {
        if (!header.contains(e.target)) {
          closeMobileMenu();
        }
      });
    }
  }

  function closeMobileMenu() {
    const toggleBtn = document.getElementById("mobile-nav-toggle");
    const navMenu = document.getElementById("wedding-header-nav");
    const header = document.getElementById("custom-wedding-header");
    if (toggleBtn) toggleBtn.classList.remove("open");
    if (navMenu) navMenu.classList.remove("mobile-open");
    if (header) header.classList.remove("mobile-nav-active");
  }

  /* ==========================================================================
     SMOOTH NAVIGATION ENGINE
     ========================================================================== */
  function getSectionScrollTarget(key) {
    const config = SECTION_MAP[key];
    if (!config) return 0;
    if (key === "home") return 0;

    const isMobile = window.innerWidth <= 860;
    const headerOffset = isMobile ? 54 : 64;
    const scrollContainer = document.querySelector(".ZRRuDw") || document.scrollingElement || document.documentElement || document.body;

    // 1. Calculate live position from section element in DOM if available
    const targetEl = document.getElementById(config.sectionId);
    if (targetEl && scrollContainer) {
      const scRect = (scrollContainer.getBoundingClientRect) ? scrollContainer.getBoundingClientRect() : { top: 0 };
      const elRect = targetEl.getBoundingClientRect();
      const currentScroll = scrollContainer.scrollTop || window.scrollY || 0;
      const targetTop = currentScroll + (elRect.top - scRect.top) - headerOffset;
      return Math.max(0, Math.round(targetTop));
    }

    // 2. Static Fallback if element not yet rendered
    if (isMobile) {
      return Math.max(0, (config.mobileScroll || 0) - headerOffset);
    } else {
      return Math.max(0, (config.approxScroll || 0) - headerOffset);
    }
  }

  let isNavigating = false;
  let navTimer = null;

  window.setNavigating = function() {
    isNavigating = true;
    const header = document.getElementById("custom-wedding-header");
    if (header) header.classList.remove("header-hidden");
    if (navTimer) clearTimeout(navTimer);
    navTimer = setTimeout(() => {
      isNavigating = false;
    }, 1400);
  };

  function navigateToSection(key) {
    const config = SECTION_MAP[key];
    if (!config) return;

    // Keep header visible during programmatic transition
    window.setNavigating();

    // Update active nav link state
    document.querySelectorAll(".wedding-nav-link").forEach(link => {
      if (link.getAttribute("data-nav") === key) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Special handling for RSVP section
    if (key === "rsvp") {
      if (typeof window.scrollToRsvp === "function") {
        window.scrollToRsvp();
        return;
      }
    }

    const targetTop = getSectionScrollTarget(key);
    const scrollContainer = document.querySelector(".ZRRuDw") || document.scrollingElement || document.documentElement || document.body;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
    }
  }

  /* ==========================================================================
     ACTIVE LINK TRACKING & AUTOHIDE HEADER ON SCROLL
     ========================================================================== */
  function setupScrollTracking() {
    let scrollTimer = null;
    let lastScroll = 0;
    const scrollDeltaThreshold = 8; // Pixels delta required before changing visibility

    const onScroll = () => {
      const scrollContainer = document.querySelector(".ZRRuDw") || document.scrollingElement || document.documentElement;
      const currentScroll = Math.max(0, scrollContainer.scrollTop || window.scrollY || 0);
      const header = document.getElementById("custom-wedding-header");
      const navMenu = document.getElementById("wedding-header-nav");
      const isDrawerOpen = navMenu && navMenu.classList.contains("mobile-open");

      if (header) {
        // A. Always reveal header at top of the page
        if (currentScroll <= 35) {
          header.classList.remove("header-hidden");
          header.classList.remove("scrolled");
        } else {
          header.classList.add("scrolled");

          // B. Autohide when scrolling down, reveal when scrolling up
          if (!isDrawerOpen && !isNavigating) {
            const delta = currentScroll - lastScroll;
            if (Math.abs(delta) >= scrollDeltaThreshold) {
              if (delta > 0 && currentScroll > 80) {
                // Scrolling down -> hide header to maximize screen estate
                header.classList.add("header-hidden");
              } else if (delta < 0) {
                // Scrolling up -> reveal header
                header.classList.remove("header-hidden");
              }
            }
          } else if (isDrawerOpen) {
            // Keep header visible while user interacts with drawer
            header.classList.remove("header-hidden");
          }
        }
      }

      lastScroll = currentScroll;

      // C. Determine active section based on currentScroll position
      let activeKey = "home";
      for (const key of Object.keys(SECTION_MAP)) {
        const secTop = getSectionScrollTarget(key);
        if (currentScroll >= secTop - 30) {
          activeKey = key;
        }
      }

      document.querySelectorAll(".wedding-nav-link").forEach(link => {
        if (link.getAttribute("data-nav") === activeKey) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    };

    // Attach to .ZRRuDw and window
    const pollInterval = setInterval(() => {
      const container = document.querySelector(".ZRRuDw");
      if (container) {
        lastScroll = Math.max(0, container.scrollTop || window.scrollY || 0);
        container.addEventListener("scroll", () => {
          if (scrollTimer) cancelAnimationFrame(scrollTimer);
          scrollTimer = requestAnimationFrame(onScroll);
        }, { passive: true });
        clearInterval(pollInterval);
      }
    }, 250);

    window.addEventListener("scroll", () => {
      if (scrollTimer) cancelAnimationFrame(scrollTimer);
      scrollTimer = requestAnimationFrame(onScroll);
    }, { passive: true });
  }

  /* ==========================================================================
     FOOTER INTERACTIONS
     ========================================================================== */
  function setupFooterInteractions() {
    // Delegated click handler on body for footer links (since footer may load dynamically via Canva's canva_installFooter)
    document.addEventListener("click", e => {
      // 1. Footer navigation links
      const navLink = e.target.closest(".wedding-footer-nav");
      if (navLink) {
        e.preventDefault();
        const target = navLink.getAttribute("data-target");
        navigateToSection(target);
        return;
      }

      // 2. Footer RSVP trigger button
      const rsvpBtn = e.target.closest("#footer-rsvp-trigger-btn");
      if (rsvpBtn) {
        e.preventDefault();
        if (typeof window.openRsvpModal === "function") {
          window.openRsvpModal();
        } else {
          navigateToSection("rsvp");
        }
      }
    });
  }
});
