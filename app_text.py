# app.py - Main application factory
from flask import Flask
from config import config
from src.extensions import db
from src.api import register_blueprints
import logging
<<<<<<< HEAD
import pandas as pd
from config import Config
from src.services.llm_service import LLMService
from utils.text_parser import parse_refined_text
=======
>>>>>>> 78d71f9 (optmizing project strcture)

def create_app(config_name="default"):
    """Application factory pattern."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Configure logging
    logging.basicConfig(
        level=app.config["LOG_LEVEL"],
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=app.config["DEBUG"], port=app.config["PORT"])