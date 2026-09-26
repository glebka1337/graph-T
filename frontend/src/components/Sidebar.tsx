import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AutocompleteInput } from './AutocompleteInput';
import { Download, Upload, Plus, X, AlignLeft } from 'lucide-react';
import clsx from 'clsx';
import { GraphEdge } from '../types';

export function Sidebar() {
    const { globalEdges, currentContext, parseRawText, getRawText, updateGlobalEdges } = useStore();
    const [mode, setMode] = useState<'text' | 'table'>('text');
    const [collapsed, setCollapsed] = useState(false);
    const [width, setWidth] = useState(450);
    const [rawText, setRawText] = useState(
`Source | Sign | Dir | Target | Label | Comment
Population, +, ->, Traffic Congestion, , More people means more cars
Traffic Congestion, -, ->, City Appeal, , High congestion makes city less appealing
City Appeal, +, ->, Population, , Attractive cities draw residents

[Traffic Congestion]
Cars, +, ->, Delay, , 
Delay, -, ->, Happiness, ,`
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            setWidth(Math.max(300, Math.min(800, e.clientX)));
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleTextRender = () => {
        if (mode === 'text') {
            parseRawText(rawText);
        } else {
            setRawText(getRawText());
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setRawText(text);
            parseRawText(text);
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExport = (type: 'csv' | 'png') => {
        if (type === 'csv') {
            const text = mode === 'table' ? getRawText() : rawText;
            const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cld-matrix.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // PNG export logic here
        }
    };

    const currentTableEdges = globalEdges.filter(e => e.context === currentContext);
    const allNodes = Array.from(new Set(globalEdges.flatMap(e => [e.source, e.target]).filter(Boolean)));

    const updateTableEdge = (index: number, field: keyof GraphEdge, value: string) => {
        const edgesInCtx = [...currentTableEdges];
        edgesInCtx[index] = { ...edgesInCtx[index], [field]: value };
        
        const newGlobalEdges = globalEdges.map(e => e.context === currentContext ? undefined : e)
            .filter(Boolean) as GraphEdge[];
            
        updateGlobalEdges([...newGlobalEdges, ...edgesInCtx]);
    };

    const addTableRow = () => {
        updateGlobalEdges([
            ...globalEdges, 
            { source: '', sign: 'none', dir: '->', target: '', label: '', comment: '', context: currentContext }
        ]);
    };

    const deleteTableRow = (index: number) => {
        const edgesInCtx = [...currentTableEdges];
        edgesInCtx.splice(index, 1);
        const newGlobalEdges = globalEdges.map(e => e.context === currentContext ? undefined : e)
            .filter(Boolean) as GraphEdge[];
        updateGlobalEdges([...newGlobalEdges, ...edgesInCtx]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index === currentTableEdges.length - 1) {
                addTableRow();
            }
        }
    };

    if (collapsed) {
        return (
            <div className="w-12 shrink-0 border-r border-border bg-panel flex flex-col h-full shadow-lg relative z-10 items-center py-4">
                <button onClick={() => setCollapsed(false)} className="p-2 rounded hover:bg-bg text-textMuted hover:text-textMain transition-colors" title="Expand Sidebar">
                    <AlignLeft size={20} />
                </button>
            </div>
        );
    }

    return (
        <div 
            style={{ width }} 
            className="shrink-0 border-r border-border bg-panel flex flex-col h-full shadow-lg relative z-10"
        >
            <div 
                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors"
                onMouseDown={(e) => {
                    isResizing.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                    e.preventDefault();
                }}
            />
            
            <div className="p-4 border-b border-border flex justify-between items-center bg-panel">
                <div className="font-bold text-lg text-textMain tracking-tight">CLD Visualizer</div>
                <button onClick={() => setCollapsed(true)} className="p-1 rounded hover:bg-bg text-textMuted hover:text-textMain transition-colors">
                    <AlignLeft size={18} />
                </button>
            </div>

            <div className="p-4 bg-bg border-b border-border flex gap-2">
                <button 
                    onClick={() => {
                        setMode('text');
                        setRawText(getRawText());
                    }} 
                    className={clsx("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors", mode === 'text' ? 'bg-panel shadow text-textMain' : 'text-textMuted hover:text-textMain')}
                >
                    Raw Text
                </button>
                <button 
                    onClick={() => {
                        setMode('table');
                        setRawText(getRawText());
                    }} 
                    className={clsx("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors", mode === 'table' ? 'bg-panel shadow text-textMain' : 'text-textMuted hover:text-textMain')}
                >
                    Visual Table
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {mode === 'text' && (
                    <div className="absolute inset-0 flex flex-col p-4 bg-panel">
                        <p className="text-sm text-textMuted mb-2">Format: <code>Source | Sign | Dir | Target | Label | Comment</code></p>
                        <textarea 
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            className="flex-1 w-full bg-bg border border-border rounded-md p-3 font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-textMain"
                            spellCheck={false}
                        />
                    </div>
                )}

                {mode === 'table' && (
                    <div className="absolute inset-0 overflow-y-auto p-4 bg-bg">
                        {currentTableEdges.map((edge, i) => (
                            <div key={i} className="bg-panel border border-border rounded-lg p-3 mb-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                <div className="flex gap-2 mb-2">
                                    <AutocompleteInput 
                                        placeholder="Node" 
                                        value={edge.source} 
                                        onChange={(val) => updateTableEdge(i, 'source', val)} 
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        options={allNodes}
                                        className="bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none text-textMain focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={() => updateTableEdge(i, 'dir', edge.dir === '->' ? '<-' : edge.dir === '<-' ? '<->' : edge.dir === '<->' ? '-' : '->')}
                                        className="w-10 h-[34px] flex items-center justify-center rounded border border-border bg-bg text-textMain text-sm font-bold transition-colors hover:border-gray-400"
                                        title="Direction"
                                    >
                                        {edge.dir === '->' ? '→' : edge.dir === '<-' ? '←' : edge.dir === '<->' ? '↔' : '—'}
                                    </button>
                                    <AutocompleteInput 
                                        placeholder="To Node (Empty for Desc)" 
                                        value={edge.target} 
                                        onChange={(val) => updateTableEdge(i, 'target', val)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        options={allNodes}
                                        className="bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none text-textMain focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Label..." 
                                        value={edge.label} 
                                        onChange={(e) => updateTableEdge(i, 'label', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        className="w-24 bg-bg border border-border rounded px-2 py-1 text-xs outline-none text-textMain"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Comment..." 
                                        value={edge.comment} 
                                        onChange={(e) => updateTableEdge(i, 'comment', e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        className="flex-1 bg-bg border border-border rounded px-2 py-1 text-xs outline-none text-textMain"
                                    />
                                    <button onClick={() => deleteTableRow(i)} className="p-1 text-textMuted hover:text-minus rounded hover:bg-bg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={addTableRow}
                            className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg text-textMuted hover:text-textMain hover:border-textMuted transition-colors font-medium text-sm"
                        >
                            <Plus size={16} /> Add Connection
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-panel">
                <div className="flex gap-2 mb-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-bg border border-border rounded-md py-2 text-sm font-medium hover:bg-border transition-colors text-textMain">
                        <Upload size={16} /> Import
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv,.txt" className="hidden" />
                    <button onClick={handleTextRender} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm font-medium transition-colors">
                        Render Graph
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')} className="flex-1 flex items-center justify-center gap-2 bg-bg border border-border rounded-md py-2 text-sm font-medium hover:bg-border transition-colors text-textMain">
                        <Download size={16} /> Save CSV
                    </button>
                </div>
            </div>
        </div>
    );
}
