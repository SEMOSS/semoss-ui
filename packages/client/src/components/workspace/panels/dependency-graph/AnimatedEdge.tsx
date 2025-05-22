import React, { useMemo } from 'react';
import {
    BaseEdge,
    getSmoothStepPath,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';

export function AnimatedEdge({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
}: EdgeProps) {
    const nodes = useNodes();
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isAnimated = useMemo(() => {
        const sourceNode = nodes.find((n) => n.id === source);
        const targetNode = nodes.find((n) => n.id === target);

        return sourceNode.selected || targetNode.selected;
    }, [nodes, source, target]);

    // {isAnimated ? (
    // Stop animation on circle and show variable name in tooltip
    //             hovered ? (
    //                 <></>
    //             ) : (
    //                 <circle
    //                     r="10"
    //                     stroke="#22A4FF"
    //                     fill="white"
    //                     strokeWidth={2}
    //                     onMouseEnter={() => setHovered(true)}
    //                     onMouseLeav={() => setHovered(false)}
    //                 >
    //                     <animateMotion
    //                         dur="4s"
    //                         repeatCount="indefinite"
    //                         path={edgePath}
    //                     />
    //                 </circle>
    // )
    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            {isAnimated ? (
                <circle r="10" stroke="#22A4FF" fill="white" strokeWidth={2}>
                    <animateMotion
                        dur="4s"
                        repeatCount="indefinite"
                        path={edgePath}
                    />
                </circle>
            ) : (
                <circle
                    r="5"
                    stroke="#22A4FF"
                    fill="white"
                    strokeWidth={2}
                    cx={targetX}
                    cy={targetY}
                ></circle>
            )}
        </>
    );
}
