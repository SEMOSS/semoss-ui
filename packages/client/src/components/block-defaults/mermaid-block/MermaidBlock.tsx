import { BlockComponent, BlockDef } from '@/stores';
import { observer } from 'mobx-react-lite';
import mermaid from 'mermaid';
import { useEffect } from 'react';
import { useBlock } from '@/hooks';

export interface MermaidBlockDef extends BlockDef<'mermaid'> {
    widget: 'mermaid';
    data: {
        text: string;
    };
    slots: never;
}

export const MermaidBlock: BlockComponent = observer(({ id }) => {
    const { data } = useBlock<MermaidBlockDef>(id);

    useEffect(() => {
        document.getElementById(id)?.removeAttribute('data-processed');
        mermaid.contentLoaded();
    }, [id]);

    return (
        <pre className="mermaid" id={id}>
            {data.text}
        </pre>
    );
});
