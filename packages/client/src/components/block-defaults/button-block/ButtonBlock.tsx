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

    const clickEvent = () => {
        // disable if in edit mode and not selected
        if (workspace.isEditMode && designer?.selected !== id) {
            return () => {};
        }
        return () => {
            listeners.onClick();
        };
    };

    return (
        <button
            style={{
                cursor: 'pointer',
                ...data.style,
            }}
            onClick={clickEvent()}
            {...attrs}
        >
            {data.label}
        </button>
    );
});
