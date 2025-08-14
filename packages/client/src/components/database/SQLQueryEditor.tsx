import React, { Suspense, lazy } from 'react';
import {
    Button,
    styled,
    Typography,
    Box,
    Card,
    IconButton,
} from '@semoss/ui';
import { Refresh, ContentCopy } from '@mui/icons-material';
import { QueryActions } from './QueryActions';

const Editor = lazy(() => import('@monaco-editor/react'));

// Main card wrapper 
const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: '16px',
    background: theme.palette.background.paper,
    boxshadow: `0px 1px 2px 0px #00000014`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid #C4C4C4`,
}));

// Header section
const StyledCardHeader = styled('div')(({ theme }) => ({
    backgroundColor: '#EBF4FE',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

// Editor container
const StyledEditorContainer = styled('div')(({ theme }) => ({
    flex: 1,
    margin: theme.spacing(2),
    border: `1px solid #22A4FF`,
    minHeight: '200px',
    backgroundColor: '#FAFAFA',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    boxshadow: `0px 5px 22px 0px #0000000F`
}));

const StyledCopyButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    zIndex: 10,
}));

interface SQLQueryEditorProps {
    query: string;
    setQuery: (query: string) => void;
    clearQuery: () => void;
    handleEditorMount: (editor: any, monaco: any) => void;
    // QueryActions props
    executeQuery: () => void;
    previewLoading: boolean;
    // limit: number;
    // setLimit: (limit: number) => void;
}

export const SQLQueryEditor: React.FC<SQLQueryEditorProps> = ({
    query,
    setQuery,
    clearQuery,
    handleEditorMount,
    executeQuery,
    previewLoading,
    // limit,
    // setLimit,
}) => {
    const handleCopyQuery = () => {
        if (query && navigator.clipboard) {
            navigator.clipboard.writeText(query);
        }
    };

    return (
        <StyledCard>
            {/* Header with title and clear button */}
            <StyledCardHeader>
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Enter Query
                </Typography>
                <Button
                    variant="text"
                    size="small"
                    onClick={clearQuery}
                    startIcon={<Refresh fontSize="small" />}
                    sx={{ color: 'primary.main', textTransform: 'none' }}
                >
                    Reset
                </Button>
            </StyledCardHeader>

            {/* Editor container */}
            <StyledEditorContainer>
                {/* Copy button floating in top right */}
                {query && (
                    <StyledCopyButton
                        size="small"
                        onClick={handleCopyQuery}
                        title="Copy query"
                    >
                        <ContentCopy fontSize="small" />
                    </StyledCopyButton>
                )}

                <Suspense fallback={
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2" color="secondary">
                            Loading editor...
                        </Typography>
                    </Box>
                }>
                    <Editor
                        value={query}
                        defaultValue=""
                        language="sql"
                        options={{
                            scrollbar: {
                                alwaysConsumeMouseWheel: false,
                            },
                            readOnly: false,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineHeight: 19,
                            fontSize: 16,
                            overviewRulerBorder: false,
                            lineNumbers: "on",
                            glyphMargin: false,
                            folding: false,
                            lineNumbersMinChars: 2,
                            wordWrap: 'on',
                            tabSize: 4,
                            colorDecorators: true,
                        }}
                        onChange={(value) => setQuery(value || '')}
                        onMount={handleEditorMount}
                    />
                </Suspense>
            </StyledEditorContainer>

            <QueryActions
                clearQuery={clearQuery}
                executeQuery={executeQuery}
                previewLoading={previewLoading}
                query={query}
                // limit={limit}
                // setLimit={setLimit}
            />
        </StyledCard>
    );
};