import React, {
    useMemo,
    useEffect,
    useState,
    SyntheticEvent,
    useRef,
} from 'react';
import { Link } from 'react-router-dom';
import { File, ControlledFile, TextEditorCodeGeneration } from '../';
import { Clear, Language, SaveOutlined } from '@mui/icons-material';
import { Icon as FiletypeIcon } from '@mdi/react';
import { FILE_ICON_MAP } from './text-editor.constants';
import {
    TextArea,
    TextField,
    IconButton,
    Typography,
    Container,
    Checkbox,
    styled,
    Button,
    Modal,
    Tabs,
    useNotification,
} from '@semoss/ui';

import Editor, { OnMount } from '@monaco-editor/react';
// import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { TextEditorPreview } from './TextEditorPreview';
// import { TextEditorNew } from './TextEditorNew';

// console.log({monaco})

import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
// import parserTypescript from 'prettier/parser-typescript';
import parserCss from 'prettier/parser-postcss';

import { runPixel } from '@/api';
import { LoadingScreen } from '@/components/ui';

const StyledKeepButton = styled(Button)(({ theme }) => ({
    margin: '12px',
}));

const StyledLLMWrapper = styled('div')(({ theme }) => ({
    border: '1px solid lightgray',
    borderRadius: '5px',
    marginBottom: '20px',
}));

const StyledLabel = styled('strong')(({ theme }) => ({
    marginRight: '10px',
    fontSize: '16px',
}));

const StyledLLMInput = styled(TextArea)(({ theme }) => ({
    margin: '0 20px',
}));

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    minWidth: '350px',
}));

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
        setControlledFiles,
        controlledFiles,
        setActiveIndex,
        setCounter,
        activeIndex,
        onClose,
        counter,
        onSave,
        files,
    } = props;

    const [LLMStarterModalOpen, setLLMStarterModalOpen] = useState(false);
    const [LLMPreviewContents, setLLMPreviewContents] = useState('');
    const [LLMLoading, setLLMLoading] = useState(false);
    const [showLLMStarter, setShowLLMStarter] = useState(true);
    const [renderStyledLLMWrapper, setRenderStyledLLMWrapper] = useState(true);
    const [LLMPromptInput, setLLMPromptInput] = useState('');

    const notification = useNotification();

    useEffect(() => {
        // const executeAction: monaco.editor.IActionDescriptor = {
        //     id: 'run-code',
        //     label: 'Run Code',
        //     contextMenuOrder: 2,
        //     contextMenuGroupId: '1_modification',
        //     keybindings: [
        //         // KeyMod.CtrlCmd | KeyCode.Enter,
        //         monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        //         monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
        //     ],
        //     // run: runTinker,
        //     run: function (ed) {
        //         alert("i'm running => " + ed.getPosition());
        //     },
        // };
        // monaco.editor.addEditorAction(executeAction);
        // Access the editor instance after it's mounted
        // // const editor = monaco.editor.getModels()[0];
        // // const editor = monaco.editor;
        // // Listen to the contextmenu event
        // console.log({ editor });
        // var editor = monaco.editor.create(document.getElementById("test-container"), {
        //     value: [
        //         "",
        //         "class Example {",
        //         "\tprivate m:number;",
        //         "",
        //         "\tpublic met(): string {",
        //         '\t\treturn "Hello world!";',
        //         "\t}",
        //         "}",
        //     ].join("\n"),
        //     language: "typescript",
        // });
        // editor.addAction({
        //     // An unique identifier of the contributed action.
        //     id: "my-unique-id",
        //     // A label of the action that will be presented to the user.
        //     label: "My Label!!!",
        //     // An optional array of keybindings for the action.
        //     keybindings: [
        //         monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
        //         // chord
        //         monaco.KeyMod.chord(
        //             monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        //             monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM
        //         ),
        //     ],
        //     // A precondition for this action.
        //     precondition: null,
        //     // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
        //     keybindingContext: null,
        //     contextMenuGroupId: "navigation",
        //     contextMenuOrder: 1.5,
        //     // Method that will be executed when the action is triggered.
        //     // @param editor The editor instance is passed in as a convenience
        //     run: function (ed) {
        //         alert("i'm running => " + ed.getPosition());
        //     },
        // });
        // const contextMenuListener = editor.onContextMenu((event) => {
        // Prevent the default context menu
        // event.preventDefault();
        // // Get the position of the right-click
        // const position = { x: event.event.x, y: event.event.y };
        // // Add your custom menu item
        // const customMenuItem = {
        //     label: 'Custom Option',
        //     // Handler for the custom option
        //     click: () => {
        //     // Implement the logic for the custom option
        //     console.log('Custom Option Clicked!');
        //     },
        // };
        // // Show the custom context menu
        // monaco.editor.showContextMenu({ getActions: () => [customMenuItem], getAnchor: () => position });
        // });
        // // Cleanup the listener when the component unmounts
        // return () => {
        // contextMenuListener.dispose();
        // };
        // console.log({ monaco });
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
     * @name prettifyFile
     * Use custom parsers to format file
     * TO-DO: Save custom configs?
     */
    const prettifyFile = () => {
        if (process.env.NODE_ENV == 'development') {
            let formatted = activeFile.content;
            console.log(activeFile);

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

    const createStarterCode = async (inputPrompt) => {
        let promptString = '';

        if (LLMPromptInput.length == 0) {
            promptString += `Generate starter, boilerplate code for a file with the file name '${activeFile.name}'. `;
            promptString += 'Include consise explanatory comments. ';
            promptString +=
                'Try to cover all possible interpretations of the file name. ';
            promptString += 'Write accurate succinct code. ';
            promptString += 'Use descriptive concise variable names. ';
            promptString +=
                'Make clear explanatory notes for dependencies or imports that will have to be installed or defined externally and include instructions on how to do this properly. ';
            promptString +=
                'Do not include the name of the file at the beginning of the file. ';
            promptString += 'Do not make a file that is just notes. ';
            promptString += 'You must include code. ';
            promptString +=
                'Include a reminder / warning about imports and dependencies but include the actual code for imports / dependencies. ';
            promptString +=
                'Use actual imports / dependencies, do not make them up. ';
            promptString +=
                'Do not use imports / dependencies that do not actually exist or that user cannot create themselves. ';
            promptString +=
                'When possible create arrays, lists or values rather than importing them. ';
            promptString +=
                'Make a complete and stand-alone application or file when possible. ';
            promptString +=
                'Close all open tags, functions, quotes and code blocks.';
            promptString += 'Do not end or cut the file off pre-maturely.';
            promptString += 'Finish everything you start.';
            promptString += 'There is not character limit.';
        } else {
            promptString += `Create starter code for a file titled ${activeFile.type} based on the following description. '${LLMPromptInput}'`;
        }

        // Notes from Neel
        // focus on comment based prompting
        // user highlights what they want the prompt to be in their code editor
        // they second click to select 'use AI Code Generator' maybe 'prompt AI Code Generator with selected text'
        // then pass prompt unedited with the filetype as a param ideally - need backend folks to address
        // then paste code uncommented below comment and leave comment
        // maybe highlight all pasted code or indicate where code stops at some point
        // maybe mimic merge conflict interface with an 'accept incoming changes' link above highlighted new text

        let pixel = `LLM(engine = "3def3347-30e1-4028-86a0-83a1e5ed619c", command = "${
            inputPrompt || promptString
        }", paramValues = [ {} ] );`;
        console.log('Prompting LLM', { activeFile, promptString, pixel });

        try {
            const res = await runPixel(pixel);
            const LLMResponse = res.pixelReturn[0].output['response'];
            let trimmedStarterCode = LLMResponse;
            trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

            trimmedStarterCode = trimmedStarterCode.substring(
                trimmedStarterCode.indexOf('\n') + 1,
            );
            //  %%% updates the actual editor contents
            // activeFile.content = trimmedStarterCode;
            setLLMLoading(false);
            setLLMPreviewContents(trimmedStarterCode);

            // return LLMResponse;
            console.log({ res, LLMResponse });
        } catch {
            setLLMLoading(false);
            alert('LLM error');
        }
    };

    const promptLLM = async (inputPrompt) => {
        let pixel = `LLM(engine = "3def3347-30e1-4028-86a0-83a1e5ed619c", command = "${inputPrompt}", paramValues = [ {} ] );`;

        console.log({ inputPrompt, pixel });

        try {
            const res = await runPixel(pixel);
            const LLMResponse = res.pixelReturn[0].output['response'];
            let trimmedStarterCode = LLMResponse;
            trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

            trimmedStarterCode = trimmedStarterCode.substring(
                trimmedStarterCode.indexOf('\n') + 1,
            );

            setLLMLoading(false);

            notification.add({
                color: 'success',
                message: 'Successful response from AI Code Generator',
            });

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
        if (af && af.content.length < 1 && showLLMStarter) {
            // commented out code responsible for previous LLM starter modal
            // open LLM starter modal
            // setLLMStarterModalOpen(true);
            // setLLMPromptInput('');
            // setLLMPromptInput(`Create a file with the name "${af.name}" including explanatory comments.`);
        }
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

    // test return
    // return <TextEditorNew />

    const ModifiedEditor = (props) => {
        return (
            <Editor
                width={props.width}
                height={props.height}
                value={props.value}
                language={props.language}
                onChange={props.onChange}
                editorDidMount={handleEditorDidMount}
                // width={'100%'}
                // height={'100%'}
                // value={activeFile.content}
                // language={fileLanguage}
                // onChange={(newValue, e) => {
                //     editFile(newValue);
                // }}
            ></Editor>
        );
    };

    const TextEditorNew = (props) => {
        const editorRef = useRef(null);

        useEffect(() => {
            if (!editorRef.current) return;

            const editor = monaco.editor.create(editorRef.current, {
                // width: '100%',
                // height: '100%',
                value: activeFile.content,
                language: fileLanguage,
                // onChange: (newValue, e) => {
                //     editFile(newValue);
                // }

                // language: "typescript",
            });

            editorRef.current.editorInstance = editor;

            const actionDisposable = editor.addAction({
                id: 'my-unique-id',
                label: 'Prompt AI Code Generator with selected text.',
                keybindings: [
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
                    monaco.KeyMod.chord(
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
                    ),
                ],
                precondition: null,
                keybindingContext: null,
                contextMenuGroupId: 'navigation',
                contextMenuOrder: 1.5,

                run: (ed) => {
                    const selection = ed.getSelection();
                    const selectedText = ed
                        .getModel()
                        .getValueInRange(selection);
                    alert(`Prompt: "${selectedText}"`);
                },
            });

            return () => {
                actionDisposable.dispose();
                editor.dispose();
            };
        }, []);

        return <div ref={editorRef} style={{ height: 400 }} />;
    };
    // <Editor
    //     ref={editorRef}
    //     width={props.width}
    //     height={props.height}
    //     value={props.value}
    //     language={props.language}
    //     onChange={props.onChange}
    //     // width={'100%'}
    //     // height={'100%'}
    //     // value={activeFile.content}
    //     // language={fileLanguage}
    //     // onChange={(newValue, e) => {
    //     //     editFile(newValue);
    //     // }}
    // ></Editor>

    // working paste in static text
    const executeAction: monaco.editor.IActionDescriptor = {
        id: 'run-code',
        label: 'Run Code',
        contextMenuOrder: 2,
        contextMenuGroupId: '1_modification',
        keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
            monaco.KeyMod.chord(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
            ),
        ],
        run: function (editor) {
            const selection = editor.getSelection();
            const selectedText = editor.getModel().getValueInRange(selection);

            if (selectedText.trim() !== '') {
                const insertPosition = {
                    lineNumber: selection.endLineNumber + 1,
                    column: 1, // insert at the beginning of the line
                };

                editor.executeEdits('custom-action', [
                    {
                        range: new monaco.Range(
                            insertPosition.lineNumber,
                            insertPosition.column,
                            insertPosition.lineNumber,
                            insertPosition.column,
                        ),
                        text: '\n\n(insert LLM response here)\n\n', // Add a newline before and after the pasted text
                        forceMoveMarkers: true,
                    },
                ]);

                // Move the cursor to the end of the pasted text
                editor.setSelection(
                    new monaco.Range(
                        insertPosition.lineNumber + 1,
                        1,
                        insertPosition.lineNumber + 1,
                        1,
                    ),
                );
            }
        },
    };

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const _executeAction: monaco.editor.IActionDescriptor = {
        id: 'run-code',
        label: 'Prompt AI Code Generator with selected text',
        contextMenuOrder: 2,
        contextMenuGroupId: '1_modification',
        keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
            monaco.KeyMod.chord(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
            ),
        ],
        run: async function (editor) {
            const selection = editor.getSelection();
            const selectedText = editor.getModel().getValueInRange(selection);

            setLLMLoading(true);
            const LLMReturnText = await promptLLM(selectedText);
            console.log({ selectedText, LLMReturnText });
            setLLMLoading(false);

            if (selectedText.trim() !== '') {
                const insertPosition = {
                    lineNumber: selection.endLineNumber + 1,
                    column: 1, // insert at the beginning of the line
                };

                editor.executeEdits('custom-action', [
                    {
                        range: new monaco.Range(
                            insertPosition.lineNumber,
                            insertPosition.column,
                            insertPosition.lineNumber,
                            insertPosition.column,
                        ),
                        text: `\n\n${LLMReturnText}\n\n`, // Add a newline before and after the pasted text
                        forceMoveMarkers: true,
                    },
                ]);

                // Move the cursor to the end of the pasted text
                editor.setSelection(
                    new monaco.Range(
                        insertPosition.lineNumber + 1,
                        1,
                        insertPosition.lineNumber + 1,
                        1,
                    ),
                );
            }
        },
    };

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
        alert('mounted?');
        editorRef.current = editor;

        // Register custom action
        monacoInstance.editor.addEditorAction(executeAction);
    };

    const editorOnMountHandler: OnMount = (editor, monacoInstance) => {
        console.log({ editor, monacoInstance });
        editorRef.current = editor;

        // Register custom action
        monacoInstance.editor.addEditorAction(executeAction);
    };

    if (LLMLoading) {
        return <LoadingScreen.Trigger description="Generating code..." />;
    }

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

                    {renderStyledLLMWrapper && (
                        <StyledLLMWrapper>
                            <div
                                style={{
                                    backgroundColor: '#D9D9D914',
                                    padding: '12px 16px 12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <StyledLabel>Generate</StyledLabel>

                                <TextField
                                    size="small"
                                    style={{ flexGrow: 1 }}
                                    placeholder="Enter prompt to generate the code"
                                    value={LLMPromptInput}
                                    onChange={(e) => {
                                        setLLMPromptInput(e.target.value);
                                    }}
                                    onKeyUp={(e) => {
                                        if (e.key == 'Enter') {
                                            setLLMLoading(true);
                                            createStarterCode();
                                        }
                                    }}
                                />

                                {/*  */}
                                <StyledCloseTab
                                    size={'small'}
                                    onClick={async (e) => {
                                        // alert('hello!');
                                        setRenderStyledLLMWrapper(false);
                                    }}
                                >
                                    <StyledClear />
                                </StyledCloseTab>
                            </div>

                            {LLMPreviewContents && (
                                <>
                                    <TextEditorPreview
                                        language={fileLanguage}
                                        contents={LLMPreviewContents}
                                    />
                                    <StyledKeepButton
                                        variant={'contained'}
                                        color={'primary'}
                                        onClick={() => {
                                            activeFile.content =
                                                LLMPreviewContents;
                                            setLLMPreviewContents('');
                                        }}
                                    >
                                        Keep
                                    </StyledKeepButton>

                                    <StyledKeepButton
                                        variant={'outlined'}
                                        color={'info'}
                                        onClick={() => {
                                            // activeFile.content = LLMPreviewContents;
                                            setLLMPreviewContents('');
                                        }}
                                    >
                                        Cancel
                                    </StyledKeepButton>
                                </>
                            )}
                        </StyledLLMWrapper>
                    )}

                    {/* <ModifiedEditor /> */}

                    {/* <ModifiedEditor 
                            width={'100%'}
                            height={'100%'}
                            value={activeFile.content}
                            language={fileLanguage}
                            onChange={(newValue, e) => {
                                editFile(newValue);
                            }}
                        />                     */}

                    {/* this one is working for getting the action added but having update and saving issues */}
                    {/* <TextEditorNew
                        // width={'100%'}
                        // height={'100%'}
                        // activeFile={activeFile}
                        // fileLanguage={fileLanguage}
                        onChange={(newValue) => {
                            editFile(newValue);
                        }}
                        code={activeFile.content}
                        language={fileLanguage}
                        // editFile={editFile}
                    /> */}

                    {/* old working editor but no second click functionality */}
                    <Editor
                        width={'100%'}
                        height={'100%'}
                        value={activeFile.content}
                        language={fileLanguage}
                        onChange={(newValue, e) => {
                            editFile(newValue);
                        }}
                        onMount={editorOnMountHandler}
                    ></Editor>

                    <Modal open={LLMStarterModalOpen}>
                        <Modal.Title>Generate Starter Code?</Modal.Title>
                        <StyledModalContent>
                            Would you like to populate this file it with starter
                            code?
                        </StyledModalContent>
                        <StyledLLMInput
                            size={'medium'}
                            label="Starter Prompt"
                            value={LLMPromptInput}
                            onChange={(e) => {
                                setLLMPromptInput(e.target.value);
                            }}
                            helperText={
                                "Describe the file you'd to like generated."
                            }
                        />
                        <Modal.Actions>
                            <Checkbox
                                label="Do not show again"
                                checked={!showLLMStarter}
                                onChange={() =>
                                    setShowLLMStarter(!showLLMStarter)
                                }
                            />
                            <Button
                                variant={'contained'}
                                color={'primary'}
                                onClick={() => {
                                    setLLMStarterModalOpen(false);
                                    setLLMLoading(true);
                                    createStarterCode();
                                }}
                            >
                                Generate
                            </Button>
                            <Button
                                color={'info'}
                                variant={'outlined'}
                                onClick={() => {
                                    setLLMStarterModalOpen(false);
                                }}
                            >
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal>
                </StyledContainer>
            );
        } else {
            return <StyledContainer>No active file</StyledContainer>;
        }
    }
};

// For Formatting Python Code
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
