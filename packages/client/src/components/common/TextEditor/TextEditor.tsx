import React, {
    useMemo,
    useEffect,
    useRef,
    useState,
    SyntheticEvent,
} from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Typography, Tabs, styled, keyframes } from '@semoss/ui';
import { File, ControlledFile } from '../';

// Weird thing with Monaco Editor and does not get loaded in correctly from install
// loader.config({
//     paths: {
//         vs: '/monaco-editor/min/vs',
//     },
// });

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
}));

const StyledEmptyFiles = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(5),
}));

const StyledFileTabs = styled('div')(({ theme }) => ({
    display: 'flex',
}));

const StyledActiveFilePath = styled('div')(({ theme }) => ({
    display: 'flex',
    // border: 'solid green',
    padding: theme.spacing(1),
}));

// Define keyframes for the text color transition
const colorTransition = keyframes`
  0% {
    color: #1e1e1e;
  }
  100% {
    color: #F3F3F3;
  }
`;

const StyledTypography = styled(Typography)(({ theme }) => ({
    animation: `${colorTransition} 4s infinite alternate`,
    background: 'transparent',
}));

interface TextEditorProps {
    /**
     * All Files
     */
    files: File[];
    /**
     * Index of Active File
     */
    activeIndex: number;
    /**
     * Sets the Active Index in parent component
     */
    setActiveIndex: (index: number) => void;
    /**
     * Saves the Asset
     */
    onSave: (asset: ControlledFile) => Promise<boolean>;
}

export const TextEditor = (props: TextEditorProps) => {
    const { files, activeIndex, setActiveIndex, onSave } = props;

    // Refresh Controlled Values
    const [counter, setCounter] = useState(0);
    const [controlledFiles, setControlledFiles] = useState<ControlledFile[]>(
        [],
    );

    /**
     * Listen for Keyboard Shortcuts, save and --> etc down the road
     */
    useEffect(() => {
        const handleKeyPress = async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault(); // Prevent the default browser save dialog
                console.log('Ctrl + S pressed');

                // 1. Save Asset with reactor
                // 2. Save the controlled files new original to content
                // 3. Trigger Memoized Val: Set New Counter to refresh active file based on new controlled files

                const saveSuccessful: boolean = await onSave(
                    controlledFiles[activeIndex],
                );

                if (saveSuccessful) {
                    const updatedControlledFiles = controlledFiles;
                    updatedControlledFiles[activeIndex] = {
                        ...updatedControlledFiles[activeIndex],
                        original: updatedControlledFiles[activeIndex].content,
                    };
                    setControlledFiles(updatedControlledFiles);

                    let newCounter = counter;
                    setCounter((newCounter += 1));
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            // Cleanup: Remove the event listener when the component unmounts
            window.removeEventListener('keydown', handleKeyPress);
        };
    });

    /**
     * Adds new files to Controlled structure
     */
    useEffect(() => {
        if (controlledFiles.length === files.length) return;

        const newControlledFiles = controlledFiles;
        newControlledFiles.push({
            ...files[files.length - 1],
            content: files[files.length - 1].original,
        });

        setControlledFiles(newControlledFiles);
    }, [files.length]);

    /**
     * Handles change with editor
     * @param newContent
     */
    const editFile = (newContent: string) => {
        // Update Controlled Value
        const edittedFile = {
            ...controlledFiles[activeIndex],
            content: newContent,
        };

        const newFiles = controlledFiles;
        newFiles[activeIndex] = edittedFile;

        setControlledFiles(newFiles);

        // Set New Counter to refresh active file based on new controlled files
        let newCounter = counter;
        setCounter((newCounter += 1));
    };

    /** ------------------
     * Memoized Values
     *  ------------------
     */

    /**
     * @returns the Active File for display
     */
    const activeFile = useMemo<ControlledFile | null>(() => {
        const af = controlledFiles[activeIndex];
        if (af) return af;
        return null;
    }, [activeIndex, controlledFiles.length, counter]);

    /**
     * @returns language to interpet in editor based on the Active File
     */
    const fileLanguage = useMemo<string>(() => {
        let interpretedLanguage = '';
        if (files.length) {
            const selectedFileType = files[activeIndex].type;

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
        return interpretedLanguage;
    }, [activeIndex, files.length, counter]);

    if (!files.length) {
        return (
            <StyledContainer>
                <StyledEmptyFiles>
                    <StyledTypography variant="h6">
                        Welcome to Editor Mode
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        The File explorer to your left, has all files that make
                        up your application. Feel free to edit them directly to
                        make real-time changes to your application.
                    </StyledTypography>
                </StyledEmptyFiles>
            </StyledContainer>
        );
    } else {
        if (activeFile) {
            // const tabRefs = files.map(() => useRef());
            return (
                <StyledContainer>
                    <>
                        <StyledFileTabs>
                            <Tabs
                                value={activeIndex}
                                onChange={(
                                    event: SyntheticEvent,
                                    newValue: number,
                                ) => {
                                    // tabRefs[newValue].current.scrollIntoView({
                                    //     behavior: 'smooth',
                                    //     block: 'center',
                                    // });

                                    setActiveIndex(newValue);
                                }}
                            >
                                {controlledFiles.map((f, i) => {
                                    return (
                                        <Tabs.Item
                                            key={i}
                                            // ref={tabRefs[i]}
                                            label={
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        // border: 'solid red',
                                                    }}
                                                >
                                                    <div>{f.name}</div>
                                                    {f.content !==
                                                    f.original ? (
                                                        <span>*</span>
                                                    ) : null}
                                                </div>
                                            }
                                        ></Tabs.Item>
                                    );
                                })}
                            </Tabs>
                        </StyledFileTabs>
                        <StyledActiveFilePath>
                            <Typography variant={'body1'}>
                                {activeFile.id}
                            </Typography>
                        </StyledActiveFilePath>
                        <Editor
                            // theme={'vs-dark'}
                            width={'100%'}
                            height={'100%'}
                            value={activeFile.content}
                            language={fileLanguage}
                            onChange={(newValue, e) => {
                                // Set new value of file in state, keep old contents
                                editFile(newValue);

                                // onSave for App Renderer??
                                // onChange(newValue);
                            }}
                        ></Editor>
                    </>
                </StyledContainer>
            );
        } else {
            return <StyledContainer>No active file</StyledContainer>;
        }
    }
};
