import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { usePipeline } from '@/hooks';

export const PipelineOverlay = observer(() => {
    const { pipeline, registry } = usePipeline();

    // get the overlay
    const { overlay } = pipeline;

    // get the active node
    const node = overlay.activeNode
        ? pipeline.getNode(overlay.activeNode)
        : null;

    // don't render anything if there is no node and it doesn't exist in the registry
    if (!node || !registry[node.data.guid]) {
        return null;
    }

    // get the component from the registery
    const Component = registry[node.data.guid];

    // don't render anything if it doesn't exist in the registry
    if (!Component) {
        return null;
    }

    return (
        <Modal
            maxWidth={false}
            open={overlay.open}
            onClose={() => {
                pipeline.closeOverlay();
            }}
        >
            <Modal.Content>
                {createElement(observer(registry[node.data.guid]), {
                    parameters: node.data.parameters,
                    display: node.data.display,
                    actions: {
                        close: () => pipeline.closeOverlay(),
                        query: async (pixel) =>
                            pipeline.queryPixel(node.id, pixel),
                        run: async (parameters) => {
                            // update the parameters
                            pipeline.saveNode(node.id, {
                                parameters: parameters,
                            });

                            // close the overlay
                            pipeline.closeOverlay();

                            // convert to pixel and run it
                            const pixel = Component.toPixel(parameters);

                            // return the response
                            return pipeline.runPixel(node.id, pixel);
                        },
                        save: (o) => pipeline.saveNode(node.id, o),
                    },
                })}
            </Modal.Content>
        </Modal>
    );
});
