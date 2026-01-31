import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rag.embed import Indexer
from rag.retrieve import Retriever
from rag.generate import Generator
from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer

def test_pipeline():
    print("Initializing RAG Pipeline...")
    
    # 1. Ingest Data
    print("Step 1: Ingesting Data into ChromaDB...")
    indexer = Indexer()
    indexer.clear()
    
    # Ingest Manuals
    indexer.ingest_manuals("data/auto_faults/knowledge_base.json")
    
    # Ingest Logs
    if os.path.exists("data/alpi/sample.csv"):
        parser = LogParser("data/alpi/sample.csv")
        textualizer = Textualizer()
        all_texts = []
        for chunk in parser.parse():
            all_texts.extend(textualizer.process_chunk(chunk))
        indexer.ingest_logs(all_texts)
    
    # 2. Retrieve
    print("\nStep 2: Retrieving Context...")
    retriever = Retriever()
    query = "Machine_3 triggered ALM_3021"
    
    results = retriever.query(query, k=3)
    context_docs = [r.page_content for r in results]
    
    print(f"Query: {query}")
    print("Retrieved Context:")
    for doc in context_docs:
        print(f" - {doc[:100]}...")
        
    # 3. Generate
    print("\nStep 3: Generating Explanation...")
    generator = Generator(model="mistral")
    explanation = generator.generate_explanation(query, context_docs)
    
    print("\nXXX GENERATED EXPLANATION XXX\n")
    print(explanation)
    print("\nXXX END XXX")

if __name__ == "__main__":
    test_pipeline()
