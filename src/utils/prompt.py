def get_refine_arabic_prompt_deepseek(raw_text):
    return f"""
    Correct the grammar and structure of this Arabic medical text. 
    Return only the corrected Arabic text with no additional explanations.

    ORIGINAL TEXT:
    \"\"\"{raw_text}\"\"\"
    """


def get_refine_arabic_prompt_deepseek_conv(raw_text):
    return f"""
    Correct this Arabic medical conversation. 
    Add **DOCTOR:** and **PATIENT:** labels based on context.
    Return only the corrected Arabic dialogue with no additional text.

    ORIGINAL TEXT:
    \"\"\"{raw_text}\"\"\"
    """


def get_translation_prompt_deepseek_conv(refined_text):
    return f"""
    Translate this Arabic medical conversation to English.
    Preserve speaker labels (**DOCTOR:** and **PATIENT:**).
    Return only the English translation without commentary.

    ARABIC TEXT:
    \"\"\"{refined_text}\"\"\"
    """


def get_translation_prompt_deepseek(refined_text):
    return f"""
    Translate this Arabic medical text to English.
    Return only the English translation without commentary.

    ARABIC TEXT:
    \"\"\"{refined_text}\"\"\"
    """


def get_extraction_prompt_deepseek(translated_text):
    return f"""
    Extract patient information from this medical text into exactly two sections:

    # SECTION 1: PATIENT DATA (JSON FORMAT)
    ```json
    {{
    "chief_complaint": "",
    "icd10_codes": [
        "Code1 - Description",
        "Code2 - Description"
    ],
    "history_of_illness": "",
    "current_medication": "",
    "imaging_results": "",
    "plan": "",
    "assessment": "",
    "follow_up": ""
    }}
    ```

    # SECTION 2: ANALYSIS NOTES
    Brief justification for data extraction and ICD10 code selections.

    Rules:
    - Use 'null' for missing data
    - Include all relevant ICD10 codes with descriptions
    - Properly format JSON with no explanatory text inside

    TEXT:
    \"\"\"{translated_text}\"\"\"
    """


def get_refine_arabic_prompt_llama(raw_text):
    return f"""
            You are a medical specialist. Correct this Arabic text while preserving its meaning.
            Only return the corrected Arabic text with no additional text or explanations.

            ORIGINAL TEXT:
            \"\"\"{raw_text}\"\"\"
            """


def get_refine_arabic_prompt_llama_conv(raw_text):
    return f"""
            Correct this Arabic medical conversation while preserving meaning. 
            Label speakers as **DOCTOR:** and **PATIENT:** based on context.
            Only return the corrected conversation with no additional text.

            ORIGINAL TEXT:
            \"\"\"{raw_text}\"\"\"
            """


def get_translation_prompt_llama(refined_text):
    return f"""
            Translate this Arabic medical text to English.
            Return only the English translation with no additional text.

            ARABIC TEXT:
            \"\"\"{refined_text}\"\"\"
            """


def get_translation_prompt_llama_conv(refined_text):
    return f"""
            Translate this Arabic medical conversation to English.
            Preserve **DOCTOR:** and **PATIENT:** labels if present.
            Return only the English translation with no additional text.

            ARABIC TEXT:
            \"\"\"{refined_text}\"\"\"
            """


def get_extraction_prompt_llama(translated_text):
    return f"""
    Extract patient information into JSON format and provide brief analysis.
    Return only these two sections:

    # SECTION 1: PATIENT DATA (JSON FORMAT)
    ```json
    {{
    "chief_complaint": "",
    "icd10_codes": [
        "Code1 - Description",
        "Code2 - Description",
        "Code3 - Description"
    ],
    "history_of_illness": "",
    "current_medication": "",
    "imaging_results": "",
    "plan": "",
    "assessment": "",
    "follow_up": ""
    }}
    ```

    # SECTION 2: ANALYSIS NOTES
    Brief justification for extracted data and ICD10 codes.

    IMPORTANT:
    - Include all relevant ICD10 codes that apply to the patient's condition
    - List both primary and secondary diagnosis codes
    - Provide specific, detailed code descriptions for each ICD10 code
    - Ensure codes accurately match the medical conditions described in the text

    TEXT TO ANALYZE:
    \"\"\"{translated_text}\"\"\"
    """