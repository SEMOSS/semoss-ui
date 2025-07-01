import React from 'react';
import {
    Button,
    styled,
    Box,
    TextField,
    Typography,
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
    limit: number;
    setLimit: (limit: number) => void;
}

export const QueryActions: React.FC<QueryActionsProps> = ({
    clearQuery,
    executeQuery,
    previewLoading,
    query,
    limit,
    setLimit,
}) => {
    const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setLimit(value);
        }
    };

    return (
        <StyledActions>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Limit:
                </Typography>
                <TextField
                    type="number"
                    size="small"
                    value={limit}
                    onChange={handleLimitChange}
                    inputProps={{ min: 1, style: { width: '80px' } }}
                    variant="outlined"
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    rows
                </Typography>
            </Box>
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
