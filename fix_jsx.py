import sys
import os

path = '/Users/adityamhaske/Documents/projects/PLC Fault/prot1.1/prot 1/frontend/app/workflow/page.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Find the start and end tokens to be safe
start_line = -1
end_line = -1

for i, line in enumerate(lines):
    if 'Part B: Knowledge Base' in line:
        # The content starts a few lines after
        for j in range(i, i + 20):
            if '<div className="space-y-4">' in lines[j]:
                start_line = j
                break
        if start_line != -1:
            break

if start_line == -1:
    print("Could not find start of KB section")
    sys.exit(1)

# Find the end of this section (it was at 431 in the last view)
# We look for the closing tag of the space-y-4 div
# In our broken state, it might be tricky, so we'll look for the next section header
for i in enumerate(lines[start_line:], start_line):
    # The next section header is "Log Selection" at line 447
    if 'Log Selection' in i[1]:
        # Backtrack to the proper closing point of the previous column
        # Let's just find the closing tag before 'Right Column'
        for j in range(i[0], start_line, -1):
             if '</div>' in lines[j] and '        </div>' == lines[j].strip('\n\r'): # 8 spaces
                 # This might be too aggressive. 
                 pass
        end_line = i[0] - 1
        break

# Actually, let's use the line numbers I saw in cat -et
# 338 to 431
start_line = 337 # 0-indexed 338
end_line = 431 

print(f"Replacing lines {start_line+1} to {end_line}")

new_content = [
    '                            <div className="space-y-4">\n',
    '                                <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4">\n',
    '                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Project Directory Path</label>\n',
    '                                    <div className="flex gap-2 mb-2">\n',
    '                                        <input\n',
    '                                            type="text"\n',
    '                                            placeholder="e.g. /path/to/project/manuals"\n',
    '                                            value={kbPath}\n',
    '                                            onChange={(e) => setKbPath(e.target.value)}\n',
    '                                            onBlur={() => loadKBFiles()}\n',
    '                                            className="flex-1 bg-slate-800 border-none rounded-lg py-2 px-3 text-xs text-slate-300 placeholder:text-slate-600 focus:ring-1 focus:ring-purple-500 transition-all outline-none"\n',
    '                                        />\n',
    '                                        <button\n',
    '                                            onClick={toggleNavigator}\n',
    '                                            className={`px-3 py-2 ${showNavigator ? \'bg-purple-600\' : \'bg-slate-700 hover:bg-slate-600\'} text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-2`}\n',
    '                                            title="Browse server folders"\n',
    '                                        >\n',
    '                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>\n',
    '                                            {showNavigator ? \'CLOSE\' : \'BROWSE\'}\n',
    '                                        </button>\n',
    '                                    </div>\n',
    '                                    \n',
    '                                    {showNavigator && (\n',
    '                                        <div className="my-3 bg-slate-800/90 rounded-lg border border-purple-500/30 p-2 max-h-48 overflow-y-auto scrollbar-thin">\n',
    '                                            <div className="flex items-center justify-between px-2 mb-2 border-b border-slate-700 pb-1">\n',
    '                                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Server Navigator</span>\n',
    '                                                <button onClick={() => handleFolderNav(\'..\')} className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1">\n',
    '                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>\n',
    '                                                    UP\n',
    '                                                </button>\n',
    '                                            </div>\n',
    '                                            <div className="grid grid-cols-2 gap-1">\n',
    '                                                {navDirs.length > 0 ? navDirs.map((dir, i) => (\n',
    '                                                    <button \n',
    '                                                        key={i} \n',
    '                                                        onClick={() => handleFolderNav(dir)}\n',
    '                                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded text-left text-[10px] text-slate-300 transition-colors truncate"\n',
    '                                                    >\n',
    '                                                        <svg className="w-3 h-3 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>\n',
    '                                                        {dir}\n',
    '                                                    </button>\n',
    '                                                )) : (\n',
    '                                                    <div className="col-span-2 py-4 text-center text-[10px] text-slate-500 italic">No subdirectories found</div>\n',
    '                                                )}\n',
    '                                            </div>\n',
    '                                        </div>\n',
    '                                    )}\n',
    '\n',
    '                                    {kbPath && (\n',
    '                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/50">\n',
    '                                            <span className={`w-2 h-2 rounded-full ${kbFiles.length > 0 ? \'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse\' : \'bg-rose-500\'}`}></span>\n',
    '                                            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">\n',
    '                                                {kbFiles.length > 0 ? \'CONNECTED\' : \'NOT FOUND\'}\n',
    '                                            </span>\n',
    '                                            <span className="text-[9px] text-slate-600 truncate flex-1 text-right italic">{kbPath}</span>\n',
    '                                        </div>\n',
    '                                    )}\n',
    '                                </div>\n',
    '\n',
    '                                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-3">\n',
    '                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">\n',
    '                                        <span>Detected Files</span>\n',
    '                                        <span className={kbFiles.length > 0 ? "text-emerald-400" : "text-slate-600"}>{kbFiles.length} ITEMS</span>\n',
    '                                    </div>\n',
    '                                    \n',
    '                                    {kbFiles.length > 0 ? (\n',
    '                                        <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">\n',
    '                                            {kbFiles.map((f, i) => (\n',
    '                                                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/50 last:border-none">\n',
    '                                                    <span className="text-[10px] text-slate-300 truncate max-w-[180px]">{f.filename}</span>\n',
    '                                                    <span className="text-[9px] text-slate-500 font-mono">{(f.size / 1024).toFixed(1)} KB</span>\n',
    '                                                </div>\n',
    '                                            ))}\n',
    '                                        </div>\n',
    '                                    ) : (\n',
    '                                        <div className="py-4 text-center">\n',
    '                                            <p className="text-[10px] text-slate-600 italic">No supported files found in this path</p>\n',
    '                                        </div>\n',
    '                                    )}\n',
    '                                </div>\n',
    '\n',
    '                                <button\n',
    '                                    onClick={handleKBIndex}\n',
    '                                    disabled={loading || kbFiles.length === 0}\n',
    '                                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 disabled:bg-slate-800 text-purple-400 border border-purple-500/30 text-[10px] font-black py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"\n',
    '                                >\n',
    '                                    <svg className={`w-3.5 h-3.5 ${loading ? \'animate-spin\' : \'\'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>\n',
    '                                    {loading ? \'INDEXING...\' : \'RE-INDEX KNOWLEDGE BASE\'}\n',
    '                                </button>\n',
    '                            </div>\n',
    '                        </div>\n'
]

lines[start_line:end_line] = new_content

with open(path, 'w') as f:
    f.writelines(lines)
