from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
try:
    from langchain.retrievers.ensemble import EnsembleRetriever
except ImportError:
    try:
        from langchain.retrievers import EnsembleRetriever
    except ImportError:
        try:
            from langchain_community.retrievers import EnsembleRetriever
        except ImportError:
            EnsembleRetriever = None
from langchain_core.documents import Document

class Retriever:
    def __init__(self, persist_dir: str = "./chroma_db", weights: list[float] = [0.5, 0.5]):
        """
        Initializes a Hybrid Retriever (Vector + Keyword).
        Note: BM25Retriever needs to be initialized with documents. 
        Since Chroma stores vectors, we might need to fetch docs or maintain a separate doc store for BM25.
        For this local implementation, we will fetch all documents from Chroma to build the BM25 index.
        This might be slow for huge datasets but fine for this scale.
        """
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = Chroma(
            collection_name="plc_logs",
            embedding_function=self.embeddings,
            persist_directory=persist_dir
        )
        
        # Initialize Retrievers
        self.vector_retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        # Build BM25 from existing docs in VectorDB
        # CAUTION: get() without args fetches all. For scale, use a real search engine (Elasticsearch).
        # For <100k chunks, this is acceptable locally.
        try:
            stored_data = self.vector_store.get()
            texts = stored_data['documents']
            metadatas = stored_data['metadatas']
            
            docs = [Document(page_content=t, metadata=m) for t, m in zip(texts, metadatas)]
            
            if docs and EnsembleRetriever:
                self.bm25_retriever = BM25Retriever.from_documents(docs)
                self.bm25_retriever.k = 5
                
                # Ensemble
                self.ensemble_retriever = EnsembleRetriever(
                    retrievers=[self.bm25_retriever, self.vector_retriever],
                    weights=weights
                )
            else:
                self.ensemble_retriever = self.vector_retriever
                
        except Exception as e:
            print(f"Warning: Could not initialize BM25 (Empty DB?): {e}")
            self.ensemble_retriever = self.vector_retriever
        
    def query(self, query_text: str, k: int = 5):
        """Retrieves top-k similar documents using Hybrid Search."""
        # Update k for dynamic calls if supported, but Ensemble usually fixes it at init.
        # We invoke the chain.
        return self.ensemble_retriever.invoke(query_text)

if __name__ == "__main__":
    ret = Retriever()
    # Test specific keyword "ALM_3021" vs semantic "Vacuum issue"
    print("--- Query: ALM_3021 ---")
    results = ret.query("ALM_3021")
    for r in results:
        print(f"[{r.metadata.get('source', 'unknown')}] {r.page_content}")
        
    print("\n--- Query: Vacuum Leak ---")
    results = ret.query("Vacuum Leak")
    for r in results:
        print(f"[{r.metadata.get('source', 'unknown')}] {r.page_content}")
