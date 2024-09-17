import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { NavLink } from 'react-router-dom';

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

export interface RouteBlockDef extends BlockDef<'route'> {
    widget: 'route';
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        disabled?: boolean;
        variant: 'contained' | 'outlined' | 'text';
        color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
        linkTo: string;
    };
    listeners: {
        onClick: true;
    };
}

const StyledContainer = styled('div')(({ theme }) => ({
    padding: '4px',
}));

export const RouteBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<RouteBlockDef>(id);

    return (
        <StyledContainer {...attrs}>
            <NavLink
                to={data.linkTo}
                className={({ isActive, isPending }) =>
                    isPending ? 'pending' : isActive ? 'active' : ''
                }
            >
                {data.label}
            </NavLink>
        </StyledContainer>
    );
});
