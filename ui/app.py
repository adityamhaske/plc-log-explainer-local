import streamlit as st
import pandas as pd
import os
import sys
import time
import json
from datetime import datetime
from prometheus_client import start_http_server, Summary, Counter, REGISTRY

# Fix import path to allow importing from parent directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer
from rag.embed import Indexer
from rag.retrieve import Retriever
from rag.generate import Generator

# --- Monitoring Metrics (Singleton check) ---
if 'metrics_started' not in st.session_state:
    try:
        start_http_server(8000) # Expose metrics on port 8000
    except:
        pass # Port likely in use by another worker
    st.session_state['metrics_started'] = True

def get_metric(cls, name, description):
    """Helper to get existing metric or create new one to avoid duplication error."""
    if name in REGISTRY._names_to_collectors:
        return REGISTRY._names_to_collectors[name]
    return cls(name, description)

QUERY_LATENCY = get_metric(Summary, 'query_latency_seconds', 'Time spent processing query')
QUERY_COUNT = get_metric(Counter, 'query_count', 'Total queries processed')
FEEDBACK_GOOD = get_metric(Counter, 'feedback_good_total', 'Total positive feedback')
FEEDBACK_BAD = get_metric(Counter, 'feedback_bad_total', 'Total negative feedback')

# Page Config
st.set_page_config(
    page_title="PLC Fault Explainer v2", 
    page_icon="⚡", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom CSS for Modern Industrial Look ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    .stApp { background-color: #0F172A; color: #E2E8F0; }
    h1, h2, h3 { color: #F8FAFC !important; font-weight: 700; }
    .css-card {
        background-color: #1E293B; border: 1px solid #334155;
        border-radius: 12px; padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 20px;
    }
    .stButton>button {
        background-color: #3B82F6; color: white; border: none;
        border-radius: 8px; padding: 0.6rem 1.2rem; font-weight: 600; width: 100%;
    }
    .stButton>button:hover { background-color: #2563EB; }
    .stTextInput>div>div>input { background-color: #0F172A; border: 1px solid #334155; color: white; }
    div[data-testid="stMetricValue"] { font-size: 1.5rem; color: #38BDF8; }
    .step-header { font-size: 1.1rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.5rem; }
</style>
""", unsafe_allow_html=True)

# --- Helper: Save Feedback ---
def save_feedback(query, response, rating):
    feedback_file = "data/feedback_logs.json"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "response": response,
        "rating": rating
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
        
    # Update Prometheus
    if rating == "Good":
        FEEDBACK_GOOD.inc()
    else:
        FEEDBACK_BAD.inc()

# --- Header ---
col_logo, col_title = st.columns([1, 6])
with col_logo: st.markdown("# ⚡") 
with col_title:
    st.title("Industrial Intelligent Assistant v2")
    st.markdown("Hybrid Search • RLHF Feedback • Real-time Monitoring")

st.markdown("---")

# --- Sidebar ---
with st.sidebar:
    st.markdown('<div class="step-header">Step 1: Data Source</div>', unsafe_allow_html=True)
    uploaded_file = st.file_uploader("Upload CSV Log File", type=['csv'])
    
    if uploaded_file:
        save_path = os.path.join("data", uploaded_file.name)
        with open(save_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.success(f"Loaded: {uploaded_file.name}")
        
        # Preview
        parser = LogParser(save_path)
        st.dataframe(parser.get_preview(), height=100, use_container_width=True)
        
        st.markdown("---")
        st.markdown('<div class="step-header">Step 2: Initialize</div>', unsafe_allow_html=True)
        
        if st.button("🔄 Process & Memorize Logs"):
            progress_bar = st.progress(0)
            status_text = st.empty()
            try:
                status_text.text("Parsing...")
                parser = LogParser(save_path)
                progress_bar.progress(20)
                
                status_text.text("Textualizing...")
                textualizer = Textualizer()
                all_texts = []
                for chunk in parser.parse():
                    all_texts.extend(textualizer.process_chunk(chunk))
                progress_bar.progress(50)
                
                status_text.text("Updating Knowledge Base (Vector + Keyword Index)...")
                idx = Indexer()
                idx.ingest_logs(all_texts)
                progress_bar.progress(100)
                
                status_text.text("✅ Ready!")
                st.session_state['data_ready'] = True
                time.sleep(1)
                st.rerun()
            except Exception as e:
                st.error(f"Error: {e}")

    st.markdown("---")
    st.caption("System Status")
    st.markdown("🟢 **Hybrid Search**: `Active`")
    st.markdown("� **Metrics**: `Port 8000`")

# --- Main Area ---
st.markdown('<div class="step-header">Step 3: Fault Analysis</div>', unsafe_allow_html=True)

query_container = st.container()

with query_container:
    st.markdown("""<div class="css-card"><h3>💬 Ask the Expert System</h3></div>""", unsafe_allow_html=True)
    col_input, col_btn = st.columns([4, 1])
    with col_input:
        user_query = st.text_input("Query", placeholder="Describe fault or paste code...", label_visibility="collapsed")
    with col_btn:
        generate_btn = st.button("Analyze ➜")

if generate_btn and user_query:
    with st.spinner("🔍 Running Hybrid Search (Semantic + Keyword)..."):
        start_time = time.time()
        QUERY_COUNT.inc() # Metric
        
        # RAG Pipeline with Latency Metric
        with QUERY_LATENCY.time():
            ret = Retriever()
            results = ret.query(user_query, k=3)
            context_docs = [r.page_content for r in results]
            gen = Generator(model="mistral")
            explanation = gen.generate_explanation(user_query, context_docs)
            
        st.session_state['last_query'] = user_query
        st.session_state['last_explanation'] = explanation
        st.session_state['last_context'] = context_docs
        
        end_time = time.time()

# Display Result if available
if 'last_explanation' in st.session_state:
    st.markdown("### 📋 Diagnosis Report")
    st.markdown(f"""
    <div class="css-card" style="border-left: 5px solid #3B82F6;">
        {st.session_state['last_explanation'].replace(chr(10), '<br>')}
    </div>
    """, unsafe_allow_html=True)
    
    # Feedback UI
    st.markdown("#### 📢 Rate this Explanation")
    col_good, col_bad = st.columns(2)
    with col_good:
        if st.button("👍 Good", key="good"):
            save_feedback(st.session_state['last_query'], st.session_state['last_explanation'], "Good")
            st.toast("Feedback Saved: Good")
    with col_bad:
        if st.button("👎 Poor", key="bad"):
            save_feedback(st.session_state['last_query'], st.session_state['last_explanation'], "Bad")
            st.toast("Feedback Saved: Bad")
            
    with st.expander("🕵️ Retrieved Evidence (Hybrid Search Results)"):
        for i, doc in enumerate(st.session_state['last_context']):
            st.markdown(f"**Evidence {i+1}:**")
            st.info(doc)

