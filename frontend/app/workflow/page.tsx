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

    const handleQuery = async (e?: React.FormEvent, customQuery?: string) => {
        if (e) e.preventDefault();
        const finalQuery = customQuery || query;
        if (!finalQuery) return;

        try {
            setIsAnalyzing(true);
            setSubmittedRating(null);
            const res = await axios.post(`${API_URL}/api/query`, {
                query: finalQuery,
                top_k: 3
            });
            setResult(res.data);

            // Save to history
            await axios.post(`${API_URL}/api/history/save`, {
                filename: filename,
                query: finalQuery,
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
        // Find the alarm/fault code in the row. 
        // Usually it's one of the columns. We'll join the row content or pick a likely column.
        // For now, let's use the whole row as context or try to find a code-like string.
        const faultDescription = rowData.join(" ");
        setQuery(faultDescription);
        handleQuery(undefined, faultDescription);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200">
            <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-white tracking-tight">PLC Fault Explainer</h1>
                        </div>
                        <div className="flex space-x-1">
                            <Link href="/" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-slate-800">
                                Home
                            </Link>
                            <Link href="/workflow" className="text-white bg-slate-800 px-3 py-2 text-sm font-medium rounded-md transition-colors">
                                Analyzer
                            </Link>
                            <Link href="/history" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-slate-800">
                                History
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Section: Steps 1 & 2 */}
                <div className="grid grid-cols-1 gap-8 mb-8">
                    {/* Combined Step 1 & 2: Log Explorer */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Step 1: Explore & Select</h2>
                                <p className="text-sm text-slate-400">Upload or select a log, then click any row to analyze the specific fault.</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {/* Previously Uploaded Files */}
                                {uploadedFiles.length > 0 && (
                                    <select
                                        onChange={(e) => handleFileSelect(e.target.value)}
                                        value={filename}
                                        className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    >
                                        <option value="">Select historical log...</option>
                                        {uploadedFiles.map((fileData) => (
                                            <option key={fileData.filename} value={fileData.filename}>
                                                {fileData.filename} {fileData.upload_timestamp && `(${formatTimestamp(fileData.upload_timestamp)})`}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <form onSubmit={handleFileUpload} className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-600 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        {file ? file.name : 'Upload New CSV'}
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={!file || loading}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : null}
                                        Process
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Interactive Table Section */}
                        <div className="relative">
                            {uploadStatus && (
                                <div className="px-6 py-2 bg-blue-900/20 text-blue-400 text-xs font-semibold border-b border-slate-700/50">
                                    {uploadStatus}
                                </div>
                            )}

                            <div className="h-[500px] overflow-auto relative bg-slate-900 shadow-inner">
                                {filePreview.length > 0 ? (
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="sticky top-0 z-20 bg-slate-800 text-slate-300 shadow-md">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold border-b border-slate-700 w-16 text-center">#</th>
                                                {filePreview[0]?.map((header, idx) => (
                                                    <th key={idx} className="px-4 py-3 font-semibold border-b border-slate-700">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {filePreview.slice(1).map((row, rowIdx) => (
                                                <tr
                                                    key={rowIdx}
                                                    onClick={() => handleRowClick(row, rowIdx)}
                                                    className={`cursor-pointer transition-all duration-150 relative group ${selectedRowIndex === rowIdx
                                                            ? 'bg-blue-600/20 border-l-4 border-l-blue-500'
                                                            : 'hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <td className="px-4 py-2.5 text-slate-500 font-mono text-center border-r border-slate-800/50 group-hover:text-slate-300">
                                                        {rowIdx + 1}
                                                    </td>
                                                    {row.map((cell, cellIdx) => (
                                                        <td key={cellIdx} className={`px-4 py-2.5 ${selectedRowIndex === rowIdx ? 'text-blue-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                        <p className="text-lg">No log file selected</p>
                                    </div>
                                )}
                            </div>

                            {/* Manual Entry Override */}
                            <div className="p-6 bg-slate-800/30 border-t border-slate-700 flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Step 2: Refine or Ask Question</label>
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Click a row above or type a manual description here..."
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <button
                                    onClick={(e) => handleQuery(e)}
                                    disabled={!filename || isAnalyzing || !query}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 h-[52px] min-w-[140px]"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Analyzing
                                        </>
                                    ) : 'Analyze'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Results */}
                {result ? (
                    <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg text-lg">3</span>
                                Analysis Results
                            </h2>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                Live Insight
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Results Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                                {categories.map(({ key, label }) => {
                                    const value = result.structured[key as keyof StructuredResult];

                                    return (
                                        <div key={key} className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-slate-500 group">
                                            <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-700 flex items-center justify-between">
                                                <h3 className="font-bold text-white text-base tracking-wide uppercase text-xs">{label}</h3>
                                                <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div className="p-6">
                                                <p className="text-[16px] text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{value}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Rating Section */}
                            <div className="border-t border-slate-700 pt-10 mt-6 text-center">
                                <div className="max-w-xl mx-auto">
                                    <h3 className="text-xl font-bold text-white mb-6">How accurate was this diagnosis?</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => handleFeedback('good')}
                                            disabled={submittedRating !== null}
                                            className={`py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${submittedRating === 'good'
                                                    ? 'bg-blue-800 ring-4 ring-blue-500/50 text-white'
                                                    : submittedRating !== null
                                                        ? 'bg-slate-800 text-slate-600 opacity-50 grayscale'
                                                        : 'bg-blue-800 hover:bg-blue-700 text-white shadow-xl hover:-translate-y-1'
                                                }`}
                                        >
                                            Good
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('can_be_better')}
                                            disabled={submittedRating !== null}
                                            className={`py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${submittedRating === 'can_be_better'
                                                    ? 'bg-blue-600 ring-4 ring-blue-400/50 text-white'
                                                    : submittedRating !== null
                                                        ? 'bg-slate-800 text-slate-600 opacity-50 grayscale'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl hover:-translate-y-1'
                                                }`}
                                        >
                                            Fair
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('bad')}
                                            disabled={submittedRating !== null}
                                            className={`py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${submittedRating === 'bad'
                                                    ? 'bg-blue-400 ring-4 ring-blue-300/50 text-white'
                                                    : submittedRating !== null
                                                        ? 'bg-slate-800 text-slate-600 opacity-50 grayscale'
                                                        : 'bg-blue-400 hover:bg-blue-300 text-white shadow-xl hover:-translate-y-1'
                                                }`}
                                        >
                                            Bad
                                        </button>
                                    </div>
                                    {submittedRating && (
                                        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-bounce">
                                            <p className="text-sm font-bold text-blue-400 flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Feedback received. Thank you!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/40 p-20 rounded-2xl border border-dotted border-slate-700 text-center shadow-inner group">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:bg-slate-700 transition-all group-hover:rotate-12">
                            <svg className="w-10 h-10 text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <p className="text-slate-500 text-xl font-medium">Select a log entry above to see technical insights</p>
                    </div>
                )}
            </main>
        </div>
    );
}
