#!/usr/bin/env python3
"""Test script to list available Gemini models"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure with your API key
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

print("Available Gemini models:")
print("-" * 80)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"\nModel: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Methods: {', '.join(model.supported_generation_methods)}")
