import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { CircularProgress, Button, styled } from '@mui/material';

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ loading }) => ({
    '& .MuiButton-endIcon svg': {
        visibility: loading === true ? 'hidden' : 'visible',
    },
    '& .MuiButton-startIcon svg': {
        visibility: loading === true ? 'hidden' : 'visible',
    },
}));

const StyledLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ loading }) => ({
    visibility: loading ? 'hidden' : 'visible',
}));

const StyledCircularProgress = styled(CircularProgress)({
    zIndex: 10,
    position: 'absolute',
});

export interface ButtonBlockDef extends BlockDef<'button'> {
    widget: 'button';
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        disabled?: boolean;
        variant: 'contained' | 'outlined' | 'text';
        color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    };
    listeners: {
        onClick: true;
    };
}

export const ButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);

    return (
        <StyledButton
            size="medium"
            color={data.color}
            variant={data.variant}
            loading={data?.loading}
            disabled={data?.disabled || data?.loading}
            sx={{
                ...data.style,
            }}
            onClick={() => {
                listeners.onClick();
            }}
            {...attrs}
        >
            <StyledLabel loading={data?.loading}>{data.label}</StyledLabel>
            {data.loading ? (
                <StyledCircularProgress color="inherit" size="2em" />
            ) : (
                <></>
            )}
        </StyledButton>
    );
});
