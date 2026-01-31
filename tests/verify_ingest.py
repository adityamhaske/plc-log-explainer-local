import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer

def test_ingest():
    print("Testing Ingestion Layer...")
    
    # Test ALPI
    alpi_path = "data/alpi/sample.csv"
    if os.path.exists(alpi_path):
        print(f"\nParsing {alpi_path}...")
        parser = LogParser(alpi_path)
        textualizer = Textualizer()
        
        for chunk_df in parser.parse():
            print(f"Read chunk with {len(chunk_df)} rows.")
            texts = textualizer.process_chunk(chunk_df)
            print("Generate Texts (First 3):")
            for t in texts[:3]:
                print(" -", t)
            break # Just test first chunk
    else:
        print("ALPI sample not found.")

    # Test PIADE
    piade_path = "data/piade/sample.csv"
    if os.path.exists(piade_path):
        print(f"\nParsing {piade_path}...")
        parser = LogParser(piade_path)
        textualizer = Textualizer()
        
        for chunk_df in parser.parse():
            texts = textualizer.process_chunk(chunk_df)
            print("Generate Texts (First 2):")
            for t in texts[:2]:
                print(" -", t)
            break

if __name__ == "__main__":
    test_ingest()
