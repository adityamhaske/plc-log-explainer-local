'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Workflow() {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{
        explanation: string;
        evidence: string[];
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/upload`, formData);
            setFilename(res.data.filename);
            setUploadStatus('Uploaded successfully');

            // Auto-process
            await axios.post(`${API_URL}/api/process`, null, {
                params: { filename: res.data.filename }
            });
            setUploadStatus('Processed and indexed');
        } catch (error) {
            setUploadStatus('Error uploading file');
        } finally {
            setLoading(false);
        }
    };

    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        try {
            setLoading(true);
            const res = await axios.post(`${API_URL}/api/query`, {
                query,
                top_k: 3
            });
            setResult(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (rating: string) => {
        if (!result) return;

        try {
            await axios.post(`${API_URL}/api/feedback`, {
                query,
                response: result.explanation,
                rating
            });
            alert('Feedback submitted');
        } catch (error) {
            console.error(error);
        }
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
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Step 1: Upload */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Step 1: Upload Logs</h2>
                        <form onSubmit={handleFileUpload} className="space-y-4">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            <button
                                type="submit"
                                disabled={!file || loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold px-4 py-2 rounded transition-colors"
                            >
                                {loading ? 'Processing...' : 'Upload & Process'}
                            </button>
                        </form>
                        {uploadStatus && (
                            <p className="mt-4 text-sm text-slate-400">{uploadStatus}</p>
                        )}
                    </div>

                    {/* Step 2: Query */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Step 2: Ask Question</h2>
                        <form onSubmit={handleQuery} className="space-y-4">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Describe fault or enter alarm code..."
                                rows={4}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={!filename || loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold px-4 py-2 rounded transition-colors"
                            >
                                {loading ? 'Analyzing...' : 'Analyze'}
                            </button>
                        </form>
                    </div>

                    {/* Step 3: Results */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Step 3: Results</h2>
                        {result ? (
                            <div className="space-y-4">
                                <div className="bg-slate-900 p-4 rounded border border-slate-600">
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.explanation}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-2">Rate this explanation:</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleFeedback('good')}
                                            className="flex-1 bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-2 rounded transition-colors"
                                        >
                                            Good
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('can_be_better')}
                                            className="flex-1 bg-yellow-700 hover:bg-yellow-800 text-white text-sm px-3 py-2 rounded transition-colors"
                                        >
                                            Can be better
                                        </button>
                                        <button
                                            onClick={() => handleFeedback('bad')}
                                            className="flex-1 bg-red-700 hover:bg-red-800 text-white text-sm px-3 py-2 rounded transition-colors"
                                        >
                                            Bad
                                        </button>
                                    </div>
                                </div>

                                {result.evidence.length > 0 && (
                                    <details className="bg-slate-900 p-4 rounded border border-slate-600">
                                        <summary className="cursor-pointer text-sm font-semibold text-white">
                                            View Evidence
                                        </summary>
                                        <div className="mt-3 space-y-2">
                                            {result.evidence.map((ev, idx) => (
                                                <p key={idx} className="text-xs text-slate-400">{ev}</p>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-500">Submit a query to see results</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
