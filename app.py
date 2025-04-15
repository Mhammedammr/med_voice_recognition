from flask import Flask, request, jsonify, render_template
import time
from config import Config
from src.services.audio_service import AudioService
from src.services.file_service import FileService
import pandas as pd
from src.utils import utils
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)


def load_forms_dataframe():
    try:
        logger.info("Loading forms dataframe from data_latest.parquet")
        df = pd.read_parquet("data_latest.parquet", engine="pyarrow")
        logger.info(f"Loaded dataframe with {len(df)} forms")
        return df
    except Exception as e:
        logger.error(f"Error loading forms dataframe: {str(e)}")
        return pd.DataFrame(columns=['name', 'json_format'])


@app.route("/")
def index():
    """Render the application frontend."""
    logger.info("Serving index page")
    return render_template("audio/index_trial2.html")

@app.route("/upload", methods=["POST"])
def upload():
    """Handle file uploads and processing."""
    logger.info("Received upload request")
    
    # Check if a file is uploaded
    if "audio" not in request.files:
        logger.warning("No audio file uploaded")
        return jsonify({"error": "No audio file uploaded"}), 400
    
    audio_file = request.files["audio"]
    language = request.form.get('language', 'en')
    model = request.form.get('model', 'deepseek')
    conversational_mode = request.form.get('isConversation') == 'on'
    # print(conversational_mode)
    logger.info(f"Upload parameters: language={language} ,conversational mode={conversational_mode}")
    
    # For recorded audio, set a default filename if none is provided
    if audio_file.filename == "":
        audio_file.filename = f"recorded_audio_{int(time.time())}.wav"
        logger.info(f"Set default filename: {audio_file.filename}")
    
    # Save the uploaded file
    try:
        file_path = FileService.save_file(audio_file, app.config["UPLOAD_FOLDER"])
        logger.info(f"File saved to {file_path}")
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
        
    try:
        logger.info("Starting batch processing mode")
        
        # Process the uploaded file
        response = AudioService.process_batch(file_path, language, model, conversational_mode)
        response_data = response.get_json()

        raw_text = response_data["raw_text"]
        arabic_text = response_data["arabic_text"]
        translation = response_data["translation_text"]
        json_data = response_data["json_data"]
        reasoning = response_data["reasoning"]
        preprocessing_time = response_data["preprocessing_time"]
        voice_time = response_data["voice_processing_time"]
        llm_time = response_data["llm_processing_time"]
        total_time = response_data["total_time"]
                
        # Return the results
        return jsonify({
            "raw_text": raw_text,
            "arabic_text": arabic_text,
            "translation_text": translation,
            "json_data": json_data,
            "reasoning": reasoning,
            "preprocessing_time": preprocessing_time,
            "voice_processing_time": voice_time,
            "llm_processing_time": llm_time
        })
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Ensure the database tables exist
    logger.info("Initializing application")
    logger.info("Starting Flask server on port 8586")
    app.run(debug=Config.DEBUG, port=Config.PORT)