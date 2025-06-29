import React from 'react';
import {
    Button,
    styled,
    Box,
} from '@semoss/ui';

const StyledActions = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
    '& > :first-of-type': {
        marginLeft: '20px',
    },
    '& > :last-child': {
        marginRight: '20px',
    },
}));

interface QueryActionsProps {
    clearQuery: () => void;
    executeQuery: () => void;
    previewLoading: boolean;
    query: string;
}

export const QueryActions: React.FC<QueryActionsProps> = ({
    clearQuery,
    executeQuery,
    previewLoading,
    query,
}) => {
    return (
        <StyledActions>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant="text"
                    onClick={clearQuery}
                    sx={{ textTransform: 'none' }}
                >
                    Clear
                </Button>
                <Button
                    variant="outlined"
                    onClick={executeQuery}
                    sx={{ textTransform: 'none' }}
                    disabled={previewLoading || !query.trim()}
                >
                    {previewLoading ? 'Running...' : 'Run'}
                </Button>
            </Box>
        </StyledActions>
    );
};
