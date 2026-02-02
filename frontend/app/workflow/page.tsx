'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        loadUploadedFiles();
    }, []);

    const loadUploadedFiles = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/files`);
            setUploadedFiles(res.data.files);
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
                {/* Top Half Split: Step 1 (Left) and Step 2 (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Step 1: Log Management */}
                    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">1</span>
                            <div>
                                <h2 className="text-lg font-bold text-white">Log Management</h2>
                                <p className="text-xs text-slate-400">Upload or select a historical log file</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Historical Log</label>
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
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-2 bg-slate-800/40 text-slate-500 font-bold">Or</span>
                                </div>
                            </div>

                            <form onSubmit={handleFileUpload} className="space-y-4">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upload New CSV</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer bg-slate-900/50 py-1 px-1 rounded-xl border border-slate-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!file || loading}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg flex-shrink-0"
                                    >
                                        {loading ? 'Processing...' : 'Upload'}
                                    </button>
                                </div>
                            </form>

                            {uploadStatus && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    {uploadStatus}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Log Explorer & Analysis */}
                    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">2</span>
                            <div>
                                <h2 className="text-lg font-bold text-white">Log Selection</h2>
                                <p className="text-xs text-slate-400">Select a row from the preview or specify manually</p>
                            </div>
                        </div>

                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="mb-4 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex-1 flex flex-col">
                                <div className="max-h-[220px] overflow-auto relative scrollbar-thin scrollbar-thumb-slate-700">
                                    {filePreview.length > 0 ? (
                                        <table className="w-full text-[11px] text-left border-collapse">
                                            <thead className="sticky top-0 z-20 bg-slate-800 text-slate-400 border-b border-slate-700">
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
                                                            <td key={cellIdx} className="px-3 py-1.5 text-slate-300 truncate max-w-[120px]">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-slate-600 text-sm flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                            No data to preview
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Click a row above or describe the fault here..."
                                    rows={2}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                                <button
                                    onClick={() => handleQuery()}
                                    disabled={!filename || isAnalyzing || !query}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? (
                                        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating Insight...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Analyze Fault</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Results (Step 3) */}
                {result ? (
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
                                        // Split actions into steps by looking for number patterns or newlines
                                        const steps = value.split(/(?=\d+\.)|\n/).map(s => s.trim()).filter(s => s);
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
                                                            <p className="font-medium">{step.replace(/^\d+\.\s*/, '')}</p>
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
                )}
            </main>
        </div>
    );
}
