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
