import { useCallback, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stack } from '@semoss/ui';
import { useBlocks } from '@/hooks';
import { BlocksRenderer } from '../blocks-workspace';
import { SerializedState } from '@/stores';

const handleStyle = { left: 10 };

export function BlockNode({ data, id }) {
    const { state } = useBlocks();
    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    const preview = useMemo(() => {
        try {
            const block = state.getBlock(id);
            const s: SerializedState = {
                version: '1.0.0-alpha.1',
                dependencies: {},
                variables: {},
                queries: {},
                blocks: {
                    'page-1': {
                        id: 'page-1',
                        widget: 'page',
                        parent: null,
                        data: {
                            style: {
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#FAFAFA',
                            },
                        },
                        listeners: {
                            onPageLoad: [],
                        },
                        slots: {
                            content: {
                                name: 'content',
                                children: [id],
                            },
                        },
                    },
                    [id]: {
                        id: block.id,
                        widget: block.widget,
                        data: block.data,
                        parent: null,
                        listeners: block.listeners,
                        slots: block.slots,
                    },
                },
            };

            return s;
        } catch {
            return null;
        }
    }, [id]);

    return (
        <>
            <Stack
                sx={{
                    border: 'solid 2px yellow',
                    backgroundColor: 'white',
                    padding: '16px',
                    width: '300px',
                }}
                direction="column"
                gap={2}
            >
                <BlocksRenderer state={preview} />
            </Stack>
            <Handle type="source" position={Position.Bottom} id={id} />
        </>
    );
}
