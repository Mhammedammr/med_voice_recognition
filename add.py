import sqlite3
import logging

logger = logging.getLogger(__name__)

def add_missing_columns():
    """Add missing columns to the audio_results table"""
    try:
        conn = sqlite3.connect("app_data.db")
        cursor = conn.cursor()
        
        # Check if doctor_name column exists
        cursor.execute("PRAGMA table_info(audio_results)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add doctor_name column if it doesn't exist
        if "doctor_name" not in columns:
            cursor.execute("ALTER TABLE audio_results ADD COLUMN doctor_name TEXT")
            logger.info("Added 'doctor_name' column to audio_results table")
        
        # Add feedback column if it doesn't exist
        if "feedback" not in columns:
            cursor.execute("ALTER TABLE audio_results ADD COLUMN feedback TEXT")
            logger.info("Added 'feedback' column to audio_results table")
        
        conn.commit()
        logger.info("Database schema updated successfully")
        return True
    except Exception as e:
        logger.error(f"Error updating database schema: {str(e)}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Add the missing columns
    success = add_missing_columns()
    print(f"Database update {'successful' if success else 'failed'}")