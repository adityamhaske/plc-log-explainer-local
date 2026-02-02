# Local LLM-Based PLC Log Explanation System (v4)

## 🎯 Project Overview
This tool is an **offline, AI-powered diagnostic assistant** for industrial maintenance. It transforms cryptic PLC (Programmable Logic Controller) alarm logs into clear, actionable natural language explanations for technicians.

Built with a modern **Next.js + FastAPI** architecture, it runs entirely **locally** (optimized for Mac Apple Silicon), ensuring data privacy, zero cloud costs, and high-speed local processing.

## 🏗️ Technical Architecture
1.  **Frontend (Next.js)**: A premium, reactive interface featuring a split-pane "Log Explorer" and interactive diagnosis results.
2.  **Backend (FastAPI)**: High-performance API handling log parsing, RAG retrieval, and LLM orchestration.
3.  **Vector Store (ChromaDB)**: Houses the fault knowledge base and historical log context for semantic search.
4.  **Local LLM (Mistral-7B via Ollama)**: The reasoning engine that synthesizes retrieved data into maintenance reports.

## 📥 Inputs & 📤 Outputs
- **Inputs**: CSV/JSON logs (Timestamp, Machine, Alarm) and Maintenance Manuals (JSON).
- **Outputs**: 5-Category Technical Diagnosis:
    - **Summary**: Concise fault overview.
    - **Evidence**: Data points supporting the diagnosis.
    - **Root Cause**: Likely technical failure points.
    - **Action Steps**: Specific maintenance procedures.
    - **Confidence**: AI certainty level based on documentation.

## 🚀 Getting Started

### Prerequisites
1.  **Ollama**: [Download & Install](https://ollama.com/).
2.  **Mistral Model**: Run `ollama pull mistral`.
3.  **Python 3.10+** & **Node.js 18+**.

### 🛠️ Execution Steps
1.  **Clone & Install**:
    ```bash
    git clone [repository-url]
    cd [repository-folder]
    pip install -r requirements.txt
    cd frontend && npm install && cd ..
    ```
2.  **Start Backend (Terminal 1)**:
    ```bash
    uvicorn backend.api.main:app --reload --port 8000
    ```
3.  **Start Frontend (Terminal 2)**:
    ```bash
    cd frontend && npm run dev
    ```
4.  **Access App**: Open [http://localhost:3000](http://localhost:3000).

## 🖱️ How to Use the Analyzer
1.  **Step 1: Select/Upload**: Choose a file from history or upload a new CSV in the left pane.
2.  **Step 2: Explore & Select**: Scroll through the numbered log table in the right pane. **Click any row** to target a specific fault.
3.  **Step 3: Analyze**: Click the **"Analyze Fault"** button to generate the report.
4.  **History**: Visit the **History** tab to review all past diagnoses filtered by file.

---
*Developed for robust, local industrial AI diagnostics.*
