import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { Button, CircularProgress } from '@semoss/ui';

export interface ButtonBlockDef extends BlockDef<'button'> {
    widget: 'button';
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        queries?: string;
    };
    listeners: {
        onClick: true;
    };
}

export const ButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);

    return (
        <Button
            sx={{
                ...data.style,
            }}
            onClick={() => {
                listeners.onClick();
            }}
            loading={data.loading}
            {...attrs}
        >
            {data.label}
        </Button>
    );
});
