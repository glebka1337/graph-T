import { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { Trash2, ChevronDown, ChevronRight, Edit2, Check } from 'lucide-react';
import clsx from 'clsx';

export const CustomNote = memo(({ id, data, selected }: NodeProps) => {
    const { updateNodeProps } = useStore();
    const typedData = data as any;
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(typedData.text || '');

    const toggleCollapse = () => {
        updateNodeProps(id, { isCollapsed: !typedData.isCollapsed });
    };

    const handleDelete = () => {
        // We can just set isNote to false or delete it. For now, setting isNote to false hides it.
        updateNodeProps(id, { isNote: false });
    };

    const saveEdit = () => {
        setIsEditing(false);
        updateNodeProps(id, { text: localText });
    };

    return (
        <div className={clsx(
            "rounded-lg border-2 bg-panel transition-all shadow-sm flex flex-col min-w-[200px] max-w-[400px]",
            selected ? "border-yellow-500 shadow-md ring-2 ring-yellow-500/20" : "border-yellow-600/50 hover:border-yellow-500"
        )}>
            <div className="flex items-center justify-between p-2 bg-yellow-500/10 border-b border-yellow-500/20 rounded-t-md group">
                <button onClick={toggleCollapse} className="flex items-center gap-1 text-sm font-bold text-yellow-600 hover:text-yellow-500">
                    {typedData.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    Note
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                        <button onClick={saveEdit} className="p-1 hover:bg-yellow-500/20 text-yellow-600 rounded">
                            <Check size={14} />
                        </button>
                    ) : (
                        <button onClick={() => { setLocalText(typedData.text || ''); setIsEditing(true); }} className="p-1 hover:bg-yellow-500/20 text-yellow-600 rounded">
                            <Edit2 size={14} />
                        </button>
                    )}
                    <button onClick={handleDelete} className="p-1 hover:bg-red-500/20 text-red-500 rounded">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            
            {!typedData.isCollapsed && (
                <div className="p-3 text-textMain text-sm custom-markdown cursor-text nodrag" onDoubleClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                        <textarea
                            value={localText}
                            onChange={(e) => setLocalText(e.target.value)}
                            onBlur={saveEdit}
                            autoFocus
                            className="w-full min-h-[100px] bg-bg border border-border rounded p-2 outline-none focus:border-yellow-500 resize-y text-textMain"
                            placeholder="Write markdown here..."
                        />
                    ) : (
                        <div className="markdown-tooltip overflow-y-auto max-h-[300px]" onDoubleClick={() => setIsEditing(true)}>
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
    );
});
