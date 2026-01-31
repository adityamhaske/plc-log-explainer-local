import csv
import json
import os
from datetime import datetime, timedelta

def generate_alpi():
    os.makedirs("data/alpi", exist_ok=True)
    with open("data/alpi/sample.csv", "w") as f:
        # No header in example, but standard csv usually has one. 
        # PRD Example: 2020-06-01 08:23:11,Machine_3,ALM_3021
        # I'll add a header for clarity or just data if PRD implies raw.
        # "Input (CSV): 2020-06-01 08:23:11,Machine_3,ALM_3021"
        # I'll write a header: timestamp,machine,alarm
        # But wait, parsing code needs to know. I'll stick to headless if implied, but header is safer.
        # Let's use header: timestamp,machine,alarm
        writer = csv.writer(f)
        writer.writerow(["timestamp", "machine", "alarm"])
        writer.writerow(["2020-06-01 08:23:11", "Machine_3", "ALM_3021"])
        writer.writerow(["2020-06-01 08:45:00", "Machine_1", "ALM_1001"])
        writer.writerow(["2020-06-01 09:12:30", "Machine_2", "ALM_2050"])
        writer.writerow(["2020-06-01 10:00:00", "Machine_3", "ALM_3021"]) 

def generate_piade():
    os.makedirs("data/piade", exist_ok=True)
    with open("data/piade/sample.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "machine", "alarm", "state"])
        writer.writerow(["2021-01-01 12:00:00", "M1", "Error_50", "Running"])
        writer.writerow(["2021-01-01 12:05:00", "M1", "Error_50", "Stopped"])

def generate_auto_faults():
    os.makedirs("data/auto_faults", exist_ok=True)
    data = [
        {
            "fault": "ALM_3021",
            "description": "Pneumatic vacuum alarm",
            "diagnosis": "Seal leakage or pump degradation",
            "resolution": "Check seals and replace if necessary. Inspect pump for wear."
        },
        {
            "fault": "ALM_1001",
            "description": "Emergency Stop",
            "diagnosis": "Operator pressed E-Stop or circuit fault",
            "resolution": "Reset E-Stop button. Check safety circuit wiring."
        },
        {
            "fault": "ALM_2050",
            "description": "Motor Overheat",
            "diagnosis": "Cooling fan failure or overload",
            "resolution": "Clean cooling fins. Check load on motor."
        }
    ]
    with open("data/auto_faults/knowledge_base.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    generate_alpi()
    generate_piade()
    generate_auto_faults()
    print("Stub data generated.")
