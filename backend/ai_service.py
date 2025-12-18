"""
AI Service module for integrating with AI providers.
Supports multiple AI providers (OpenAI, Anthropic, etc.)
"""

import os
from typing import Optional, List, Dict
from enum import Enum

class AIProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    # Add more providers as needed

class AIService:
    """
    Service class to handle AI interactions for planning assistant.
    """
    
    def __init__(self, provider: AIProvider = AIProvider.OPENAI):
        self.provider = provider
        self.api_key = self._get_api_key()
        self._initialize_client()
    
    def _get_api_key(self) -> str:
        """Get API key based on provider."""
        if self.provider == AIProvider.OPENAI:
            return os.getenv("OPENAI_API_KEY", "")
        elif self.provider == AIProvider.ANTHROPIC:
            return os.getenv("ANTHROPIC_API_KEY", "")
        elif self.provider == AIProvider.GEMINI:
            return os.getenv("GEMINI_API_KEY", "")
        return ""
    
    def _initialize_client(self):
        """Initialize the AI client based on provider."""
        if not self.api_key:
            raise ValueError(f"API key not found for {self.provider.value}")
        
        # TODO: Initialize actual client
        # Example for OpenAI:
        # from openai import OpenAI
        # self.client = OpenAI(api_key=self.api_key)
        
        # Example for Anthropic:
        # from anthropic import Anthropic
        # self.client = Anthropic(api_key=self.api_key)
        
        # Example for Gemini:
        # import google.generativeai as genai
        # genai.configure(api_key=self.api_key)
        # self.client = genai.GenerativeModel('gemini-pro')
        
        self.client = None
    
    async def generate_plan(self, prompt: str, context: Optional[str] = None) -> Dict:
        """
        Generate a planning response from the AI.
        
        Args:
            prompt: The user's planning request (brain dump from user)
            context: Optional context to provide to the AI
            
        Returns:
            Dictionary containing the plan and extracted tasks
        """
        # ============================================================
        # 🎯 PUT YOUR PROMPT INSTRUCTIONS HERE
        # ============================================================
        # This is the system prompt that tells the AI how to process
        # the user's brain dump and what kind of output to generate
        # ============================================================
        system_prompt = """You are an AI planning assistant. 
        Help users create detailed, actionable plans for their goals.
        Break down complex objectives into clear, manageable tasks.
        Provide realistic timelines and priorities.
        
        ⚠️ CUSTOMIZE THIS PROMPT TO DEFINE:
        - How to organize the brain dump
        - What format the response should be in
        - How to categorize tasks
        - What details to include (deadlines, priorities, etc.)
        - Any specific structure you want in the output
        """
        # ============================================================
        
        full_prompt = f"{context}\n\n{prompt}" if context else prompt
        
        # TODO: Implement actual AI call
        # Example for OpenAI:
        # response = await self.client.chat.completions.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": system_prompt},
        #         {"role": "user", "content": full_prompt}
        #     ]
        # )
        # plan_text = response.choices[0].message.content
        
        # Placeholder response
        plan_text = f"AI-generated plan for: {prompt}"
        tasks = self._extract_tasks(plan_text)
        
        return {
            "plan": plan_text,
            "tasks": tasks
        }
    
    def _extract_tasks(self, plan_text: str) -> List[str]:
        """
        Extract actionable tasks from the plan text.
        
        Args:
            plan_text: The generated plan text
            
        Returns:
            List of extracted tasks
        """
        # TODO: Implement task extraction logic
        # Could use regex, another AI call, or structured output
        tasks = []
        
        # Simple extraction based on numbered lists or bullet points
        lines = plan_text.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                tasks.append(line)
        
        return tasks if tasks else ["Task extraction pending"]

    async def refine_task(self, task: str, details: str) -> str:
        """
        Refine a task with additional details using AI.
        
        Args:
            task: The original task
            details: Additional details or requirements
            
        Returns:
            Refined task description
        """
        prompt = f"Refine this task with the given details:\nTask: {task}\nDetails: {details}"
        
        # TODO: Implement AI refinement
        return f"Refined: {task} - {details}"
