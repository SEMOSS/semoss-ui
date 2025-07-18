import React, { useMemo } from 'react';
import {
    Button,
    Table,
    styled,
    Typography,
    Search,
    CircularProgress,
} from '@semoss/ui';
import { useEngine, useFileManager } from '@/hooks';
import { FileExplorer } from '@/components/common/File/FileExplorer';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledTableContainer = styled('div')({
    borderRadius: '12px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    backgroundColor: 'white',
    padding: '16px',
    width: '100%',
});

const StyledTopDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
}));

export const EngineFilePage = () => {
    const { id } = useEngine();
    const { searchFilter, setSearchFilter, isLoading, error } = useFileManager({
        engineId: id,
        mode: 'storage',
        storagePath: '/',
    });

    // no-op drag handler for FileExplorer
    const noopDrag = (_e: React.DragEvent<HTMLDivElement>, _path: string) => {
        // intentionally empty
    };

    if (isLoading) {
        return (
            <StyledContainer>
                <CircularProgress />
                <Typography variant="body2">Loading files...</Typography>
            </StyledContainer>
        );
    }

    if (error) {
        return (
            <StyledContainer>
                <Typography variant="body2" color="error">
                    Error loading files: {String(error)}
                </Typography>
            </StyledContainer>
        );
    }

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>File Explorer</Typography>
                <Search
                    placeholder="Search files..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    size="small"
                />
            </StyledTopDiv>
            <StyledTableContainer>
                <FileExplorer
                    type="storage-catalog"
                    space="/"
                    onDragStart={noopDrag}
                />
            </StyledTableContainer>
        </StyledContainer>
    );
};
