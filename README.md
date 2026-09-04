# 💍 Karen & Steven Wedding Invitation & Admin Portal

A luxury wedding invitation website and administrative content management dashboard built with Flask, Canva layout integration, and SQLite.

![Wedding Banner](frontend/_assets/images/6776a3b6463c8fb90b9f4ba414415d93.jpg)

## ✨ Features

- **Luxury Responsive Wedding Experience**:
  - Full-featured wedding sections: *Home*, *Save the Date*, *Location & Maps*, *Timeline*, *Dress Code*, *Entourage*, *Reminders*, *Playlist*, *In-Page RSVP & Guestbook*, and *Prenup Gallery*.
  - Smart autohide navigation header with smooth glide-on-scroll.
  - Interactive in-page RSVP with instant status badges (Accepted / Regretfully Declining).
- **Administrative Portal (`/admin`)**:
  - Full WYSIWYG control over all 10 wedding sections.
  - Media library with drag-and-drop photo/video uploader.
  - Guest RSVP management with real-time counters and notes tracking.
  - Secure session-based authentication with token headers.
- **Docker & Tailscale Deployment**:
  - Ready-to-deploy Docker Compose stack with Tailscale VPN integration.
  - Supports private tailnet access, local network access, and public guest access via Tailscale Funnel.

---

## 🚀 Quick Start (Local Development)

### 1. Set Up Python Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the Development Server
```bash
python3 app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🐳 Docker & Tailscale Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions on deploying with Docker and Tailscale:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your Tailscale Auth Key to .env
# TS_AUTHKEY=tskey-auth-...

# 3. Start containers
docker compose up -d --build
```

---

## 🔐 Admin Access

- **URL**: `http://localhost:5000/admin/login`
- **Default Username**: `admin`
- **Default Password**: `@P@ssw0rd`

---

## 📄 License
Private wedding invitation site for Karen & Steven.
