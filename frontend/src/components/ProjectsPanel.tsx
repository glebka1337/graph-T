import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2 } from 'lucide-react';

export function ProjectsPanel() {
    const { globalEdges, globalNodes, globalEdgeProps, updateGlobalEdges, } = useStore();
    const [graphs, setGraphs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const saveCurrent = async () => {
        const id = 'graph_' + Date.now();
        const name = prompt('Enter graph name:');
        if (!name) return;
        
        try {
            await fetch('http://localhost:3001/api/graphs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id, name, globalEdges, globalNodes, globalEdgeProps
                })
            });
            loadGraphs();
        } catch (e) {
            console.error(e);
        }
    };

    const loadGraph = async (id: string) => {
        try {
            const res = await fetch('http://localhost:3001/api/graphs/' + id);
            const data = await res.json();
            updateGlobalEdges(data.globalEdges || []);
            // Quick hack to restore nodes and edges props via store setter
            useStore.setState({ 
                globalNodes: data.globalNodes || {}, 
                globalEdgeProps: data.globalEdgeProps || {},
                currentContext: 'root'
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteGraph = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch('http://localhost:3001/api/graphs/' + id, { method: 'DELETE' });
            loadGraphs();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col p-4 bg-bg overflow-y-auto">
            <button 
                onClick={saveCurrent}
                className="w-full py-2 mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
                <Plus size={16} /> Save Current as New Project
            </button>
            
            <h3 className="text-sm font-bold text-textMuted mb-2 tracking-wide uppercase">Your Projects</h3>
            
            {loading ? (
                <div className="text-textMuted text-sm text-center py-4">Loading...</div>
            ) : graphs.length === 0 ? (
                <div className="text-textMuted text-sm text-center py-4">No saved projects yet.</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {graphs.map(g => (
                        <div key={g.id} className="flex items-center justify-between p-3 bg-panel border border-border rounded-lg shadow-sm group hover:border-blue-500 transition-colors">
                            <button 
                                onClick={() => loadGraph(g.id)}
                                className="flex-1 flex flex-col items-start text-left"
                            >
                                <span className="font-medium text-textMain text-sm">{g.name}</span>
                                <span className="text-xs text-textMuted">{new Date(g.updatedAt).toLocaleString()}</span>
                            </button>
                            <button 
                                onClick={() => deleteGraph(g.id)}
                                className="p-2 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

