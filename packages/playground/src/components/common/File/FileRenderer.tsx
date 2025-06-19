import { lazy, Suspense } from 'react';
import { styled, Backdrop, CircularProgress } from '@mui/material';

const SandpackProvider = lazy(async () => ({
    default: (await import('@codesandbox/sandpack-react')).SandpackProvider,
}));

const SandpackPreview = lazy(async () => ({
    default: (await import('@codesandbox/sandpack-react')).SandpackPreview,
}));

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    background: theme.palette.background.paper,
    overflow: 'hidden',
}));

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    position: 'absolute',
    zIndex: theme.zIndex.drawer + 1,
    color: theme.palette.primary.contrastText,
}));

interface FileRendererProps {
    /** Name of the file */
    name: string;

    /**  Value of the file */
    value: string;
}

export const FileRenderer: React.FC<FileRendererProps> = (props) => {
    const { name = '', value = '' } = props;

    return (
        <StyledContainer>
            <Suspense
                fallback={
                    <StyledBackdrop open={true}>
                        <CircularProgress color="inherit" />
                    </StyledBackdrop>
                }
            >
                <SandpackProvider
                    files={{
                        '/index.html': value,
                    }}
                    theme="auto"
                    template="static"
                    style={{ flex: 1, height: '100%', width: '100%' }}
                >
                    <SandpackPreview
                        style={{ height: '100%', width: '100%' }}
                        showRefreshButton={false}
                        showOpenInCodeSandbox={false}
                    />
                </SandpackProvider>
            </Suspense>
        </StyledContainer>
    );
};
