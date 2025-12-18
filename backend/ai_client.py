"""
Unified AI client that supports multiple providers (OpenAI, Gemini)
"""
import os
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from openai import OpenAI

class AIClient:
    def __init__(self, provider: str = None):
        self.provider = provider or os.getenv('AI_PROVIDER', 'openai')
        
        if self.provider == 'gemini':
            genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
            self.model_name = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp')
            self.client = genai.GenerativeModel(self.model_name)
        elif self.provider == 'openai':
            self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            self.model_name = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 4000,
        response_format: Optional[Dict] = None
    ) -> str:
        """
        Send a chat completion request to the configured AI provider
        """
        if self.provider == 'gemini':
            # Convert messages to Gemini format
            prompt_parts = []
            system_instruction = None
            
            for msg in messages:
                if msg['role'] == 'system':
                    system_instruction = msg['content']
                elif msg['role'] == 'user':
                    prompt_parts.append(msg['content'])
                elif msg['role'] == 'assistant':
                    prompt_parts.append(f"Assistant: {msg['content']}")
            
            # Combine parts
            full_prompt = "\n\n".join(prompt_parts)
            
            # Configure generation
            generation_config = {
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            }
            
            # For JSON mode, add instruction to the prompt instead of config
            # (older SDK versions may not support response_mime_type)
            if response_format and response_format.get('type') == 'json_object':
                full_prompt = full_prompt + "\n\nIMPORTANT: Return your response as valid JSON only. Do not include any text before or after the JSON."
            
            # Create model with system instruction if provided
            if system_instruction:
                model = genai.GenerativeModel(
                    self.model_name,
                    system_instruction=system_instruction,
                    generation_config=generation_config
                )
            else:
                model = genai.GenerativeModel(
                    self.model_name,
                    generation_config=generation_config
                )
            
            response = model.generate_content(full_prompt)
            return response.text
            
        elif self.provider == 'openai':
            kwargs = {
                'model': self.model_name,
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            }
            
            if response_format:
                kwargs['response_format'] = response_format
            
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
    
    def vision_completion(
        self,
        prompt: str,
        image_data: bytes,
        mime_type: str = "image/jpeg"
    ) -> str:
        """
        Send an image + text prompt to the AI for vision tasks
        """
        if self.provider == 'gemini':
            import PIL.Image
            import io
            
            # Convert bytes to PIL Image
            image = PIL.Image.open(io.BytesIO(image_data))
            
            # Generate content with image
            response = self.client.generate_content([prompt, image])
            return response.text
            
        elif self.provider == 'openai':
            import base64
            
            # Encode image to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            return response.choices[0].message.content
