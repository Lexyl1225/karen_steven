from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_sqlalchemy import SQLAlchemy
import os
import json
import secrets
import time
from datetime import datetime
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder="frontend/", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "karen-steven-wedding-secret-key-2026")

# Database config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Upload folder config
UPLOAD_FOLDER = os.path.join(app.root_path, "frontend", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "svg", "mp4", "webm", "mov", "m4v"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

db = SQLAlchemy(app)

# Active admin sessions store: token -> user_id
_active_sessions = {}

def _create_session(user):
    token = secrets.token_hex(32)
    _active_sessions[token] = user.id
    return token

def _set_session_cookie(resp, token):
    resp.set_cookie("admin_session", token, httponly=True, samesite="Lax", max_age=86400 * 7)

def get_current_user():
    token = request.cookies.get("admin_session") or request.headers.get("X-Admin-Token")
    if not token and request.headers.get("Authorization"):
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    if not token or token not in _active_sessions:
        return None
    user_id = _active_sessions[token]
    return User.query.get(user_id)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.name != "admin":
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized - admin access required"}), 401
            return redirect("/admin/login")
        return f(*args, **kwargs)
    return decorated

# -----------------------------
# Models
# -----------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(1000), nullable=True)

class SiteConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    section = db.Column(db.String(50), unique=True, nullable=False)
    data = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# -----------------------------
# Default Section Configuration
# -----------------------------
DEFAULT_SECTIONS = {
    "home": {
        "bride_name": "Karen",
        "groom_name": "Steven",
        "title": "THE WEDDING",
        "date_text": "September 18, 2026",
        "rsvp_btn_text": "RSVP HERE",
        "video_url": "https://m.youtube.com/shorts/xlX_0NDfE3c",
        "background_image": "_assets/images/6776a3b6463c8fb90b9f4ba414415d93.jpg",
        "subtitle": "You are Invited!"
    },
    "save_the_date": {
        "title": "Our Big Day Awaits",
        "subtitle": "Save the Date",
        "month_year": "September 2026",
        "wedding_date": "2026-09-18",
        "highlight_day": "18",
        "countdown_embed": "https://dfzpu93ycp7qo.betterimages.ai/i:AFHooxUV6P/cv:1784989290/embed",
        "image": "_assets/media/c733895c2b3072199518ff7b0cffd358.jpg"
    },
    "location": {
        "ceremony_title": "Wedding Ceremony",
        "ceremony_church": "Iglesia Ni Cristo",
        "ceremony_sub": "Lokal ng Rosario",
        "ceremony_city": "Santiago City",
        "ceremony_map_url": "https://maps.app.goo.gl/4zqntRy8gpKKDxDu6?g_st=ac",
        "reception_title": "Wedding Reception",
        "reception_venue": "Alleria Events Place",
        "reception_city": "Santiago City",
        "reception_map_url": "https://maps.app.goo.gl/NeWNTmFpfqihmKr37?g_st=ac",
        "ceremony_image": "_assets/media/296bbcc011e2b50b4ac6eb222be0dc0f.jpg",
        "reception_image": "_assets/media/d759ffc4a7c6a62df96555e01214d3fa.jpg"
    },
    "timeline": {
        "title": "Wedding Timeline",
        "subtitle": "Program for our special day",
        "events": [
            {"time": "3:00 PM", "title": "Wedding Ceremony", "description": "Solemnization at Iglesia Ni Cristo Lokal ng Rosario"},
            {"time": "5:00 PM", "title": "Photo Session", "description": "Capturing sweet moments with family & friends"},
            {"time": "6:00 PM", "title": "Venue Arrival", "description": "Cocktails and welcome drinks at Alleria Events Place"},
            {"time": "7:00 PM", "title": "Dinner Reception", "description": "Sumptuous dinner, toasts, and program"},
            {"time": "8:00 PM", "title": "Time to Party", "description": "Dancing, celebration, and joyous memories"}
        ]
    },
    "dress_code": {
        "title": "Dress Code",
        "ladies": "Maxi Dress | Long Gown",
        "gentlemen": "Formal Polo or Long Sleeves | Black Slacks",
        "notes": "Please wear shades of DUSTY BLUE and LAVENDER to compliment the theme.",
        "attire_rule": "Formal Attire is strictly requested.",
        "colors": ["#4a6984", "#742374", "#9bb0c1", "#cbb3cc", "#c5a059"],
        "guide_image": "_assets/media/47d9d7f93ecc64daf3d22daee9249d7a.jpg"
    },
    "entourage": {
        "title": "The Entourage",
        "subtitle": "Standing beside us on our special day",
        "best_man": "Ricky P. Fernandez",
        "maid_of_honor": "Marissa P. Fernandez",
        "groomsmen": [
            "Ricky P. Fernandez",
            "Pat. Christian Jade Espiritu",
            "Jhonny Molina",
            "FO1 Marc Dale Cariaga"
        ],
        "bridesmaids": [
            "Marissa P. Fernandez",
            "Kareen B. Camba",
            "Monica G. Molina",
            "Mary Lolly O. Fernandez"
        ]
    },
    "reminders": {
        "title": "Reminders & Guidelines",
        "intimate_note": "We are keeping our guest list intentional and intimate. Though we wish we could invite everyone, we are unable to accommodate a plus one at this time.",
        "dress_code_note": "We kindly request all guests to observe the prescribed dress code and dress appropriately for our special day.",
        "unplugged_ceremony": "Please keep phones on silent during the ceremony so everyone can be fully present.",
        "punctuality": "Please arrive 30 minutes prior to the ceremony start time."
    },
    "playlist": {
        "title": "Our Wedding Playlist",
        "subtitle": "Wedding playlist (Click to play)",
        "spotify_url": "https://open.spotify.com/playlist/10ZmntL2QY4ygLYP3odjyn?si=JETwBJ4YQwilM1Kt6Vui1A%0A",
        "notes": "Listen to our curated love songs celebrating our journey."
    },
    "rsvp": {
        "title": "RSVP",
        "description": "We would be delighted if you could join us. Please confirm your attendance on or before SEPTEMBER 06, 2026.",
        "deadline": "September 06, 2026",
        "google_form_url": "https://forms.gle/uwkGwfMKvKUDLRDy9",
        "enable_direct_rsvp": True,
        "enable_guestbook": True
    },
    "prenup": {
        "title": "Prenup Photos & Gallery",
        "subtitle": "Our Love Story in Frames",
        "photos": [
            "_assets/media/2a1e77950c27f7ed5397700782d1eeb7.jpg",
            "_assets/media/7ede13e1a998ed6b7c330784c0aa0a12.jpg",
            "_assets/media/c53e1f8e97ccbce5095b66d7e59ce0f2.jpg",
            "_assets/media/af04ed154bc249cb21176f4c5ce509c2.jpg",
            "_assets/media/b10c737a13aca7187456b5641f7dff16.jpg",
            "_assets/media/3dcfa17230f541b88dfc575fd28d789b.jpg"
        ]
    },
    "page_options": {
        "site_title": "You are Invited! Karen & Steven Wedding",
        "meta_description": "Join us to celebrate the wedding of Karen and Steven on September 18, 2026 in Santiago City.",
        "show_floating_rsvp": True,
        "show_guest_wishes": True,
        "primary_color": "#04225c",
        "secondary_color": "#742374",
        "accent_color": "#4a6984"
    }
}

def init_db_defaults():
    db.create_all()
    # Ensure admin user with password '@P@ssw0rd'
    admin = User.query.filter_by(name="admin").first()
    hashed_pwd = generate_password_hash("@P@ssw0rd")
    admin_desc = json.dumps({"role": "admin", "hashed_password": hashed_pwd})
    if not admin:
        admin = User(name="admin", description=admin_desc)
        db.session.add(admin)
    else:
        try:
            desc_obj = json.loads(admin.description) if admin.description else {}
        except Exception:
            desc_obj = {}
        if not desc_obj.get("hashed_password") or not check_password_hash(desc_obj.get("hashed_password", ""), "@P@ssw0rd"):
            desc_obj["role"] = "admin"
            desc_obj["hashed_password"] = hashed_pwd
            admin.description = json.dumps(desc_obj)

    # Ensure all section configs exist
    for sec_name, sec_data in DEFAULT_SECTIONS.items():
        cfg = SiteConfig.query.filter_by(section=sec_name).first()
        if not cfg:
            cfg = SiteConfig(section=sec_name, data=json.dumps(sec_data))
            db.session.add(cfg)
    
    db.session.commit()

with app.app_context():
    init_db_defaults()

# -----------------------------
# Home Page & Static Fallbacks
# -----------------------------
@app.route("/")
def index():
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Flask API is running", "endpoints": ["/users", "/users/<user_id>"]})

@app.route("/_footer")
def footer_endpoint():
    footer_path = os.path.join(app.static_folder, "_footer")
    if os.path.exists(footer_path):
        return send_from_directory(app.static_folder, "_footer", mimetype="text/html")
    return ""

@app.route("/_website-element-widget")
def widget_endpoint():
    widget_path = os.path.join(app.static_folder, "_website-element-widget")
    if os.path.exists(widget_path):
        return send_from_directory(app.static_folder, "_website-element-widget", mimetype="text/html")
    return jsonify({"error": "Widget not found"}), 404

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# -----------------------------
# Admin Page Routes
# -----------------------------
@app.route("/admin")
def admin_root():
    user = get_current_user()
    if user and user.name == "admin":
        return redirect("/admin/dashboard")
    return redirect("/admin/login")

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login_page():
    user = get_current_user()
    if user and user.name == "admin":
        return redirect("/admin/dashboard")

    if request.method == "POST":
        data = request.get_json(silent=True) if request.is_json else (request.form or {})
        name = (data.get("name") or data.get("username") or "").strip()
        password = data.get("password") or ""
        if name and password:
            u = User.query.filter_by(name=name).first()
            if u:
                try:
                    desc_obj = json.loads(u.description) if u.description else {}
                except Exception:
                    desc_obj = {}
                stored_hashed_password = desc_obj.get("hashed_password") if isinstance(desc_obj, dict) else None
                valid = False
                if stored_hashed_password:
                    try:
                        valid = check_password_hash(stored_hashed_password, password)
                    except Exception:
                        valid = False
                elif u.name == "admin" and password == "@P@ssw0rd":
                    valid = True

                if valid:
                    token = _create_session(u)
                    resp = redirect("/admin/dashboard")
                    _set_session_cookie(resp, token)
                    return resp

    login_html = os.path.join(app.static_folder, "admin", "login.html")
    if os.path.exists(login_html):
        return send_from_directory(os.path.dirname(login_html), "login.html")
    return "Login page is being prepared", 200

@app.route("/admin/dashboard")
@admin_required
def admin_dashboard_page():
    dashboard_html = os.path.join(app.static_folder, "admin", "dashboard.html")
    if os.path.exists(dashboard_html):
        return send_from_directory(os.path.dirname(dashboard_html), "dashboard.html")
    return "Dashboard page is being prepared", 200

@app.route("/admin/logout")
def admin_logout():
    token = request.cookies.get("admin_session")
    if token and token in _active_sessions:
        del _active_sessions[token]
    resp = redirect("/admin/login")
    resp.delete_cookie("admin_session")
    return resp

# -----------------------------
# Admin & Auth API Endpoints
# -----------------------------
@app.route("/api/login", methods=["POST"])
@app.route("/login", methods=["POST"])
def login():
    if request.is_json:
        data = request.get_json(silent=True) or {}
    else:
        data = request.form or {}
    name = (data.get("name") or data.get("username") or "").strip()
    password = data.get("password") or ""

    if not name or not password:
        return jsonify({"error": "Name and password are required"}), 400

    user = User.query.filter_by(name=name).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 404

    try:
        stored_description = json.loads(user.description) if user.description else {}
    except (TypeError, ValueError):
        stored_description = {}

    stored_hashed_password = stored_description.get("hashed_password") if isinstance(stored_description, dict) else None
    valid = False
    if stored_hashed_password:
        try:
            valid = check_password_hash(stored_hashed_password, password)
        except Exception:
            valid = False
    elif user.name == "admin" and password == "@P@ssw0rd":
        valid = True

    if not valid:
        return jsonify({"error": "Invalid credentials"}), 401

    token = _create_session(user)
    resp = jsonify({"message": "Login successful", "token": token, "username": user.name})
    _set_session_cookie(resp, token)
    return resp

@app.route("/api/logout", methods=["POST"])
def api_logout():
    token = request.cookies.get("admin_session") or request.headers.get("X-Admin-Token")
    if token and token in _active_sessions:
        del _active_sessions[token]
    resp = jsonify({"message": "Logged out successfully"})
    resp.delete_cookie("admin_session")
    return resp

@app.route("/api/me", methods=["GET"])
def api_me():
    user = get_current_user()
    if user:
        return jsonify({"authenticated": True, "username": user.name, "is_admin": user.name == "admin"})
    return jsonify({"authenticated": False}), 200

# -----------------------------
# Section Configuration API
# -----------------------------
@app.route("/api/sections", methods=["GET"])
def get_sections():
    configs = SiteConfig.query.all()
    result = {}
    for c in configs:
        try:
            result[c.section] = json.loads(c.data)
        except Exception:
            result[c.section] = c.data
    return jsonify(result)

@app.route("/api/sections/<string:section_name>", methods=["GET"])
def get_section(section_name):
    cfg = SiteConfig.query.filter_by(section=section_name).first()
    if not cfg:
        if section_name in DEFAULT_SECTIONS:
            return jsonify(DEFAULT_SECTIONS[section_name])
        return jsonify({"error": "Section not found"}), 404
    try:
        return jsonify(json.loads(cfg.data))
    except Exception:
        return jsonify(cfg.data)

@app.route("/api/sections/<string:section_name>", methods=["PUT"])
@admin_required
def update_section(section_name):
    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body required"}), 400

    cfg = SiteConfig.query.filter_by(section=section_name).first()
    if not cfg:
        cfg = SiteConfig(section=section_name, data=json.dumps(data))
        db.session.add(cfg)
    else:
        cfg.data = json.dumps(data)
        cfg.updated_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"message": f"Section '{section_name}' updated successfully", "section": section_name, "data": data})

# -----------------------------
# File Upload & Media API
# -----------------------------
@app.route("/api/upload", methods=["POST"])
@admin_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"}), 400

    orig_name = secure_filename(file.filename)
    name_root, ext = os.path.splitext(orig_name)
    timestamp = int(time.time())
    unique_filename = f"{name_root}_{timestamp}{ext}"
    target_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(target_path)

    file_size = os.path.getsize(target_path)
    file_type = "video" if ext.lower() in [".mp4", ".webm", ".mov", ".m4v"] else "image"
    url = f"/uploads/{unique_filename}"

    return jsonify({
        "success": True,
        "filename": unique_filename,
        "url": url,
        "type": file_type,
        "size": file_size
    }), 201

@app.route("/api/media", methods=["GET"])
@admin_required
def list_media():
    files = []
    if os.path.exists(UPLOAD_FOLDER):
        for fname in sorted(os.listdir(UPLOAD_FOLDER), reverse=True):
            fpath = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.isfile(fpath):
                stat = os.stat(fpath)
                ext = os.path.splitext(fname)[1].lower()
                ftype = "video" if ext in [".mp4", ".webm", ".mov", ".m4v"] else "image"
                files.append({
                    "filename": fname,
                    "url": f"/uploads/{fname}",
                    "type": ftype,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                })
    return jsonify(files)

@app.route("/api/media/<string:filename>", methods=["DELETE"])
@admin_required
def delete_media(filename):
    safe_name = secure_filename(filename)
    target_path = os.path.join(UPLOAD_FOLDER, safe_name)
    if os.path.exists(target_path):
        os.remove(target_path)
        return jsonify({"message": f"File '{safe_name}' deleted"})
    return jsonify({"error": "File not found"}), 404

# -----------------------------
# RSVPs Management API
# -----------------------------
@app.route("/api/rsvps", methods=["GET"])
@admin_required
def get_rsvps():
    users = User.query.filter(User.name != "admin").all()
    rsvps = []
    attending_count = 0
    declined_count = 0

    for u in users:
        desc = u.description or ""
        try:
            if desc.startswith("{") and desc.endswith("}"):
                desc = json.loads(desc).get("notes", desc)
        except Exception:
            pass

        is_declined = any(w in desc.lower() for w in ["declining", "regret", "declined", "unable"])
        if is_declined:
            declined_count += 1
            status = "Declined"
        else:
            attending_count += 1
            status = "Attending"

        rsvps.append({
            "id": u.id,
            "name": u.name,
            "description": desc,
            "status": status
        })

    return jsonify({
        "total": len(rsvps),
        "attending": attending_count,
        "declined": declined_count,
        "rsvps": rsvps
    })

@app.route("/api/rsvps/<int:rsvp_id>", methods=["DELETE"])
@admin_required
def delete_rsvp(rsvp_id):
    user = User.query.get_or_404(rsvp_id)
    if user.name == "admin":
        return jsonify({"error": "Cannot delete admin account"}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "RSVP deleted successfully"})

# -----------------------------
# GET ALL USERS (Public / RSVP list)
# -----------------------------
@app.route("/users", methods=["GET"])
def get_users():
    users = User.query.filter(User.name != "admin").all()
    return jsonify([{"id": u.id, "name": u.name, "description": u.description} for u in users])

# -----------------------------
# GET ONE USER
# -----------------------------
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({"id": user.id, "name": user.name, "description": user.description})

# -----------------------------
# CREATE USER (POST)
# -----------------------------
@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "Name is required"}), 400

    description = data.get("description", "")
    password = data.get("password")
    if password:
        desc_data = {"notes": description, "hashed_password": generate_password_hash(password)}
        description = json.dumps(desc_data)

    user = User.query.filter_by(name=name).first()
    if user:
        user.description = description
        db.session.commit()
        return jsonify({"message": "User updated", "id": user.id}), 200

    new_user = User(name=name, description=description)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created", "id": new_user.id}), 201

# -----------------------------
# UPDATE USER (PUT)
# -----------------------------
@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    user.name = data.get("name", user.name)
    user.description = data.get("description", user.description)
    db.session.commit()
    return jsonify({"message": "User updated"})

# -----------------------------
# DELETE USER
# -----------------------------
@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})

if __name__ == "__main__":
    app.run(debug=True)
