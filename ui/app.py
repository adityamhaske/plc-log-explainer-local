import streamlit as st
import pandas as pd
import os
import sys
import time

# Fix import path to allow importing from parent directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingest.parse_logs import LogParser
from ingest.textualize import Textualizer
from rag.embed import Indexer
from rag.retrieve import Retriever
from rag.generate import Generator

# Page Config
st.set_page_config(
    page_title="PLC Fault Explainer", 
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
    
    /* Main Background */
    .stApp {
        background-color: #0F172A; /* Slate 900 */
        color: #E2E8F0; /* Slate 200 */
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #F8FAFC !important;
        font-weight: 700;
    }
    
    /* Cards */
    .css-card {
        background-color: #1E293B; /* Slate 800 */
        border: 1px solid #334155; /* Slate 700 */
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
    }
    
    /* Buttons */
    .stButton>button {
        background-color: #3B82F6; /* Blue 500 */
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.2rem;
        font-weight: 600;
        transition: all 0.2s;
        width: 100%;
    }
    .stButton>button:hover {
        background-color: #2563EB; /* Blue 600 */
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .stButton>button:active {
        transform: translateY(1px);
    }
    
    /* File Uploader */
    .stFileUploader {
        background-color: #1E293B;
        border-radius: 8px;
        padding: 10px;
    }
    
    /* Inputs */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea {
        background-color: #0F172A;
        border: 1px solid #334155;
        color: white;
        border-radius: 8px;
    }
    
    /* Success/Info Alerts */
    .stSuccess, .stInfo {
        background-color: #1E293B !important;
        color: #E2E8F0 !important;
        border: 1px solid #10B981;
    }
    
    /* Metric Text */
    div[data-testid="stMetricValue"] {
        font-size: 1.5rem;
        color: #38BDF8; /* Sky 400 */
    }
    
    .step-header {
        font-size: 1.1rem;
        font-weight: 600;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

</style>
""", unsafe_allow_html=True)

# --- Header Section ---
col_logo, col_title = st.columns([1, 6])
with col_logo:
    st.markdown("# ⚡") 
with col_title:
    st.title("Industrial Intelligent Assistant")
    st.markdown("Automated Root Cause Analysis for PLC Faults")

st.markdown("---")

# --- Onboarding / Help Expandable ---
with st.expander("📘 How to use this system", expanded=False):
    st.markdown("""
    1.  **Step 1 (Sidebar)**: Upload your PLC logs (`.csv`). This gives the AI the memory of what happened.
    2.  **Step 2 (Sidebar)**: Click 'Process Logs' to read and memorize the file.
    3.  **Step 3 (Main)**: Describe the problem or copy an alarm code. The AI will explain it using the logs and its manual.
    """)

# --- Main Layout ---
# We use a sidebar for Data Ingestion (Setup) and Main Area for Analysis (Task)
with st.sidebar:
    st.markdown('<div class="step-header">Step 1: Data Source</div>', unsafe_allow_html=True)
    st.markdown(" Upload your machine logs here to begin.")
    
    uploaded_file = st.file_uploader("Upload CSV Log File", type=['csv'])
    
    if uploaded_file:
        # Save temp
        save_path = os.path.join("data", uploaded_file.name)
        with open(save_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
            
        st.success(f"Loaded: {uploaded_file.name}")
        
        # Preview Stats
        parser = LogParser(save_path)
        preview_df = parser.get_preview()
        st.caption("File Preview:")
        st.dataframe(preview_df, height=100, use_container_width=True)
        
        st.markdown("---")
        st.markdown('<div class="step-header">Step 2: Initialize</div>', unsafe_allow_html=True)
        
        if st.button("🔄 Process & Memorize Logs"):
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            try:
                # 1. Parsing
                status_text.text("Parsing file...")
                parser = LogParser(save_path)
                progress_bar.progress(20)
                
                # 2. Textualizing
                status_text.text("Converting to natural language...")
                textualizer = Textualizer()
                all_texts = []
                for chunk in parser.parse():
                    texts = textualizer.process_chunk(chunk)
                    all_texts.extend(texts)
                progress_bar.progress(50)
                
                # 3. Embedding
                status_text.text("Updating Knowledge Base (Vector DB)...")
                idx = Indexer()
                # Optional: Clear old logs? keeping additive for now or clear?
                # User might want to clear. Let's infer "New Session"
                # For simplicity, we just add.
                idx.ingest_logs(all_texts)
                progress_bar.progress(100)
                
                status_text.text("✅ Ready!")
                st.session_state['data_ready'] = True
                st.balloons()
                time.sleep(1)
                st.rerun()
                
            except Exception as e:
                st.error(f"Error: {e}")

    # System Status Footer
    st.markdown("---")
    st.caption("System Status")
    st.markdown("🟢 **Ollama Engine**: `Online`")
    st.markdown("🟢 **Vector DB**: `Active`")
    st.markdown(f"💾 **Memory Safe**: `True`")

# --- Main Analysis Area ---
st.markdown('<div class="step-header">Step 3: Fault Analysis</div>', unsafe_allow_html=True)

# Using a container for the chat interface feel
query_container = st.container()

with query_container:
    st.markdown("""
    <div class="css-card">
        <h3>💬 Ask the Expert System</h3>
        <p style="color: #94A3B8;">Describe the fault, paste an error code, or ask about a specific machine event.</p>
    </div>
    """, unsafe_allow_html=True)

    col_input, col_btn = st.columns([4, 1])
    
    with col_input:
        user_query = st.text_input(
            "Query", 
            placeholder="e.g. 'Machine_3 triggered ALM_3021' or 'Why did the pump stop?'",
            label_visibility="collapsed"
        )
        
    with col_btn:
        generate_btn = st.button("Analyze ➜")

    if generate_btn and user_query:
        if 'data_ready' not in st.session_state and not uploaded_file:
             st.warning("⚠️ Please upload and process logs in the sidebar first.")
        else:
            with st.spinner("🔍 Reading manuals and analyzing logs..."):
                start_time = time.time()
                
                # RAG Pipeline
                ret = Retriever()
                results = ret.query(user_query, k=3)
                context_docs = [r.page_content for r in results]
                
                gen = Generator(model="mistral")
                explanation = gen.generate_explanation(user_query, context_docs)
                
                end_time = time.time()
                
            # --- Results Display ---
            st.markdown("### 📋 Diagnosis Report")
            
            # Highlighted result card
            st.markdown(f"""
            <div class="css-card" style="border-left: 5px solid #3B82F6;">
                {explanation.replace(chr(10), '<br>')}
            </div>
            """, unsafe_allow_html=True)
            
            # Evidence Section
            with st.expander("🕵️ Retrieved Evidence (Why did I say this?)"):
                for i, doc in enumerate(context_docs):
                    st.markdown(f"**Evidence {i+1}:**")
                    st.info(doc)

            st.caption(f"⏱️ Analysis completed in {round(end_time - start_time, 2)} seconds")
