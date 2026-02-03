from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
try:
    from langchain.retrievers.ensemble import EnsembleRetriever
except ImportError:
    try:
        from langchain_community.retrievers import EnsembleRetriever
    except ImportError:
        try:
            from langchain_classic.retrievers.ensemble import EnsembleRetriever
        except ImportError:
            EnsembleRetriever = None
from langchain_core.documents import Document

class Retriever:
    def __init__(self, persist_dir: str = "./chroma_db", weights: list[float] = [0.5, 0.5]):
        """Initializes a Hybrid Retriever (Vector + Keyword)."""
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = Chroma(
            collection_name="plc_logs",
            embedding_function=self.embeddings,
            persist_directory=persist_dir
        )
        
        self.vector_retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        try:
            stored_data = self.vector_store.get()
            texts = stored_data['documents']
            metadatas = stored_data['metadatas']
            docs = [Document(page_content=t, metadata=m) for t, m in zip(texts, metadatas)]
            
            if docs:
                self.bm25_retriever = BM25Retriever.from_documents(docs)
                self.bm25_retriever.k = 5
                self.ensemble_retriever = EnsembleRetriever(
                    retrievers=[self.bm25_retriever, self.vector_retriever],
                    weights=weights
                )
            else:
                self.ensemble_retriever = self.vector_retriever
        except Exception as e:
            self.ensemble_retriever = self.vector_retriever
        
    def query(self, query_text: str, k: int = 5):
        """Retrieves top-k similar documents."""
        return self.ensemble_retriever.invoke(query_text)
