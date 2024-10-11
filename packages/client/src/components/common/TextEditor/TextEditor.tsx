import {
    useMemo,
    useEffect,
    useState,
    SyntheticEvent,
    useRef,
    Suspense,
    lazy,
} from 'react';

import { File, ControlledFile, TextEditorCodeGeneration } from '../';
import { Clear, SaveOutlined } from '@mui/icons-material';
import { FILE_ICON_MAP } from './text-editor.constants';
import { Icon as FiletypeIcon } from '@mdi/react';
import { Link } from 'react-router-dom';

import {
    useNotification,
    IconButton,
    Typography,
    Container,
    styled,
    Tabs,
} from '@semoss/ui';

import parserBabel from 'prettier/parser-babel';
import parserCss from 'prettier/parser-postcss';
import parserHtml from 'prettier/parser-html';
import prettier from 'prettier';

import { LoadingScreen } from '@/components/ui';
import { useLLM } from '@/hooks';
import { runPixel } from '@/api';

// Reduce Initial Bundle
const Editor = lazy(() => import('@monaco-editor/react'));

const StyledSVG = styled('svg')(({ theme }) => ({
    viewBox: '0 0 16 16',
    fill: '#0000008A',
    height: '1em',
    width: '1em',
}));

const StyledHeaderContainer = styled(Container)(({ theme }) => ({
    gap: theme.spacing(2),
    flexDirection: 'column',
    display: 'flex',
}));

const StyledFiletypeIcon = styled(FiletypeIcon)(({ theme }) => ({
    marginRight: '8px',
    color: 'rgba(0, 0, 0, 0.6)',
    height: '24px',
    width: '24px',
}));

const StyledEmptyFiles = styled('div')(({ theme }) => ({
    padding: theme.spacing(5),
    justifyContent: 'space-around',
    alignItems: 'normal',
    textAlign: 'left',
    flexDirection: 'column',
    display: 'flex',
    height: '100%',
    width: '100%',
}));

const StyledPrettierIconButton = styled(IconButton)(({ theme }) => ({
    fontSize: 'inherit',
    paddingRight: '0px',
    marginRight: '0px',
    height: '50px',
    width: '30px',
}));

const StyledSaveIconButton = styled(IconButton)(({ theme }) => ({
    marginRight: '20px',
    fontSize: 'inherit',
    color: '#0000008A',
    height: '50px',
    width: '30px',
}));

const StyledActiveFilePath = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    alignItems: 'center',
    display: 'flex',
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
    gap: theme.spacing(0.5),
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
}));

const StyledTabLabel = styled('div')(({ theme }) => ({
    gap: theme.spacing(1),
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
}));

const StyledNonGrayPath = styled(Typography)(({ theme }) => ({
    display: 'inline-block',
    marginRight: '5px',
    paddingLeft: '0px',
    marginLeft: '0px',
}));

const StyledGrayFileName = styled(Typography)(({ theme }) => ({
    display: 'inline-block',
    paddingLeft: '0px',
    marginLeft: '0px',
    opacity: 0.6,
}));

const StyledFileTabs = styled('div')(({ theme }) => ({
    gap: theme.spacing(1),
    justifyContent: 'space-between',
    display: 'flex',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
}));

const StyledClear = styled(Clear)(({ theme }) => ({
    height: theme.spacing(2),
    width: theme.spacing(2),
}));

const StyledActiveFilePathContainer = styled('div')(({ theme }) => ({
    paddingLeft: '0px',
    marginLeft: '0px',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
}));

const TextEditorCodeGenerationWrapper = styled('div')(({ theme }) => ({
    width: '180px',
}));

const StyledSaveChangesIndicator = styled('div')(({ theme }) => ({
    color: theme.palette.primary.main,
}));

const StyledCloseTab = styled(IconButton)(({ theme }) => ({
    fontSize: '16px',
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

    /**
     * NEED TO GET RID OF THIS
     */
    counter: number;
    setCounter: (index: number) => void;
}

export const TextEditor = (props: TextEditorProps) => {
    const {
        controlledFiles,
        activeIndex,
        counter,
        files,
        setActiveIndex,
        setCounter,
        setControlledFiles,
        onClose,
        onSave,
    } = props;

    const notification = useNotification();
    const { modelId } = useLLM();

    const [monaco, setMonaco] = useState(null);
    const [LLMLoading, setLLMLoading] = useState(false);
    const [LLMActionAdded, setLLMActionAdded] = useState(false);
    // tracks filetype to address bug when prompting LLM - re-address if/when filetype added to LLM pixel
    const fileTypeRef = useRef('');
    const modelIdRef = useRef('');
    const wordWrapRef = useRef(false);

    useEffect(() => {
        import('monaco-editor').then((mon) => {
            setMonaco(mon);
        });
    }, []);
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
        if (controlledFiles.length === files.length) return;

        const newControlledFiles = controlledFiles;
        newControlledFiles.push({
            ...files[files.length - 1],
            content: files[files.length - 1].original,
        });

        setControlledFiles(newControlledFiles);
    }, [files.length, activeIndex, controlledFiles.length]);

    useEffect(() => {
        fileTypeRef.current = files[activeIndex]?.type;
    }, [activeIndex]);

    // Effect to re-initialize 'id' ref change
    useEffect(() => {
        modelIdRef.current = modelId;
    }, [modelId]);

    /**
     * @name prettifyFile
     * Use custom parsers to format file
     * TODO: Save custom configs?
     */
    const prettifyFile = () => {
        if (process.env.NODE_ENV == 'development') {
            let formatted = activeFile.content;

            if (activeFile.type === 'py') {
                (async () => {
                    try {
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

                // parsers for other languages are needed
                if (activeFile.type === 'html') {
                    prettierConfig['parser'] = 'html';
                    prettierConfig['plugins'] = [parserHtml];
                } else if (
                    activeFile.type === 'js' ||
                    activeFile.type === 'jsx' ||
                    activeFile.type === 'ts' ||
                    activeFile.type === 'tsx'
                ) {
                    prettierConfig['parser'] = 'babel';
                    prettierConfig['plugins'] = [parserBabel];
                } else if (
                    activeFile.type === 'css' ||
                    activeFile.type === 'scss'
                ) {
                    prettierConfig['parser'] = 'css';
                    prettierConfig['plugins'] = [parserCss];
                }

                // If we have a configuration for the selected language
                if (Object.keys(prettierConfig).length) {
                    formatted = prettier.format(
                        activeFile.content,
                        prettierConfig,
                    );
                }
            }
            editFile(formatted);
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
        fileTypeRef.current = files[activeIndex].type;

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

    /**
     * Runs LLM pixel and manages LLM loading
     * @param string
     * @returns LLM response string
     */
    const promptLLM = async (inputPrompt) => {
        setLLMLoading(true);

        // ideally add filetype to LLM pixel so it does not have to be in prompt string
        // some formatting issues in return pixel including triple quotes and infrequent cutoffs in response string
        const pixel = `LLM(engine = "${modelIdRef.current}", command = "${inputPrompt}", paramValues = [ {} ] );`;

        try {
            const res = await runPixel(pixel);
            setLLMLoading(false);

            const LLMResponse = res.pixelReturn[0].output['response'];
            let trimmedStarterCode = LLMResponse;
            trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

            trimmedStarterCode = trimmedStarterCode.substring(
                trimmedStarterCode.indexOf('\n') + 1,
            );

            return trimmedStarterCode;
        } catch {
            setLLMLoading(false);
            notification.add({
                color: 'error',
                message: 'Failed response from AI Code Generator',
            });
            return '';
        }
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

    /**
     * Handler that adds new LLM dropdown actions to editor when the editor mounts
     * @param monacoInstance
     */
    const editorOnMountHandler = (_editor, monacoInstance) => {
        const toggleWordWrapAction = {
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 2,
            id: 'toggle-word-wrap',
            label: 'Toggle Word Wrap',
            keybindings: [
                monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyZ,
            ],
            run: async (editor) => {
                wordWrapRef.current = !wordWrapRef.current;
                editor.updateOptions({
                    wordWrap: wordWrapRef.current ? 'on' : 'off',
                });
            },
        };

        const executeAction = {
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 1,
            id: 'prompt-LLM',
            label: 'Generate Code',
            keybindings: [
                monacoInstance.KeyMod.CtrlCmd |
                    monacoInstance.KeyMod.Shift |
                    monacoInstance.KeyCode.KeyG,
            ],

            run: async (editor) => {
                const selection = editor.getSelection();
                const selectedText = editor
                    .getModel()
                    .getValueInRange(selection);

                const LLMReturnText = await promptLLM(
                    `Create code for a .${fileTypeRef.current} file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
                );

                editor.executeEdits('custom-action', [
                    {
                        range: new monaco.Range(
                            selection.endLineNumber + 2,
                            1,
                            selection.endLineNumber + 2,
                            1,
                        ),
                        text: `\n\n${LLMReturnText}\n`,
                        forceMoveMarkers: true,
                    },
                ]);

                editor.setSelection(
                    new monaco.Range(
                        selection.endLineNumber + 3,
                        1,
                        selection.endLineNumber +
                            2 +
                            LLMReturnText.split('\n').length,
                        1,
                    ),
                );
            },
        };

        // prevents redundant additions of new dropdown action
        if (LLMActionAdded == false && process.env.NODE_ENV == 'development') {
            setLLMActionAdded(true);
            _editor.addAction(executeAction);
            _editor.addAction(toggleWordWrapAction);
        }
    };

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
                    {LLMLoading && (
                        <LoadingScreen.Trigger description="Generating..." />
                    )}
                    <Suspense fallback={<>...</>}>
                        <Editor
                            key={modelIdRef.current}
                            width={'100%'}
                            height={'100%'}
                            value={activeFile.content}
                            language={fileLanguage}
                            onChange={(newValue, e) => {
                                editFile(newValue);
                            }}
                            onMount={editorOnMountHandler}
                        ></Editor>
                    </Suspense>
                </StyledContainer>
            );
        } else {
            return <StyledContainer>No active file</StyledContainer>;
        }
    }
};

// TODO: Format Python Code
const runBlack = (code) => {
    return code;
};
