# Installation Guide

This guide provides detailed instructions for setting up the Medical Voice Recognition System.

## System Requirements

- Python 3.8 or higher
- 4GB RAM minimum (8GB recommended)
- Microphone input device
- Internet connection for initial model download

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Mhammedammr/med_voice_recognition.git
cd med_voice_recognition

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -e .