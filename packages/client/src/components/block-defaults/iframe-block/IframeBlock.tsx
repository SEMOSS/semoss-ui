import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
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

export const IframeBlock: BlockComponent = observer(
    ({ id, selectedId, isEditMode }) => {
        const { attrs, data } = useBlock<IframeBlockDef>(id);

        const pointerEvents = useMemo(() => {
            // if disabled, always none
            if (data.disabled) {
                return 'none';
            }
            // otherwise disable if not selected in edit mode
            if (isEditMode) {
                return selectedId === id ? 'auto' : 'none';
            }
            // not in edit mode, always enable pointer events
            return 'auto';
        }, [selectedId, isEditMode]);

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
                        pointerEvents: pointerEvents,
                    }}
                    src={data.src}
                    title={data.title}
                />
            </span>
        );
    },
);
