'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface HistoryEntry {
    filename: string;
    timestamp: string;
    query: string;
    result: any;
}

interface FileMetadata {
    filename: string;
    upload_timestamp: string;
    size: number;
}

export default function History() {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('all');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadFiles();
        loadHistory();
    }, []);

    const loadFiles = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/files`);
            setFiles(res.data.files);
        } catch (error) {
            console.error(error);
        }
    };

    const loadHistory = async (filename?: string) => {
        try {
            setLoading(true);
            const params = filename && filename !== 'all' ? { filename } : {};
            const res = await axios.get(`${API_URL}/api/history`, { params });
            setHistory(res.data.history);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileFilter = (filename: string) => {
        setSelectedFile(filename);
        loadHistory(filename === 'all' ? undefined : filename);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

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
                                PLC Fault Explainer
                            </h1>
                        </div>
                        <div className="flex space-x-1">
                            <Link href="/" className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors">
                                Home
                            </Link>
                            <Link href="/workflow" className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium rounded-md transition-colors">
                                Analyzer
                            </Link>
                            <Link href="/history" className="text-white bg-slate-800 px-3 py-2 text-sm font-medium rounded-md">
                                History
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Query History</h2>
                        <p className="text-slate-400 text-sm mt-1">Review past diagnoses and analysis reports</p>
                    </div>
                </div>

                {/* File Filter */}
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 mb-8 shadow-xl">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Filter by CSV File</label>
                    <div className="flex gap-4">
                        <select
                            value={selectedFile}
                            onChange={(e) => handleFileFilter(e.target.value)}
                            className="w-full md:w-80 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="all">All Files</option>
                            {files.map((file) => (
                                <option key={file.filename} value={file.filename}>
                                    {file.filename} {file.upload_timestamp && `(${new Date(file.upload_timestamp).toLocaleDateString()})`}
                                </option>
                            ))}
                        </select>
                        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium px-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {history.length} Total Records
                            </div>
                        </div>
                    </div>
                </div>

                {/* History List */}
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="animate-spin h-8 w-8 text-blue-500 border-4 border-slate-700 border-t-blue-500 rounded-full"></div>
                        <p className="text-slate-500 font-medium">Retrieving historical records...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-slate-800/20 p-20 rounded-2xl border border-dashed border-slate-700 text-center shadow-inner">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-slate-500 font-bold text-lg">No history found</p>
                        <p className="text-slate-600 text-sm">Queries will appear here once you analyze logs in the Analyzer</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {history.map((entry, idx) => (
                            <div key={idx} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all shadow-lg group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded leading-none">QUERY</span>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{entry.query}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                            <span className="text-slate-400">File:</span>
                                            <span className="text-slate-300">{entry.filename}</span>
                                            <span className="mx-1">•</span>
                                            <span>{formatTimestamp(entry.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${entry.result?.structured?.confidence?.toLowerCase().includes('high')
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                            {entry.result?.structured?.confidence || 'N/A'} Confidence
                                        </span>
                                    </div>
                                </div>

                                <details className="group/details">
                                    <summary className="cursor-pointer list-none flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest py-2">
                                        <svg className="w-4 h-4 group-open/details:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        Technical Analysis Details
                                    </summary>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {entry.result?.structured && Object.entries(entry.result.structured).map(([key, value]) => (
                                            <div key={key} className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/50">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                                                    {key.replace('_', ' ')}
                                                </h4>
                                                <p className="text-sm text-slate-300 leading-relaxed font-medium line-clamp-4 hover:line-clamp-none transition-all cursor-default">
                                                    {value as string}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
