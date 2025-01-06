import React from 'react';
import { styled, Stack, IconButton } from '@semoss/ui';

const StyledPanel = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    background: theme.palette.background.paper,
    overflow: 'hidden',
}));

const StyledPanelActions = styled(Stack)(({ theme }) => ({
    width: '100%',
    backgroundColor: theme.palette.secondary.light,
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
}));

const StyledPanelContent = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
}));

interface PanelProps {
    /** Children */
    children: React.ReactNode;

    /** Actions to render */
    actions?: React.ReactNode;
}
export const Panel = ({ children, actions = null }: PanelProps) => {
    return (
        <StyledPanel>
            {actions ? (
                <StyledPanelActions
                    direction="row"
                    alignItems={'center'}
                    spacing={0}
                >
                    {actions}
                </StyledPanelActions>
            ) : null}
            <StyledPanelContent>{children}</StyledPanelContent>
        </StyledPanel>
    );
};
