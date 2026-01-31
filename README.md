# Local LLM-Based PLC Log Explanation System

## 1. Project Overview
This tool is an **offline, AI-powered assistant** for industrial maintenance. It takes raw, cryptic PLC (Programmable Logic Controller) alarm logs and converts them into clear, actionable natural language explanations.

It is designed to run entirely **locally** (on a Mac with Apple Silicon) without sending data to the cloud, ensuring data privacy and zero cost. It uses **RAG (Retrieval-Augmented Generation)** to combine specific log data with general troubleshooting manuals.

## 2. Inputs & Outputs

### 📥 Inputs
1.  **Raw PLC Logs**: 
    *   **Format**: CSV or JSON files.
    *   **Content**: Must contain at least a timestamp, machine identifier, and alarm code (e.g., `2023-10-01 08:30:00, Machine_3, ALM_3021`).
2.  **User Query**: 
    *   A natural language description of the problem or a copy-paste of a specific log entry (e.g., *"Machine 3 triggered ALM_3021 at 10:00"*).
3.  **Knowledge Base (Backend)**: 
    *   System manuals and historical log data (stored in the vector database) are used as context.

### 📤 Outputs
The system generates a **Structured Fault Explanation** containing:
1.  **Summary**: A concise description of what went wrong.
2.  **Observed Evidence**: The specific log entries or manual sections found that support the conclusion.
3.  **Root Cause Hypotheses**: Technical reasons for the fault (e.g., "Sensor misalignment", "Fuse blown").
4.  **Actionable Steps**: Specific instructions for the technician to fix the issue (e.g., "Check input X", "Replace valve Y").
5.  **Confidence Score**: High/Medium/Low assessment of the diagnosis.

## 3. How to Use

### Prerequisites
*   **Ollama** must be installed and running (`ollama serve`).
*   **Mistral Model** must be pulled (`ollama pull mistral:7b-instruct-q4`).

### Step-by-Step Guide
1.  **Start the Interface**:
    Open your terminal in the project folder and run:
    ```bash
    streamlit run ui/app.py
    ```
2.  **Upload Logs**:
    *   In the sidebar (left), look for the "Ingest Logs" section.
    *   Upload your `.csv` log file (e.g., `data/alpi/sample.csv`).
    *   Click **"Process & Ingest"**. You will see a confirmation when the logs are added to the system's memory.
3.  **Diagnose a Fault**:
    *   On the main screen, find the "Analyze Fault" box.
    *   Type your question or log detail, for example: `Machine_3 triggered ALM_3021`.
    *   Click **"🚀 Generate Explanation"**.
4.  **Read the Results**:
    *   The AI will think for a few seconds and then display the structured explanation and the evidence it used.

## 4. Technical Architecture
1.  **Ingestion Layer**: Reads CSVs and converts rows like `ALM_3021` into a sentence: *"At 08:23, Machine 3 triggered a pneumatic vacuum alarm..."*.
2.  **Vector Store (ChromaDB)**: Stores these sentences numerically. This allows the AI to search for "similar issues" mathematically.
3.  **LLM (Mistral-7B via Ollama)**: The "brain" that reads the search results and writes the final English report.
