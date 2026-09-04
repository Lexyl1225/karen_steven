/**
 * Karen & Steven Wedding - Admin Dashboard Engine
 */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // State
  let siteConfigs = {};
  let mediaLibrary = [];
  let allRsvps = [];
  let currentActiveMediaTargetInput = null;

  // Check authentication
  const auth = await checkAuth();
  if (!auth) {
    window.location.href = "/admin/login";
    return;
  }

  // Initialize UI
  setupNavigation();
  setupQrCodeGenerator();
  setupMediaUploader();
  setupSectionSavers();
  setupQuickUploaders();
  setupMediaPicker();
  setupColorPreviews();
  setupSpotifyPreview();
  setupRsvpManagement();

  // Load Data
  await loadAllSections();
  await loadMediaLibrary();
  await loadRsvps();
  calculateCountdown();

  /* ==========================================================================
     AUTHENTICATION CHECK
     ========================================================================== */
  async function checkAuth() {
    try {
      const savedToken = localStorage.getItem("wedding_admin_token");
      const headers = savedToken ? { "X-Admin-Token": savedToken } : {};
      const resp = await fetch("/api/me", { headers });
      const data = await resp.json().catch(() => ({}));
      if (data.authenticated && data.is_admin) {
        const nameEl = document.getElementById("admin-display-name");
        if (nameEl) nameEl.textContent = data.username || "admin";
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /* ==========================================================================
     NAVIGATION
     ========================================================================== */
  function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const mobileToggle = document.getElementById("mobile-toggle");
    const sidebar = document.getElementById("sidebar");

    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        navigateToTab(target);
        if (window.innerWidth <= 900) {
          sidebar.classList.remove("open");
        }
      });
    });

    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }
  }

  window.navigateToTab = function (tabId) {
    document.querySelectorAll(".nav-item").forEach(btn => {
      if (btn.getAttribute("data-target") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.remove("active");
    });

    const targetPanel = document.getElementById("panel-" + tabId);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    const titleMap = {
      overview: "Dashboard Overview",
      qrcode: "Website QR Code & Stationery Printing",
      media: "Media Library & Uploads",
      home: "Home Section",
      save_the_date: "Save the Date",
      location: "Location & Venues",
      timeline: "Timeline & Schedule",
      dress_code: "Dress Code & Palette",
      entourage: "Wedding Entourage",
      reminders: "Reminders & Guidelines",
      playlist: "Wedding Playlist",
      rsvp: "RSVP & Guest Management",
      prenup: "Prenup Photo Gallery",
      page_options: "General Page Options"
    };

    const titleEl = document.getElementById("current-panel-title");
    if (titleEl && titleMap[tabId]) {
      titleEl.textContent = titleMap[tabId];
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ==========================================================================
     DATA LOADING & POPULATION
     ========================================================================== */
  async function loadAllSections() {
    try {
      const resp = await fetch("/api/sections");
      if (!resp.ok) throw new Error("Failed to fetch sections");
      siteConfigs = await resp.json();

      populateHome(siteConfigs.home);
      populateSaveTheDate(siteConfigs.save_the_date);
      populateLocation(siteConfigs.location);
      populateTimeline(siteConfigs.timeline);
      populateDressCode(siteConfigs.dress_code);
      populateEntourage(siteConfigs.entourage);
      populateReminders(siteConfigs.reminders);
      populatePlaylist(siteConfigs.playlist);
      populateRsvpSettings(siteConfigs.rsvp);
      populatePrenup(siteConfigs.prenup);
      populatePageOptions(siteConfigs.page_options);
      populateQrCode(siteConfigs.qr_code);
    } catch (err) {
      showToast("Error loading section settings", "error");
    }
  }

  function populateHome(data = {}) {
    setVal("home_bride_name", data.bride_name || "Karen");
    setVal("home_groom_name", data.groom_name || "Steven");
    setVal("home_title", data.title || "THE WEDDING");
    setVal("home_date_text", data.date_text || "September 18, 2026");
    setVal("home_rsvp_btn_text", data.rsvp_btn_text || "RSVP HERE");
    setVal("home_subtitle", data.subtitle || "You are Invited!");
    setVal("home_video_url", data.video_url || "");
    setVal("home_background_image", data.background_image || "");
    updatePreviewBox("home_background_image");
  }

  function populateSaveTheDate(data = {}) {
    setVal("std_title", data.title || "Our Big Day Awaits");
    setVal("std_subtitle", data.subtitle || "Save the Date");
    setVal("std_month_year", data.month_year || "September 2026");
    setVal("std_wedding_date", data.wedding_date || "2026-09-18");
    setVal("std_highlight_day", data.highlight_day || "18");
    setVal("std_countdown_embed", data.countdown_embed || "");
    setVal("std_image", data.image || "");
    updatePreviewBox("std_image");
    calculateCountdown(data.wedding_date);
  }

  function populateLocation(data = {}) {
    setVal("loc_ceremony_title", data.ceremony_title || "Wedding Ceremony");
    setVal("loc_ceremony_church", data.ceremony_church || "Iglesia Ni Cristo");
    setVal("loc_ceremony_sub", data.ceremony_sub || "Lokal ng Rosario");
    setVal("loc_ceremony_city", data.ceremony_city || "Santiago City");
    setVal("loc_ceremony_map_url", data.ceremony_map_url || "");
    setVal("loc_ceremony_image", data.ceremony_image || "");
    updatePreviewBox("loc_ceremony_image");

    setVal("loc_reception_title", data.reception_title || "Wedding Reception");
    setVal("loc_reception_venue", data.reception_venue || "Alleria Events Place");
    setVal("loc_reception_city", data.reception_city || "Santiago City");
    setVal("loc_reception_map_url", data.reception_map_url || "");
    setVal("loc_reception_image", data.reception_image || "");
    updatePreviewBox("loc_reception_image");
  }

  function populateTimeline(data = {}) {
    setVal("tl_title", data.title || "Wedding Timeline");
    setVal("tl_subtitle", data.subtitle || "Program for our special day");
    const list = document.getElementById("timeline-list");
    list.innerHTML = "";

    const events = Array.isArray(data.events) ? data.events : [];
    events.forEach(evt => addTimelineRow(evt.time, evt.title, evt.description));
  }

  function addTimelineRow(time = "", title = "", desc = "") {
    const list = document.getElementById("timeline-list");
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.innerHTML = `
      <span class="dynamic-item-handle">≡</span>
      <div class="dynamic-item-fields">
        <input type="text" class="form-control tl-time" placeholder="Time (e.g. 3:00 PM)" value="${escapeAttr(time)}" />
        <input type="text" class="form-control tl-name" placeholder="Event Title (e.g. Ceremony)" value="${escapeAttr(title)}" />
        <input type="text" class="form-control tl-desc" placeholder="Description / Notes" value="${escapeAttr(desc)}" />
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(div);
  }
  document.getElementById("add-timeline-item-btn").addEventListener("click", () => addTimelineRow("", "", ""));

  function populateDressCode(data = {}) {
    setVal("dc_title", data.title || "Dress Code");
    setVal("dc_attire_rule", data.attire_rule || "Formal Attire is strictly requested.");
    setVal("dc_ladies", data.ladies || "Maxi Dress | Long Gown");
    setVal("dc_gentlemen", data.gentlemen || "Formal Polo or Long Sleeves | Black Slacks");
    setVal("dc_notes", data.notes || "");
    const colors = Array.isArray(data.colors) ? data.colors.join(", ") : (data.colors || "#4a6984, #742374, #9bb0c1, #cbb3cc, #c5a059");
    setVal("dc_colors", colors);
    renderColorPreviews(colors);
    setVal("dc_guide_image", data.guide_image || "");
    updatePreviewBox("dc_guide_image");
  }

  function populateEntourage(data = {}) {
    setVal("ent_title", data.title || "The Entourage");
    setVal("ent_subtitle", data.subtitle || "Standing beside us on our special day");
    setVal("ent_best_man", data.best_man || "Ricky P. Fernandez");
    setVal("ent_maid_of_honor", data.maid_of_honor || "Marissa P. Fernandez");

    const gmList = document.getElementById("groomsmen-list");
    gmList.innerHTML = "";
    (data.groomsmen || []).forEach(name => addPersonRow(gmList, name, "Groomsman"));

    const bmList = document.getElementById("bridesmaids-list");
    bmList.innerHTML = "";
    (data.bridesmaids || []).forEach(name => addPersonRow(bmList, name, "Bridesmaid"));
  }

  function addPersonRow(container, name = "", placeholder = "") {
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.style.padding = "8px 12px";
    div.innerHTML = `
      <input type="text" class="form-control person-name" placeholder="${placeholder} Name" value="${escapeAttr(name)}" />
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
  }
  document.getElementById("add-groomsman-btn").addEventListener("click", () => addPersonRow(document.getElementById("groomsmen-list"), "", "Groomsman"));
  document.getElementById("add-bridesmaid-btn").addEventListener("click", () => addPersonRow(document.getElementById("bridesmaids-list"), "", "Bridesmaid"));

  function populateReminders(data = {}) {
    setVal("rem_title", data.title || "Reminders & Guidelines");
    setVal("rem_intimate_note", data.intimate_note || "");
    setVal("rem_dress_code_note", data.dress_code_note || "");
    setVal("rem_unplugged_ceremony", data.unplugged_ceremony || "");
    setVal("rem_punctuality", data.punctuality || "");
  }

  function populatePlaylist(data = {}) {
    setVal("pl_title", data.title || "Our Wedding Playlist");
    setVal("pl_subtitle", data.subtitle || "Wedding playlist (Click to play)");
    const spotifyUrl = data.spotify_url || "https://open.spotify.com/playlist/10ZmntL2QY4ygLYP3odjyn?si=JETwBJ4YQwilM1Kt6Vui1A%0A";
    setVal("pl_spotify_url", spotifyUrl);
    setVal("pl_notes", data.notes || "");
    renderSpotifyPreview(spotifyUrl);
  }

  function populateRsvpSettings(data = {}) {
    setVal("rsvp_title", data.title || "RSVP");
    setVal("rsvp_deadline", data.deadline || "September 06, 2026");
    setVal("rsvp_description", data.description || "");
    setVal("rsvp_google_form_url", data.google_form_url || "https://forms.gle/uwkGwfMKvKUDLRDy9");
    setCheck("rsvp_enable_direct_rsvp", data.enable_direct_rsvp !== false);
    setCheck("rsvp_enable_guestbook", data.enable_guestbook !== false);
  }

  function populatePrenup(data = {}) {
    setVal("pn_title", data.title || "Prenup Photos & Gallery");
    setVal("pn_subtitle", data.subtitle || "Our Love Story in Frames");

    const container = document.getElementById("prenup-photos-list");
    container.innerHTML = "";
    (data.photos || []).forEach(url => addPrenupPhotoRow(url));
  }

  function addPrenupPhotoRow(url = "") {
    const container = document.getElementById("prenup-photos-list");
    const div = document.createElement("div");
    div.className = "dynamic-item";
    div.innerHTML = `
      <img src="${url || "#"}" class="media-preview-img" style="width: 60px; height: 40px;" onerror="this.style.display='none'" onload="this.style.display='block'" />
      <input type="text" class="form-control pn-url" placeholder="Image URL (e.g. /uploads/photo.jpg or _assets/...)" value="${escapeAttr(url)}" oninput="this.previousElementSibling.src=this.value; this.previousElementSibling.style.display='block';" />
      <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaPickerForDynamicInput(this.previousElementSibling)">📁</button>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
  }
  document.getElementById("add-prenup-photo-btn").addEventListener("click", () => addPrenupPhotoRow(""));
  document.getElementById("upload-prenup-photo-btn").addEventListener("click", () => {
    triggerDirectUpload((newUrl) => {
      addPrenupPhotoRow(newUrl);
    });
  });

  function populatePageOptions(data = {}) {
    setVal("opt_site_title", data.site_title || "You are Invited! Karen & Steven Wedding");
    setVal("opt_meta_description", data.meta_description || "Join us to celebrate the wedding of Karen and Steven on September 18, 2026 in Santiago City.");
    setCheck("opt_show_floating_rsvp", data.show_floating_rsvp !== false);
    setCheck("opt_show_guest_wishes", data.show_guest_wishes !== false);
    setVal("opt_primary_color", data.primary_color || "#04225c");
    setVal("opt_secondary_color", data.secondary_color || "#742374");
  }

  function populateQrCode(data = {}) {
    const currentHost = window.location.origin;
    setVal("qr_domain_url", data.domain_url || currentHost);
    setVal("qr_destination_page", data.destination_page || "");
    setVal("qr_couple_names", data.couple_names || "Karen & Steven");
    setVal("qr_headline", data.headline || "You Are Cordially Invited");
    setVal("qr_instructions", data.instructions || "Scan with your phone camera to view schedule, map directions, and submit RSVP.");
    setVal("qr_date_venue", data.date_venue || "September 18, 2026 \u2022 Santiago City, Isabela");
    setVal("qr_color", data.qr_color || "#04225c");
    setVal("qr_bg_color", data.bg_color || "#ffffff");
    setVal("qr_accent_color", data.accent_color || "#c5a059");
    setCheck("qr_show_monogram", data.show_monogram !== false);
    setCheck("qr_show_wifi", data.show_wifi === true);
    setVal("qr_wifi_ssid", data.wifi_ssid || "Alleria_Guest_WiFi");
    setVal("qr_wifi_password", data.wifi_password || "weddingcelebration");

    // Template option radio
    const templateStyle = data.card_style || "table_card";
    const templateRadio = document.querySelector(`input[name="qr_card_template"][value="${templateStyle}"]`);
    if (templateRadio) {
      templateRadio.checked = true;
      document.querySelectorAll(".template-option").forEach(el => el.classList.remove("active"));
      templateRadio.closest(".template-option")?.classList.add("active");
    }

    // Theme preset
    const theme = data.theme_color || "navy_gold";
    document.querySelectorAll(".theme-pill").forEach(el => {
      if (el.getAttribute("data-theme") === theme) el.classList.add("active");
      else el.classList.remove("active");
    });

    if (typeof updateQrCodeDisplay === "function") {
      updateQrCodeDisplay();
    }
  }

  /* ==========================================================================
     SAVE SECTION HANDLERS
     ========================================================================== */
  function setupSectionSavers() {
    document.querySelectorAll(".save-section-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sec = btn.getAttribute("data-section");
        await saveSection(sec, btn);
      });
    });
  }

  async function saveSection(sec, btn = null) {
    let payload = {};

    if (sec === "home") {
      payload = {
        bride_name: getVal("home_bride_name"),
        groom_name: getVal("home_groom_name"),
        title: getVal("home_title"),
        date_text: getVal("home_date_text"),
        rsvp_btn_text: getVal("home_rsvp_btn_text"),
        subtitle: getVal("home_subtitle"),
        video_url: getVal("home_video_url"),
        background_image: getVal("home_background_image")
      };
    } else if (sec === "save_the_date") {
      payload = {
        title: getVal("std_title"),
        subtitle: getVal("std_subtitle"),
        month_year: getVal("std_month_year"),
        wedding_date: getVal("std_wedding_date"),
        highlight_day: getVal("std_highlight_day"),
        countdown_embed: getVal("std_countdown_embed"),
        image: getVal("std_image")
      };
      calculateCountdown(payload.wedding_date);
    } else if (sec === "location") {
      payload = {
        ceremony_title: getVal("loc_ceremony_title"),
        ceremony_church: getVal("loc_ceremony_church"),
        ceremony_sub: getVal("loc_ceremony_sub"),
        ceremony_city: getVal("loc_ceremony_city"),
        ceremony_map_url: getVal("loc_ceremony_map_url"),
        ceremony_image: getVal("loc_ceremony_image"),
        reception_title: getVal("loc_reception_title"),
        reception_venue: getVal("loc_reception_venue"),
        reception_city: getVal("loc_reception_city"),
        reception_map_url: getVal("loc_reception_map_url"),
        reception_image: getVal("loc_reception_image")
      };
    } else if (sec === "timeline") {
      const events = [];
      document.querySelectorAll("#timeline-list .dynamic-item").forEach(item => {
        const time = item.querySelector(".tl-time").value.trim();
        const title = item.querySelector(".tl-name").value.trim();
        const desc = item.querySelector(".tl-desc").value.trim();
        if (time || title) {
          events.push({ time, title, description: desc });
        }
      });
      payload = {
        title: getVal("tl_title"),
        subtitle: getVal("tl_subtitle"),
        events
      };
    } else if (sec === "dress_code") {
      const colors = getVal("dc_colors").split(",").map(s => s.trim()).filter(Boolean);
      payload = {
        title: getVal("dc_title"),
        attire_rule: getVal("dc_attire_rule"),
        ladies: getVal("dc_ladies"),
        gentlemen: getVal("dc_gentlemen"),
        notes: getVal("dc_notes"),
        colors,
        guide_image: getVal("dc_guide_image")
      };
    } else if (sec === "entourage") {
      const groomsmen = [];
      document.querySelectorAll("#groomsmen-list .person-name").forEach(inp => {
        if (inp.value.trim()) groomsmen.push(inp.value.trim());
      });
      const bridesmaids = [];
      document.querySelectorAll("#bridesmaids-list .person-name").forEach(inp => {
        if (inp.value.trim()) bridesmaids.push(inp.value.trim());
      });
      payload = {
        title: getVal("ent_title"),
        subtitle: getVal("ent_subtitle"),
        best_man: getVal("ent_best_man"),
        maid_of_honor: getVal("ent_maid_of_honor"),
        groomsmen,
        bridesmaids
      };
    } else if (sec === "reminders") {
      payload = {
        title: getVal("rem_title"),
        intimate_note: getVal("rem_intimate_note"),
        dress_code_note: getVal("rem_dress_code_note"),
        unplugged_ceremony: getVal("rem_unplugged_ceremony"),
        punctuality: getVal("rem_punctuality")
      };
    } else if (sec === "playlist") {
      payload = {
        title: getVal("pl_title"),
        subtitle: getVal("pl_subtitle"),
        spotify_url: getVal("pl_spotify_url"),
        notes: getVal("pl_notes")
      };
    } else if (sec === "rsvp") {
      payload = {
        title: getVal("rsvp_title"),
        deadline: getVal("rsvp_deadline"),
        description: getVal("rsvp_description"),
        google_form_url: getVal("rsvp_google_form_url"),
        enable_direct_rsvp: getCheck("rsvp_enable_direct_rsvp"),
        enable_guestbook: getCheck("rsvp_enable_guestbook")
      };
    } else if (sec === "prenup") {
      const photos = [];
      document.querySelectorAll("#prenup-photos-list .pn-url").forEach(inp => {
        if (inp.value.trim()) photos.push(inp.value.trim());
      });
      payload = {
        title: getVal("pn_title"),
        subtitle: getVal("pn_subtitle"),
        photos
      };
    } else if (sec === "page_options") {
      payload = {
        site_title: getVal("opt_site_title"),
        meta_description: getVal("opt_meta_description"),
        show_floating_rsvp: getCheck("opt_show_floating_rsvp"),
        show_guest_wishes: getCheck("opt_show_guest_wishes"),
        primary_color: getVal("opt_primary_color"),
        secondary_color: getVal("opt_secondary_color")
      };
    } else if (sec === "qr_code") {
      payload = {
        domain_url: getVal("qr_domain_url"),
        destination_page: getVal("qr_destination_page"),
        card_style: document.querySelector('input[name="qr_card_template"]:checked')?.value || "table_card",
        theme_color: document.querySelector('.theme-pill.active')?.getAttribute("data-theme") || "navy_gold",
        qr_color: getVal("qr_color") || "#04225c",
        bg_color: getVal("qr_bg_color") || "#ffffff",
        accent_color: getVal("qr_accent_color") || "#c5a059",
        couple_names: getVal("qr_couple_names") || "Karen & Steven",
        headline: getVal("qr_headline") || "You Are Cordially Invited",
        instructions: getVal("qr_instructions") || "Scan with your phone camera to view schedule, map directions, and submit RSVP.",
        date_venue: getVal("qr_date_venue") || "September 18, 2026 \u2022 Santiago City, Isabela",
        show_monogram: getCheck("qr_show_monogram"),
        show_wifi: getCheck("qr_show_wifi"),
        wifi_ssid: getVal("qr_wifi_ssid"),
        wifi_password: getVal("qr_wifi_password")
      };
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Saving...";
    }

    try {
      const resp = await fetch("/api/sections/" + sec, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error("Update failed");
      siteConfigs[sec] = payload;
      showToast('Section "' + sec.replace(/_/g, " ") + '" saved successfully!', "success");
    } catch (err) {
      showToast("Could not save section: " + err.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "💾 Save Changes";
      }
    }
  }

  /* ==========================================================================
     MEDIA UPLOADS & MANAGEMENT
     ========================================================================== */
  function setupMediaUploader() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    const refreshBtn = document.getElementById("refresh-media-btn");

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesUpload(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFilesUpload(fileInput.files);
      }
    });

    if (refreshBtn) {
      refreshBtn.addEventListener("click", loadMediaLibrary);
    }
  }

  async function handleFilesUpload(files) {
    const progressBox = document.getElementById("upload-progress");
    const progressBar = document.getElementById("upload-progress-bar");
    const progressText = document.getElementById("upload-progress-text");

    progressBox.style.display = "block";
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const percent = Math.round(((i + 1) / files.length) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = "Uploading file " + (i + 1) + " of " + files.length + " (" + file.name + ")...";

      const formData = new FormData();
      formData.append("file", file);

      try {
        const resp = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (resp.ok) {
          uploadedCount++;
        } else {
          const err = await resp.json().catch(() => ({}));
          showToast("Failed to upload " + file.name + ": " + (err.error || "Error"), "error");
        }
      } catch (err) {
        showToast("Network error uploading " + file.name, "error");
      }
    }

    progressBar.style.width = "100%";
    progressText.textContent = "Uploaded " + uploadedCount + " of " + files.length + " files successfully!";
    setTimeout(() => { progressBox.style.display = "none"; }, 2000);

    await loadMediaLibrary();
    showToast("Uploaded " + uploadedCount + " file(s) to media library!", "success");
  }

  async function loadMediaLibrary() {
    try {
      const resp = await fetch("/api/media");
      if (!resp.ok) throw new Error("Failed to load media");
      mediaLibrary = await resp.json();

      document.getElementById("media-count-label").textContent = mediaLibrary.length;
      const kpiMedia = document.getElementById("kpi-media-count");
      if (kpiMedia) kpiMedia.textContent = mediaLibrary.length;
      const mediaBadge = document.getElementById("media-badge-count");
      if (mediaBadge) mediaBadge.textContent = mediaLibrary.length;

      renderMediaGrid("media-grid-container", mediaLibrary, false);
      renderMediaGrid("picker-media-grid", mediaLibrary, true);
    } catch (e) {
      document.getElementById("media-grid-container").innerHTML = "<div style=\"grid-column: 1/-1; text-align: center; color: #94a3b8;\">No uploaded files yet. Drag & drop files above.</div>";
    }
  }

  function renderMediaGrid(containerId, files, isPickerMode = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (files.length === 0) {
      container.innerHTML = "<div style=\"grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 20px;\">No files in library yet.</div>";
      return;
    }

    container.innerHTML = files.map(f => {
      const isVideo = f.type === "video";
      const thumbContent = isVideo
        ? "<div style=\"font-size: 32px;\">🎬</div>"
        : "<img src=\"" + f.url + "\" alt=\"" + escapeAttr(f.filename) + "\" loading=\"lazy\" />";

      const sizeKb = Math.round(f.size / 1024);

      if (isPickerMode) {
        return `
          <div class="media-card" style="cursor: pointer;" onclick="selectMediaForTarget('${escapeAttr(f.url)}')">
            <div class="media-card-thumb">${thumbContent}</div>
            <div class="media-card-info">
              <div class="media-card-name" title="${escapeAttr(f.filename)}">${escapeHtml(f.filename)}</div>
              <div class="media-card-meta"><span>${f.type.toUpperCase()}</span><span>${sizeKb} KB</span></div>
            </div>
          </div>
        `;
      }

      return `
        <div class="media-card">
          <div class="media-card-thumb">${thumbContent}</div>
          <div class="media-card-info">
            <div class="media-card-name" title="${escapeAttr(f.filename)}">${escapeHtml(f.filename)}</div>
            <div class="media-card-meta"><span>${sizeKb} KB</span><span>${f.created_at || ""}</span></div>
            <div class="media-card-actions">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="copyToClipboard('${escapeAttr(f.url)}')">📋 Copy URL</button>
              <button class="btn btn-danger btn-sm" onclick="deleteMediaFile('${escapeAttr(f.filename)}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied media URL to clipboard!", "success");
    }).catch(() => {
      showToast("Could not copy to clipboard", "error");
    });
  };

  window.deleteMediaFile = async function (filename) {
    if (!confirm("Are you sure you want to delete '" + filename + "'?")) return;

    try {
      const resp = await fetch("/api/media/" + encodeURIComponent(filename), { method: "DELETE" });
      if (resp.ok) {
        showToast("File deleted successfully", "success");
        await loadMediaLibrary();
      } else {
        showToast("Failed to delete file", "error");
      }
    } catch (e) {
      showToast("Error connecting to server", "error");
    }
  };

  /* ==========================================================================
     QUICK UPLOADERS & MEDIA PICKER
     ========================================================================== */
  function setupQuickUploaders() {
    document.querySelectorAll(".quick-upload-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const inputId = btn.getAttribute("data-target-input");
        triggerDirectUpload((url) => {
          setVal(inputId, url);
          updatePreviewBox(inputId);
        });
      });
    });

    document.querySelectorAll(".choose-media-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const inputId = btn.getAttribute("data-target-input");
        openMediaPickerForInput(inputId);
      });
    });

    ["home_background_image", "std_image", "loc_ceremony_image", "loc_reception_image", "dc_guide_image"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => updatePreviewBox(id));
      }
    });
  }

  function triggerDirectUpload(callback) {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = "image/*,video/*";
    tempInput.onchange = async () => {
      if (tempInput.files && tempInput.files[0]) {
        const file = tempInput.files[0];
        const formData = new FormData();
        formData.append("file", file);
        try {
          const resp = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await resp.json();
          if (resp.ok && data.url) {
            callback(data.url);
            showToast("Uploaded " + file.name + "!", "success");
            await loadMediaLibrary();
          } else {
            showToast(data.error || "Upload failed", "error");
          }
        } catch (e) {
          showToast("Upload network error", "error");
        }
      }
    };
    tempInput.click();
  }

  function updatePreviewBox(inputId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(inputId + "_preview");
    if (!input || !box) return;

    const url = input.value.trim();
    if (!url) {
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }

    const isVideo = url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov");
    box.style.display = "inline-flex";
    if (isVideo) {
      box.innerHTML = `
        <video src="${url}" class="media-preview-img" controls></video>
        <div class="media-preview-info"><strong>Video Preview:</strong> ${escapeHtml(url)}</div>
      `;
    } else {
      box.innerHTML = `
        <img src="${url}" class="media-preview-img" onerror="this.src='https://via.placeholder.com/80x50?text=Preview';" />
        <div class="media-preview-info"><strong>Image Preview:</strong> ${escapeHtml(url)}</div>
      `;
    }
  }

  function setupMediaPicker() {
    const modal = document.getElementById("media-picker-modal");
    const closeBtn = document.getElementById("close-media-picker-btn");
    const cancelBtn = document.getElementById("cancel-media-picker-btn");

    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    cancelBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  function openMediaPickerForInput(inputId) {
    currentActiveMediaTargetInput = document.getElementById(inputId);
    document.getElementById("media-picker-modal").classList.add("active");
  }

  window.openMediaPickerForDynamicInput = function (inputEl) {
    currentActiveMediaTargetInput = inputEl;
    document.getElementById("media-picker-modal").classList.add("active");
  };

  window.selectMediaForTarget = function (url) {
    if (currentActiveMediaTargetInput) {
      currentActiveMediaTargetInput.value = url;
      if (currentActiveMediaTargetInput.id) {
        updatePreviewBox(currentActiveMediaTargetInput.id);
      } else if (currentActiveMediaTargetInput.previousElementSibling) {
        currentActiveMediaTargetInput.previousElementSibling.src = url;
        currentActiveMediaTargetInput.previousElementSibling.style.display = "block";
      }
      showToast("Media selected!", "success");
    }
    document.getElementById("media-picker-modal").classList.remove("active");
  };

  /* ==========================================================================
     COLOR & SPOTIFY PREVIEWS
     ========================================================================== */
  function setupColorPreviews() {
    const input = document.getElementById("dc_colors");
    if (input) {
      input.addEventListener("input", () => renderColorPreviews(input.value));
    }
  }

  function renderColorPreviews(colorsStr = "") {
    const container = document.getElementById("dc_color_preview");
    if (!container) return;
    const colors = colorsStr.split(",").map(s => s.trim()).filter(Boolean);
    container.innerHTML = colors.map(c => `
      <div style="width: 32px; height: 32px; border-radius: 6px; background: ${c}; border: 1px solid rgba(0,0,0,0.15);" title="${c}"></div>
    `).join("");
  }

  function setupSpotifyPreview() {
    const input = document.getElementById("pl_spotify_url");
    if (input) {
      input.addEventListener("input", () => renderSpotifyPreview(input.value));
    }
  }

  function renderSpotifyPreview(url = "") {
    const container = document.getElementById("spotify-preview-container");
    if (!container) return;
    let embedUrl = "https://open.spotify.com/embed/playlist/10ZmntL2QY4ygLYP3odjyn?utm_source=generator";
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      embedUrl = "https://open.spotify.com/embed/playlist/" + match[1] + "?utm_source=generator";
    }
    container.innerHTML = `
      <iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
    `;
  }

  /* ==========================================================================
     RSVP & GUEST MANAGEMENT
     ========================================================================== */
  function setupRsvpManagement() {
    document.getElementById("refresh-rsvps-btn").addEventListener("click", loadRsvps);
    document.getElementById("export-rsvps-csv-btn").addEventListener("click", exportRsvpsCsv);

    const search = document.getElementById("rsvp-search-input");
    const filter = document.getElementById("rsvp-status-filter");
    if (search) search.addEventListener("input", filterAndRenderRsvps);
    if (filter) filter.addEventListener("change", filterAndRenderRsvps);
  }

  async function loadRsvps() {
    try {
      const resp = await fetch("/api/rsvps");
      if (!resp.ok) throw new Error("Failed to fetch RSVPs");
      const data = await resp.json();

      allRsvps = data.rsvps || [];

      // Update KPIs
      document.getElementById("kpi-rsvps-total").textContent = data.total || 0;
      document.getElementById("kpi-rsvps-attending").textContent = data.attending || 0;
      const badgeCount = document.getElementById("rsvp-badge-count");
      if (badgeCount) badgeCount.textContent = data.total || 0;

      filterAndRenderRsvps();
      renderOverviewRsvps(allRsvps.slice(0, 5));
    } catch (e) {
      showToast("Could not load RSVPs from database", "error");
    }
  }

  function filterAndRenderRsvps() {
    const searchTerm = (document.getElementById("rsvp-search-input")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("rsvp-status-filter")?.value || "all";

    const filtered = allRsvps.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm) || (r.description || "").toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });

    renderRsvpTable(filtered);
  }

  function renderRsvpTable(list) {
    const tbody = document.getElementById("all-rsvps-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = "<tr><td colspan=\"5\" style=\"text-align: center; color: #94a3b8; padding: 24px;\">No matching RSVP responses.</td></tr>";
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td><strong>🌸 ${escapeHtml(r.name)}</strong></td>
        <td>
          <span class="badge ${r.status === "Attending" ? "badge-success" : "badge-gray"}">
            ${r.status}
          </span>
        </td>
        <td style="max-width: 320px; font-size: 13px;">${escapeHtml(r.description || "-")}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteRsvpRecord(${r.id})">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  function renderOverviewRsvps(list) {
    const tbody = document.getElementById("overview-rsvp-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = "<tr><td colspan=\"3\" style=\"text-align: center; color: #94a3b8;\">No RSVPs yet.</td></tr>";
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>
          <span class="badge ${r.status === "Attending" ? "badge-success" : "badge-gray"}">
            ${r.status}
          </span>
        </td>
        <td style="max-width: 300px; font-size: 12.5px; color: #64748b;">${escapeHtml(r.description || "")}</td>
      </tr>
    `).join("");
  }

  window.deleteRsvpRecord = async function (id) {
    if (!confirm("Are you sure you want to delete this RSVP response?")) return;

    try {
      const resp = await fetch("/api/rsvps/" + id, { method: "DELETE" });
      if (resp.ok) {
        showToast("RSVP record deleted", "success");
        await loadRsvps();
      } else {
        showToast("Error deleting RSVP", "error");
      }
    } catch (e) {
      showToast("Server error", "error");
    }
  };

  function exportRsvpsCsv() {
    if (allRsvps.length === 0) {
      showToast("No RSVPs to export", "error");
      return;
    }

    let csv = "ID,Name,Status,Details\n";
    allRsvps.forEach(r => {
      const cleanName = "\"" + (r.name || "").replace(/\"/g, "\"\"") + "\"";
      const cleanDesc = "\"" + (r.description || "").replace(/\"/g, "\"\"") + "\"";
      csv += r.id + "," + cleanName + "," + r.status + "," + cleanDesc + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Karen_Steven_Wedding_RSVPs_" + (new Date().toISOString().split("T")[0]) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported RSVPs to CSV!", "success");
  }

  function calculateCountdown(weddingDateStr = "2026-09-18") {
    const target = new Date(weddingDateStr + "T15:00:00");
    const now = new Date();
    const diff = target - now;
    const daysEl = document.getElementById("kpi-days-left");
    if (!daysEl) return;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      daysEl.textContent = days + "d";
    } else {
      daysEl.textContent = "Married! 💍";
    }
  }

  /* ==========================================================================
     QR CODE & PRINTABLE STATIONERY GENERATOR
     ========================================================================== */
  let currentQrInstance = null;
  let currentMiniQrInstance = null;

  function getFullDestinationUrl() {
    let domain = (getVal("qr_domain_url") || "").trim();
    if (!domain) {
      domain = window.location.origin;
    }
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = window.location.protocol + "//" + domain;
    }
    domain = domain.replace(/\/+$/, "");
    const targetPath = getVal("qr_destination_page") || "";
    if (targetPath) {
      const cleanPath = targetPath.startsWith("#") ? "/" + targetPath : (targetPath.startsWith("/") ? targetPath : "/" + targetPath);
      return domain + cleanPath;
    }
    return domain;
  }

  function setupQrCodeGenerator() {
    const triggerInputs = [
      "qr_domain_url", "qr_destination_page", "qr_color", "qr_bg_color",
      "qr_accent_color", "qr_couple_names", "qr_headline", "qr_instructions",
      "qr_date_venue", "qr_wifi_ssid", "qr_wifi_password"
    ];

    triggerInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => updateQrCodeDisplay());
        el.addEventListener("change", () => updateQrCodeDisplay());
      }
    });

    const checkToggles = ["qr_show_monogram", "qr_show_wifi"];
    checkToggles.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", () => updateQrCodeDisplay());
      }
    });

    // Preset buttons
    const btnCurDomain = document.getElementById("preset-current-domain");
    if (btnCurDomain) {
      btnCurDomain.addEventListener("click", () => {
        setVal("qr_domain_url", window.location.origin);
        updateQrCodeDisplay();
        showToast("Domain set to current origin: " + window.location.origin, "success");
      });
    }

    const btnTailscale = document.getElementById("preset-tailscale-magic");
    if (btnTailscale) {
      btnTailscale.addEventListener("click", () => {
        setVal("qr_domain_url", "http://karen-steven-wedding:5000");
        updateQrCodeDisplay();
        showToast("Domain set to Tailscale MagicDNS", "success");
      });
    }

    const btnLocalhost = document.getElementById("preset-localhost");
    if (btnLocalhost) {
      btnLocalhost.addEventListener("click", () => {
        setVal("qr_domain_url", "http://localhost:5000");
        updateQrCodeDisplay();
        showToast("Domain set to localhost:5000", "success");
      });
    }

    // Template options
    document.querySelectorAll(".template-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll(".template-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        updateQrCodeDisplay();
      });
    });

    // Theme preset pills
    document.querySelectorAll(".theme-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".theme-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const theme = pill.getAttribute("data-theme");

        if (theme === "navy_gold") {
          setVal("qr_color", "#04225c");
          setVal("qr_bg_color", "#ffffff");
          setVal("qr_accent_color", "#c5a059");
        } else if (theme === "rose_gold") {
          setVal("qr_color", "#b76e79");
          setVal("qr_bg_color", "#fffafd");
          setVal("qr_accent_color", "#d8a48f");
        } else if (theme === "champagne") {
          setVal("qr_color", "#997327");
          setVal("qr_bg_color", "#fdfcf7");
          setVal("qr_accent_color", "#e2cb9b");
        } else if (theme === "classic_black") {
          setVal("qr_color", "#111111");
          setVal("qr_bg_color", "#ffffff");
          setVal("qr_accent_color", "#444444");
        }
        updateQrCodeDisplay();
      });
    });

    // Test & Copy buttons
    const btnTest = document.getElementById("qr-test-url-btn");
    if (btnTest) {
      btnTest.addEventListener("click", () => {
        const url = getFullDestinationUrl();
        window.open(url, "_blank");
      });
    }

    const btnCopy = document.getElementById("qr-copy-url-btn");
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        const url = getFullDestinationUrl();
        navigator.clipboard.writeText(url).then(() => {
          showToast("Website destination URL copied to clipboard!", "success");
        }).catch(() => {
          showToast("URL: " + url, "success");
        });
      });
    }

    // Print & Export Action buttons
    const btnPrintDirect = document.getElementById("btn-print-direct");
    if (btnPrintDirect) btnPrintDirect.addEventListener("click", printWeddingCard);

    const btnPrintBanner = document.getElementById("btn-print-banner");
    if (btnPrintBanner) btnPrintBanner.addEventListener("click", printWeddingCard);

    const btnPrintCleanWin = document.getElementById("btn-print-clean-win");
    if (btnPrintCleanWin) btnPrintCleanWin.addEventListener("click", openPrintableWindow);

    const btnOpenPrintWin = document.getElementById("btn-open-print-win");
    if (btnOpenPrintWin) btnOpenPrintWin.addEventListener("click", openPrintableWindow);

    const btnDownloadCard = document.getElementById("btn-download-card-png");
    if (btnDownloadCard) btnDownloadCard.addEventListener("click", downloadCardPng);

    const btnDownloadBanner = document.getElementById("btn-download-card-banner");
    if (btnDownloadBanner) btnDownloadBanner.addEventListener("click", downloadCardPng);

    const btnDownloadQr = document.getElementById("btn-download-qr-only");
    if (btnDownloadQr) btnDownloadQr.addEventListener("click", downloadQrOnly);

    // Initial render
    setTimeout(updateQrCodeDisplay, 100);
  }

  function updateQrCodeDisplay() {
    const fullUrl = getFullDestinationUrl();
    const qrColor = getVal("qr_color") || "#04225c";
    const bgColor = getVal("qr_bg_color") || "#ffffff";
    const accentColor = getVal("qr_accent_color") || "#c5a059";
    const coupleNames = getVal("qr_couple_names") || "Karen & Steven";
    const headline = getVal("qr_headline") || "You Are Cordially Invited";
    const instructions = getVal("qr_instructions") || "Scan with your phone camera to view schedule, map directions, and submit RSVP.";
    const dateVenue = getVal("qr_date_venue") || "September 18, 2026 \u2022 Santiago City, Isabela";
    const showMonogram = getCheck("qr_show_monogram");
    const showWifi = getCheck("qr_show_wifi");
    const wifiSsid = getVal("qr_wifi_ssid") || "Alleria_Guest_WiFi";
    const wifiPass = getVal("qr_wifi_password") || "weddingcelebration";
    const templateStyle = document.querySelector('input[name="qr_card_template"]:checked')?.value || "table_card";

    // Update text readouts
    const elDisplay = document.getElementById("qr-encoded-url-display");
    if (elDisplay) elDisplay.textContent = fullUrl;

    const elOverviewDisplay = document.getElementById("overview-qr-url-code");
    if (elOverviewDisplay) elOverviewDisplay.textContent = fullUrl;

    const elPreviewNames = document.getElementById("preview-couple-names");
    if (elPreviewNames) elPreviewNames.textContent = coupleNames;

    const elPreviewHeadline = document.getElementById("preview-headline");
    if (elPreviewHeadline) elPreviewHeadline.textContent = headline;

    const elPreviewInstructions = document.getElementById("preview-instructions");
    if (elPreviewInstructions) elPreviewInstructions.textContent = instructions;

    const elPreviewDate = document.getElementById("preview-date-venue");
    if (elPreviewDate) elPreviewDate.textContent = dateVenue;

    const elPreviewSlug = document.getElementById("preview-domain-slug");
    if (elPreviewSlug) elPreviewSlug.textContent = fullUrl;

    // Card style attributes & variables
    const card = document.getElementById("printable-wedding-card");
    if (card) {
      card.style.setProperty("--card-border-color", accentColor);
      card.style.setProperty("--card-accent-color", accentColor);
      card.style.setProperty("--card-text-color", qrColor);
      card.style.setProperty("--card-bg-color", bgColor);

      card.classList.remove("tpl-table_card", "tpl-insert_card", "tpl-poster", "tpl-minimal_qr");
      card.classList.add("tpl-" + templateStyle);
    }

    // Template badge
    const badge = document.getElementById("preview-template-badge");
    if (badge) {
      const badgeMap = {
        table_card: '5" \u00d7 7" Table Standee',
        insert_card: '4" \u00d7 6" Invitation Insert',
        poster: 'A4 / 8" \u00d7 10" Welcome Sign',
        minimal_qr: "Minimalist QR Only"
      };
      badge.textContent = badgeMap[templateStyle] || '5" \u00d7 7" Table Standee';
    }

    // Monogram badge
    const centerBadge = document.getElementById("preview-center-badge");
    if (centerBadge) {
      centerBadge.style.display = showMonogram ? "flex" : "none";
      centerBadge.style.borderColor = accentColor;
    }

    // Wi-Fi box
    const wifiBox = document.getElementById("preview-wifi-box");
    const wifiSettings = document.getElementById("wifi-settings-container");
    if (wifiSettings) wifiSettings.style.display = showWifi ? "block" : "none";
    if (wifiBox) {
      wifiBox.style.display = showWifi ? "flex" : "none";
      const creds = document.getElementById("preview-wifi-creds");
      if (creds) creds.innerHTML = "Network: <strong>" + escapeHtml(wifiSsid) + "</strong> &bull; Pass: <strong>" + escapeHtml(wifiPass) + "</strong>";
    }

    // Render Main QR Code
    const mainQrContainer = document.getElementById("live-qr-code-element");
    if (mainQrContainer && typeof QRCode !== "undefined") {
      mainQrContainer.innerHTML = "";
      try {
        currentQrInstance = new QRCode(mainQrContainer, {
          text: fullUrl,
          width: 220,
          height: 220,
          colorDark: qrColor,
          colorLight: bgColor,
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (e) {
        console.error("QR Code Error:", e);
      }
    }

    // Render Overview Mini QR Code
    const overviewQrContainer = document.getElementById("overview-mini-qr");
    if (overviewQrContainer && typeof QRCode !== "undefined") {
      overviewQrContainer.innerHTML = "";
      try {
        currentMiniQrInstance = new QRCode(overviewQrContainer, {
          text: fullUrl,
          width: 104,
          height: 104,
          colorDark: qrColor,
          colorLight: bgColor,
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (e) {
        console.error("Mini QR Error:", e);
      }
    }
  }

  function printWeddingCard() {
    window.navigateToTab("qrcode");
    setTimeout(() => {
      window.print();
    }, 250);
  }

  function openPrintableWindow() {
    const fullUrl = getFullDestinationUrl();
    const qrColor = getVal("qr_color") || "#04225c";
    const bgColor = getVal("qr_bg_color") || "#ffffff";
    const accentColor = getVal("qr_accent_color") || "#c5a059";
    const coupleNames = getVal("qr_couple_names") || "Karen & Steven";
    const headline = getVal("qr_headline") || "You Are Cordially Invited";
    const instructions = getVal("qr_instructions") || "Scan with your phone camera to view schedule, map directions, and submit RSVP.";
    const dateVenue = getVal("qr_date_venue") || "September 18, 2026 \u2022 Santiago City, Isabela";
    const showMonogram = getCheck("qr_show_monogram");
    const showWifi = getCheck("qr_show_wifi");
    const wifiSsid = getVal("qr_wifi_ssid") || "Alleria_Guest_WiFi";
    const wifiPass = getVal("qr_wifi_password") || "weddingcelebration";

    let qrDataUrl = "";
    const qrCanvas = document.querySelector("#live-qr-code-element canvas");
    const qrImg = document.querySelector("#live-qr-code-element img");
    if (qrCanvas) {
      qrDataUrl = qrCanvas.toDataURL("image/png");
    } else if (qrImg && qrImg.src) {
      qrDataUrl = qrImg.src;
    } else {
      qrDataUrl = "/api/admin/qr?url=" + encodeURIComponent(fullUrl) + "&color=" + encodeURIComponent(qrColor) + "&bg=" + encodeURIComponent(bgColor);
    }

    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow popups to open the print window.", "warning");
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Wedding Card - ${escapeHtml(coupleNames)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: auto;
      margin: 10mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f4f6f9;
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-controls {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
    }
    .print-btn {
      background: #04225c;
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(4,34,92,0.25);
    }
    .print-btn:hover { background: #072e7d; }
    .close-btn {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
    }
    .wedding-card {
      width: 4.8in;
      min-height: 6.8in;
      background: ${bgColor};
      border: 2.5px solid ${accentColor};
      padding: 10px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.12);
      position: relative;
      color: ${qrColor};
      display: flex;
      flex-direction: column;
    }
    .corner-flourish {
      position: absolute;
      width: 20px;
      height: 20px;
      border-style: solid;
      border-color: ${accentColor};
    }
    .top-left { top: 5px; left: 5px; border-width: 2.5px 0 0 2.5px; }
    .top-right { top: 5px; right: 5px; border-width: 2.5px 2.5px 0 0; }
    .bottom-left { bottom: 5px; left: 5px; border-width: 0 0 2.5px 2.5px; }
    .bottom-right { bottom: 5px; right: 5px; border-width: 0 2.5px 2.5px 0; }
    .inner-frame {
      border: 1px solid ${accentColor};
      padding: 24px 20px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      flex: 1;
    }
    .crest {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 8px;
    }
    .crest-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid ${accentColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: rgba(197, 160, 89, 0.08);
      margin-bottom: 4px;
    }
    .monogram {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: ${accentColor};
    }
    .names {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 23px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${qrColor};
      margin: 2px 0 6px;
      line-height: 1.2;
    }
    .rule {
      width: 65px;
      height: 1.5px;
      background: ${accentColor};
      margin: 0 auto 8px;
    }
    .headline {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${accentColor};
      margin-bottom: 16px;
    }
    .qr-container {
      background: #ffffff;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.08);
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.06);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      display: block;
    }
    .center-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38px;
      height: 38px;
      background: #ffffff;
      border: 2px solid ${accentColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .prompt {
      font-size: 11.5px;
      line-height: 1.45;
      color: #475569;
      max-width: 88%;
      margin: 0 auto 12px;
      font-weight: 500;
    }
    .wifi-box {
      background: rgba(0,0,0,0.02);
      border: 1px dashed ${accentColor};
      border-radius: 8px;
      padding: 6px 12px;
      margin: 0 auto 12px;
      width: 90%;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }
    .footer-date {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${qrColor};
      margin-bottom: 2px;
      margin-top: auto;
    }
    .footer-slug {
      font-size: 9.5px;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-controls {
        display: none !important;
      }
      .wedding-card {
        box-shadow: none;
        margin: 0 auto;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print Now</button>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>

  <div class="wedding-card">
    <div class="corner-flourish top-left"></div>
    <div class="corner-flourish top-right"></div>
    <div class="corner-flourish bottom-left"></div>
    <div class="corner-flourish bottom-right"></div>

    <div class="inner-frame">
      <div class="crest">
        <div class="crest-icon">💍</div>
        <div class="monogram">K &amp; S</div>
      </div>

      <h2 class="names">${escapeHtml(coupleNames)}</h2>
      <div class="rule"></div>
      <div class="headline">${escapeHtml(headline)}</div>

      <div class="qr-container">
        <img class="qr-img" src="${qrDataUrl}" alt="Wedding QR" />
        ${showMonogram ? '<div class="center-badge">💍</div>' : ''}
      </div>

      <div class="prompt">${escapeHtml(instructions)}</div>

      ${showWifi ? `<div class="wifi-box">📶 <span>Guest Wi-Fi: <strong>${escapeHtml(wifiSsid)}</strong> &bull; Pass: <strong>${escapeHtml(wifiPass)}</strong></span></div>` : ''}

      <div class="footer-date">${escapeHtml(dateVenue)}</div>
      <div class="footer-slug">${escapeHtml(fullUrl)}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  <\/script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  function downloadCardPng() {
    const fullUrl = getFullDestinationUrl();
    const qrColor = getVal("qr_color") || "#04225c";
    const bgColor = getVal("qr_bg_color") || "#ffffff";
    const accentColor = getVal("qr_accent_color") || "#c5a059";
    const coupleNames = getVal("qr_couple_names") || "Karen & Steven";
    const headline = getVal("qr_headline") || "You Are Cordially Invited";
    const instructions = getVal("qr_instructions") || "Scan with your phone camera to view schedule, map directions, and submit RSVP.";
    const dateVenue = getVal("qr_date_venue") || "September 18, 2026 \u2022 Santiago City, Isabela";
    const showMonogram = getCheck("qr_show_monogram");

    // 1500 x 2100 = 5" x 7" at 300 DPI
    const W = 1500;
    const H = 2100;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Corner flourishes
    const flLen = 90;
    const flThick = 12;
    ctx.fillStyle = accentColor;
    // Top-left
    ctx.fillRect(20, 20, flLen, flThick);
    ctx.fillRect(20, 20, flThick, flLen);
    // Top-right
    ctx.fillRect(W - 20 - flLen, 20, flLen, flThick);
    ctx.fillRect(W - 20 - flThick, 20, flThick, flLen);
    // Bottom-left
    ctx.fillRect(20, H - 20 - flThick, flLen, flThick);
    ctx.fillRect(20, H - 20 - flLen, flThick, flLen);
    // Bottom-right
    ctx.fillRect(W - 20 - flLen, H - 20 - flThick, flLen, flThick);
    ctx.fillRect(W - 20 - flThick, H - 20 - flLen, flThick, flLen);

    // Inner frame
    ctx.lineWidth = 4;
    ctx.strokeRect(70, 70, W - 140, H - 140);

    // Crest circle & rings
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 180, 50, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(197, 160, 89, 0.08)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    ctx.font = "50px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💍", W / 2, 180);
    ctx.restore();

    // Monogram
    ctx.fillStyle = accentColor;
    ctx.font = "bold 34px Cinzel, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("K & S", W / 2, 265);

    // Couple Names
    ctx.fillStyle = qrColor;
    ctx.font = "bold 82px Cinzel, Georgia, serif";
    ctx.fillText(coupleNames.toUpperCase(), W / 2, 370);

    // Rule line
    ctx.fillStyle = accentColor;
    ctx.fillRect(W / 2 - 140, 410, 280, 3);

    // Headline
    ctx.fillStyle = accentColor;
    ctx.font = "600 36px Inter, sans-serif";
    ctx.fillText(headline.toUpperCase(), W / 2, 475);

    // Draw QR Code
    const qrCanvas = document.querySelector("#live-qr-code-element canvas");
    const qrImg = document.querySelector("#live-qr-code-element img");
    const qrSize = 800;
    const qrX = (W - qrSize) / 2;
    const qrY = 540;

    // QR container box shadow & bg
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);

    if (qrCanvas) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    } else if (qrImg) {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    // Monogram badge in center of QR
    if (showMonogram) {
      const badgeR = 65;
      const bX = W / 2;
      const bY = qrY + qrSize / 2;
      ctx.beginPath();
      ctx.arc(bX, bY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.font = "60px serif";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💍", bX, bY);
    }

    // Call-to-action Prompt
    ctx.fillStyle = "#475569";
    ctx.font = "500 38px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Wrap prompt text
    const maxTextWidth = W - 320;
    const words = instructions.split(" ");
    let line = "";
    let curY = 1460;
    words.forEach(word => {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && line !== "") {
        ctx.fillText(line.trim(), W / 2, curY);
        line = word + " ";
        curY += 52;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line.trim(), W / 2, curY);

    // Date & Venue Footer
    ctx.fillStyle = qrColor;
    ctx.font = "bold 44px Cinzel, Georgia, serif";
    ctx.fillText(dateVenue.toUpperCase(), W / 2, 1920);

    // URL slug
    ctx.fillStyle = "#94a3b8";
    ctx.font = "32px monospace";
    ctx.fillText(fullUrl, W / 2, 1980);

    // Download trigger
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Karen_Steven_Wedding_QR_Card.png";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("High-resolution printable card downloaded (300 DPI)!", "success");
    }, "image/png");
  }

  function downloadQrOnly() {
    const fullUrl = getFullDestinationUrl();
    const qrColor = getVal("qr_color") || "#04225c";
    const bgColor = getVal("qr_bg_color") || "#ffffff";
    const accentColor = getVal("qr_accent_color") || "#c5a059";
    const showMonogram = getCheck("qr_show_monogram");

    const W = 1000;
    const H = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const qrCanvas = document.querySelector("#live-qr-code-element canvas");
    const qrImg = document.querySelector("#live-qr-code-element img");
    const qrSize = 880;
    const qrX = (W - qrSize) / 2;
    const qrY = (H - qrSize) / 2;

    if (qrCanvas) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    } else if (qrImg) {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    if (showMonogram) {
      const badgeR = 68;
      const bX = W / 2;
      const bY = H / 2;
      ctx.beginPath();
      ctx.arc(bX, bY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.font = "64px serif";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💍", bX, bY);
    }

    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Karen_Steven_Website_QR.png";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Standalone QR Code image downloaded!", "success");
    }, "image/png");
  }

  // Global methods for quick overview buttons
  window.quickPrintWeddingCard = function() {
    openPrintableWindow();
  };

  window.downloadQuickQrOnly = function() {
    downloadQrOnly();
  };

  /* ==========================================================================
     HELPERS & TOASTS
     ========================================================================== */
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : "";
  }
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }
  function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.innerHTML = "<span>" + (type === "success" ? "✓" : "⚠️") + "</span><span>" + escapeHtml(msg) + "</span>";
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || "").replace(/\"/g, "&quot;");
  }
});
