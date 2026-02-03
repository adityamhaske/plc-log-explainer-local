import sys
import os
import shutil
import json
import pandas as pd
from datetime import datetime
from typing import List, Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer
from ingest.parse_kb import KnowledgeBaseIngestor
from rag.embed import Indexer
from rag.retrieve import Retriever
from rag.generate import Generator

app = FastAPI(title="PLC Fault Explainer API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    rating: str

class HistorySaveRequest(BaseModel):
    filename: str
    query: str
    result: dict

class KBProcessRequest(BaseModel):
    path: str = "data/knowledge_base"

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and save log file"""
    try:
        file_path = f"data/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        metadata_file = "data/file_metadata.json"
        metadata = []
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                try:
                    metadata = json.load(f)
                except:
                    pass
        
        if not any(m["filename"] == file.filename for m in metadata):
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

@app.post("/api/process")
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
        
        clean_explanation = explanation.strip()
        if clean_explanation.startswith("```"):
            clean_explanation = clean_explanation.split("\n", 1)[-1].rsplit("\n", 1)[0].replace("json", "").strip()
            
        try:
            parsed = json.loads(clean_explanation)
            return {
                "query": request.query,
                "structured": parsed,
                "evidence": context_docs
            }
        except:
            import re
            match = re.search(r'\{.*\}', explanation, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                    return {
                        "query": request.query,
                        "structured": parsed,
                        "evidence": context_docs
                    }
                except:
                    pass
            
            return {
                "query": request.query,
                "structured": {
                    "summary": "AI returned non-structured text",
                    "evidence": "No valid JSON block found in the response.",
                    "root_cause": explanation,
                    "actions": "Please review raw output.",
                    "confidence": "Low"
                },
                "evidence": context_docs
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/history/save")
async def save_history(request: HistorySaveRequest):
    """Save query history"""
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
                try: data = json.load(f)
                except: pass
        data.append(entry)
        
        with open(history_file, "w") as f:
            json.dump(data, f, indent=2)
        
        return {"message": "History saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(filename: Optional[str] = None):
    """Get query history"""
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
    """Get metadata for all uploaded CSV files"""
    try:
        metadata_file = "data/file_metadata.json"
        if os.path.exists(metadata_file):
            with open(metadata_file, "r") as f:
                return {"files": json.load(f)}
        
        data_dir = "data"
        files = [{"filename": f, "upload_timestamp": None, "size": None} 
                for f in os.listdir(data_dir) if f.endswith('.csv')]
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/preview/{filename}")
async def preview_file(filename: str):
    """Get preview of CSV file"""
    try:
        file_path = f"data/{filename}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(file_path, "r") as f:
            lines = [f.readline().strip() for _ in range(1001)]
            lines = [l for l in lines if l]
        
        rows = [line.split(',') for line in lines]
        return {"preview": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/faults/{filename}")
async def get_faults(filename: str):
    """Extract unique fault codes"""
    try:
        file_path = f"data/{filename}"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        df = pd.read_csv(file_path)
        cols = [c for c in df.columns if any(x in c.lower() for x in ["alarm", "fault"])]
        
        if not cols: return {"faults": []}
        unique_faults = df[cols[0]].dropna().unique().tolist()
        return {"faults": sorted([str(f) for f in unique_faults])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Submit user feedback"""
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
                try: data = json.load(f)
                except: pass
        data.append(entry)
        
        with open(feedback_file, "w") as f:
            json.dump(data, f, indent=2)
        
        return {"message": "Feedback saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kb/upload")
async def upload_kb_file(file: UploadFile = File(...)):
    """Upload to KB"""
    try:
        kb_dir = "data/knowledge_base"
        os.makedirs(kb_dir, exist_ok=True)
        file_path = os.path.join(kb_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"message": "File uploaded to Knowledge Base", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kb/ls")
async def ls_directory(path: str = "."):
    """List subdirectories for the folder navigator"""
    try:
        # Prevent escaping /app
        full_path = os.path.abspath(path)
        if not full_path.startswith("/app"):
            # Fallback for local dev outside docker if needed, but usually we want to stay in /app
            pass
            
        if not os.path.exists(path):
            return {"dirs": [], "error": "Path not found"}
        
        dirs = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d)) and not d.startswith(".")]
        return {
            "dirs": sorted(dirs),
            "current_path": os.path.abspath(path),
            "parent": os.path.dirname(os.path.abspath(path))
        }
    except Exception as e:
        return {"dirs": [], "error": str(e)}

@app.get("/api/kb/files")
async def get_kb_files(path: str = "data/knowledge_base"):
    """List KB documents with connectivity status"""
    try:
        abs_path = os.path.abspath(path)
        if not os.path.exists(path):
            return {
                "files": [], 
                "error": "Path not found", 
                "status": "disconnected",
                "abs_path": abs_path
            }
        
        files = [{"filename": f, "size": os.path.getsize(os.path.join(path, f))} 
                for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
        
        return {
            "files": files, 
            "status": "connected", 
            "abs_path": abs_path,
            "count": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/kb/process")
async def process_kb(request: KBProcessRequest):
    """Index KB path"""
    try:
        kb_dir = request.path
        if not os.path.exists(kb_dir):
            raise HTTPException(status_code=404, detail=f"Path {kb_dir} not found")
            
        ingestor = KnowledgeBaseIngestor()
        docs = ingestor.process_directory(kb_dir)
        
        indexer = Indexer()
        indexer.ingest_documents(docs)
        
        return {"message": f"Indexed {len(docs)} segments", "count": len(docs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "PLC Fault Explainer API v3"}
