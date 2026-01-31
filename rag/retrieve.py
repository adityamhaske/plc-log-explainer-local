from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

class Retriever:
    def __init__(self, persist_dir: str = "./chroma_db"):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = Chroma(
            collection_name="plc_logs",
            embedding_function=self.embeddings,
            persist_directory=persist_dir
        )
        
    def query(self, query_text: str, k: int = 5):
        """Retrieves top-k similar documents."""
        results = self.vector_store.similarity_search(query_text, k=k)
        return results

if __name__ == "__main__":
    ret = Retriever()
    results = ret.query("vacuum alarm")
    for r in results:
        print(f"[{r.metadata['source']}] {r.page_content}")
