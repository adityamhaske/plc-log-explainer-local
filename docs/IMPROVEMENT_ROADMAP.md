# CCI-Nexus Improvement Roadmap

This roadmap outlines the evolution from a local diagnostic utility to an enterprise-grade **Collaborative Commissioning Intelligence (CCI)** platform.

---

## ✅ Phase 1: Foundation (COMPLETED)
- [x] **Local RAG Pipeline**: Implemented offline indexing and retrieval using ChromaDB and Mistral-7B.
- [x] **FastAPI Backend**: Built a robust REST API for diagnostic orchestration.
- [x] **Next.js Frontend**: Developed a premium, engineering-focused reactive UI for commissioning diagnostics.
- [x] **Interactive Log Explorer**: Enabled direct row-to-analysis mapping via a numbered, scrollable CSV preview.
- [x] **History & Session Persistence**: Implemented a shared historical database for project-wide collaboration.
- [x] **Platform Containerization**: Enabled one-click deployment via Docker Compose for team-based industrial LAN access.

---

## ✅ Phase 2: CCI Collaboration & V5 Release (COMPLETED)
- [x] **Robust AI Parsing**: Implemented regex-based JSON extraction to handle LLM conversational noise.
- [x] **UI Polish**: Refined Action Steps as numbered lists and split Confidence scores for better readability.
- [x] **Team Persistence**: Finalized Docker-based shared history and LAN accessibility.
- [x] **Regional Deployment Ready**: Cleaned workspace and updated documentation for site-wide use.

---

## 🛠️ Phase 3: Project-Specific Expert (Future Milestones)
- [ ] **Multi-Source Context Injection**: Automated ingestion of I/O lists and Sequence of Operations (SOO).
- [ ] **Logic Trace Mapping**: AI-driven suggestions of specific PLC Function Blocks (FBs) or memory addresses related to faults.
- [ ] **Predictive Commissioning**: Identifying recurring wiring or logic bugs based on pattern analysis across 100s of project logs.
- [ ] **Automated Handover Reports**: Generating structured PDF commissioning summaries for the end-client.

---

## 🌐 Phase 4: Enterprise Scaling
- [ ] **Multi-Project Central Hub**: Aggregating insights across 50+ warehouses to identify global hardware failure trends.
- [ ] **Hybrid Inference Routing**: Seamlessly switching between local edge LLMs (privacy) and cloud frontier models (deep analysis).
- [ ] **Direct PLC Ingestion**: Live streaming of registers via OPC UA or MQTT for real-time proactive diagnostics.

---
*Optimized for the next generation of industrial commissioning.*
