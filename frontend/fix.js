const fs = require('fs');
let code = fs.readFileSync('src/components/Canvas.tsx', 'utf8');

const target = \<div className="flex flex-col gap-2">
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
                        </div>\;

const replacement = \<div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-textMuted flex items-center gap-1.5 uppercase tracking-wider">
                                    <AlignLeft size={14} /> Description
                                </label>
                                <button 
                                    onClick={() => setIsEditingMd(!isEditingMd)}
                                    className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1"
                                >
                                    {isEditingMd ? <><Eye size={12} /> Preview</> : <><FileEdit size={12} /> Edit</>}
                                </button>
                            </div>
                            {isEditingMd ? (
                                <textarea 
                                    value={inspectedNode ? (globalNodes[inspectedNode.id]?.description || '') : (inspectedEdge ? (globalEdgeProps[inspectedEdge.id]?.description ?? (inspectedEdge.data?.comment as string) ?? '') : '')}
                                    onChange={(e) => {
                                        if (inspectedNode) {
                                            updateNodeProps(inspectedNode.id, { description: e.target.value });
                                        } else if (inspectedEdge) {
                                            updateEdgeProps(inspectedEdge.id, { description: e.target.value });
                                        }
                                    }}
                                    placeholder="Add markdown notes..."
                                    className="w-full bg-bg border border-border rounded p-2 text-sm text-textMain resize-y min-h-[120px] focus:outline-none focus:border-blue-500 font-mono"
                                />
                            ) : (
                                <div className="w-full bg-bg border border-border rounded p-3 text-sm text-textMain min-h-[120px] max-h-[300px] overflow-y-auto prose prose-sm prose-invert prose-p:leading-snug prose-headings:mb-2 prose-p:mb-2 prose-a:text-blue-500 max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {inspectedNode ? (globalNodes[inspectedNode.id]?.description || '*No description*') : (inspectedEdge ? (globalEdgeProps[inspectedEdge.id]?.description ?? (inspectedEdge.data?.comment as string) ?? '*No description*') : '')}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>\;

let escapedTarget = target.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/\s+/g, '\\s*');
let regex = new RegExp(escapedTarget);
code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Canvas.tsx', code);
console.log('Successfully replaced');
