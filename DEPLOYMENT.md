# Karen & Steven Wedding Website - Docker & Tailscale Deployment Guide

This guide provides step-by-step instructions for deploying the **Karen & Steven Wedding Invitation Site and Administrative Dashboard** inside a Docker container with **Tailscale** integration.

---

## 🏗️ Architecture Overview

The deployment uses a **Docker Compose sidecar pattern**:
- **`tailscale` container**: Runs the official Tailscale daemon with a persistent state volume. It connects directly to your private Tailscale tailnet and registers the hostname `karen-steven-wedding`.
- **`web` container**: Runs the production Flask application via **Gunicorn** (multi-worker WSGI server). It uses `network_mode: "service:tailscale"`, attaching directly to the Tailscale container's network stack.
- **Persistent Volumes**: Stores the SQLite database (`instance/test.db`) and uploaded media (`frontend/uploads/`) securely across container restarts and updates.

---

## 📋 Prerequisites

1. **Docker & Docker Compose** installed:
   ```bash
   docker --version
   docker compose version
   ```
2. A **Tailscale account** ([tailscale.com](https://tailscale.com)).
3. Linux, macOS, or Windows with WSL2.

---

## 🚀 Step-by-Step Deployment

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Generate a Tailscale Auth Key
1. Log in to your [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys).
2. Click **Generate auth key...**.
3. Settings:
   - **Reusable**: Enabled (if you plan to rebuild or recreate containers).
   - **Expiration**: As desired (e.g. 90 days or custom).
   - **Ephemeral**: Disabled (so the device identity and IP persist).
   - **Tags**: Optional (e.g., `tag:server` or `tag:container`).
4. Copy the generated key (looks like `tskey-auth-k...`) and paste it into `.env`:
   ```bash
   TS_AUTHKEY=tskey-auth-k123456789-xxxxxxxxxxxxxxxxxxxx
   ```

### 3. Build and Start the Containers
Run Docker Compose in detached mode:
```bash
docker compose up -d --build
```

### 4. Verify Container Status
Check that both containers are healthy and running:
```bash
docker compose ps
```

Check the logs to verify Tailscale connected and Gunicorn started:
```bash
# Tailscale logs:
docker compose logs tailscale

# Web app logs:
docker compose logs -f web
```

---

## 🌐 Accessing the Website

### Option A: Private Access via Tailscale (Tailnet)
Any device connected to your Tailscale network (phone, laptop, tablet) can access:
- **MagicDNS Domain**: `http://karen-steven-wedding:5000`
- **Tailscale IP**: `http://<tailscale-ip>:5000` (run `docker exec wedding-tailscale tailscale ip -4` to find the IP)

### Option B: Local Network / Host Access
By default, port `5000` is mapped to the host machine:
- **Localhost**: `http://localhost:5000`
- **LAN IP**: `http://<your-local-ip>:5000`

### Option C: Public Access for Guests via Tailscale Funnel 🌍
If you want wedding guests to access the website publicly from anywhere without installing Tailscale, you can enable **Tailscale Funnel** with HTTPS:

1. Enable Funnel in your Tailscale Admin Console:
   - Go to **Access Controls** and allow `funnel` for your node/tag.
2. Run Funnel inside the container:
   ```bash
   docker exec -it wedding-tailscale tailscale funnel --bg 5000
   ```
3. Your wedding site will now be live on the public internet with a free, automatic TLS/SSL certificate:
   `https://karen-steven-wedding.<your-tailnet-name>.ts.net`

---

## 🔐 Administrative Dashboard

- **Login URL**: `/admin/login`
- **Default Username**: `admin`
- **Default Password**: `@P@ssw0rd`
- **Features**:
  - Edit all 10 wedding sections (Home, Save the Date, Location, Timeline, Dress Code, Entourage, Reminders, Playlist, RSVP, Prenup).
  - Upload photos, videos, and music.
  - Manage guest RSVPs and export attendee lists.

---

## 🛠️ Maintenance & Useful Commands

### Stop the Containers
```bash
docker compose down
```

### Restart the Containers
```bash
docker compose restart
```

### View Live Logs
```bash
docker compose logs -f
```

### Rebuild After Code Changes
```bash
docker compose up -d --build
```

### Backup Database & Media Files
The SQLite database and uploaded media are stored in named Docker volumes:
- `wedding_instance_db`
- `wedding_user_uploads`

To copy the database out of the container to your host:
```bash
docker cp wedding-web:/app/instance/test.db ./backup_test.db
docker cp wedding-web:/app/frontend/uploads ./backup_uploads
```

---

## 🏔️ Standalone Alpine Linux Container Deployment (with Tailscale Funnel)

If you prefer to run everything inside a single lightweight **Alpine Linux container** at `/var/www/karen-steven`:

### 1. Launch the Alpine Container
Tailscale requires network permissions and the host TUN device:
```bash
docker run -it --name karen-steven-alpine \
  --device /dev/net/tun:/dev/net/tun \
  --cap-add=NET_ADMIN \
  --cap-add=NET_RAW \
  -v karen_data:/var/www/karen-steven/instance \
  -v karen_uploads:/var/www/karen-steven/frontend/uploads \
  -v tailscale_state:/var/lib/tailscale \
  alpine:latest sh
```

### 2. Inside the Alpine Container:
```sh
# A. Install system packages and native C libraries
apk update && apk add --no-cache \
  python3 \
  py3-pip \
  py3-pillow \
  py3-flask \
  py3-requests \
  py3-gunicorn \
  git \
  tailscale \
  iptables \
  ca-certificates

# B. Clone the repository into /var/www/karen-steven
mkdir -p /var/www
git clone https://github.com/Lexyl1225/karen_steven.git /var/www/karen-steven
cd /var/www/karen-steven

# C. Install remaining Python dependencies
pip install --break-system-packages -r requirements.txt

# D. Start the Tailscale daemon in the background
tailscaled --state=/var/lib/tailscale/tailscaled.state &

# E. Authenticate with Tailscale (replace with your auth key or run interactive login)
tailscale up --hostname=karen-steven-wedding --authkey=tskey-auth-YOUR_KEY

# F. Start the Flask application
python3 app.py &
# (Or production-grade with 4 workers: gunicorn -w 4 -b 0.0.0.0:5000 app:app &)

# G. Expose the application to the public internet via Tailscale Funnel
tailscale funnel --bg 5000
```
Your wedding website is now publicly live at:
`https://karen-steven-wedding.<your-tailnet>.ts.net`

