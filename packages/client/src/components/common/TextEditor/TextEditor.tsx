import { useMemo, useEffect, SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { File, ControlledFile, TextEditorCodeGeneration } from '../';
import { Clear, SaveOutlined } from '@mui/icons-material';
import { Icon as FiletypeIcon } from '@mdi/react';
import { FILE_ICON_MAP } from './text-editor.constants';
import {
    IconButton,
    useNotification,
    Typography,
    Container,
    styled,
    Tabs,
} from '@semoss/ui';

import Editor from '@monaco-editor/react';

import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserTypescript from 'prettier/parser-typescript';
import parserCss from 'prettier/parser-postcss';
// list of available prettier parsers does not include python --> https://prettier.io/docs/en/options#parser
// need to find working python parser, autopep8 may be an option --> https://stackoverflow.com/questions/65410758/problem-formatting-python-when-using-prettier-in-vscode

// Python Code Formatting
import { spawn } from 'child_process';

const TextEditorCodeGenerationWrapper = styled('div')(({ theme }) => ({
    width: '180px',
}));

const StyledSVG = styled('svg')(({ theme }) => ({
    fill: '#0000008A',
    viewBox: '0 0 16 16',
    width: '1em',
    height: '1em',
}));

const StyledHeaderContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledFiletypeIcon = styled(FiletypeIcon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, 0.6)',
    height: '24px',
    width: '24px',
    marginRight: '8px',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
}));

const StyledEmptyFiles = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    alignItems: 'normal',
    textAlign: 'left',
    padding: theme.spacing(5),
    justifyContent: 'space-around',
}));

const StyledPrettierIconButton = styled(IconButton)(({ theme }) => ({
    height: '50px',
    width: '30px',
    fontSize: 'inherit',
    marginRight: '0px',
    paddingRight: '0px',
}));

const StyledSaveIconButton = styled(IconButton)(({ theme }) => ({
    color: '#0000008A',
    height: '50px',
    width: '30px',
    marginRight: '20px',
    fontSize: 'inherit',
}));

const StyledFileTabs = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
}));

const StyledActiveFilePath = styled('div')(({ theme }) => ({
    display: 'flex',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    alignItems: 'center',
}));

const StyledTabsItem = styled(Tabs.Item, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if tab is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    backgroundColor: selected ? theme.palette.background.paper : 'inherit',
}));

const StyledTabLabelContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(0.5),
    alignItems: 'center',
}));

const StyledTabLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    alignItems: 'center',
}));

const StyledSaveChangesIndicator = styled('div')(({ theme }) => ({
    color: theme.palette.primary.main,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
}));

const StyledClear = styled(Clear)(({ theme }) => ({
    width: theme.spacing(2),
    height: theme.spacing(2),
}));

const StyledCloseTab = styled(IconButton)(({ theme }) => ({
    fontSize: '16px',
}));

const StyledActiveFilePathContainer = styled('div')(({ theme }) => ({
    marginLeft: '0px',
    paddingLeft: '0px',
}));

const StyledNonGrayPath = styled(Typography)(({ theme }) => ({
    marginLeft: '0px',
    paddingLeft: '0px',
    marginRight: '5px',
    display: 'inline-block',
}));

const StyledGrayFileName = styled(Typography)(({ theme }) => ({
    display: 'inline-block',
    opacity: 0.6,
    marginLeft: '0px',
    paddingLeft: '0px',
}));

const PrettierPath = () => (
    <path d="M10.33 1.67h-8c-.45-.02-.43-.67 0-.67h8c.44 0 .46.64 0 .67Zm-8 2.66c-.45-.02-.43-.66 0-.66H7c.44 0 .45.64 0 .66H2.33ZM5.67 3c-.46-.02-.44-.66 0-.67h6.66c.44.01.46.65 0 .67H5.67Zm5.33.67c.44 0 .45.64 0 .66H8.33c-.45-.02-.43-.66 0-.66H11Zm1.33.66c-.45-.02-.43-.66 0-.66H13c.44 0 .45.64 0 .66h-.67Zm-10 1.34c-.45-.02-.43-.67 0-.67h1.34c.43 0 .45.64 0 .67H2.33Zm8 0c-.45-.02-.43-.67 0-.67h3.34c.43 0 .45.64 0 .67h-3.34ZM5 5.67C4.55 5.65 4.57 5 5 5h.67c.43 0 .45.64 0 .67H5Zm-2.67 8c-.45-.02-.43-.67 0-.67h1.34c.43 0 .45.64 0 .67H2.33Zm2.67 0c-.45-.02-.43-.67 0-.67h.67c.43 0 .45.64 0 .67H5ZM10.33 7c-.45-.02-.43-.66 0-.67h3.34c.43.01.45.65 0 .67h-3.34Zm-8 0c-.45-.02-.43-.66 0-.67h3.34c.43.01.45.65 0 .67H2.33Zm0 5.33c-.45-.02-.43-.66 0-.66h3.34c.43 0 .45.64 0 .66H2.33Zm0 2.67c-.45-.02-.43-.66 0-.67h3.34c.43.01.45.65 0 .67H2.33Zm0-6.67c-.45-.02-.43-.66 0-.66H3c.44 0 .45.64 0 .66h-.67Zm2 0c-.45-.02-.43-.66 0-.66h2c.44 0 .46.64 0 .66h-2Zm3.34 0c-.46-.02-.44-.66 0-.66H13c.44 0 .45.64 0 .66H7.67Zm2.66 1.34c-.45-.02-.43-.67 0-.67h2c.44 0 .46.64 0 .67h-2Zm-4 0c-.45-.02-.43-.67 0-.67H9c.44 0 .45.64 0 .67H6.33Zm-4 0c-.45-.02-.43-.67 0-.67H5c.44 0 .45.64 0 .67H2.33Zm0 1.33c-.45-.02-.43-.66 0-.67H3c.44.01.45.65 0 .67h-.67Zm2 0c-.45-.02-.43-.66 0-.67h6c.44.01.46.65 0 .67h-6Zm-2-8c-.45-.02-.43-.66 0-.67h2c.44.01.46.65 0 .67h-2Z"></path>
);

interface TextEditorProps {
    /**
     * Params factored out to AppEditor parent component to make closing tabs possible on file deletion
     */
    controlledFiles: ControlledFile[];
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
    /**
     * Closes indexed file tab in files
     */
    onClose?: (index) => void;
    /**
     * Sets new files to be controlled
     */
    setControlledFiles: (controlledFiles: ControlledFile[]) => void;

    counter: number;
    setCounter: (index: number) => void;
}

export const TextEditor = (props: TextEditorProps) => {
    const {
        files,
        activeIndex,
        setControlledFiles,
        controlledFiles,
        setActiveIndex,
        setCounter,
        counter,
        onClose,
        onSave,
    } = props;

    const notification = useNotification();

    /**
     * Listen for Keyboard Shortcuts, save and --> etc down the road
     */
    useEffect(() => {
        const handleKeyPress = async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault(); // Prevent the default browser save dialog
                console.log('Ctrl + S pressed');
                saveFile();
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
        console.log('files', files);
        console.log('contfiles', controlledFiles);
        if (controlledFiles.length === files.length) return;

        const newControlledFiles = controlledFiles;
        newControlledFiles.push({
            ...files[files.length - 1],
            content: files[files.length - 1].original,
        });

        setControlledFiles(newControlledFiles);
    }, [files.length, activeIndex, controlledFiles.length]);

    /**
     * @name parseFiletype
     * Return filetype abbreviation from filename string
     */
    function parseFiletype(filename: string): string | null {
        const match = /\.([^.]+)$/.exec(filename);
        if (match && match[1]) return `.${match[1]}`;
        return null;
    }

    /**
     * @name prettifyFile
     * Use custom parsers to format file
     * TO-DO: Save custom configs?
     */
    const prettifyFile = () => {
        // get filetype or parse out filetype if filetype is just 'file' in the case of python / html / css etc
        const filetype =
            activeFile.type === 'file'
                ? parseFiletype(activeFile.name)
                : activeFile.type;

        // only run the function if in developer mode, if not do nothing
        if (process.env.NODE_ENV == 'development') {
            let formatted = activeFile.content;

            // this is currently not working to parse / format python
            if (filetype === 'py') {
                (async () => {
                    try {
                        // currently this just returns the file content unchanged
                        const formattedPythonCode = await runBlack(
                            activeFile.content,
                        );
                        console.log(
                            'Formatted Python Code:\n',
                            formattedPythonCode,
                        );
                    } catch (error) {
                        console.error(
                            'Error formatting Python code:',
                            error.message,
                        );
                    }
                })();
            } else {
                const prettierConfig = {};

                // running babel as default else statement rather than specifically for these filetypes
                // may change back to this later
                // if (
                //     filetype === 'js' ||
                //     filetype === 'jsx' ||
                //     filetype === 'ts' ||
                //     filetype === 'tsx'
                // ) {
                //     prettierConfig['parser'] = 'babel';
                //     prettierConfig['plugins'] = [parserBabel];
                //     // prettierConfig['semi'] = false;
                //     // prettierConfig['singleQuote'] = true;
                // } else if (filetype === 'html') {
                if (filetype === 'html') {
                    prettierConfig['parser'] = 'html';
                    prettierConfig['plugins'] = [parserHtml];
                } else if (filetype === 'css' || filetype === 'scss') {
                    prettierConfig['parser'] = 'css';
                    prettierConfig['plugins'] = [parserCss];
                } else {
                    prettierConfig['parser'] = 'babel';
                    prettierConfig['plugins'] = [parserBabel];
                }

                // If we have a configuration for the selected language
                if (Object.keys(prettierConfig).length) {
                    formatted = prettier.format(
                        activeFile.content,
                        prettierConfig,
                    );
                }
            }

            if (formatted != activeFile.content) {
                // only apply prettier changes in DOM if changes have been made
                editFile(formatted);

                // optional success notification but not necessary
                // notification.add({
                //     color: 'success',
                //     message: 'Prettier formatting changes complete.',
                // });
            } else {
                // if no chages have been made alert user to avoid feeling of dead button
                notification.add({
                    color: 'error',
                    message:
                        'No formatting issues found in file or filetype may not be covered by Prettier.',
                });
            }
        }
    };

    /**
     * Saves Asset
     *
     */
    const saveFile = async () => {
        // 1?. Format File
        // 2. Save Asset with reactor
        // 3. Save the controlled files new original to content
        // 4. Trigger Memoized Val: Set New Counter to refresh active file based on new controlled files

        // await prettifyFile();

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
    };

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

    const formatFilePath = (activeFileid) => {
        if (activeFileid[activeFileid.length - 1] == '/') {
            activeFileid = activeFileid.slice(0, -1);
        }

        activeFileid = activeFileid.replace('version/assets/', '');
        activeFileid = activeFileid.replace('version/assets', '');

        if (activeFileid[0] == '/') {
            activeFileid = activeFileid.slice(1);
        }

        const splitId = activeFileid.split('/');

        let nonGrayPath = splitId.slice(0, splitId.length - 1).join('/');
        nonGrayPath = nonGrayPath.replaceAll('/', ' / ');

        if (nonGrayPath.length > 0) {
            nonGrayPath = nonGrayPath + ' / ';
        }

        const grayFilename = splitId.slice(-1)[0];

        return (
            <>
                <StyledFiletypeIcon
                    path={
                        FILE_ICON_MAP[activeFileid?.split('.').slice(-1)[0]] ||
                        FILE_ICON_MAP.document
                    }
                    size={1}
                ></StyledFiletypeIcon>
                <StyledActiveFilePathContainer>
                    {nonGrayPath.length > 0 && (
                        <StyledNonGrayPath variant="body2">
                            {nonGrayPath}
                        </StyledNonGrayPath>
                    )}

                    <StyledGrayFileName variant="body2">
                        {grayFilename}
                    </StyledGrayFileName>
                </StyledActiveFilePathContainer>
            </>
        );
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
    }, [activeIndex, files.length, controlledFiles.length, counter]);

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
                    <StyledHeaderContainer>
                        <div>
                            <StyledTypography variant="h5">
                                Welcome to the Code Editor
                            </StyledTypography>
                            <StyledTypography variant="body1">
                                Get started by selecting a file{' '}
                                {process.env.NODE_ENV == 'development' && 'or'}
                            </StyledTypography>
                        </div>
                        {process.env.NODE_ENV == 'development' && (
                            <TextEditorCodeGenerationWrapper>
                                <TextEditorCodeGeneration />
                            </TextEditorCodeGenerationWrapper>
                        )}
                    </StyledHeaderContainer>
                    <Container>
                        <Typography variant="h6">
                            Github Documentation
                        </Typography>
                        <ul>
                            <li>
                                <Link to={'#'}>Code Editor</Link>
                            </li>
                        </ul>
                    </Container>
                </StyledEmptyFiles>
            </StyledContainer>
        );
    } else {
        if (activeFile) {
            return (
                <StyledContainer>
                    <StyledFileTabs>
                        <Tabs
                            value={activeIndex}
                            variant="scrollable"
                            scrollButtons={false}
                            onChange={(
                                event: SyntheticEvent,
                                newValue: number,
                            ) => {
                                setActiveIndex(newValue);
                            }}
                        >
                            {controlledFiles.map((f, i) => {
                                return (
                                    <StyledTabsItem
                                        key={i}
                                        selected={activeIndex === i}
                                        label={
                                            <StyledTabLabelContainer>
                                                <StyledTabLabel>
                                                    <span>{f.name}</span>
                                                    <StyledSaveChangesIndicator>
                                                        {f.content !==
                                                        f.original ? (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="8"
                                                                height="8"
                                                                viewBox="0 0 8 8"
                                                                fill="none"
                                                            >
                                                                <circle
                                                                    cx="4"
                                                                    cy="4"
                                                                    r="4"
                                                                    fill="#0471F0"
                                                                />
                                                            </svg>
                                                        ) : (
                                                            <div>&nbsp;</div>
                                                        )}
                                                    </StyledSaveChangesIndicator>
                                                </StyledTabLabel>
                                                <StyledCloseTab
                                                    size={'small'}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        console.warn(
                                                            ' closing tab',
                                                            controlledFiles,
                                                        );

                                                        const newControlledFiles =
                                                            controlledFiles;
                                                        newControlledFiles.splice(
                                                            i,
                                                            1,
                                                        );

                                                        setControlledFiles(
                                                            newControlledFiles,
                                                        );

                                                        // close this index, set state of files in parent
                                                        await onClose(i);

                                                        // Refresh Active File Memoized value
                                                        setCounter(counter + 1);
                                                    }}
                                                >
                                                    <StyledClear />
                                                </StyledCloseTab>
                                            </StyledTabLabelContainer>
                                        }
                                    ></StyledTabsItem>
                                );
                            })}
                        </Tabs>
                        <div style={{ flexGrow: 1 }}></div>
                        <StyledPrettierIconButton
                            size={'small'}
                            color={'secondary'}
                            title={'Prettify'}
                            onClick={() => {
                                prettifyFile();
                            }}
                        >
                            <StyledSVG>
                                <PrettierPath />
                            </StyledSVG>
                        </StyledPrettierIconButton>
                        <StyledSaveIconButton
                            size={'small'}
                            color={'secondary'}
                            title={'Save'}
                            onClick={() => {
                                saveFile();
                            }}
                        >
                            <SaveOutlined />
                        </StyledSaveIconButton>
                    </StyledFileTabs>
                    <StyledActiveFilePath>
                        {formatFilePath(activeFile.id)}
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

                            // onSave for App Renderer
                            // onChange(newValue);
                        }}
                    ></Editor>
                </StyledContainer>
            );
        } else {
            return <StyledContainer>No active file</StyledContainer>;
        }
    }
};

// Formats Python Code
const runBlack = (code) => {
    // return new Promise((resolve, reject) => {
    //     const blackProcess = spawn('black', ['-', '--quiet', '-']);

    //     let formattedCode = '';
    //     let errorOutput = '';

    //     blackProcess.stdout.on('data', (data) => {
    //         formattedCode += data;
    //     });

    //     blackProcess.stderr.on('data', (data) => {
    //         errorOutput += data;
    //     });

    //     blackProcess.on('close', (code) => {
    //         if (code === 0) {
    //             resolve(formattedCode);
    //         } else {
    //             reject(new Error(`Black formatting failed: ${errorOutput}`));
    //         }
    //     });

    //     blackProcess.stdin.write(code);
    //     blackProcess.stdin.end();
    // });
    return code;
};
