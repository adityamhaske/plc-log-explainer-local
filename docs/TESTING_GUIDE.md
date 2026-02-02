# CCI-Nexus System Testing Guide (v5.0)

Follow these steps to verify that the **Collaborative Commissioning Intelligence (CCI)** platform is correctly orchestrated via Docker and providing accurate technical diagnoses for the team.

## 🐳 Container Setup Verification
1.  **Deployment**: Run `docker compose up -d` in the root directory.
2.  **Container Health**: Verify all containers are running:
    - `plc-api` (FastAPI)
    - `plc-frontend` (Next.js)
    - `plc-prometheus` & `plc-grafana`
3.  **Connectivity**: Ensure the frontend can reach the backend:
    - Check the browser console at `localhost:3000` for any CORS errors.
    - Verify that the **Step 1: Log Management** dropdown is populated with files from the backend.

---

## 🏎️ Functional Test: Interactive Diagnosis
**Scenario**: Verify the core "Direct-Click" analysis workflow in the new UI.

1.  **Project Setup**: In **Step 1**, select `sample_v4.csv`.
2.  **Interaction**: In the **Log Explorer** (Step 2), click on a row containing a critical alarm (e.g., `ALM_2021`).
3.  **Trigger**: Verify the technical log data is populated in the query box, then click **"Analyze Fault"**.
4.  **Expectation**:
    - AI generates a JSON-structured response in <10 seconds.
    - **Step 3: Technical Insights** is populated with structured data (Summary, Evidence, Root Cause, Actions, Confidence).

---

## 👥 Collaboration Test: Team History Sharing
**Scenario**: Verify that diagnostics are correctly persistent and shared across the team.

1.  **Action**: Complete an analysis for a specific fault.
2.  **Navigation**: Go to the **History** page via the top navigation menu.
3.  **Validation**:
    - Locate your recently analyzed fault in the list.
    - Verify that the file name and timestamp are accurate.
    - Click **"View Analysis Details"** to confirm the full technical report is preserved.

---

## 🛠️ Performance & Monitoring
1.  **Admin Portal**: Visit `http://localhost:30001` to access Grafana.
2.  **Metrics Check**: Confirm that system metrics are being collected by Prometheus from the `plc-api` container.

---
*Ensuring the highest standards of diagnostic accuracy for industrial commissioning.*
