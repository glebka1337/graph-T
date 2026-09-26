export interface GraphEdge {
    source: string;
    sign: string;
    dir: string;
    target: string;
    label: string;
    comment: string;
    context: string;
}

export interface Loop {
    type: 'R' | 'B';
    nodes: string[];
    edges: string[];
}
