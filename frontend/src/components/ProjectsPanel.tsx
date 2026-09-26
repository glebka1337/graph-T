import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Check, X, File, RefreshCw, Save } from 'lucide-react';

export function ProjectsPanel() {
    const { 
        globalEdges, globalNodes, globalEdgeProps, 
        currentGraphId, currentGraphName, setCurrentGraph,
        updateGlobalEdges,  
    } = useStore();
    
    const [graphs, setGraphs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI states
    const [isCreating, setIsCreating] = useState(false);
    const [isSavingCurrent, setIsSavingCurrent] = useState(false);
    const [newName, setNewName] = useState('');
    const [newError, setNewError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Auto-save ref
    const saveTimeoutRef = useRef<any>(null);

    const loadGraphs = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3001/api/graphs');
            const data = await res.json();
            setGraphs(data);
        } catch (e) {
            console.error('Failed to load graphs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGraphs();
    }, []);

    // Auto-Save Effect
    useEffect(() => {
        if (!currentGraphId) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await fetch('http://localhost:3001/api/graphs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentGraphId, 
                        name: currentGraphName, 
                        globalEdges, 
                        globalNodes, 
                        globalEdgeProps
                    })
                });
            } catch (e) {
                console.error('Auto-save failed', e);
            }
        }, 1500);

        return () => clearTimeout(saveTimeoutRef.current);
    }, [globalEdges, globalNodes, globalEdgeProps, currentGraphId, currentGraphName]);

    const handleCreate = async (withCurrentState: boolean = false) => {
        if (!newName.trim()) return;
        setNewError('');
        const id = 'graph_' + Date.now();
        try {
            const res = await fetch('http://localhost:3001/api/graphs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id, 
                    name: newName.trim(), 
                    globalEdges: withCurrentState ? globalEdges : [], 
                    globalNodes: withCurrentState ? globalNodes : {}, 
                    globalEdgeProps: withCurrentState ? globalEdgeProps : {}
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setNewError(data.error || 'Failed to create');
                return;
            }
            
            setCurrentGraph(id, newName.trim());
            
            if (!withCurrentState) {
                updateGlobalEdges([]);
                useStore.setState({ globalNodes: {}, globalEdgeProps: {}, currentContext: 'root' });
            }
            
            setIsCreating(false);
            setIsSavingCurrent(false);
            setNewName('');
            loadGraphs();
        } catch (e) {
            setNewError('Network error');
        }
    };

    const loadGraph = async (id: string, name: string) => {
        if (id === currentGraphId) return;
        try {
            const res = await fetch('http://localhost:3001/api/graphs/' + id);
            const data = await res.json();
            setCurrentGraph(id, name);
            updateGlobalEdges(data.globalEdges || []);
            useStore.setState({ 
                globalNodes: data.globalNodes || {}, 
                globalEdgeProps: data.globalEdgeProps || {},
                currentContext: 'root'
            });
        } catch (e) {
            console.error('Failed to load graph', e);
        }
    };

    const deleteGraph = async (id: string) => {
        try {
            await fetch('http://localhost:3001/api/graphs/' + id, { method: 'DELETE' });
            if (id === currentGraphId) {
                setCurrentGraph(null, null);
                updateGlobalEdges([]);
                useStore.setState({ globalNodes: {}, globalEdgeProps: {}, currentContext: 'root' });
            }
            loadGraphs();
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col p-4 bg-bg overflow-y-auto">
            {!isCreating && !isSavingCurrent ? (
                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} /> New
                    </button>
                    {!currentGraphId && (globalEdges.length > 0) && (
                        <button 
                            onClick={() => setIsSavingCurrent(true)}
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-panel border border-border hover:bg-border text-textMain rounded-md text-sm font-medium transition-colors shadow-sm"
                        >
                            <Save size={16} /> Save Local
                        </button>
                    )}
                </div>
            ) : (
                <div className="mb-4 p-3 bg-panel border border-border rounded-lg shadow-sm">
                    <p className="text-xs font-bold text-textMuted mb-2">
                        {isCreating ? 'Create Blank Project' : 'Save Current Work'}
                    </p>
                    <div className="flex gap-2 mb-2">
                        <input 
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate(isSavingCurrent)}
                            placeholder="Project Name..."
                            className="flex-1 w-0 min-w-0 bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none text-textMain focus:border-blue-500 transition-colors"
                        />
                        <button onClick={() => handleCreate(isSavingCurrent)} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shrink-0">
                            <Check size={16} />
                        </button>
                        <button onClick={() => { setIsCreating(false); setIsSavingCurrent(false); setNewError(''); }} className="p-1.5 bg-border text-textMuted hover:text-textMain rounded transition-colors shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                    {newError && <p className="text-red-500 text-xs">{newError}</p>}
                </div>
            )}
            
            <div className="flex items-center justify-between mb-2 mt-2">
                <h3 className="text-sm font-bold text-textMuted tracking-wide uppercase">Your Projects</h3>
                <button onClick={loadGraphs} className="p-1 text-textMuted hover:text-textMain" title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>
            
            {loading ? (
                <div className="text-textMuted text-sm text-center py-4">Loading...</div>
            ) : graphs.length === 0 ? (
                <div className="text-textMuted text-sm text-center py-4 bg-panel border border-dashed border-border rounded-lg">No saved projects yet.</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {graphs.map(g => {
                        const isActive = g.id === currentGraphId;
                        return (
                            <div 
                                key={g.id} 
                                className={"flex items-center justify-between p-3 border rounded-lg transition-colors group " + (isActive ? 'bg-blue-500/10 border-blue-500/50' : 'bg-panel border-border hover:border-gray-500')}
                            >
                                <button 
                                    onClick={() => loadGraph(g.id, g.name)}
                                    className="flex-1 flex flex-col items-start text-left min-w-0"
                                >
                                    <span className={"font-medium text-sm flex items-center gap-2 w-full truncate " + (isActive ? 'text-blue-500' : 'text-textMain')}>
                                        <File size={14} className="shrink-0" /> <span className="truncate">{g.name}</span>
                                    </span>
                                    <span className="text-xs text-textMuted mt-1">{new Date(g.updatedAt).toLocaleString()}</span>
                                </button>
                                
                                {deletingId === g.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200 shrink-0 ml-2">
                                        <span className="text-xs text-red-500 font-medium mr-1">Sure?</span>
                                        <button onClick={() => deleteGraph(g.id)} className="p-1 text-white bg-red-500 hover:bg-red-600 rounded">
                                            <Check size={14} />
                                        </button>
                                        <button onClick={() => setDeletingId(null)} className="p-1 text-textMuted bg-border hover:bg-bg rounded">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setDeletingId(g.id)}
                                        className={"p-2 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0 ml-2 " + (isActive ? 'text-textMuted' : 'opacity-0 group-hover:opacity-100 text-textMuted')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

