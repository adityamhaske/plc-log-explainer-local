import pandas as pd
import json
import os
from typing import Iterator, Union, Dict, Any

class LogParser:
    def __init__(self, filepath: str, chunksize: int = 10000):
        self.filepath = filepath
        self.chunksize = chunksize
        self.file_ext = os.path.splitext(filepath)[1].lower()

    def validate(self) -> bool:
        """Simple validation: file exists and extension is supported."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"File not found: {self.filepath}")
        if self.file_ext not in ['.csv', '.json']:
            raise ValueError(f"Unsupported file type: {self.file_ext}")
        return True

    def parse(self) -> Iterator[pd.DataFrame]:
        """Parses the file and yields dataframes in chunks."""
        self.validate()
        
        if self.file_ext == '.csv':
            # Use pandas chunksize for CSV
            with pd.read_csv(self.filepath, chunksize=self.chunksize) as reader:
                for chunk in reader:
                    yield chunk
        
        elif self.file_ext == '.json':
            # For JSON, efficient chunking is harder if it's a single big list.
            # Assuming standard "records" or list of dicts.
            # Loading full JSON might be risky for 8GB RAM if huge, but for now standard load.
            # TODO: Stream JSON if needed using ijson for huge files.
            with open(self.filepath, 'r') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                # Yield chunks from list
                for i in range(0, len(data), self.chunksize):
                    yield pd.DataFrame(data[i:i + self.chunksize])
            else:
                 yield pd.DataFrame([data])

    def get_preview(self, rows: int = 5) -> pd.DataFrame:
        """Returns the first few rows for preview."""
        try:
             return next(self.parse()).head(rows)
        except StopIteration:
            return pd.DataFrame()

