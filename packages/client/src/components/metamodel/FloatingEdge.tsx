import React from 'react';
import {
    EdgeProps,
    getSmoothStepPath,
    BaseEdge,
    useInternalNode,
} from '@xyflow/react';

import { getEdgeParams } from './utility';

export const FloatingEdge: React.FC<EdgeProps> = ({
    id,
    source,
    target,
    markerEnd,
    style,
}) => {
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);

    if (!sourceNode || !targetNode) {
        return null;
    }

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
        sourceNode,
        targetNode,
    );

    const [path] = getSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
    });

    return (
        <BaseEdge
            id={id}
            className="react-flow__edge-path"
            path={path}
            markerEnd={markerEnd}
            style={style}
        />
    );
};
