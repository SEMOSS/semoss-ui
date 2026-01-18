import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Card,
    styled,
    IconButton
} from '@semoss/ui';
import { useQueryResults } from '@/hooks/useDatabaseQueryResults';
import { QueryResult } from '@/hooks/useDatabaseQueryExecution';
import { KeyboardArrowDown } from '@mui/icons-material';

const StyledCard = styled(Card)<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
    borderRadius: '16px',
    background: theme.palette.background.paper,
    boxshadow: `0px 1px 2px 0px #00000014`,
    height: isExpanded ? '100%' : '300px',
    minHeight: isExpanded ? '100%' : '300px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid #C4C4C4`,
    flex: isExpanded ? 1 : 'none',
}));

// Header section
const StyledCardHeader = styled('div')(({ theme }) => ({
    backgroundColor: '#EBF4FE', 
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
}));

// Results content area 
const StyledResultsContent = styled('div')<{ isExpanded: boolean }>(({ isExpanded }) => ({
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column'
}));

const StyledHeaderTypography = styled(Typography)(() => ({
    fontSize: '0.875rem',
    fontWeight: 600,
}));

// Styled expand button
const StyledExpandButton = styled(IconButton)(({ theme }) => ({
    width: 28,
    height: 28,
    border: '1px solid',
    borderColor: theme.palette.grey[400],
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
        backgroundColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[600],
    }
}));

// Styled loading container
const StyledLoadingContainer = styled(Box)(() => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: 'secondary'
}));

// Footer section
const StyledFooter = styled('div')<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
    display: isExpanded ? 'flex' : 'none',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    borderTop: `1px solid ${theme.palette.divider}`,
}));

interface QueryResultsPanelProps {
    previewData: QueryResult | null;
    previewLoading: boolean;
    clearResults: () => void;
    //previewLimit: number;
    onExpandChange?: (expanded: boolean) => void; 
}

export const QueryResultsPanel: React.FC<QueryResultsPanelProps> = ({
    previewData,
    previewLoading,
    onExpandChange,
}) => {
    const previewLimit = 50;
    const renderResults = useQueryResults();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleExpandToggle = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        
        if (onExpandChange) {
            onExpandChange(newExpandedState);
        }
    };

    useEffect(() => {
        if (onExpandChange) {
            onExpandChange(isExpanded);
        }
    }, [isExpanded, onExpandChange]);

    // Helper to get result stats for footer
    const getResultStats = () => {
        if (!previewData || previewLoading) return null;
        
        if (previewData.output?.data?.values) {
            const totalRows = previewData.output.data.values.length;
            const showingRows = Math.min(totalRows, previewLimit);
            return `Showing ${showingRows} of ${totalRows} rows`;
        }
        
        return null;
    };

    return (
        <StyledCard isExpanded={isExpanded}>
            <StyledCardHeader>
                <StyledHeaderTypography variant="h6">
                    Query Results
                </StyledHeaderTypography>
                {previewData && (
                    <StyledExpandButton 
                        size="small" 
                        title={isExpanded ? "Collapse Panel" : "Expand Panel"}
                        onClick={handleExpandToggle}
                        style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease-in-out'
                        }}
                    >
                        <KeyboardArrowDown fontSize="small" />
                    </StyledExpandButton>
                )}
            </StyledCardHeader>
           
            <StyledResultsContent isExpanded={isExpanded}>
                {previewLoading ? (
                    <StyledLoadingContainer>
                        <Typography variant="body2">
                            Loading results...
                        </Typography>
                    </StyledLoadingContainer>
                ) : (
                    renderResults(previewData, previewLimit, isExpanded)
                )}
            </StyledResultsContent>

            <StyledFooter isExpanded={isExpanded}>
                <Box>
                    {getResultStats() && (
                        <Typography variant="caption">
                            {getResultStats()}
                        </Typography>
                    )}
                </Box>
                <Box sx={{display:"flex", gap:1}}>
                    <Typography variant="caption">
                        Execution time: {previewData?.timeToRun || 0}ms
                    </Typography>
                </Box>
            </StyledFooter>
        </StyledCard>
    );
};