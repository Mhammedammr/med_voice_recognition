import fireworks.client
<<<<<<< HEAD
import logging
from src.utils.prompt import *

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    """Service for LLM processing."""
    
    @staticmethod
=======
from src.utils.prompt import *
import logging

# Get a logger for this module
logger = logging.getLogger(__name__)

class LLMService:

    def refine_ar_transcription(raw_text, api_key, model, conversational_mode=False):
        """Process Arabic voice transcription with LLM."""
        return LLMService.process_text(raw_text, api_key, model, "refine_arabic", conversational_mode)
    

    def translate_to_eng(refined_text, api_key, model, conversational_mode=False):
        """Translate refined text to English with LLM."""
        return LLMService.process_text(refined_text, api_key, model, "translate", conversational_mode)
    

    def extract_features(translated_text, api_key, model, conversational_mode=False):
        """Extract features from translated text with LLM."""
        return LLMService.process_text(translated_text, api_key, model, "extract", conversational_mode)
    

>>>>>>> 78d71f9 (optmizing project strcture)
    def _get_model_account(model):
        """Get the appropriate model account based on model name."""
        if model == "deepseek":
            return "accounts/fireworks/models/deepseek-v3"
        else:
            return "accounts/fireworks/models/llama4-maverick-instruct-basic"
    
<<<<<<< HEAD
    @staticmethod
=======

>>>>>>> 78d71f9 (optmizing project strcture)
    def _get_prompt(prompt_type, model, text, conversational_mode=False):
        """Get the appropriate prompt based on type, model and mode."""
        if prompt_type == "refine_arabic":
            if conversational_mode:
                return get_refine_arabic_prompt_deepseek_conv(text) if model == "deepseek" else get_refine_arabic_prompt_llama_conv(text)
            else:
                return get_refine_arabic_prompt_deepseek(text) if model == "deepseek" else get_refine_arabic_prompt_llama(text)
        elif prompt_type == "translate":
            if conversational_mode:
                return get_translation_prompt_deepseek_conv(text) if model == "deepseek" else get_translation_prompt_llama_conv(text)
            else:
                return get_translation_prompt_deepseek(text) if model == "deepseek" else get_translation_prompt_llama(text)
        elif prompt_type == "extract":
            return get_extraction_prompt_deepseek(text) if model == "deepseek" else get_extraction_prompt_llama(text)
        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")
    
<<<<<<< HEAD
    @staticmethod
=======

>>>>>>> 78d71f9 (optmizing project strcture)
    def _call_llm_api(api_key, model_account, prompt, temperature=0.3):
        """Make API call to the LLM service."""
        fireworks.client.api_key = api_key
        
        try:
            logger.info(f"Calling LLM API with model: {model_account}")
            response = fireworks.client.Completion.create(
                model=model_account,
                prompt=prompt,
                max_tokens=100000,
                temperature=temperature,
            )
            
            if response.choices and response.choices[0].text.strip():
                return response.choices[0].text.strip()
            else:
                logger.warning("LLM returned empty response")
                return None
        except Exception as e:
            logger.error(f"LLM API call failed: {str(e)}")
            raise Exception(f"LLM processing failed: {str(e)}")
    
<<<<<<< HEAD
    @staticmethod
=======

>>>>>>> 78d71f9 (optmizing project strcture)
    def process_text(text, api_key, model, prompt_type, conversational_mode=False):
        """Generic method to process text with LLM."""
        model_account = LLMService._get_model_account(model)
        prompt = LLMService._get_prompt(prompt_type, model, text, conversational_mode)
        
        result = LLMService._call_llm_api(api_key, model_account, prompt)
        return result if result else text
<<<<<<< HEAD
    
    @staticmethod
    def refine_ar_transcription(raw_text, api_key, model, conversational_mode=False):
        """Process Arabic voice transcription with LLM."""
        return LLMService.process_text(raw_text, api_key, model, "refine_arabic", conversational_mode)
    
    @staticmethod
    def translate_to_eng(refined_text, api_key, model, conversational_mode=False):
        """Translate refined text to English with LLM."""
        return LLMService.process_text(refined_text, api_key, model, "translate", conversational_mode)
    
    @staticmethod
    def extract_features(translated_text, api_key, model, conversational_mode=False):
        """Extract features from translated text with LLM."""
        return LLMService.process_text(translated_text, api_key, model, "extract", conversational_mode)
=======

    # @staticmethod
    # def process_text_data(raw_text, json_text, api_key):
    #     """Process voice transcription with LLM."""
    #     fireworks.client.api_key = api_key
        
    #     prompt = f"""
    #         1. Fill Patient Features: (MUST be written)  
    #         - Fill the features in {json_text} using the diagnosis description in {raw_text}.  
    #         - Assign NULL to any feature not mentioned in {raw_text}.  
    #         - Add the appropriate ICD-10 code based on the diagnosis.  

    #         2. Reasoning: (MUST be written)  
    #         - Explain step-by-step why each feature is filled with the corresponding value.  
    #         - Include reasoning for assigning NULL values or inferring ICD-10 codes.  

    #         Strictly follow the structure and ensure the output is clear and concise. 
    #         (1. Fill Patient Features: (MUST be written) and 2. Reasoning: (MUST be written) must be written in the output)
    #     """
        
    #     try:
    #         response = fireworks.client.Completion.create(
    #             model="accounts/fireworks/models/deepseek-v3",
    #             prompt=prompt,
    #             max_tokens=100000,
    #             temperature=0.3,
    #         )
            
    #         if response.choices and response.choices[0].text.strip():
    #             return response.choices[0].text.strip()
    #         else:
    #             return raw_text
    #     except Exception as e:
    #         raise Exception(f"LLM processing failed: {str(e)}")
    
    # @staticmethod
    # def process_html_data(raw_text, api_key):
    #     """Process HTML data with LLM."""
    #     fireworks.client.api_key = api_key
        
    #     soup = BeautifulSoup(raw_text, "html.parser")
        
    #     # Remove unnecessary tags
    #     for tag in soup(["script", "style", "meta", "link", "head"]):
    #         tag.decompose()
            
    #     cleaned_html = soup.prettify()
        
    #     prompt = f"""
    #         DeepSeek-V3, analyze the provided HTML input (`{cleaned_html}`) which contains clinical sheets.
    #         Extract all key features related to the patient and structure them into a flat JSON object.
    #         Ensure the JSON object is non-nested, with keys describing medical features and values as text,
    #         numbers, or booleans. Exclude any non-medical or irrelevant information.
    #         Provide the output in a clear and concise format.
    #     """
        
    #     try:
    #         response = fireworks.client.Completion.create(
    #             model="accounts/fireworks/models/deepseek-v3",
    #             prompt=prompt,
    #             max_tokens=100000,
    #             temperature=0.3,
    #         )
            
    #         if response.choices and response.choices[0].text.strip():
    #             return response.choices[0].text.strip()
    #         else:
    #             return "{}"
    #     except Exception as e:
    #         raise Exception(f"HTML processing failed: {str(e)}")

#@staticmethod
#     def process_voice_data(raw_text, api_key, language):
#         """Process voice transcription with LLM."""
#         fireworks.client.api_key = api_key
#         if language == "ar":
#             prompt = f"""
# You are a specialized medical assistant processing Arabic transcriptions from doctor-patient conversations or medical notes. You must follow these exact instructions and output format.

# # FORMAT REQUIREMENTS
# 1. Respond in these four clearly separated sections
# 2. Use precise headings as specified
# 3. Never skip any section
# 4. Never add additional sections

# # SECTION 1: REFINED ARABIC TEXT
# - Correct grammar and sentence structure in Arabic
# - Format conversations with clear speaker labels (DOCTOR/PATIENT)
# - Identify speakers based on context (patients describe symptoms, doctors ask questions/give advice)
# - Do not invent or add content
# - Maintain original meaning and clarity

# ORIGINAL ARABIC TEXT:
# \"\"\"{raw_text}\"\"\"

# # SECTION 2: ENGLISH TRANSLATION
# - Provide complete translation of the refined Arabic text
# - Use proper English grammar and medical terminology
# - Preserve speaker labels (DOCTOR/PATIENT) if applicable

# # SECTION 3: PATIENT DATA (JSON FORMAT)
# ```json
# {{
# "chief_complaint": "Primary reason for visit or main symptom",
# "icd10_codes": [list of all possible icd10 code with there description],
# "history_of_illness": "Relevant medical history",
# "current_medication": "Current medications",
# "imaging_results": "Results from any imaging studies",
# "plan": "Treatment plan",
# "assessment": "Doctor's assessment",
# "follow_up": "Follow-up instructions"
# }}
# ```

# # SECTION 4: ANALYSIS NOTES
# - Explain your understanding of the conversation
# - Detail how you identified speakers
# - Explain your translation decisions
# - Describe how you extracted each medical data point
# - Provide reasoning for ICD10 code selections

# IMPORTANT RULES:
# - Use 'null' for any data field not mentioned in the text
# - Always include at least two ICD10 codes with descriptions
# - Format the JSON exactly as shown with proper escaping
# - Do not add explanatory text within the JSON section
# """
#         elif language == "en":
#             prompt = f"""
#             You are a medical assistant tasked with processing a Arabic text transcription generated by OpenAI Whisper from an audio file (e.g., a doctor-patient conversation or medical notes). Follow these steps:

#             1. Refine the Text: (MUST be written)
#                 - Improve the text grammatically and logically for better readability and coherence.
#                 - If the input text is a conversation between doctor and pateint, the output must be in form of dialogue.  
#                 - Do not add any new words, sentences, or information not present in the original input.
#                 - Ensure the refined text retains the original meaning and context.          

#             2. Extract Patient Features: (MUST be written)
#                 - Cheif Complaint.
#                 - ICD10 code (try to provide more than one ICD10 code for the diagnose). (NOTE: try to output the ICD10 codes in a from of list, not in nested json.)
#                 - History of the patient illness.
#                 - Current medication.
#                 - Imaging results.
#                 - Plan.
#                 - Assessment.
#                 - Follow up.
#                 This Output MUST be in JSON format.
                

#             3. Reasoning: (MUST be written)
#                 write your reasons here.
                
#                 please be strict to the above structure and write the title before (MUST be written) before any section.

#                 If a specific feature is not mentioned in the input, assign the value null
#                 to that key (except ICD10 code).
#                 make sure the output message to be written with the sentence that have (MUST be written) message and be free in any format.
#                 Explain your reasoning step by step before providing the answer.
#             """

#         try:
#             response = fireworks.client.Completion.create(
#                 model="accounts/fireworks/models/deepseek-v3",
#                 prompt=prompt,
#                 max_tokens=100000,
#                 temperature=0.3,
#             )
            
#             if response.choices and response.choices[0].text.strip():
#                 return response.choices[0].text.strip()
#             else:
#                 return raw_text
#         except Exception as e:
#             raise Exception(f"LLM processing failed: {str(e)}")
>>>>>>> 78d71f9 (optmizing project strcture)
