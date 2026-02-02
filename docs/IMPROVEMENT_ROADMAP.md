# 🚀 System Improvement Roadmap

This document outlines the evolutionary steps for the **Local PLC Log Explainer**.

## ✅ Phase 1: Foundational Modernization (Completed)
- **Client-Server Architecture**: Migrated from a single Streamlit script to a high-performance **FastAPI backend** and a decoupled **Next.js (React) frontend**.
- **Interactive UI**: Implemented a split-pane Explorer with a numbered log table, clickable row analysis, and a premium "Live Insight" results engine.
- **Robust History**: Developed a file-based session tracking system with persistent storage for all queries and AI diagnoses.
- **Local LLM Orchestration**: Integrated Mistral-7B via Ollama for zero-cost, private technical reasoning.

## 🛠️ Phase 2: Enterprise Scaling (Ongoing)
- **Advanced Metadata Filtering**: Allow users to filter history by machine ID, timestamp ranges, or specific technicians.
- **Dockerization**: Containerize Backend, Frontend, and Vector Store for "one-click" deployment on factory-floor workstations.
- **OPC UA / MQTT Integration**: Implement real-time log ingestion pipelines that pull directly from live PLCs instead of relying on CSV uploads.

## 📈 Phase 3: AI Intelligence Upgrades
- **Knowledge Graph Integration**: Map PLC manual relationships (e.g., "Pump A" is connected to "Valve B") to provide deeper root cause analysis.
- **Hybrid Semantic Search**: Combine vector-based "meaning" search with exact-match keyword indexing for specific alarm codes.
- **Multi-Model Support**: Support switching between Mistral, Llama-3, or CodeLlama for different diagnostic tasks.

## 🔒 Phase 4: Security & Compliance
- **Local LDAP/SSO**: Integrate with factory user management systems for secure access.
- **Audit Logging**: Maintain tamper-proof logs of all AI diagnoses for safety and regulatory compliance.
