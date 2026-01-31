import ollama
from typing import List

class Generator:
    def __init__(self, model: str = "mistral"):
        self.model = model

    def generate_explanation(self, query: str, context_docs: List[str]) -> str:
        """Generates a structured fault explanation from retrieved context."""
        context_str = "\n".join([f"- {doc}" for doc in context_docs])
        
        prompt = f"""You are an expert industrial automation AI assistant. 
Your goal is to explain PLC faults to maintenance technicians based on the provided context.

CONTEXT INFORMATION:
{context_str}

USER ALARM/LOG:
{query}

INSTRUCTIONS:
Analyze the user alarm using the context information and provide a response in VALID JSON format with exactly these 5 categories:

{{
  "summary": "A clear, comprehensive explanation of the fault suitable for technical users (2-3 sentences)",
  "evidence": "Detailed explanation of which specific logs, manuals, or data points support this diagnosis and why they are relevant",
  "root_cause": "Thorough analysis of the most likely technical causes with technical details (e.g., sensor failure modes, wiring issues, logic errors, environmental factors)",
  "actions": "Detailed step-by-step maintenance procedures with technical specifics (tools needed, safety precautions, verification steps)",
  "confidence": "High/Medium/Low based on how well the manual matches the alarm, with brief justification"
}}

Each field should be a string with appropriate technical detail. Use newline characters for bullet points where appropriate.
Provide evidence-based reasoning throughout - explain WHY you reached each conclusion based on the context.
Do not hallucinate. If the context does not contain relevant info, state that explicitly in the summary.
Return ONLY valid JSON, no markdown code blocks, no extra text.
"""
        response = ollama.chat(model=self.model, messages=[
            {
                'role': 'user',
                'content': prompt,
            },
        ])
        return response['message']['content']

if __name__ == "__main__":
    gen = Generator()
    # Stub test
    print(gen.generate_explanation("ALM_3021", ["Fault Code: ALM_3021. Description: Vacuum alarm."]))
