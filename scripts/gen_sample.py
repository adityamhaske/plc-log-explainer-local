import csv
import random
from datetime import datetime, timedelta

def generate_sample_csv(filename, num_rows=150):
    machines = [f"Machine_{i}" for i in range(1, 6)]
    alarms = [
        ("ALM_3021", "Vacuum Failure"),
        ("ALM_1001", "Emergency Stop"),
        ("ALM_2045", "Motor Overheat"),
        ("ALM_4056", "Communication Loss"),
        ("ALM_5012", "Pressure Low"),
        ("ALM_6078", "Limit Switch Error"),
        ("ALM_7034", "Sensor Timeout"),
        ("ALM_8090", "Gate Open"),
        ("ALM_2110", "Overcurrent Trip"),
        ("ALM_3345", "Oil Level Low"),
        ("ALM_4490", "Phase Unbalance"),
        ("ALM_5521", "Safety Relay Trip")
    ]
    states = ["Running", "Idle", "Error", "Maintenance"]

    start_time = datetime(2024, 2, 1, 8, 0, 0)
    
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['timestamp', 'machine', 'alarm', 'state']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for i in range(num_rows):
            # Advance time by random intervals (1 min to 30 mins)
            current_time = start_time + timedelta(minutes=i * random.randint(5, 15))
            
            # Pick a random machine and alarm
            machine = random.choice(machines)
            alarm_code, _ = random.choice(alarms)
            state = random.choice(states)
            
            writer.writerow({
                'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'machine': machine,
                'alarm': alarm_code,
                'state': state
            })

if __name__ == "__main__":
    generate_sample_csv("data/sample_v4.csv", 150)
    print("Generated data/sample_v4.csv with 150 rows.")
