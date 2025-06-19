import { useMemo, lazy, Suspense } from 'react';
import { styled, Backdrop, CircularProgress } from '@mui/material';

const Editor = lazy(() => import('@monaco-editor/react'));

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

interface FileEditorProps {
    /** Name of the file */
    name: string;

    /**  Value of the file */
    value: string;

    /**
     * Callback triggered when the content in the editor is changed
     * @param value
     */
    onChange: (value: string) => void;
}

export const FileEditor: React.FC<FileEditorProps> = (props) => {
    const { name = '', value = '', onChange = () => null } = props;

    const fileLanguage = useMemo<
        | 'typescript'
        | 'javascript'
        | 'html'
        | 'css'
        | 'scss'
        | 'python'
        | 'java'
        | 'mdx'
        | 'markdown'
        | 'txt'
        | ''
    >(() => {
        const ext = name.split('.').pop();

        if (ext === 'ts' || ext === 'tsx') {
            return 'typescript';
        } else if (ext === 'js' || ext === 'jsx') {
            return 'javascript';
        } else if (ext === 'html') {
            return 'html';
        } else if (ext === 'css') {
            return 'css';
        } else if (ext === 'scss') {
            return 'scss';
        } else if (ext === 'py' || ext === 'python') {
            return 'python';
        } else if (ext === 'java') {
            return 'java';
        } else if (ext === 'mdx') {
            return 'mdx';
        } else if (ext === 'md') {
            return 'markdown';
        } else if (ext === 'txt') {
            return 'txt';
        }

        return '';
    }, [name]);

    return (
        <StyledContainer>
            <Suspense
                fallback={
                    <StyledBackdrop open={true}>
                        <CircularProgress color="inherit" />
                    </StyledBackdrop>
                }
            >
                <Editor
                    width={'100%'}
                    height={'100%'}
                    value={value}
                    language={fileLanguage}
                    options={{
                        readOnly: false,
                        minimap: {
                            enabled: false,
                        },
                    }}
                    onChange={(newValue) => {
                        onChange(newValue);
                    }}
                />
            </Suspense>
        </StyledContainer>
    );
};
