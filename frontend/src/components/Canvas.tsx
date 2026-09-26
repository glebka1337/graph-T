import { useEffect, useCallback, useState } from 'react';
import { 
    ReactFlow, 
    useNodesState, 
    useEdgesState, 
    MarkerType, 
    Background, 
    Controls, 
    Node, 
    Edge,
    useReactFlow,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    Position,
    useOnSelectionChange
} from '@xyflow/react';
import dagre from 'dagre';
import { useStore } from '../store/useStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { ChevronRight, Home, X, Palette, AlignLeft } from 'lucide-react';
import clsx from 'clsx';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 180, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
        node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
        node.position = {
            x: nodeWithPosition.x - 90,
            y: nodeWithPosition.y - 25,
        };
        return node;
    });

    return { nodes, edges };
};

export function Canvas() {
    const { globalEdges, globalNodes, globalEdgeProps, currentContext, setContext, isDark, updateNodeProps, updateEdgeProps } = useStore();
    const { fitView } = useReactFlow();

    const [nodes, setNodes] = useNodesState<Node>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);



    useEffect(() => {
        const currentEdges = globalEdges.filter(e => e.context === currentContext);
        
        const nodesMap = new Map<string, Node>();
        const flowEdges: Edge[] = [];

        currentEdges.forEach((edgeData, i) => {
            const { source, sign, dir, target, label, comment } = edgeData;
            
            if (!source || !target) return;

            const hasInternalSource = globalEdges.some(e => e.context === source);
            const sourceProps = globalNodes[source] || {};

            if (!nodesMap.has(source)) {
                nodesMap.set(source, {
                    id: source,
                    type: 'custom',
                    position: { x: 0, y: 0 },
                    data: { label: source, hasChildren: hasInternalSource, opacity: 1, ...sourceProps },
                });
            }

            const hasInternalTarget = globalEdges.some(e => e.context === target);
            const targetProps = globalNodes[target] || {};

            if (!nodesMap.has(target)) {
                nodesMap.set(target, {
                    id: target,
                    type: 'custom',
                    position: { x: 0, y: 0 },
                    data: { label: target, hasChildren: hasInternalTarget, opacity: 1, ...targetProps },
                });
            }

            const edgeId = `e${i}-${source}-${target}`;
            const eProps = globalEdgeProps[edgeId] || {};

            let defaultColor = '#9ca3af';
            if (sign === '+') defaultColor = '#10b981';
            else if (sign === '-') defaultColor = '#ef4444';
            
            let color = eProps.customColor || defaultColor;

            const edgeComment = eProps.description !== undefined ? eProps.description : comment;

            const flowEdge: Edge = {
                id: edgeId,
                source,
                target,
                type: 'custom',
                data: { label, comment: edgeComment, opacity: 1, color, originalColor: defaultColor, originalComment: comment },
                animated: false,
            };

            if (dir === '->') {
                flowEdge.markerEnd = { type: MarkerType.ArrowClosed, color };
            } else if (dir === '<-') {
                flowEdge.markerStart = { type: MarkerType.ArrowClosed, color };
            } else if (dir === '<->') {
                flowEdge.markerEnd = { type: MarkerType.ArrowClosed, color };
                flowEdge.markerStart = { type: MarkerType.ArrowClosed, color };
            }

            flowEdges.push(flowEdge);
        });

        const initialNodes = Array.from(nodesMap.values());
        
        if (initialNodes.length > 0) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                flowEdges
            );
            
            setNodes(oldNds => {
                return layoutedNodes.map(newN => {
                    const old = oldNds.find(o => o.id === newN.id);
                    if (old) {
                        newN.selected = old.selected;
                        newN.position = old.position;
                    }
                    return newN;
                });
            });
            
            setEdges(oldEds => {
                return layoutedEdges.map(newE => {
                    const old = oldEds.find(o => o.id === newE.id);
                    if (old) {
                        newE.selected = old.selected;
                    }
                    return newE;
                });
            });
        } else {
            setNodes([]);
            setEdges([]);
        }
    }, [globalEdges, globalNodes, globalEdgeProps, currentContext]);

    // Initial fitView on context change
    useEffect(() => {
        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }, [currentContext, fitView]);

    // Live sync properties without rebuilding layout
    useEffect(() => {
        setNodes((nds) => nds.map(n => {
            const props = globalNodes[n.id] || {};
            return { ...n, data: { ...(n.data || {}), ...props } };
        }));
    }, [globalNodes]);

    useEffect(() => {
        setEdges((eds) => eds.map(e => {
            const eProps = globalEdgeProps[e.id] || {};
            let color = eProps.customColor || (e.data?.originalColor as string);
            return { 
                ...e, 
                data: { 
                    ...(e.data || {}), 
                    color, 
                    comment: eProps.description !== undefined ? eProps.description : (e.data?.originalComment as string)
                } 
            };
        }));
    }, [globalEdgeProps]);

    const onNodesChange = useCallback((changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node[]), []);
    const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]), []);

    const [inspectedElement, setInspectedElement] = useState<{type: 'node' | 'edge', id: string} | null>(null);

    useOnSelectionChange({
        onChange: ({ nodes: selectedNodes, edges: selectedEdges }) => {
            // A node is explicitly focused if it was Ctrl+Clicked (we'll track this via length > 1, or just standard React Flow selection)
            // Wait, we need to show Inspector Panel ONLY on explicit click.
            // But for dimming, we dim if there's any selection. Wait, user wants dim on Ctrl+Click (multiple) OR Edge select.
            const hasSelection = selectedEdges.length > 0 || selectedNodes.length > 1;
            
            setNodes((nds) => nds.map((n) => {
                const isSelected = selectedNodes.some(sn => sn.id === n.id);
                const isConnectedToSelectedEdge = selectedEdges.some(se => se.source === n.id || se.target === n.id);
                // Highlight nodes that share an edge with a selected node
                const isAdjacentToSelectedNode = globalEdges.some(ge => 
                    (selectedNodes.some(sn => sn.id === ge.source) && ge.target === n.id) ||
                    (selectedNodes.some(sn => sn.id === ge.target) && ge.source === n.id)
                );
                
                const shouldBeHighlighted = isSelected || isConnectedToSelectedEdge || isAdjacentToSelectedNode;
                
                return {
                    ...n,
                    data: { ...n.data, opacity: hasSelection && !shouldBeHighlighted ? 0.2 : 1 }
                };
            }));

            setEdges((eds) => eds.map((e) => {
                const isSelected = selectedEdges.some(se => se.id === e.id);
                const isConnectedToinspectedNode = selectedNodes.some(sn => sn.id === e.source || sn.id === e.target);
                const shouldBeHighlighted = isSelected || isConnectedToinspectedNode;
                
                return {
                    ...e,
                    data: { ...e.data, opacity: hasSelection && !shouldBeHighlighted ? 0.1 : 1 }
                };
            }));
        },
    });

    const inspectedNode = inspectedElement?.type === 'node' ? nodes.find(n => n.id === inspectedElement.id) : null;
    const inspectedEdge = inspectedElement?.type === 'edge' ? edges.find(e => e.id === inspectedElement.id) : null;

    return (
        <div className="flex-1 relative bg-bg h-full">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-panel px-4 py-2 rounded-lg border border-border shadow-sm">
                <button 
                    onClick={() => setContext('root')} 
                    className="flex items-center gap-1 text-sm font-medium hover:text-blue-500 transition-colors"
                >
                    <Home size={16} /> Root
                </button>
                {currentContext !== 'root' && (
                    <>
                        <ChevronRight size={16} className="text-textMuted" />
                        <span className="text-sm font-bold">{currentContext}</span>
                    </>
                )}
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_e, node) => setInspectedElement({type: 'node', id: node.id})}
                onEdgeClick={(_e, edge) => setInspectedElement({type: 'edge', id: edge.id})}
                onPaneClick={() => setInspectedElement(null)}
                nodeTypes={nodeTypes as any}
                edgeTypes={edgeTypes as any}
                fitView
                colorMode={isDark ? 'dark' : 'light'}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
            >
                <Background color={isDark ? '#374151' : '#9ca3af'} gap={24} />
                <Controls className="!bg-panel !border-border !fill-textMain" />
            </ReactFlow>

            {(inspectedNode || inspectedEdge) && (
                <div className="absolute top-4 right-4 z-10 w-80 bg-panel border border-border shadow-lg rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-bg">
                        <span className="font-bold text-sm text-textMain truncate pr-2">
                            {inspectedNode ? inspectedNode.id : inspectedEdge?.data?.label ? inspectedEdge.data.label as string : 'Connection'}
                        </span>
                        <button 
                            onClick={() => setInspectedElement(null)}
                            className="p-1 rounded hover:bg-border text-textMuted hover:text-textMain transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-textMuted flex items-center gap-1.5 uppercase tracking-wider">
                                <AlignLeft size={14} /> Description
                            </label>
                            <textarea 
                                value={inspectedNode ? (globalNodes[inspectedNode.id]?.description || '') : (inspectedEdge ? (globalEdgeProps[inspectedEdge.id]?.description ?? (inspectedEdge.data?.comment as string) ?? '') : '')}
                                onChange={(e) => {
                                    if (inspectedNode) {
                                        updateNodeProps(inspectedNode.id, { description: e.target.value });
                                    } else if (inspectedEdge) {
                                        updateEdgeProps(inspectedEdge.id, { description: e.target.value });
                                    }
                                }}
                                placeholder="Add notes..."
                                className="w-full bg-bg border border-border rounded p-2 text-sm text-textMain resize-none h-24 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-textMuted flex items-center gap-1.5 uppercase tracking-wider">
                                <Palette size={14} /> Custom Color
                            </label>
                            <div className="flex gap-2">
                                {['', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            if (inspectedNode) updateNodeProps(inspectedNode.id, { color: c || undefined });
                                            if (inspectedEdge) updateEdgeProps(inspectedEdge.id, { customColor: c || undefined });
                                        }}
                                        className={clsx(
                                            "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                            c === '' ? "bg-bg border-dashed border-border" : "",
                                            ((inspectedNode && globalNodes[inspectedNode.id]?.color === c) || 
                                             (inspectedEdge && globalEdgeProps[inspectedEdge.id]?.customColor === c)) ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-panel border-transparent" : "border-transparent"
                                        )}
                                        style={c ? { backgroundColor: c } : {}}
                                        title={c === '' ? 'Default' : c}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


