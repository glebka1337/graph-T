import { memo, useState, useEffect, useRef } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { Trash2, ChevronDown, ChevronRight, Edit2, Check } from 'lucide-react';
import clsx from 'clsx';

export const CustomNote = memo(({ id, data, selected }: NodeProps) => {
    const { updateNodeProps } = useStore();
    const typedData = data as any;
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localText, setLocalText] = useState(typedData.text || '');
    const [localTitle, setLocalTitle] = useState(typedData.title || 'Note');
    const titleInputRef = useRef<HTMLInputElement>(null);

    const color = typedData.color || '#eab308';
    const bgAlpha = color + '20'; // append 20 for hex opacity

    useEffect(() => {
        if (isEditingTitle) {
            titleInputRef.current?.focus();
        }
    }, [isEditingTitle]);

    const toggleCollapse = () => {
        updateNodeProps(id, { isCollapsed: !typedData.isCollapsed });
    };

    const handleDelete = () => {
        updateNodeProps(id, { isNote: false });
    };

    const saveEdit = () => {
        setIsEditing(false);
        updateNodeProps(id, { text: localText });
    };

    const saveTitle = () => {
        setIsEditingTitle(false);
        updateNodeProps(id, { title: localTitle });
    };

    return (
        <>
            <NodeResizer 
                color={color} 
                isVisible={selected} 
                minWidth={200} 
                minHeight={60} 
                onResizeEnd={(_, params) => {
                    useStore.getState().updateNodeProps(id, { width: params.width, height: params.height });
                }}
            />
        <div 
            className={clsx(
                "rounded-lg border-2 bg-panel transition-all shadow-sm flex flex-col min-w-[200px]",
                selected ? "shadow-md ring-2 ring-offset-2 ring-offset-bg" : "hover:shadow-md"
            )}
            style={{ 
                width: typedData.width,
                height: typedData.height,
                borderColor: color, 
                '--tw-ring-color': color 
            } as React.CSSProperties}
        >
            <div 
                className="flex items-center justify-between p-2 border-b rounded-t-[6px] group"
                style={{ backgroundColor: bgAlpha, borderBottomColor: color }}
            >
                <div className="flex items-center gap-1 overflow-hidden">
                    <button onClick={toggleCollapse} className="flex-shrink-0" style={{ color: color }}>
                        {typedData.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                            className="bg-bg border border-border rounded px-1 text-sm font-bold text-textMain outline-none w-full min-w-0 nodrag"
                        />
                    ) : (
                        <button 
                            onDoubleClick={() => setIsEditingTitle(true)}
                            className="text-sm font-bold truncate hover:opacity-80 transition-opacity" 
                            style={{ color: color }}
                            title="Double click to rename"
                        >
                            {typedData.title || 'Note'}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    {isEditing ? (
                        <button onClick={saveEdit} className="p-1 rounded hover:bg-bg/50" style={{ color: color }}>
                            <Check size={14} />
                        </button>
                    ) : (
                        <button onClick={() => { setLocalText(typedData.text || ''); setIsEditing(true); }} className="p-1 rounded hover:bg-bg/50" style={{ color: color }}>
                            <Edit2 size={14} />
                        </button>
                    )}
                    <button onClick={handleDelete} className="p-1 rounded hover:bg-red-500/20 text-red-500">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            
            {!typedData.isCollapsed && (
                <div className="p-3 text-textMain text-sm custom-markdown cursor-text nodrag flex-1 flex flex-col h-full min-h-0" onDoubleClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                        <textarea
                            value={localText}
                            onChange={(e) => setLocalText(e.target.value)}
                            onBlur={saveEdit}
                            autoFocus
                            className="w-full h-full min-h-[100px] flex-1 bg-bg border border-border rounded p-2 outline-none resize-none text-textMain"
                            style={{ '--tw-ring-color': color, '&:focus': { borderColor: color } } as any}
                            placeholder="Write markdown here..."
                        />
                    ) : (
                        <div className="markdown-tooltip overflow-y-auto h-full flex-1" onDoubleClick={() => setIsEditing(true)}>
                            {typedData.text ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{typedData.text}</ReactMarkdown>
                            ) : (
                                <span className="text-textMuted italic">Double-click to edit note...</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
});


