from flask import Flask, request, jsonify, render_template
import time
import logging
import pandas as pd
from config import Config
from src.services.llm_service import LLMService
from utils.text_parser import parse_refined_text

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.config.from_object(Config)

# Load forms dataframe
# You'll need to replace this with your actual code to load the dataframe
def load_forms_dataframe():
    # Example implementation - replace with your actual dataframe loading code
    # This could be from a CSV, database, or any other source
    try:
        return pd.read_parquet("data_latest.parquet", engine="pyarrow")  # Adjust path as needed
    except Exception as e:
        logging.error(f"Error loading forms dataframe: {str(e)}")
        # Return an empty dataframe with the expected columns if loading fails
        return pd.DataFrame(columns=['name', 'json_format'])

@app.route("/")
def index_html():
    """Render the application frontend."""
    return render_template("index_text.html")

@app.route("/get_forms")
def get_forms():
    """Return the list of available forms."""
    try:
        forms_df = load_forms_dataframe()
        # Convert dataframe to list of dictionaries for JSON response
        forms_list = forms_df[['name', 'json_format']].to_dict(orient='records')
        return jsonify(forms_list)
    except Exception as e:
        logging.error(f"Error retrieving forms: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/upload", methods=["POST"])
def upload():
    """Handle form processing."""
    try:
        # Get the form JSON format from the request
        form_name = request.form.get('formName', '')
        form_json_format = request.form.get('formJsonFormat', '')
        input_text = request.form.get('text2', '')
        
        if not form_name or not form_json_format:
            return jsonify({"error": "Form selection is required"}), 400
            
        if not input_text:
            return jsonify({"error": "Diagnosis description is required"}), 400
        
        # Process the selected form
        process_start_time = time.time()
        
        # Step 1: Use the selected form's JSON format
        json_data = form_json_format
        # If the json_format is a string, convert it to a dictionary
        if isinstance(json_data, str):
            import json
            try:
                json_data = json.loads(json_data)
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid JSON format in selected form"}), 500
                
        process_form_time = time.time() - process_start_time
        logging.info(f"Time taken to process form: {process_form_time:.4f} seconds")
        
        # Step 2: Process the diagnosis text with LLM
        text_start_time = time.time()
        refined_text = LLMService.process_text_data(
            input_text,
            json_data,
            app.config["FIREWORKS_API_KEY"]
        )
        extract_time = time.time() - text_start_time
        logging.info(f"Time taken to process text with LLM: {extract_time:.4f} seconds")
        print(refined_text)
        
        # Step 3: Parse the refined text
        json_data, reasoning = parse_refined_text(refined_text)
        processing_time = time.time() - process_start_time
        logging.info(f"Total Processing time: {processing_time:.4f} seconds")
        print(json_data)
        
        # Return the results
        return jsonify({
            "json_data": json_data,
            "reasoning": reasoning,
        })
    except Exception as e:
        logging.error(f"Error processing upload: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8587)