# Medical Voice Recognition System

A robust voice recognition system designed specifically for medical professionals to transcribe and process medical dictations, notes, and commands.

## Overview

This project aims to improve the efficiency of medical documentation by providing accurate speech-to-text capabilities tailored to medical terminology and workflows. The system is designed to understand medical jargon, anatomical terms, medications, and procedural language.

## Features

- High-accuracy medical speech-to-text conversion
- Medical terminology dictionary integration
- Support for multiple medical specialties
- HIPAA-compliant data handling
- Integration capabilities with EHR systems
- Real-time transcription with low latency
- Voice command functionality for hands-free operation

## Documentation

Detailed documentation is available in the [docs](./docs) directory:

- [Installation Guide](./docs/installation.md)
- [Usage Guide](./docs/usage.md)
- [Contribution Guide](./docs/contribution_guide.md)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Mhammedammr/med_voice_recognition.git

# Navigate to the project directory
cd med_voice_recognition

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -e .

# Run the application
python app.py