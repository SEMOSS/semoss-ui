import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useWorkspace } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface IframeBlockDef extends BlockDef<'iframe'> {
    widget: 'iframe';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
    };
    slots: never;
}

export const IframeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<IframeBlockDef>(id);
    const { workspace } = useWorkspace();

    return (
        <span
            style={{
                width: '100%',
                height: '400px',
                display: 'block',
                ...data.style,
            }}
            {...attrs}
        >
            <iframe
                style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: workspace.isEditMode ? 'none' : 'auto',
                }}
                src={data.src}
                title={data.title}
            />
        </span>
    );
});
