import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useInternalNode } from '@xyflow/react';
import { getEdgeParams } from '../utils/edgeUtils';

export const CustomEdge = memo(({
    source,
    target,
    style = {},
    markerEnd,
    markerStart,
    data
}: EdgeProps) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) {
        return null;
    }

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetX: tx,
        targetY: ty,
        targetPosition: targetPos,
    });

    return (
        <>
            <BaseEdge 
                path={edgePath} 
                markerEnd={markerEnd} 
                markerStart={markerStart} 
                style={{
                    ...style,
                    stroke: (data?.color as string) || '#9ca3af',
                    strokeWidth: 2,
                    opacity: (data?.opacity as number) ?? 1
                }} 
            />
            
            {(data?.label || data?.comment) && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            opacity: (data?.opacity as number) ?? 1,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan group"
                    >
                        <div className="bg-bg px-2 py-0.5 rounded text-xs font-medium text-textMain border border-border shadow-sm flex items-center gap-1 cursor-help hover:ring-2 hover:ring-blue-500 transition-all relative">
                            {!!data.label && <span>{data.label as string}</span>}
                            {!data.label && !!data.comment && <span className="text-textMuted text-[10px] w-3 h-3 flex items-center justify-center rounded-full bg-border">i</span>}
                            
                            {!!data.comment && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-48 p-2 bg-panel border border-border rounded-lg shadow-xl text-xs text-textMain whitespace-pre-wrap break-words text-center" style={{ wordBreak: 'break-word' }}>
                                    {data.comment as string}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-panel border-b border-r border-border rotate-45"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});
