# 🧪 System Testing Guide (v4)

Follow these steps to verify that the PLC Log Explainer is correctly parsing logs, retrieving manual context, and generating accurate technical diagnoses via the new interactive UI.

## ⚠️ Setup Verification
1.  **Backend Running**: Ensure FastAPI is live on `http://localhost:8000`.
2.  **Frontend Running**: Ensure Next.js is live on `http://localhost:3000`.
3.  **Log Loading**: Select `sample_v4.csv` from the Step 1 dropdown.
4.  **Ollama**: Ensure `ollama serve` is active and the `mistral` model is available.

---

## ✅ Test Case 1: Interactive Row Analysis (Vacuum Leak)
**Scenario**: Target a specific known fault via the interactive log table.

1.  **Action**: Scroll through the **Step 2: Log Selection** table.
2.  **Action**: Find a row containing `ALM_3021` (Vacuum Failure) and **click the row**.
3.  **Action**: Verify the query box is populated with the row data.
4.  **Action**: Click the **"Analyze Fault"** button.
5.  **Expected Results**:
    - **Summary**: Identifies a "Pneumatic vacuum alarm."
    - **Root Cause**: Mentions "Seal degradation" or "Pump loss of efficiency."
    - **Action**: Suggests checking vacuum cups, seals, and the primary pump.

---

## ✅ Test Case 2: Historical Review (Emergency Stop)
**Scenario**: Verify that the history tracking system is correctly persistent.

1.  **Action**: Perform an analysis for an `ALM_1001` (Emergency Stop) entry.
2.  **Action**: Navigate to the **History** tab (top menu).
3.  **Action**: Filter by the filename `sample_v4.csv`.
4.  **Expected Results**:
    - The `ALM_1001` query appears as a high-confidence record.
    - Click "Technical Analysis Details" to verify the results match the original diagnosis.

---

## ✅ Test Case 3: Manual Override Analysis
**Scenario**: Verify the system can handle manual technical descriptions.

1.  **Action**: Go to the **Analyzer**.
2.  **Action**: Type into the manual query box: `"Machine 4 is overheating but there is no alarm code yet."`
3.  **Action**: Click **"Analyze Fault."**
4.  **Expected Results**:
    - The AI retrieves "Motor Overheat" manual context based on the word "overheating."
    - Suggests maintenance actions like cleaning cooling fins or checking ambient temperature.

---

## 🔍 Quality Check
- **Success**: The "Live Insight" section provides distinct, technical, and actionable bullet points.
- **Accuracy**: The AI correctly identifies the *meaning* of alarm codes based on retrieved documentation.
- **Persistence**: Refreshes do not wipe out your query results (checked via History).
