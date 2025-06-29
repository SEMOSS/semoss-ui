import React, { Suspense, lazy } from 'react';
import {
    Button,
    styled,
    Typography,
    Box,
} from '@semoss/ui';
import { Refresh } from '@mui/icons-material';

const Editor = lazy(() => import('@monaco-editor/react'));

const StyledQueryHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing(1)} 20px`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
}));

const StyledEditorContainer = styled('div')(({ theme }) => ({
    flex: 1,
    margin: `0 20px 20px 20px`,
    border: `1px solid ${theme.palette.divider}`,
    minHeight: '200px',
    backgroundColor: '#FAFAFA',
}));

interface SQLQueryEditorProps {
    query: string;
    setQuery: (query: string) => void;
    clearQuery: () => void;
    handleEditorMount: (editor: any, monaco: any) => void;
}

export const SQLQueryEditor: React.FC<SQLQueryEditorProps> = ({
    query,
    setQuery,
    clearQuery,
    handleEditorMount,
}) => {
    return (
        <>
            <StyledQueryHeader>
                <Typography variant="h6" sx={{ fontSize: '0.875rem', fontWeight: 600, flex: 1 }}>
                    Enter SQL Query
                </Typography>
                <Button
                    variant="text"
                    size="small"
                    onClick={clearQuery}
                    startIcon={<Refresh fontSize="small" />}
                    sx={{ color: 'primary.main', textTransform: 'none' }}
                >
                    Clear
                </Button>
            </StyledQueryHeader>

            <StyledEditorContainer>
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
        </>
    );
};
