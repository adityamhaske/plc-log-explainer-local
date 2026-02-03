'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface StructuredResult {
    summary: string;
    evidence: string;
    root_cause: string;
    actions: string;
    confidence: string;
}

interface FileMetadata {
    filename: string;
    upload_timestamp: string;
    size: number;
}

export default function Workflow() {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [filePreview, setFilePreview] = useState<string[][]>([]);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{
        structured: StructuredResult;
        evidence: string[];
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [submittedRating, setSubmittedRating] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [kbFiles, setKbFiles] = useState<FileMetadata[]>([]);
    const [kbPath, setKbPath] = useState<string>("data/knowledge_base");
    const [navDirs, setNavDirs] = useState<string[]>([]);
    const [showNavigator, setShowNavigator] = useState(false);
    const folderInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadUploadedFiles();
        loadKBFiles();
    }, []);

    const loadUploadedFiles = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/files`);
            setUploadedFiles(res.data.files);
        } catch (error) {
        }
    };

    const loadKBFiles = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/kb/files?path=${encodeURIComponent(kbPath)}`);
            setKbFiles(res.data.files);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/upload`, formData);
            const newFilename = res.data.filename;
            setFilename(newFilename);
            setUploadStatus('Uploaded successfully');

            // Fetch preview
            const previewRes = await axios.get(`${API_URL}/api/preview/${newFilename}`);
            setFilePreview(previewRes.data.preview);

            await axios.post(`${API_URL}/api/process`, null, {
                params: { filename: newFilename }
            });
            setUploadStatus('Processed and indexed');

            await loadUploadedFiles();
        } catch (error) {
            setUploadStatus('Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (selectedFilename: string) => {
        setFilename(selectedFilename);
        setUploadStatus(`Selected: ${selectedFilename}`);
        setSelectedRowIndex(null);
        setResult(null);
        setQuery('');

        if (!selectedFilename) {
            setFilePreview([]);
            return;
        }

        try {
            setLoading(true);
            // Fetch preview
            const previewRes = await axios.get(`${API_URL}/api/preview/${selectedFilename}`);
            setFilePreview(previewRes.data.preview);

            // Ensure processed
            await axios.post(`${API_URL}/api/process`, null, {
                params: { filename: selectedFilename }
            });
            setUploadStatus(`${selectedFilename} - Ready to query`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuery = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query) return;

        try {
            setIsAnalyzing(true);
            setSubmittedRating(null);
            const res = await axios.post(`${API_URL}/api/query`, {
                query: query,
                top_k: 3
            });
            setResult(res.data);

            // Save to history
            await axios.post(`${API_URL}/api/history/save`, {
                filename: filename,
                query: query,
                result: res.data
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRowClick = (rowData: string[], index: number) => {
        setSelectedRowIndex(index);
        const faultDescription = rowData.join(" ");
        setQuery(faultDescription);
        // Note: Analysis is now triggered by the "Analyze" button, not auto-triggered
    };

    const handleFeedback = async (rating: string) => {
        if (!result) return;

        try {
            await axios.post(`${API_URL}/api/feedback`, {
                query,
                response: JSON.stringify(result.structured),
                rating
            });
            setSubmittedRating(rating);
        } catch (error) {
            console.error(error);
        }
    };

    const handleKBIndex = async () => {
        try {
            setLoading(true);
            await axios.post(`${API_URL}/api/kb/process`, { path: kbPath });
            setUploadStatus(`Knowledge Base indexed from ${kbPath}`);
            await loadKBFiles();
        } catch (error) {
            setUploadStatus('Error indexing Knowledge Base path');
        } finally {
            setLoading(false);
        }
    };

    const handleFolderNav = async (dirName: string) => {
        let newPath = '';
        if (dirName === '..') {
            const parts = kbPath.replace(/\/$/, '').split('/');
            parts.pop();
            newPath = parts.join('/') || '.';
        } else {
            newPath = `${kbPath.replace(/\/$/, '')}/${dirName}`;
        }
        setKbPath(newPath);

        try {
            const res = await axios.get(`${API_URL}/api/kb/ls?path=${encodeURIComponent(newPath)}`);
            if (res.data.dirs) setNavDirs(res.data.dirs);
            // Also trigger file update for connectivity check
            const fileRes = await axios.get(`${API_URL}/api/kb/files?path=${encodeURIComponent(newPath)}`);
            setKbFiles(fileRes.data.files);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleNavigator = async () => {
        if (!showNavigator) {
            try {
                const res = await axios.get(`${API_URL}/api/kb/ls?path=${encodeURIComponent(kbPath)}`);
                if (res.data.dirs) setNavDirs(res.data.dirs);
            } catch (error) {
                const res = await axios.get(`${API_URL}/api/kb/ls?path=.`);
                if (res.data.dirs) setNavDirs(res.data.dirs);
            }
        }
        setShowNavigator(!showNavigator);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const categories = [
        { key: 'summary', label: 'Summary' },
        { key: 'evidence', label: 'Evidence' },
        { key: 'root_cause', label: 'Root Cause' },
        { key: 'actions', label: 'Action Steps' },
        { key: 'confidence', label: 'Confidence' }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span className="bg-blue-600 p-1.5 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                </span>
                                PLC Log Explainer
                            </h1>
                        </div>
                        <div className="flex space-x-1">
                            <Link href="/" className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors">
                                Home
                            </Link>
                            <Link href="/workflow" className="text-white bg-slate-800 px-3 py-2 text-sm font-medium rounded-md">
                                Analyzer
                            </Link>
                            <Link href="/history" className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors">
                                History
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Half Split: Context (Left) and Selection (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">

                    {/* Left Column: Project Setup & Context */}
                    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl p-6 flex flex-col space-y-8">
                        {/* Part A: Log Management */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">1</span>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Log Management</h2>
                                    <p className="text-xs text-slate-400">Upload or select a historical log file</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Historical Log</label>
                                    <select
                                        onChange={(e) => handleFileSelect(e.target.value)}
                                        value={filename}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    >
                                        <option value="">Choose a file...</option>
                                        {uploadedFiles.map((fileData) => (
                                            <option key={fileData.filename} value={fileData.filename}>
                                                {fileData.filename} {fileData.upload_timestamp && `(${formatTimestamp(fileData.upload_timestamp)})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-slate-700/50"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase">
                                        <span className="px-2 bg-slate-800/40 text-slate-500 font-bold">Or Upload New</span>
                                    </div>
                                </div>

                                <form onSubmit={handleFileUpload} className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="block w-full text-[10px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer bg-slate-900/50 p-1 rounded-xl border border-slate-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!file || loading}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-lg flex-shrink-0"
                                    >
                                        {loading ? '...' : 'UPLOAD'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-700/50"></div>

                        {/* Part B: Knowledge Base */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.73 5.832 18 7.5 18s3.332.73 4.5 1.5m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.73 18.168 18 16.5 18c-1.746 0-3.332.73-4.5 1.5" /></svg>
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Knowledge Base</h2>
                                    <p className="text-xs text-slate-400">Pointing AI to local project documentation</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Project Directory Path</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. /path/to/project/manuals"
                                            value={kbPath}
                                            onChange={(e) => setKbPath(e.target.value)}
                                            onBlur={() => loadKBFiles()}
                                            className="flex-1 bg-slate-800 border-none rounded-lg py-2 px-3 text-xs text-slate-300 placeholder:text-slate-600 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                                        />
                                        <button
                                            onClick={toggleNavigator}
                                            className={`px-3 py-2 ${showNavigator ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'} text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-2`}
                                            title="Browse server folders"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                            {showNavigator ? 'CLOSE' : 'BROWSE'}
                                        </button>
                                    </div>

                                    {showNavigator && (
                                        <div className="my-3 bg-slate-800/90 rounded-lg border border-purple-500/30 p-2 max-h-48 overflow-y-auto scrollbar-thin">
                                            <div className="flex items-center justify-between px-2 mb-2 border-b border-slate-700 pb-1">
                                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Server Navigator</span>
                                                <button onClick={() => handleFolderNav('..')} className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                    UP
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {navDirs.length > 0 ? navDirs.map((dir, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleFolderNav(dir)}
                                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded text-left text-[10px] text-slate-300 transition-colors truncate"
                                                    >
                                                        <svg className="w-3 h-3 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                                                        {dir}
                                                    </button>
                                                )) : (
                                                    <div className="col-span-2 py-4 text-center text-[10px] text-slate-500 italic">No subdirectories found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {kbPath && (
                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
                                            <span className={`w-2 h-2 rounded-full ${kbFiles.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`}></span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                                                {kbFiles.length > 0 ? 'CONNECTED' : 'NOT FOUND'}
                                            </span>
                                            <span className="text-[9px] text-slate-600 truncate flex-1 text-right italic">{kbPath}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-3">
                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                                        <span>Detected Files</span>
                                        <span className={kbFiles.length > 0 ? "text-emerald-400" : "text-slate-600"}>{kbFiles.length} ITEMS</span>
                                    </div>

                                    {kbFiles.length > 0 ? (
                                        <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                                            {kbFiles.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/50 last:border-none">
                                                    <span className="text-[10px] text-slate-300 truncate max-w-[180px]">{f.filename}</span>
                                                    <span className="text-[9px] text-slate-500 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] text-slate-600 italic">No supported files found in this path</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleKBIndex}
                                    disabled={loading || kbFiles.length === 0}
                                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 disabled:bg-slate-800 text-purple-400 border border-purple-500/30 text-[10px] font-black py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    {loading ? 'INDEXING...' : 'RE-INDEX KNOWLEDGE BASE'}
                                </button>
                            </div>

                            {uploadStatus && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400 mt-auto">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    {uploadStatus}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Log Explorer & Analysis */}
                        <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl p-6 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">2</span>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Log Selection</h2>
                                    <p className="text-xs text-slate-400">Select a row from the preview or specify manually</p>
                                </div>
                            </div>

                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="mb-4 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden h-[400px] flex flex-col">
                                    <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-700">
                                        {filePreview.length > 0 ? (
                                            <table className="w-full text-[11px] text-left border-collapse">
                                                <thead className="sticky top-0 z-20 bg-slate-800 text-slate-400 border-b border-slate-700 shadow-sm">
                                                    <tr>
                                                        <th className="px-3 py-2 font-bold w-10 text-center">#</th>
                                                        {filePreview[0]?.map((header, idx) => (
                                                            <th key={idx} className="px-3 py-2 font-bold whitespace-nowrap">
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filePreview.slice(1).map((row, rowIdx) => (
                                                        <tr
                                                            key={rowIdx}
                                                            onClick={() => handleRowClick(row, rowIdx)}
                                                            className={`cursor-pointer border-b border-slate-800/50 transition-colors ${selectedRowIndex === rowIdx ? 'bg-blue-600/20' : 'hover:bg-slate-800/50'
                                                                }`}
                                                        >
                                                            <td className="px-3 py-1.5 text-center text-slate-600 font-mono">
                                                                {rowIdx + 1}
                                                            </td>
                                                            {row.map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="px-3 py-1.5 max-w-[200px] truncate">
                                                                    {cell}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
                                                {loading ? 'Processing data...' : 'No log file loaded'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Diagnostic Target Query</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. INF_105 Vacuum sensor problem"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            className="flex-1 bg-slate-800 border-none rounded-lg py-2.5 px-3 text-xs text-slate-300 placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        />
                                        <button
                                            onClick={() => handleQuery()}
                                            disabled={!query || loading}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-[10px] font-black px-6 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2 group"
                                        >
                                            <svg className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            {isAnalyzing ? 'ANALYZING...' : 'RUN DIAGNOSIS'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Results (Step 3) */}
                    {
                        result ? (
                            <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm shadow-inner">3</span>
                                        Technical Diagnosis
                                    </h2>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
                                        Processed via Mistral-7B
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                        {categories.map(({ key, label }) => {
                                            const value = result.structured[key as keyof StructuredResult];

                                            if (key === 'actions') {
                                                // Split by newline or a number followed by a dot at the start of a line
                                                const steps = value
                                                    .split(/\n|(?=^\d+\.)|(?<=\n)(?=\d+\.)/)
                                                    .map(s => s.trim())
                                                    .filter(s => s && s.length > 5); // Filter out fragments like "2" or "0"

                                                return (
                                                    <div key={key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-500 transition-all group lg:col-span-1">
                                                        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            <span>{label}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {steps.map((step, i) => (
                                                                <div key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed group/item">
                                                                    <span className="flex-shrink-0 w-5 h-5 bg-slate-800 text-blue-400 rounded text-[10px] flex items-center justify-center border border-slate-700 font-bold">
                                                                        {i + 1}
                                                                    </span>
                                                                    <p className="font-medium">{step.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (key === 'confidence') {
                                                // Confidence rendering: score in header, explanation below
                                                const scoreMatch = value.match(/^(High|Medium|Low)/i);
                                                const score = scoreMatch ? scoreMatch[0] : 'Medium';
                                                const explanation = value.replace(/^(This diagnosis has a|Confidence:)?\s*(High|Medium|Low)[:,-]?\s*/i, '').replace(/\.?\s*(degree of certainty based on retrieved documentation\.?)$/i, '').trim();

                                                return (
                                                    <div key={key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-500 transition-all group lg:col-span-1">
                                                        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            <span>{label}</span>
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${score.toLowerCase() === 'high' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : score.toLowerCase() === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                                {score.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-400 leading-relaxed font-medium mt-2">
                                                            {explanation}
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={key} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-500 transition-all group">
                                                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        <span>{label}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                        {value}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Feedback */}
                                    <div className="border-t border-slate-700 pt-8 mt-2 text-center">
                                        <p className="text-sm font-bold text-slate-400 mb-4">Was this diagnosis helpful for your maintenance?</p>
                                        <div className="flex gap-3 justify-center">
                                            {['good', 'can_be_better', 'bad'].map((r) => (
                                                <button
                                                    key={r}
                                                    onClick={() => handleFeedback(r)}
                                                    disabled={submittedRating !== null}
                                                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${submittedRating === r
                                                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                                                        : submittedRating !== null
                                                            ? 'bg-slate-800 text-slate-600'
                                                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                                                        }`}
                                                >
                                                    {r === 'can_be_better' ? 'Needs Improvement' : r.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                        {submittedRating && (
                                            <p className="text-xs font-bold text-emerald-400 mt-4 animate-pulse">✓ Feedback saved. Thank you for helping improve the AI.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-16 border-2 border-dashed border-slate-700/50 rounded-2xl text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50 shadow-inner">
                                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <p className="text-slate-500 font-bold text-lg">Awaiting Selection</p>
                                <p className="text-slate-600 text-sm">Select a log entry above to generate a technical insight report</p>
                            </div>
                        )
                    }
                </div>
            </main>
        </div>
    );
}
