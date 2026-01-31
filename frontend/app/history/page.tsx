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

export default function History() {
    const [files, setFiles] = useState<string[]>([]);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-white">PLC Fault Explainer</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link href="/" className="text-slate-300 hover:text-white px-3 py-2">
                                Home
                            </Link>
                            <Link href="/workflow" className="text-slate-300 hover:text-white px-3 py-2">
                                Analyzer
                            </Link>
                            <Link href="/history" className="text-slate-300 hover:text-white px-3 py-2">
                                History
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-white mb-6">Query History</h2>

                {/* File Filter */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
                    <label className="block text-sm font-semibold text-white mb-2">Filter by CSV File:</label>
                    <select
                        value={selectedFile}
                        onChange={(e) => handleFileFilter(e.target.value)}
                        className="w-full md:w-auto bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Files</option>
                        {files.map((file) => (
                            <option key={file} value={file}>{file}</option>
                        ))}
                    </select>
                </div>

                {/* History List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-slate-800 p-12 rounded-lg border border-slate-700 text-center">
                        <p className="text-slate-500 text-lg">No query history found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((entry, idx) => (
                            <div key={idx} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{entry.query}</h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            File: <span className="text-blue-400">{entry.filename}</span> • {formatTimestamp(entry.timestamp)}
                                        </p>
                                    </div>
                                </div>

                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300">
                                        View Results
                                    </summary>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {entry.result?.structured && Object.entries(entry.result.structured).map(([key, value]) => (
                                            <div key={key} className="bg-slate-900 p-4 rounded border border-slate-600">
                                                <h4 className="text-sm font-semibold text-white capitalize mb-2">
                                                    {key.replace('_', ' ')}
                                                </h4>
                                                <p className="text-xs text-slate-300 whitespace-pre-wrap">{value as string}</p>
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
