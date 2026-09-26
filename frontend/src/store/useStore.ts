import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GraphEdge } from '../types';
import Papa from 'papaparse';

export type NodePropsType = { color?: string, description?: string };
export type EdgePropsType = { customColor?: string, description?: string };

interface AppState {
    globalEdges: GraphEdge[];
    globalNodes: Record<string, NodePropsType>;
    globalEdgeProps: Record<string, EdgePropsType>;
    currentContext: string;
    isDark: boolean;
    setTheme: (dark: boolean) => void;
    setContext: (ctx: string) => void;
    updateGlobalEdges: (edges: GraphEdge[]) => void;
    updateNodeProps: (nodeId: string, props: Partial<NodePropsType>) => void;
    updateEdgeProps: (edgeId: string, props: Partial<EdgePropsType>) => void;
    parseRawText: (text: string) => void;
    getRawText: () => string;
}

const cleanString = (str: string) => str.replace(/^\|?/, '').replace(/\|?$/, '').trim().replace(/^"/, '').replace(/"$/, '').trim();

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            globalEdges: [],
            globalNodes: {},
            globalEdgeProps: {},
            currentContext: 'root',
            isDark: true,
            
            setTheme: (dark) => {
                set({ isDark: dark });
                document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            },
            
            setContext: (ctx) => set({ currentContext: ctx }),
            
            updateGlobalEdges: (edges) => set({ globalEdges: edges }),

            updateNodeProps: (nodeId, props) => set((state) => ({
                globalNodes: { ...state.globalNodes, [nodeId]: { ...(state.globalNodes[nodeId] || {}), ...props } }
            })),

            updateEdgeProps: (edgeId, props) => set((state) => ({
                globalEdgeProps: { ...state.globalEdgeProps, [edgeId]: { ...(state.globalEdgeProps[edgeId] || {}), ...props } }
            })),
            
            parseRawText: (text) => {
                const globalEdges: GraphEdge[] = [];
                let activeContext = 'root';
                const lines = text.split('\n');
                let toParse = "";
                
                for (const line of lines) {
                    const t = line.trim();
                    if (t.startsWith('[') && t.endsWith(']')) {
                        activeContext = t.substring(1, t.length - 1).trim();
                    } else if (t !== '') {
                        if (t.toLowerCase().startsWith('source') || t.toLowerCase().startsWith('node')) continue;
                        toParse += t + `, ${activeContext}\n`;
                    }
                }
                
                if (!toParse) {
                    set({ globalEdges: [] });
                    return;
                }

                Papa.parse(toParse, {
                    delimiter: "",
                    skipEmptyLines: true,
                    complete: (results: any) => {
                        for (const row of results.data) {
                            if (row.length < 3) continue;
                            let context = 'root';
                            let source = cleanString(row[0]);
                            let sign = cleanString(row[1]);
                            let dir = row.length > 2 ? cleanString(row[2]) : '->';
                            let target = row.length > 3 ? cleanString(row[3]) : '';
                            let label = row.length > 4 ? cleanString(row[4]) : '';
                            let comment = row.length > 5 ? cleanString(row[5]) : '';
                            
                            if (row.length === 7) {
                                comment = cleanString(row[5]);
                                context = cleanString(row[6]);
                            } else if (row.length === 4) {
                                dir = '->'; target = cleanString(row[2]); context = cleanString(row[3]); label = ''; comment = '';
                            } else if (row.length === 5) {
                                dir = '->'; target = cleanString(row[2]); comment = cleanString(row[3]); context = cleanString(row[4]); label = '';
                            }

                            if (source || target) {
                                globalEdges.push({ source, sign, dir, target, label, comment, context });
                            }
                        }
                        set({ globalEdges });
                    }
                });
            },

            getRawText: () => {
                const { globalEdges } = get();
                let text = "Source | Sign | Dir | Target | Label | Comment\n";
                const contexts = ['root', ...Array.from(new Set(globalEdges.map(e => e.context).filter(c => c !== 'root')))];
                
                contexts.forEach(ctx => {
                    const edges = globalEdges.filter(e => e.context === ctx);
                    if (edges.length === 0) return;
                    
                    if (ctx !== 'root') text += `\n[${ctx}]\n`;
                    
                    edges.forEach(e => {
                        const s = e.source.includes(',') ? `"${e.source}"` : e.source;
                        const t = e.target.includes(',') ? `"${e.target}"` : e.target;
                        const c = e.comment.includes(',') ? `"${e.comment}"` : e.comment;
                        const l = e.label.includes(',') ? `"${e.label}"` : e.label;
                        text += `${s}, ${e.sign}, ${e.dir}, ${t}, ${l}, ${c}\n`;
                    });
                });
                return text.trim();
            }
        }),
        {
            name: 'graph-t-storage',
            partialize: (state) => ({
                globalEdges: state.globalEdges,
                globalNodes: state.globalNodes,
                globalEdgeProps: state.globalEdgeProps,
                isDark: state.isDark
            })
        }
    )
);
