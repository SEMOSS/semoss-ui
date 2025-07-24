import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Typography } from '@semoss/ui';
import {
    useEngine,
    useDatabaseStructure,
    useQueryExecution,
    useQueryEditor,
} from '@/hooks';
import {
    DatabaseStructureBrowser,
    SQLQueryEditor,
    QueryResultsPanel,
    QueryActions,
} from '@/components/database';

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    padding: 0,
}));

const StyledTop = styled('div')(({ theme }) => ({
    padding: `${theme.spacing(1)} 20px 4px 20px`,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
}));

const StyledContent = styled('div')(() => ({
    flex: 1,
    display: 'flex',
    width: '100%',
    overflow: 'hidden',
    minHeight: 0,
}));

const StyledLeft = styled('div')(({ theme }) => ({
    width: '30%',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    borderRight: `1px solid ${theme.palette.divider}`,
}));

const StyledRight = styled('div')(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    minWidth: 0,
}));

export const EngineQueryDataPage = observer(() => {
    const { active } = useEngine();
    const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

    const handleRefresh = () => {
        setRefreshMessage('Refreshing database structure...');
        refreshDatabaseStructure();
        setTimeout(() => setRefreshMessage(null), 3000);
    };

    const {
        structure,
        searchTerm,
        setSearchTerm,
        searchedStructure,
        expandedTables,
        toggleState,
        toggleTable,
        toggleAllTables,
        isLoading,
        error,
        refreshDatabaseStructure,
    } = useDatabaseStructure(active.id || '');

    const {
        query,
        setQuery,
        previewData,
        previewLoading,
        clearQuery: clearQueryInternal,
        clearResults,
        executeQuery: executeQueryInternal,
        limit,
        setLimit,
    } = useQueryExecution(active.id || '', {
        onSchemaChange: () => {
            setRefreshMessage(
                'Database schema changed. Refreshing structure...',
            );
            refreshDatabaseStructure();
            setTimeout(() => setRefreshMessage(null), 3000);
        },
    });

    const executeQuery = async () => {
        await executeQueryInternal();
        setRefreshMessage('Refreshing database structure after query...');
        refreshDatabaseStructure();
        setTimeout(() => setRefreshMessage(null), 3000);
    };

    const { editorRef, handleEditorMount, setValue } = useQueryEditor({
        onRun: executeQuery,
        tables: structure.tables,
    });

    const clearQuery = () => {
        clearQueryInternal();
        setValue('');
    };

    return (
        <StyledContainer>
            <StyledTop>
                <Typography variant="h5" component="h1">
                    Database Query
                </Typography>
            </StyledTop>

            <StyledContent>
                <StyledLeft>
                    <DatabaseStructureBrowser
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        searchedStructure={searchedStructure}
                        expandedTables={expandedTables}
                        toggleState={toggleState}
                        toggleTable={toggleTable}
                        toggleAllTables={toggleAllTables}
                        isLoading={isLoading}
                        error={error}
                        refreshDatabaseStructure={handleRefresh}
                        refreshMessage={refreshMessage}
                    />
                </StyledLeft>

                <StyledRight>
                    <SQLQueryEditor
                        query={query}
                        setQuery={setQuery}
                        clearQuery={clearQuery}
                        handleEditorMount={handleEditorMount}
                    />
                </StyledRight>
            </StyledContent>

            <QueryResultsPanel
                previewData={previewData}
                previewLoading={previewLoading}
                clearResults={clearResults}
                previewLimit={limit}
            />

            <QueryActions
                clearQuery={clearQuery}
                executeQuery={executeQuery}
                previewLoading={previewLoading}
                query={query}
                limit={limit}
                setLimit={setLimit}
            />
        </StyledContainer>
    );
});
