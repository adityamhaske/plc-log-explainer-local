import chromadb
from chromadb.utils import embedding_functions
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
import json
import os
import shutil

class Indexer:
    def __init__(self, persist_dir: str = "./chroma_db"):
        self.persist_dir = persist_dir
        # Use HuggingFace embeddings via LangChain
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = Chroma(
            collection_name="plc_logs",
            embedding_function=self.embeddings,
            persist_directory=self.persist_dir
        )
        
    def clear(self):
        """Clears the existing vector store."""
        if os.path.exists(self.persist_dir):
            self.vector_store.delete_collection()
            # Re-init
            self.vector_store = Chroma(
                collection_name="plc_logs",
                embedding_function=self.embeddings,
                persist_directory=self.persist_dir
            )

    def ingest_manuals(self, json_path: str):
        """Ingests structured manuals/fault knowledge base."""
        if not os.path.exists(json_path):
            print(f"Manual file not found: {json_path}")
            return
            
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        documents = []
        for item in data:
            # Construct a rich text representation
            content = f"Fault Code: {item.get('fault', 'N/A')}. " \
                      f"Description: {item.get('description', '')}. " \
                      f"Diagnosis: {item.get('diagnosis', '')}. " \
                      f"Resolution: {item.get('resolution', '')}."
            
            documents.append(Document(
                page_content=content,
                metadata={"source": "manual", "code": item.get('fault', 'unknown')}
            ))
            
        if documents:
            self.vector_store.add_documents(documents)
            print(f"Ingested {len(documents)} manual entries.")

    def ingest_logs(self, log_texts: list[str]):
        """Ingests textualized logs as historical context."""
        documents = [
            Document(page_content=text, metadata={"source": "log_history", "content_type": "log"}) 
            for text in log_texts
        ]
        
        if documents:
            self.vector_store.add_documents(documents)
            print(f"Ingested {len(documents)} log entries.")

    def ingest_documents(self, documents: list[Document]):
        """Ingests generic LangChain documents into the store."""
        if documents:
            # Ensure metadata has at least source and content_type
            for doc in documents:
                if "content_type" not in doc.metadata:
                    doc.metadata["content_type"] = "knowledge_base"
            
            self.vector_store.add_documents(documents)
            print(f"Ingested {len(documents)} knowledge base documents.")

