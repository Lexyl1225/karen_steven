/**
 * Karen & Steven Wedding - Dynamic Live Customizer
 * Syncs customized section options from /api/sections to the live website.
 * Operates non-intrusively with zero CSS modifications.
 */
(function () {
  'use strict';

  async function applyCustomizations() {
    try {
      const resp = await fetch('/api/sections', {
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || typeof data !== 'object') return;

      // 1. Page Options
      if (data.page_options) {
        if (data.page_options.site_title) {
          document.title = data.page_options.site_title;
        }
        if (data.page_options.show_floating_rsvp === false) {
          const pill = document.getElementById('rsvp-floating-pill');
          if (pill) pill.style.display = 'none';
        }
      }

      // 2. Wait for Canva React app to render root DOM
      let retries = 0;
      const interval = setInterval(() => {
        retries++;
        const root = document.getElementById('root');
        if ((root && root.children.length > 0) || retries > 30) {
          clearInterval(interval);
          updateDomElements(data);
        }
      }, 250);

    } catch (e) {
      // Graceful offline fallback
    }
  }

  function updateDomElements(data) {
    // A. Location Maps
    if (data.location) {
      const links = document.querySelectorAll('a[href*="maps.app.goo.gl"], a[href*="google.com/maps"]');
      if (links.length >= 2) {
        if (data.location.ceremony_map_url) links[0].href = data.location.ceremony_map_url;
        if (data.location.reception_map_url) links[1].href = data.location.reception_map_url;
      } else if (links.length === 1 && data.location.ceremony_map_url) {
        links[0].href = data.location.ceremony_map_url;
      }
    }

    // B. Spotify Playlist
    if (data.playlist && data.playlist.spotify_url) {
      const spotifyFrames = document.querySelectorAll('iframe[src*="spotify.com"]');
      const match = data.playlist.spotify_url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (spotifyFrames.length > 0 && match && match[1]) {
        const newEmbed = 'https://open.spotify.com/embed/playlist/' + match[1];
        spotifyFrames.forEach(f => { f.src = newEmbed; });
      }
    }

    // C. Video Short
    if (data.home && data.home.video_url) {
      const ytFrames = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]');
      const ytMatch = data.home.video_url.match(/(?:shorts\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
      if (ytFrames.length > 0 && ytMatch && ytMatch[1]) {
        const newEmbed = 'https://www.youtube-nocookie.com/embed/' + ytMatch[1];
        ytFrames.forEach(f => { f.src = newEmbed; });
      }
    }

    // D. Reroute any legacy RSVP links to in-page RSVP form
    document.querySelectorAll('a[href*="forms.gle"]').forEach(a => {
      a.href = 'javascript:void(0)';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.scrollToRsvp === 'function') {
          window.scrollToRsvp();
        }
      });
    });

    // E. Countdown embed
    if (data.save_the_date && data.save_the_date.countdown_embed) {
      const countFrames = document.querySelectorAll('iframe[src*="betterimages.ai"]');
      countFrames.forEach(f => { f.src = data.save_the_date.countdown_embed; });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCustomizations);
  } else {
    applyCustomizations();
  }
})();
