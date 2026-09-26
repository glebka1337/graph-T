import { Position, InternalNode } from '@xyflow/react';

// Returns the position (Top, Bottom, Left, or Right) and the coordinate (x, y) 
// on the node boundary that is closest to the other node.
function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode) {
    const intersectionNodeWidth = intersectionNode.measured?.width || 0;
    const intersectionNodeHeight = intersectionNode.measured?.height || 0;
    const intersectionNodePosition = intersectionNode.internals?.positionAbsolute || { x: 0, y: 0 };
    
    const targetPosition = targetNode.internals?.positionAbsolute || { x: 0, y: 0 };
    const targetWidth = targetNode.measured?.width || 0;
    const targetHeight = targetNode.measured?.height || 0;
    
    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;
    
    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + targetWidth / 2;
    const y1 = targetPosition.y + targetHeight / 2;
    
    const xx1 = (x1 - x2) / (w * 2) - (y1 - y2) / (h * 2);
    const yy1 = (x1 - x2) / (w * 2) + (y1 - y2) / (h * 2);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1)) || 0;
    
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;
    
    return { x, y };
}

function getEdgePosition(node: InternalNode, intersectionPoint: { x: number, y: number }) {
    const pos = node.internals?.positionAbsolute || { x: 0, y: 0 };
    const width = node.measured?.width || 0;
    const height = node.measured?.height || 0;
    
    const nx = Math.round(pos.x);
    const ny = Math.round(pos.y);
    const px = Math.round(intersectionPoint.x);
    const py = Math.round(intersectionPoint.y);

    if (px <= nx + 1) {
        return Position.Left;
    }
    if (px >= nx + width - 1) {
        return Position.Right;
    }
    if (py <= ny + 1) {
        return Position.Top;
    }
    if (py >= ny + height - 1) {
        return Position.Bottom;
    }

    return Position.Top;
}

export function getEdgeParams(source: InternalNode, target: InternalNode) {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
    const targetPos = getEdgePosition(target, targetIntersectionPoint);

    return {
        sx: sourceIntersectionPoint.x,
        sy: sourceIntersectionPoint.y,
        tx: targetIntersectionPoint.x,
        ty: targetIntersectionPoint.y,
        sourcePos,
        targetPos,
    };
}
