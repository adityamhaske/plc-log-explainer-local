# PLC Log Explainer - Frontend (Next.js)

This is the interactive frontend for the PLC Log Explainer system, built using **Next.js 14**, **Tailwind CSS**, and **Axios**.

## 🏗️ Architecture
The frontend is designed with a reactive, engineering-focused aesthetic. It communicates with the FastAPI backend via a series of RESTful endpoints.

### Core Pages
1.  **Home (`/`)**: Overview and system landing page.
2.  **Analyzer (`/workflow`)**: The primary diagnostic tool.
    - **Split-Pane Layout**: Step 1 (Log Management) and Step 2 (Interactive Preview) side-by-side.
    - **Interactive Table**: A numbered, scrollable CSV preview where row clicks populate the diagnostic query.
    - **AI Results Engine**: Displays technical diagnoses in 5 structured categories with confidence scoring.
3.  **History (`/history`)**: A persistent record of all past AI diagnoses, searchable by source log file.

## 🛠️ Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- App running with [FastAPI Backend](http://localhost:8000)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

## 🎨 UI & Styling
- **Theme**: Slate-900 / Dark Engineering Theme.
- **Framework**: Tailwind CSS for high-performance utility-first styling.
- **Interactions**: Framer-style CSS transitions for smooth table highlighting and results entry.
- **Icons**: Heroicons for a clean, professional technical interface.

---
*Optimized for rapid technical fault analysis on the factory floor.*
