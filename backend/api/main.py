import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
from typing import List

from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer
from rag.embed import Indexer
from rag.retrieve import Retriever
from rag.generate import Generator

app = FastAPI(title="PLC Fault Explainer API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

class FeedbackRequest(BaseModel):
    query: str
    response: str
    rating: str  # "good", "can_be_better", "bad"

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and save log file"""
    try:
        file_path = f"data/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"message": "File uploaded successfully", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ app.post("/api/process")
async def process_logs(filename: str):
    """Process and index logs"""
    try:
        file_path = f"data/{filename}"
        parser = LogParser(file_path)
        textualizer = Textualizer()
        
        all_texts = []
        for chunk in parser.parse():
            all_texts.extend(textualizer.process_chunk(chunk))
        
        indexer = Indexer()
        indexer.ingest_logs(all_texts)
        
        return {"message": f"Processed {len(all_texts)} log entries", "count": len(all_texts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
async def query_system(request: QueryRequest):
    """Query the RAG system"""
    try:
        retriever = Retriever()
        results = retriever.query(request.query, k=request.top_k)
        context_docs = [r.page_content for r in results]
        
        generator = Generator(model="mistral")
        explanation = generator.generate_explanation(request.query, context_docs)
        
        return {
            "query": request.query,
            "explanation": explanation,
            "evidence": context_docs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Submit user feedback"""
    import json
    from datetime import datetime
    
    try:
        feedback_file = "data/feedback_logs.json"
        entry = {
            "timestamp": datetime.now().isoformat(),
            "query": request.query,
            "response": request.response,
            "rating": request.rating
        }
        
        data = []
        if os.path.exists(feedback_file):
            with open(feedback_file, "r") as f:
                try:
                    data = json.load(f)
                except:
                    pass
        data.append(entry)
        
        with open(feedback_file, "w") as f:
            json.dump(data, f, indent=2)
        
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "PLC Fault Explainer API v3",
        "endpoints": [
            "/api/upload",
            "/api/process",
            "/api/query",
            "/api/feedback"
        ]
    }
