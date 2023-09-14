import { runPixel } from '@/api';
import { Canvas, Widgets } from '@semoss/canvas';

export const EditorPage = () => {
    return (
        <Canvas
            blocks={{
                root: {
                    id: 'root',
                    widget: 'page',
                    parent: null,
                    data: {
                        style: {},
                    },
                    listeners: {},
                    slots: {
                        content: {
                            name: 'content',
                            children: ['text-1', 'text-2'],
                        },
                    },
                },
                'text-1': {
                    id: 'text-1',
                    widget: 'text',
                    parent: null,
                    data: {
                        style: {},
                        text: 'Text 1',
                    },
                    listeners: {},
                    slots: {},
                },
                'text-2': {
                    id: 'text-2',
                    widget: 'text',
                    parent: null,
                    data: {
                        style: {},
                        text: 'Text 2',
                    },
                    listeners: {},
                    slots: {},
                },
            }}
            widgets={Widgets}
            onQuery={async ({ query }) => {
                const response = await runPixel('', query);

                if (response.errors) {
                    throw new Error(response.errors.join(''));
                }

                return {
                    data: response.pixelReturn[0].output,
                };
            }}
        >
            <Canvas.Renderer id="root" />
        </Canvas>
    );
};
