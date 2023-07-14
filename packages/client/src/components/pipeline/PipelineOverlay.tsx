import { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { Modal } from '@semoss/ui';

import { usePipeline } from '@/hooks';

export const PipelineOverlay = observer(() => {
    const { pipeline, registry } = usePipeline();

    // get the overlay
    const { overlay, graph } = pipeline;

    // get the active node
    const node = overlay.activeNode ? graph.nodes[overlay.activeNode] : null;

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
                    saveParameters: (p) => pipeline.saveParameters(node.id, p),
                    closeNode: (name) => {
                        // update the name if it exists
                        if (name) {
                            pipeline.updateName(node.id, name);
                        }

                        // close it
                        pipeline.closeOverlay();
                    },
                })}
            </Modal.Content>
        </Modal>
    );
});
