import os
from groq import Groq
<<<<<<< HEAD
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
=======
# from .audio_preprocessing import AudioPreprocessingService
>>>>>>> 78d71f9 (optmizing project strcture)

class SpeechService:
    """Service for speech recognition with audio preprocessing."""
    
    @staticmethod
    def transcribe_audio(audio_file_path, api_key, language="en", preprocess=True):
        """
        Transcribe audio file to text with optional preprocessing.
        
        Args:
            audio_file_path: Path to the audio file
            api_key: Groq API key
            language: Language code (default: "en" for English)
            preprocess: Whether to apply audio preprocessing
            
        Returns:
            Transcribed text
<<<<<<< HEAD
            
        Raises:
            FileNotFoundError: If the audio file doesn't exist
            ValueError: If the audio format is invalid
            Exception: For other transcription failures
        """
        processed_file_path = audio_file_path
        temp_file_created = False
        
        try:
            # Validate input file exists
            if not os.path.exists(audio_file_path):
                raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
                
            # Apply preprocessing if requested
            if preprocess:
                from .audio_preprocessing import AudioPreprocessingService
                processed_file_path = AudioPreprocessingService.preprocess(audio_file_path)
                temp_file_created = processed_file_path != audio_file_path
                logger.info(f"Audio preprocessing applied: {audio_file_path} → {processed_file_path}")
            
            # Initialize Groq client
            client = Groq(api_key=api_key)
            
            # Perform transcription
            logger.info(f"Starting transcription for {processed_file_path} in {language}")
=======
        """
        try:
            processed_file_path = audio_file_path
            
            # Perform transcription with Groq/Whisper
            client = Groq(api_key=api_key)
>>>>>>> 78d71f9 (optmizing project strcture)
            with open(processed_file_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(processed_file_path, file.read()),
                    model="whisper-large-v3-turbo",
                    response_format="json",
                    language=language,
                    temperature=0.0
                )
            
<<<<<<< HEAD
            logger.info(f"Transcription completed successfully: {len(transcription.text)} characters")
            return transcription.text
            
        except FileNotFoundError as e:
            logger.error(f"File error: {str(e)}")
            raise
        except ValueError as e:
            logger.error(f"Value error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise Exception(f"Audio transcription failed: {str(e)}")
        finally:
            # Clean up temporary processed file if needed
            if temp_file_created and os.path.exists(processed_file_path):
                logger.debug(f"Cleaning up temporary file: {processed_file_path}")
                os.remove(processed_file_path)
=======
            # Clean up temporary processed file if it's different from the original
            if processed_file_path != audio_file_path and os.path.exists(processed_file_path):
                os.remove(processed_file_path)
                
            return transcription.text
            
        except Exception as e:
            # Clean up any temporary files in case of error
            if processed_file_path != audio_file_path and os.path.exists(processed_file_path):
                os.remove(processed_file_path)
            raise Exception(f"Audio transcription failed: {str(e)}")
>>>>>>> 78d71f9 (optmizing project strcture)
