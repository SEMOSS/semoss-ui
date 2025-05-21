import React, { useRef, useEffect, useState } from 'react';
import { getBezierPath, EdgeProps, BaseEdge } from '@xyflow/react';

export function AnimatedSvgEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const [progress, setProgress] = useState(0);

    // Get path length on mount
    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [edgePath]);

    // Animation loop: progress goes from 1 to 0 (target to source)
    useEffect(() => {
        let frame: number;
        let start: number | null = null;
        const duration = 2000; // ms

        function animate(ts: number) {
            if (!start) start = ts;
            const elapsed = ts - start;
            // progress goes from 1 (target) to 0 (source)
            const t = (elapsed % duration) / duration;
            setProgress(1 - t); // reverse direction
            frame = requestAnimationFrame(animate);
        }
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Get marker position along the path
    let markerPos = { x: targetX, y: targetY };
    if (pathRef.current && pathLength > 0) {
        const pos = pathRef.current.getPointAtLength(progress * pathLength);
        markerPos = { x: pos.x, y: pos.y };
    }

    return (
        <g>
            {/* Edge path */}
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: '#007bff', strokeWidth: 2 }}
            />
            {/* Invisible path for marker animation */}
            <path
                ref={pathRef}
                d={edgePath}
                fill="none"
                style={{ stroke: 'none' }}
            />
            {/* Animated marker (circle) */}
            <circle
                cx={markerPos.x}
                cy={markerPos.y}
                r={7}
                fill="#ff007b"
                stroke="#fff"
                strokeWidth={2}
                style={{
                    filter: 'drop-shadow(0 0 4px #ff007b88)',
                    transition: 'cx 0.1s linear, cy 0.1s linear',
                }}
            />
        </g>
    );
}
