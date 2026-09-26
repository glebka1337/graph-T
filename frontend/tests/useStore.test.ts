import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/store/useStore';

describe('Graph Store', () => {
    beforeEach(() => {
        useStore.setState({
            globalEdges: [],
            globalNodes: {},
            globalEdgeProps: {},
            currentContext: 'root'
        });
    });

    it('should correctly parse CSV raw text into edges', () => {
        const store = useStore.getState();
        store.parseRawText('NodeA, +, ->, NodeB, label, comment');
        
        const newEdges = useStore.getState().globalEdges;
        expect(newEdges).toHaveLength(1);
        expect(newEdges[0]).toMatchObject({
            source: 'NodeA',
            sign: '+',
            dir: '->',
            target: 'NodeB',
            label: 'label',
            comment: 'comment',
            context: 'root'
        });
    });

    it('should handle context blocks correctly', () => {
        const store = useStore.getState();
        const text = "[Auth]\nUser, +, ->, DB, auth";
        store.parseRawText(text);
        
        const newEdges = useStore.getState().globalEdges;
        expect(newEdges).toHaveLength(1);
        expect(newEdges[0].context).toBe('Auth');
    });

    it('should update edge props', () => {
        const store = useStore.getState();
        store.updateEdgeProps('edge-1', { customColor: '#ff0000', description: 'test' });
        
        const props = useStore.getState().globalEdgeProps;
        expect(props['edge-1'].customColor).toBe('#ff0000');
        expect(props['edge-1'].description).toBe('test');
    });
});
