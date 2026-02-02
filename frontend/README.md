# CCI-Nexus Frontend (Next.js)

The interactive user interface for the **Collaborative Commissioning Intelligence (CCI)** platform. Built for controls engineers who need rapid, accurate diagnostic insights during the high-pressure commissioning phase.

## 🏗️ Architecture
- **Framework**: Next.js 14 (Turbopack).
- **Styling**: Vanilla CSS + Tailwind for a professional, dark-themed industrial aesthetic.
- **State Management**: Reactive UI components with real-time feedback for diagnostic triggers.

## 🖱️ Key Workflows

### 1. Dual-Pane Log Management
Step 1 and 2 are presented in a split-pane layout to maximize efficiency:
- **Left Pane**: File upload and selection.
- **Right Pane**: Numbered, interactive Log Explorer. Scroll through thousands of rows and click any row to instantly start an AI analysis.

### 2. Evidence-Based Diagnostic Engine
The results are presented in five detailed technical categories:
- **Technical Summary**, **Evidence**, **Root Cause**, **Action Steps**, and **Confidence**.
- Technical details like PLC rack/slot info and wiring terminals are prioritized for engineers.

### 3. Shared Project History
All analyses done by teammates on the same project LAN are synced and stored. This prevents duplicate work and allows the team to build a shared repository of "known fixes" for specific commissioning bugs.

## 🚀 Development Mode

### Installation
```bash
cd frontend
npm install
```

### Local Dev Server
```bash
npm run dev
```
Accessible at [http://localhost:3000](http://localhost:3000).

## 🐳 Deployment (Recommended)
For team use, the frontend is orchestated via Docker. See the root `README.md` for `docker compose` instructions.

---
*Engineering diagnostics, refined.*
