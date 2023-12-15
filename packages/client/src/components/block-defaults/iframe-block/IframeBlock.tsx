import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useDesigner } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface IframeBlockDef extends BlockDef<'iframe'> {
    widget: 'iframe';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
        disabled: boolean;
    };
    slots: never;
}

export const IframeBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<IframeBlockDef>(id);
    const { designer } = useDesigner();

    const pointerEvents = () => {
        // if disabled, always none
        if (data.disabled) {
            return 'none';
        }
        // otherwise disable is not selected
        return designer.selected === id ? 'auto' : 'none';
    };

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
                    pointerEvents: pointerEvents(),
                }}
                src={data.src}
                title={data.title}
            />
        </span>
    );
});
