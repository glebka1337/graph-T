import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layers } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';

export const CustomNode = memo(({ id, data, selected }: NodeProps) => {
    const setContextPath = useStore(s => s.setContextPath);
    const contextPath = useStore(s => s.contextPath);
    const typedData = data as any;

    const onDoubleClick = () => {
        setContextPath([...contextPath, id]);
    };

    return (
        <>
            <NodeResizer 
                color={typedData.color || '#3b82f6'} 
                isVisible={selected} 
                minWidth={100} 
                minHeight={40} 
                onResizeEnd={(_, params) => {
                    useStore.getState().updateNodeProps(id, { width: params.width, height: params.height });
                }}
            />
            <div 
                onDoubleClick={onDoubleClick}
                style={{
                    borderColor: typedData.color || undefined,
                    width: typedData.width,
                    height: typedData.height
                }}
            className={clsx(
                "px-4 py-2 rounded-lg border-2 bg-panel transition-all shadow-sm flex items-center gap-2",
                selected ? "border-blue-500 shadow-md ring-2 ring-blue-500/20" : (!typedData.color && "border-border hover:border-gray-400"),
                typedData.opacity < 1 ? "opacity-30" : "opacity-100"
            )}
        >
            <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0 absolute top-1/2 left-1/2 pointer-events-none" />
            
            <div className="flex flex-col gap-1 items-center justify-center">
                <div className="flex items-center gap-1.5">
                    <span className="text-textMain font-medium font-sans text-sm">
                        {typedData.label as string}
                    </span>
                    {typedData.description && (
                        <div className="relative group">
                            <span className="cursor-help text-textMuted text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full bg-border hover:bg-blue-500 hover:text-white transition-colors">
                                i
                            </span>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-56 p-3 bg-panel border border-border rounded-lg shadow-xl text-xs text-textMain whitespace-pre-wrap break-words text-center" style={{ wordBreak: 'break-word' }}>
                                <div className="markdown-tooltip"><ReactMarkdown remarkPlugins={[remarkGfm]}>{typedData.description as string}</ReactMarkdown></div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-panel border-b border-r border-border rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {typedData.hasChildren && (
                <div className="text-blue-500 bg-blue-500/10 p-1 rounded" title="Double click to enter sub-graph">
                    <Layers size={14} />
                </div>
            )}
            
            <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0 absolute top-1/2 left-1/2 pointer-events-none" />
        </div>
        </>
    );
});




