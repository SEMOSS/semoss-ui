import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Layout, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './flexlayout.css';
import { useWorkspace } from '@/hooks';

interface WorkspaceRendererProps {
    /** Factory method */
    factory: (node: TabNode, layout: Layout) => React.ReactNode;
}

export const WorkspaceRenderer = observer((props: WorkspaceRendererProps) => {
    const { factory = () => null } = props;

    const layoutRef = useRef<Layout>(null);
    const { workspace } = useWorkspace();

    // get the model from the layout
    const model = workspace.selectedLayout?.model;

    if (!model) {
        return null;
    }

    return (
        <Layout
            ref={layoutRef}
            model={model}
            factory={(node) => {
                return factory(node, layoutRef.current);
            }}
            onModelChange={() => {
                workspace.saveToCache();
            }}
        />
    );
});
