import React, { useMemo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Skeleton, Typography, styled, keyframes } from '@semoss/ui';

// Define keyframes for the background color transition
const colorTransition = keyframes`
  0% {
    color: #1e1e1e;
  }
  100% {
    color: #F3F3F3;
  }
`;

const bgColorTransition = keyframes`
  0% {
    background-color: #F3F3F3; /* Initial color */
  }
  100% {
    background-color: #1e1e1e; /* Target color for the transition */
  }
`;

// loader.config({
//     paths: {
//         vs: '/monaco-editor/min/vs',
//     },
// });

const StyledNoFilePlaceholder = styled(Skeleton)(({ theme }) => ({
    animation: `${bgColorTransition} 3s infinite alternate`,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    animation: `${colorTransition} 3s infinite alternate`,
    background: 'transparent',
}));

interface TextEditorProps {
    files: any[];

    // files: FileInterface[]
}
export const TextEditor = (props: TextEditorProps) => {
    const { files } = props;

    /**
     * Used to determine what language we would like to read in editor
     */
    const fileLanguage = useMemo(() => {
        let interpretedLanguage = '';
        if (files.length) {
            const selectedFileType = files[0].type;

            if (selectedFileType === 'ts' || selectedFileType === 'tsx') {
                interpretedLanguage = 'typescript';
            } else if (
                selectedFileType === 'js' ||
                selectedFileType === 'jsx'
            ) {
                interpretedLanguage = 'javascript';
            } else if (selectedFileType === 'html') {
                interpretedLanguage = 'html';
            } else if (selectedFileType === 'css') {
                interpretedLanguage = 'css';
            } else if (selectedFileType === 'python') {
                interpretedLanguage = 'python';
            } else if (selectedFileType === 'java') {
                interpretedLanguage = 'java';
            } else if (selectedFileType === 'mdx') {
                interpretedLanguage = 'mdx';
            } else {
                interpretedLanguage = 'markdown';
            }
        }
        debugger;
        return interpretedLanguage;
    }, [files.length]);
    debugger;

    if (files.length) {
        return (
            <Editor
                width={'100%'}
                height={'100%'}
                theme={'vs-dark'}
                // defaultValue={'heye'}
                value={files[0].content}
                language={fileLanguage}
                onChange={(newValue, e) => {
                    // Set new value of file in state, keep old contents
                    // onChange(newValue);
                }}
            ></Editor>
        );
    } else {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                }}
            >
                <StyledNoFilePlaceholder
                    // sx={{ backgroundColor: '#1e1e1e' }}
                    height={'100%'}
                    width={'100%'}
                    variant={'rectangular'}
                ></StyledNoFilePlaceholder>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '40px',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        top: 0,
                        left: 0,
                    }}
                >
                    <StyledTypography variant="h6">
                        Welcome to Editor Mode
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        The File explorer to your left, has all files that make
                        up your application. Feel free to edit them directly to
                        make real-time changes to your applicationapplication
                    </StyledTypography>
                </div>
            </div>
        );
    }
};
