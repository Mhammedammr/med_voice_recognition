from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
import time
import pandas as pd
import logging
from typing import Optional
import os
import uvicorn

# Import your services
from config import Config
from src.services.audio_service import AudioService

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Audio Processing API")

# Set up templates and static files
templates = Jinja2Templates(directory="templates")

def load_forms_dataframe():
    try:
        logger.info("Loading forms dataframe from data_latest.parquet")
        df = pd.read_parquet("data_latest.parquet", engine="pyarrow")
        logger.info(f"Loaded dataframe with {len(df)} forms")
        return df
    except Exception as e:
        logger.error(f"Error loading forms dataframe: {str(e)}")
        return pd.DataFrame(columns=['name', 'json_format'])

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Initializing application")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the application frontend."""
    logger.info("Serving index page")
    return templates.TemplateResponse("audio/index_trial2.html", {"request": request})

@app.post("/upload")
async def upload(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    model: str = Form("deepseek"),
    isConversation: Optional[str] = Form(None)
):
    """Handle file uploads and processing."""
    logger.info("Received upload request")
    
    # Check conversational mode
    conversational_mode = isConversation == 'on'
    logger.info(f"Upload parameters: language={language}, conversational mode={conversational_mode}")
    
    # For recorded audio, set a default filename if none is provided
    if audio.filename == "":
        audio.filename = f"recorded_audio_{int(time.time())}.wav"
        logger.info(f"Set default filename: {audio.filename}")
    
    # Save the uploaded file
    try:
        # Create a temporary file object
        contents = await audio.read()
        file_path = os.path.join(Config.UPLOAD_FOLDER, audio.filename)
        
        # Ensure upload directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"File saved to {file_path}")
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
    try:
        logger.info("Starting batch processing mode")
        # Process the uploaded file
        response_data = AudioService.process_batch(file_path, language, model, conversational_mode)
        
        return {
            "raw_text": response_data["raw_text"],
            "arabic_text": response_data["arabic_text"],
            "translation_text": response_data["translation_text"],
            "json_data": response_data["json_data"],
            "reasoning": response_data["reasoning"],
            "preprocessing_time": response_data["preprocessing_time"],
            "voice_processing_time": response_data["voice_processing_time"],
            "llm_processing_time": response_data["llm_processing_time"]
        }
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    logger.info(f"Starting FastAPI server on port {Config.PORT}")
    uvicorn.run("test:app", host="0.0.0.0", port=Config.PORT, reload=Config.DEBUG)