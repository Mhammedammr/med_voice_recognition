import os
from dotenv import load_dotenv

load_dotenv()

# config.py - Configuration management
import os

class Config:
    """Base configuration."""

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg'}
    DEBUG = True
    TESTING = False
    PORT = 8586
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")

    # Create upload folder if it doesn't exist
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
