import pandas as pd

class Textualizer:
    def __init__(self):
        pass

    def row_to_text(self, row: pd.Series) -> str:
        """Converts a single log row to narrative text."""
        # Detect schema based on columns
        # ALPI: timestamp, machine, alarm
        # PIADE: timestamp, machine, alarm, state
        
        cols = row.index.str.lower()
        
        timestamp = row.get("timestamp") or row.get("time") or "Unknown Time"
        machine = row.get("machine") or row.get("machine_id") or "Unknown Machine"
        alarm = row.get("alarm") or row.get("alarm_code") or "Unknown Alarm"
        
        text = f"At {timestamp}, {machine} triggered alarm {alarm}."
        
        if "state" in cols:
            state = row.get("state")
            text += f" The machine state was recorded as '{state}'."
            
        return text

    def process_chunk(self, df: pd.DataFrame) -> list[str]:
        """Converts a dataframe chunk to a list of text strings."""
        return df.apply(self.row_to_text, axis=1).tolist()

if __name__ == "__main__":
    # Test
    data = {
        "timestamp": ["2020-06-01 08:23:11"],
        "machine": ["Machine_3"],
        "alarm": ["ALM_3021"]
    }
    df = pd.DataFrame(data)
    tex = Textualizer()
    print(tex.process_chunk(df))
