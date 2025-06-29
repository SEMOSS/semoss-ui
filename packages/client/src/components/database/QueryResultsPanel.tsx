import React from 'react';
import {
    Button,
    Typography,
    Box,
} from '@semoss/ui';
import { useQueryResults } from '@/hooks/useDatabaseQueryResults';
import { QueryResult } from '@/hooks/useDatabaseQueryExecution';

interface QueryResultsPanelProps {
    previewData: QueryResult | null;
    previewLoading: boolean;
    clearResults: () => void;
    previewLimit: number;
}

export const QueryResultsPanel: React.FC<QueryResultsPanelProps> = ({
    previewData,
    previewLoading,
    clearResults,
    previewLimit,
}) => {
    const renderResults = useQueryResults();

    return (
        <Box sx={{
            borderTop: '1px solid',
            borderColor: 'grey.300',
            backgroundColor: 'background.paper',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
        }}>
            <Box sx={{
                padding: 1,
                borderBottom: '1px solid',
                borderColor: 'grey.300',
                backgroundColor: 'grey.100',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
            }}>
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Query Results
                </Typography>
                {previewData && (
                    <Button
                        size="small"
                        onClick={clearResults}
                        sx={{ color: 'secondary', textTransform: 'none' }}
                    >
                        Clear Results
                    </Button>
                )}
            </Box>
           
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {previewLoading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'secondary'
                    }}>
                        <Typography variant="body2">
                            Loading results...
                        </Typography>
                    </Box>
                ) : (
                    renderResults(previewData, previewLimit)
                )}
            </Box>
        </Box>
    );
};
