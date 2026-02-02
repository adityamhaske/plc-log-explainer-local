# CCI-Nexus: Collaborative PLC Log Explainer (v5.0)

## 🎯 Project Overview
**CCI-Nexus** is an enterprise-ready, **offline AI-powered diagnostic platform** specifically designed for the **commissioning and stabilization phase** of industrial automation projects. It transforms cryptic PLC (Programmable Logic Controller) alarm logs into technical natural language insights, enabling controls engineers to stabilize new systems at unprecedented speeds.

Built with a containerized **Next.js + FastAPI** architecture, it ensures **100% data privacy** and zero cloud dependency by running local LLMs (Mistral-7B) directly on project-site hardware.

## 🏗️ Architecture
- **Frontend (Next.js)**: A premium engineering dashboard with split-pane log exploration, interactive row analysis, and a shared team history.
- **Backend (FastAPI)**: A high-performance diagnostic engine optimized for industrial log parsing and RAG (Retrieval-Augmented Generation).
- **Security & Efficiency**: Optimized for industrial LANs, enabling multiple engineers to collaborate on a single project knowledge base.

## 📥 Inputs & 📤 Outputs
- **Inputs**: CSV/JSON logs, Project I/O lists, and Sequence of Operations (SOO).
- **Outputs**: Technical maintenance reports categorized into:
    - **Technical Summary**: Rapid fault identification.
    - **Evidence**: Data highlights supporting the diagnosis.
    - **Root Cause**: Engineering-level failure hypotheses.
    - **Action Steps**: Specific logic or electrical troubleshooting sequences.
    - **Confidence**: Reliability score based on retrieved project context.

## 🚀 Deployment (Docker First)

### Prerequisites
1.  **Ollama**: [Download & Install](https://ollama.com/).
2.  **Mistral Model**: Run `ollama pull mistral`.
3.  **Docker & Docker Compose**: Installed and running.

### 🛠️ One-Click Team Start
Run the following command in the project root to bring the entire platform online:
```bash
docker compose up -d --build
```

### Accessing the Platform
- **Main Interface**: [http://localhost:3000](http://localhost:3000) (Accessible via Server IP on LAN).
- **History & Sharing**: Visit the Shared History tab to see diagnostics from the whole team.
- **Monitoring (Grafana)**: [http://localhost:30001](http://localhost:30001) (Admin: `admin/admin`).

## 🖱️ Collaborative Workflow
1.  **Project Setup**: Upload the project's logs and manuals in the **Log Management** pane.
2.  **Target Fault**: Select a specific row in the **Log Explorer** table (Step 2) to target a commissioning fault.
3.  **Collaborate**: Analyzed faults are saved to the **History**, allowing teammates to review and verify fixes in real-time.

---
*Accelerating industrial commissioning through collaborative intelligence.*
