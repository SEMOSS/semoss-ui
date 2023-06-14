import React, { useCallback } from 'react';
import { useStore, EdgeProps, getSmoothStepPath } from 'react-flow-renderer';

import { getEdgeParams } from './utility';

export const FloatingEdge: React.FC<EdgeProps> = ({
    id,
    source,
    target,
    markerEnd,
    style,
}) => {
    const sourceNode = useStore(
        useCallback((store) => store.nodeInternals.get(source), [source]),
    );
    const targetNode = useStore(
        useCallback((store) => store.nodeInternals.get(target), [target]),
    );

    if (!sourceNode || !targetNode) {
        return null;
    }

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
        sourceNode,
        targetNode,
    );

    const d = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
    });

    return (
        <path
            id={id}
            className="react-flow__edge-path"
            d={d}
            markerEnd={markerEnd}
            style={style}
        />
    );
};
