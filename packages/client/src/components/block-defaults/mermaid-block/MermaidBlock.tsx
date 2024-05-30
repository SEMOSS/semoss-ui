import { BlockComponent, BlockDef } from '@/stores';
import { observer } from 'mobx-react-lite';

export interface MermaidBlockDef extends BlockDef<'mermaid'> {
    widget: 'mermaid';
    data: {
        text: string;
    };
    slots: never;
}

export const MermaidBlock: BlockComponent = observer(({ id }) => {
    return (
        <div>
            {/* MERMAID BLOCK TODO */}
            {/* RETURN MERMAID DIAGRAM HERE*/}
        </div>
    );
});
