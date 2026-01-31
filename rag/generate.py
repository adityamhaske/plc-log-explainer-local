import ollama
from typing import List

class Generator:
    def __init__(self, model: str = "mistral"):
        self.model = model

    def generate_explanation(self, query: str, context_docs: List[str]) -> str:
        """Generates an explanation based on query and context."""
        
        context_str = "\n".join([f"- {doc}" for doc in context_docs])
        
        prompt = f"""You are an expert industrial automation AI assistant. 
Your goal is to explain PLC faults to maintenance technicians based on the provided context.

CONTEXT INFORMATION:
{context_str}

USER ALARM/LOG:
{query}

INSTRUCTIONS:
Analyze the user alarm using the context information.
Provide a response in the following structured format:
1. **Summary**: A one-sentence overview of the fault.
2. **Observed Evidence**: Which logs or manuals point to this conclusion?
3. **Root Cause Hypotheses**: List the most likely technical causes (e.g., sensor failure, wiring, logic).
4. **Actionable Steps**: Step-by-step specific maintenance actions.
5. **Confidence Score**: High/Medium/Low based on how well the manual matches the alarm.

Do not halluncinate. If the context does not contain relevant info, state that you cannot identify the specific fault but provide general guidance.
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
