import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { CircularProgress, Button } from '@mui/material';

export interface ButtonBlockDef extends BlockDef<'button'> {
    widget: 'button';
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
    };
    listeners: {
        onClick: true;
    };
}

export const ButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);

    return (
        <Button
            size="large"
            sx={{
                ...data.style,
            }}
            onClick={() => {
                listeners.onClick();
            }}
            {...attrs}
        >
            <span
                style={{
                    visibility: data?.loading ? 'hidden' : 'visible',
                }}
            >
                {data.label}
            </span>
            {data.loading ? (
                <CircularProgress
                    color="inherit"
                    size="2em"
                    sx={{ zIndex: 10, position: 'absolute' }}
                />
            ) : (
                <></>
            )}
        </Button>
    );
});
