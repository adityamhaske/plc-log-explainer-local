# 🧪 System Testing Guide

Use these 3 specific test cases to verify that your PLC Log Explainer is correctly ingesting logs, searching the knowledge base, and generating accurate explanations.

## ⚠️ Prerequisites
1.  **Ensure App is Running**: `streamlit run ui/app.py`
2.  **Ingest Data First**:
    *   Upload `data/alpi/sample.csv` in the sidebar.
    *   Click **"Process & Ingest"**.
    *   *Why?* The AI needs these logs in its memory to "see" that these errors actually happened.

---

## ✅ Test Case 1: The Vacuum Leak
**Scenario**: A technician sees "ALM_3021" on Machine 3 and doesn't know what it means.

*   **Input Query**:
    ```text
    Machine_3 triggered ALM_3021
    ```
*   **Expected Output**:
    *   **Summary**: The AI should identify this as a "Pneumatic vacuum alarm".
    *   **Root Cause**: It should mention "Seal leakage" or "pump degradation".
    *   **Action**: It should suggest checking seals or the pump.
    *   **Evidence**: Look for a reference to the manual entry for `ALM_3021` or the log at `08:23`.

---

## ✅ Test Case 2: The Mystery E-Stop
**Scenario**: Machine 1 stopped suddenly. We want to know if it was a mechanical fault or an operator action.

*   **Input Query**:
    ```text
    What happened to Machine_1 at 08:45?
    ```
*   **Expected Output**:
    *   **Summary**: The AI should link this time/machine to `ALM_1001` (Emergency Stop).
    *   **Root Cause**: "Operator pressed E-Stop" or "circuit fault".
    *   **Action**: "Reset E-Stop button", "Check wiring".
    *   **Evidence**: It must pull the log entry: `2020-06-01 08:45:00, Machine_1, ALM_1001`.

---

## ✅ Test Case 3: Overheating Diagnosis
**Scenario**: You see ALM_2050 in the logs for Machine 2 and need to fix it.

*   **Input Query**:
    ```text
    Explain the fault on Machine_2 (ALM_2050)
    ```
*   **Expected Output**:
    *   **Summary**: Identification of "Motor Overheat".
    *   **Root Cause**: "Cooling fan failure" or "overload".
    *   **Action**: "Clean cooling fins" or "Check load".

---

## 🔍 How to Interpret Results
*   **Success**: The "Explanation" section gives you clear English sentences that match the "Expected Output" above.
*   **Partial Success**: It finds the log ("I see event X") but doesn't explain the root cause (Knowledge Base retrieval failed).
*   **Failure**: It says "I don't have information about this" or hallucinates a completely wrong error (e.g., calling ALM_3021 a "Door Open" error).
