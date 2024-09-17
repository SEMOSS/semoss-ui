import React, { FC } from 'react';
import {
    EdgeProps,
    getBezierPath,
    EdgeLabelRenderer,
    BaseEdge,
    Edge,
    EdgeText,
} from '@xyflow/react';

export const CustomEdge: FC<EdgeProps<Edge<{ label: string }>>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    sourceHandleId,
    targetHandleId,
    markerEnd,
    data,
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                d={edgePath}
                markerEnd={markerEnd}
                className="react-flow__edge-path"
                style={{}}
            />
            <EdgeText
                x={sourceX + 50}
                y={sourceY}
                label={data.label}
                labelShowBg={true}
                labelBgBorderRadius={4}
                labelBgPadding={[8, 6]}
            />
            <EdgeText
                x={targetX - 50}
                y={targetY}
                label={data.label}
                labelShowBg={true}
                labelBgBorderRadius={4}
                labelBgPadding={[8, 6]}
            />
        </>
    );
};
