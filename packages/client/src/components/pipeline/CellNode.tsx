import { useCallback, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack } from '@semoss/ui';
import { useBlocks } from '@/hooks';

const handleStyle = { left: 10 };

export function CellNode({ data, id }) {
    const { state } = useBlocks();

    const q = state.getQuery(data.queryId);
    const cell = q.getCell(data.to);

    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    const sources = useMemo(() => {
        if (!q) return [];

        return q.edges.filter((edge) => {
            if (edge.source === id) {
                const cell = q.getCell(edge.source);

                if (cell) return edge;
            }
        });
        return [];
    }, [q]);

    const cellTarget = useMemo(() => {
        if (!q) return [];

        return q.edges.filter((edge) => {
            if (edge.target === id) {
                const cell = q.getCell(edge.source);

                if (cell) return edge;
            }
        });
        return [];
    }, [q]);

    const inputTargets = useMemo(() => {
        if (!q) return [];

        return q.edges.filter((edge) => {
            if (edge.target === id) {
                const cell = q.getCell(edge.source);

                if (!cell) return edge;
            }
        });
    }, [q]);
    return (
        <>
            {/* <Handle type="target" position={Position.Left} /> */}
            {inputTargets.map((input, i) => {
                debugger;
                return (
                    <Handle
                        key={i}
                        type="target"
                        position={Position.Top}
                        id={input.source + '--' + data.to}
                    />
                );
            })}
            {cellTarget.map((cell, i) => {
                return (
                    <Handle
                        key={i}
                        type="target"
                        position={Position.Left}
                        id={cell.source + '--' + data.to}
                    />
                );
            })}
            <Stack
                sx={{
                    border: 'solid 2px green',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '300px',
                }}
                direction="column"
                gap={2}
            >
                <div>Cell Node</div>
                <div>{cell.parameters.code}</div>
            </Stack>
            {sources.map((input, i) => {
                return (
                    <Handle
                        key={i}
                        type="source"
                        position={Position.Right}
                        id={data.to}
                    />
                );
            })}
        </>
    );
}
