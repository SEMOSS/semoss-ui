import { CSSProperties, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useDesigner, useWorkspace } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface ButtonBlockDef extends BlockDef<'button'> {
    widget: 'button';
    data: {
        style: CSSProperties;
        label: string;
    };
    listeners: {
        onClick: true;
    };
}

export const ButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);
    const { designer } = useDesigner();
    const { workspace } = useWorkspace();

    const pointerEvents = () => {
        console.log(designer?.selected);
        // disable if not selected in edit mode
        if (workspace.isEditMode) {
            return designer?.selected === id ? 'auto' : 'none';
        }

        return 'auto';
    };

    return (
        <span>
            <button
                style={{
                    pointerEvents: pointerEvents(),
                    ...data.style,
                }}
                onClick={() => {
                    listeners.onClick();
                }}
                {...attrs}
            >
                {data.label}
            </button>
        </span>
    );
});
