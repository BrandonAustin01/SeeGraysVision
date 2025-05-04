from flask import Flask, request, redirect, url_for, send_from_directory, jsonify
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename

# ==========================
# SeeGraysVision Backend Server
# Handles photo uploads with metadata and gallery listing
# ==========================

# --- Setup ---
app = Flask(__name__)
CORS(app)

# --- Configuration ---
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_FOLDER = os.path.join(basedir, 'assets', 'img', 'uploads')
DATA_FOLDER = os.path.join(basedir, 'data')
PHOTOS_JSON = os.path.join(DATA_FOLDER, 'photos.json')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_SECRET = "seegraysvision_secret"

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Set upload folder in Flask config
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Helper Functions ---

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_photos_metadata():
    if not os.path.exists(PHOTOS_JSON):
        return []
    with open(PHOTOS_JSON, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_photos_metadata(metadata):
    with open(PHOTOS_JSON, 'w') as f:
        json.dump(metadata, f, indent=4)

# --- Routes ---

@app.route('/upload', methods=['POST'])
def upload_file():
    # Authorization check
    secret = request.headers.get('Authorization')
    if secret != UPLOAD_SECRET:
        return jsonify({'error': 'Unauthorized'}), 401

    # File validation
    if 'photo' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['photo']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        # --- Handle metadata ---
        title = request.form.get('title', '')
        tags = request.form.get('tags', '')
        description = request.form.get('description', '')

        new_photo = {
            'filename': filename,
            'title': title,
            'tags': tags,
            'description': description
        }

        photos_data = load_photos_metadata()
        photos_data.append(new_photo)
        save_photos_metadata(photos_data)

        return jsonify({'success': True, 'filename': filename}), 200

    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/gallery')
def gallery_images():
    photos_data = load_photos_metadata()
    return jsonify(photos_data)

# --- Main ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)
