import { useMemo } from 'react';
import { Canvas, Widgets } from '@semoss/canvas';
import { Stack } from '@semoss/ui';

import { DesignerContext } from '@/contexts';
import { DesignerStore } from '@/stores';
import { runPixel } from '@/api';
import {
    DesignerRenderer,
    DesignerSidebar,
    DesignerSelectedMenu,
} from '@/components/designer';

export const DesignPage = () => {
    // create a new instance of the store and provide it to the childen
    const designer = useMemo(() => {
        return new DesignerStore();
    }, []);

    return (
        // TODO: Fix
        <div style={{ height: '100vh', width: '100vw' }}>
            <DesignerContext.Provider
                value={{
                    designer: designer,
                }}
            >
                <Canvas
                    config={{
                        blocks: {
                            'page-1': {
                                id: 'page-1',
                                widget: 'page',
                                parent: null,
                                data: {
                                    style: {
                                        background: 'lightblue',
                                        padding: '16px 0',
                                    },
                                },
                                listeners: {},
                                slots: {
                                    content: {
                                        name: 'content',
                                        children: [
                                            'text-1',
                                            'text-2',
                                            'page-2',
                                            'text-3',
                                        ],
                                    },
                                },
                            },
                            'page-2': {
                                id: 'page-2',
                                widget: 'page',
                                parent: {
                                    id: 'page-1',
                                    slot: 'content',
                                },
                                data: {
                                    style: {
                                        background: 'lightgreen',
                                        padding: '16px 0',
                                    },
                                },
                                listeners: {},
                                slots: {
                                    content: {
                                        name: 'content',
                                        children: [],
                                    },
                                },
                            },
                            'text-1': {
                                id: 'text-1',
                                widget: 'text',
                                parent: {
                                    id: 'page-1',
                                    slot: 'content',
                                },
                                data: {
                                    style: {
                                        display: 'block',
                                    },
                                    text: 'Text 1',
                                },
                                listeners: {},
                                slots: {},
                            },
                            'text-2': {
                                id: 'text-2',
                                widget: 'text',
                                parent: {
                                    id: 'page-1',
                                    slot: 'content',
                                },
                                data: {
                                    style: {
                                        display: 'block',
                                    },
                                    text: 'Text 2',
                                },
                                listeners: {},
                                slots: {},
                            },
                            'text-3': {
                                id: 'text-3',
                                widget: 'text',
                                parent: {
                                    id: 'page-1',
                                    slot: 'content',
                                },
                                data: {
                                    style: {
                                        marginTop: '200px',
                                        display: 'block',
                                    },
                                    text: 'Text 3',
                                },
                                listeners: {},
                                slots: {},
                            },
                        },
                    }}
                    widgets={Widgets}
                    onQuery={async ({ query }) => {
                        const response = await runPixel('', query);

                        if (response.errors.length) {
                            throw new Error(response.errors.join(''));
                        }

                        return {
                            data: response.pixelReturn[0].output,
                        };
                    }}
                >
                    <Stack
                        height="100%"
                        width={'100%'}
                        direction="row"
                        spacing={0}
                    >
                        <DesignerSidebar />
                        <Stack flex="1">
                            <DesignerRenderer blockId="page-1" />
                        </Stack>
                        <DesignerSelectedMenu />
                    </Stack>
                </Canvas>
            </DesignerContext.Provider>
        </div>
    );
};
