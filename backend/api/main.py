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
    import json
    from datetime import datetime
    try:
        file_path = f"data/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Track file metadata
        metadata_file = "data/file_metadata.json"
        metadata = []
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                try:
                    metadata = json.load(f)
                except:
                    pass
        
        # Check if file already exists in metadata
        existing = next((m for m in metadata if m["filename"] == file.filename), None)
        if not existing:
            metadata.append({
                "filename": file.filename,
                "upload_timestamp": datetime.now().isoformat(),
                "size": os.path.getsize(file_path)
            })
            with open(metadata_file, "w") as f:
                json.dump(metadata, f, indent=2)
        
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
    import json
    from datetime import datetime
    try:
        retriever = Retriever()
        results = retriever.query(request.query, k=request.top_k)
        context_docs = [r.page_content for r in results]
        
        generator = Generator(model="mistral")
        explanation = generator.generate_explanation(request.query, context_docs)
        
        # Try to parse JSON response
        try:
            parsed = json.loads(explanation)
            structured_result = {
                "query": request.query,
                "structured": parsed,
                "evidence": context_docs
            }
        except:
            # Fallback for non-JSON responses
            structured_result = {
                "query": request.query,
                "structured": {
                    "summary": "Error parsing response",
                    "evidence": "",
                    "root_cause": explanation,
                    "actions": "",
                    "confidence": "Low"
                },
                "evidence": context_docs
            }
        
        return structured_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class HistorySaveRequest(BaseModel):
    filename: str
    query: str
    result: dict

@app.post("/api/history/save")
async def save_history(request: HistorySaveRequest):
    """Save query history for a specific file"""
    import json
    from datetime import datetime
    
    try:
        history_file = "data/query_history.json"
        entry = {
            "filename": request.filename,
            "timestamp": datetime.now().isoformat(),
            "query": request.query,
            "result": request.result
        }
        
        data = []
        if os.path.exists(history_file):
            with open(history_file, "r") as f:
                try:
                    data = json.load(f)
                except:
                    pass
        data.append(entry)
        
        with open(history_file, "w") as f:
            json.dump(data, f, indent=2)
        
        return {"message": "History saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(filename: str = None):
    """Get query history, optionally filtered by filename"""
    import json
    
    try:
        history_file = "data/query_history.json"
        if not os.path.exists(history_file):
            return {"history": []}
        
        with open(history_file, "r") as f:
            data = json.load(f)
        
        if filename:
            data = [entry for entry in data if entry.get("filename") == filename]
        
        return {"history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files")
async def get_uploaded_files():
    """Get list of all uploaded CSV files with metadata"""
    import json
    try:
        metadata_file = "data/file_metadata.json"
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                metadata = json.load(f)
            return {"files": metadata}
        else:
            # Fallback: list files without metadata
            data_dir = "data"
            files = [{"filename": f, "upload_timestamp": None, "size": None} 
                    for f in os.listdir(data_dir) if f.endswith('.csv')]
            return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/preview/{filename}")
async def preview_file(filename: str):
    """Get preview of CSV file (first 6 lines)"""
    try:
        file_path = f"data/{filename}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(file_path, "r") as f:
            # Read all lines (or a very large number for safety)
            # Using readlines() is ok for 1k-5k rows on 8GB RAM
            lines = [line.strip() for line in f.readlines()]
        
        rows = [line.split(',') for line in lines if line]
        return {"preview": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/faults/{filename}")
async def get_faults(filename: str):
    """Extract unique fault codes from the CSV"""
    import pandas as pd
    try:
        file_path = f"data/{filename}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Load the whole file to get all unique alarms, but limit columns for memory
        # Assuming typical column names from textualize.py
        df = pd.read_csv(file_path)
        cols = [c for c in df.columns if c.lower() in ["alarm", "alarm_code", "fault", "fault_code"]]
        
        if not cols:
            # Try to find any column with "alarm" or "fault" in the name if exact match fails
            cols = [c for c in df.columns if "alarm" in c.lower() or "fault" in c.lower()]
            
        if not cols:
            return {"faults": []}
            
        # Get unique values from the primary alarm column
        unique_faults = df[cols[0]].dropna().unique().tolist()
        return {"faults": sorted([str(f) for f in unique_faults])}
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
