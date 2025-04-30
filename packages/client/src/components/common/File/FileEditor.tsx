import {
    useMemo,
    useEffect,
    useState,
    useRef,
    lazy,
    Suspense,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { OnMount } from '@monaco-editor/react';
import parserBabel from 'prettier/parser-babel';
import parserCss from 'prettier/parser-postcss';
import parserHtml from 'prettier/parser-html';
import prettier from 'prettier';

import { styled, useNotification } from '@semoss/ui';
import { LoadingScreen } from '@/components/ui';
import { runPixelTwo } from '../../../runPixelTwo';

const Editor = lazy(() => import('@monaco-editor/react'));

const IS_PRODUCTION = process.env.NODE_ENV == 'production';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    background: theme.palette.background.paper,
    overflow: 'hidden',
}));

interface FileEditorProps {
    /** Type of file opened */
    type: 'app' | 'insight';

    /** Space where the file is located */
    space: string;

    /** Path to the file file */
    path: string;

    /** insight id */
    insightId?: string | null;

    /**
     * Optional Model Engine to use
     */
    agentModelEngine?: string;

    /**
     *
     * @param isModified
     * @returns
     */
    onChange: (content: string, isModified: boolean) => void;
}

export interface FileEditorRefDef {
    /**
     *
     * @returns Save the file
     */
    saveFile: () => Promise<void>;

    /**
     *
     * @returns Format the file
     */
    formatFile: () => Promise<void>;
}

export const FileEditor = forwardRef<FileEditorRefDef, FileEditorProps>(
    function FileEditor(props, ref) {
        const {
            type = 'app',
            space = '',
            path = '',
            insightId = null,
            agentModelEngine = '',
            onChange = () => null,
        } = props;

        const notification = useNotification();
        const [content, setContent] = useState('');
        const [initialContent, setInitialContent] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [LLMActionAdded, setLLMActionAdded] = useState(false);
        // tracks filetype to address bug when prompting LLM - re-address if/when filetype added to LLM pixel
        const wordWrapRef = useRef(false);

        const isModified = initialContent !== content;

        // update whenever the content changes
        useImperativeHandle(
            ref,
            () => {
                return {
                    saveFile: saveFile,
                    formatFile: formatFile,
                };
            },
            [content],
        );

        /**
         * Set the initial file
         */
        useEffect(() => {
            // load when the type space or path change
            loadFile();
        }, [type, space, path]);

        /**
         * Trigger the on change function
         */
        useEffect(() => {
            onChange(content, isModified);
        }, [content, isModified]);

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
            const ext = path.split('.').pop();

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
        }, [path]);

        /**
         * Load the File
         * @param type - type of the file
         * @param id - ID of the file
         * @param path - path to the file
         */
        const loadFile = async () => {
            try {
                setIsLoading(true);

                let pixel = '';
                if (type === 'app') {
                    pixel = `GetAsset(filePath=["${path}"], space=["${space}"]);`;
                } else if (type === 'insight') {
                    throw Error('TODO');
                    // TODO: add insight
                    // pixel = `GetAsset(filePath=["${path}"], space=["${id}"]);`;
                }

                if (!pixel) {
                    throw new Error('Error missing pixel to get file');
                }

                const response = await runPixelTwo<[string]>(pixel, insightId);

                // set the content
                const content = response.pixelReturn[0].output;
                setContent(content);
                setInitialContent(content);
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        /**
         * @name formatFile
         * Use custom parsers to format file
         * TODO: Save custom configs?
         */
        const formatFile = async () => {
            try {
                let formatted = content;

                if (fileLanguage === 'python') {
                    //TODO:: Implement
                } else {
                    const prettierConfig = {};

                    // parsers for other languages are needed
                    if (fileLanguage === 'html') {
                        prettierConfig['parser'] = 'html';
                        prettierConfig['plugins'] = [parserHtml];
                    } else if (
                        fileLanguage === 'javascript' ||
                        fileLanguage === 'typescript'
                    ) {
                        prettierConfig['parser'] = 'babel';
                        prettierConfig['plugins'] = [parserBabel];
                    } else if (
                        fileLanguage === 'css' ||
                        fileLanguage === 'scss'
                    ) {
                        prettierConfig['parser'] = 'css';
                        prettierConfig['plugins'] = [parserCss];
                    }

                    // If we have a configuration for the selected language
                    if (Object.keys(prettierConfig).length) {
                        formatted = prettier.format(content, prettierConfig);
                    }

                    setContent(formatted);
                }

                notification.add({
                    color: 'success',
                    message: 'Success formatting file',
                });
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        /**
         * Save the File
         */
        const saveFile = async () => {
            try {
                setIsLoading(true);

                let pixel = '';
                if (type === 'app') {
                    pixel = `
                SaveAsset(fileName=["${path}"], content=["<encode>${content}</encode>"], space=["${space}"]); 
                CommitAsset(filePath=["${path}"], comment=["Save from editor"], space=["${space}"])
            `;
                } else if (type === 'insight') {
                    throw Error('TODO');
                    // TODO: add insight
                    //     pixel = `
                    //     SaveAsset(fileName=["${path}"], content=["<encode>${content}</encode>"], space=["${id}"]);
                    //     CommitAsset(filePath=["${path}"], comment=["Hardcoded comment from the App Page editor"], space=["${id}"])
                    // `;
                }

                if (!pixel) {
                    throw new Error('Error missing pixel to get file');
                }

                const { errors } = await runPixelTwo(pixel, insightId);

                // bubble up the errors
                for (const e of errors) {
                    throw new Error(e);
                }

                // reload the file
                loadFile();
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        /**
         * Runs LLM pixel and manages LLM loading
         * @param string
         * @returns LLM response string
         */
        const promptLLM = async (prompt: string) => {
            // ideally add filetype to LLM pixel so it does not have to be in prompt string
            // some formatting issues in return pixel including triple quotes and infrequent cutoffs in response string

            try {
                setIsLoading(true);

                if (!agentModelEngine) {
                    throw new Error('No Agent Model Engine');
                }

                const response = await runPixelTwo(
                    `LLM(engine = "${agentModelEngine}", command = "${prompt}", paramValues = [ {} ] );`,
                    insightId,
                );

                const LLMResponse = response.pixelReturn[0].output['response'];
                let trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

                trimmedStarterCode = trimmedStarterCode.substring(
                    trimmedStarterCode.indexOf('\n') + 1,
                );

                return trimmedStarterCode;
            } catch {
                notification.add({
                    color: 'error',
                    message: 'Failed response from AI Code Generator',
                });
            } finally {
                setIsLoading(false);
            }
        };

        /**
         * Handler called when the editor is mounted
         */
        const onEditorMount: OnMount = (editor, monaco) => {
            if (IS_PRODUCTION) {
                return;
            }

            // prevents redundant additions of new dropdown action
            if (LLMActionAdded == false) {
                setLLMActionAdded(true);
                editor.addAction({
                    contextMenuGroupId: '1_modification',
                    contextMenuOrder: 1,
                    id: 'prompt-LLM',
                    label: 'Generate Code',
                    keybindings: [
                        monaco.KeyMod.CtrlCmd |
                            monaco.KeyMod.Shift |
                            monaco.KeyCode.KeyG,
                    ],

                    run: async (editor) => {
                        const selection = editor.getSelection();
                        const selectedText = editor
                            .getModel()
                            .getValueInRange(selection);

                        const LLMReturnText = await promptLLM(
                            `Create code for a ${fileLanguage} file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
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
                });
                editor.addAction({
                    contextMenuGroupId: '1_modification',
                    contextMenuOrder: 2,
                    id: 'toggle-word-wrap',
                    label: 'Toggle Word Wrap',
                    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
                    run: async (editor) => {
                        wordWrapRef.current = !wordWrapRef.current;
                        editor.updateOptions({
                            wordWrap: wordWrapRef.current ? 'on' : 'off',
                        });
                    },
                });
            }
        };

        return (
            <StyledContainer>
                <Suspense
                    fallback={
                        <LoadingScreen.Trigger description="Loading..." />
                    }
                >
                    {isLoading ? (
                        <LoadingScreen.Trigger description="Loading..." />
                    ) : (
                        <Editor
                            width={'100%'}
                            height={'100%'}
                            value={content}
                            language={fileLanguage}
                            options={{
                                readOnly: false,
                            }}
                            onChange={(newValue) => {
                                setContent(newValue);
                            }}
                            onMount={onEditorMount}
                        ></Editor>
                    )}
                </Suspense>
            </StyledContainer>
        );
    },
);
