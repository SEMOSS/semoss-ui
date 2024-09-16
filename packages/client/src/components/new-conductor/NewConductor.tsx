import React, { useEffect, useState } from 'react';
import { useConductor, useRootStore } from '@/hooks';
import {
    Stack,
    Typography,
    styled,
    TextField,
    IconButton,
    FileDropzone,
    useNotification,
    Button,
    Accordion,
} from '@semoss/ui';
import { NewConductorStep } from './NewConductorStep';
import { observer } from 'mobx-react-lite';
import {
    KeyboardArrowDown,
    ArrowUpward,
    AutoFixHigh,
    PlayArrow,
    Person,
    Close,
    Mic,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { Editor } from '@monaco-editor/react';
import { None } from 'vega';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '20px',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const Conductor = observer(() => {
    const { conductor } = useConductor();
    const notification = useNotification();

    const [taskEditWidthPercent, setTaskEditWidthPercent] = useState('0%');
    const [taskEditorHistory, setTaskEditorHistory] = useState([]);
    const [modelResponseText, setModelResponseText] = useState(null);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedSubtask, setSelectedSubtask] = useState(-1);
    const { monolithStore, configStore } = useRootStore();
    const [promptText, setPromptText] = useState(null);
    const [openAccordionIndexesSet, setOpenAccordionIndexesSet] = useState(
        new Set(),
    );
    const [taskContainerWidthPercent, setTaskContainerWidthPercent] =
        useState('100%');

    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    useEffect(() => {
        if (selectedSubtask == -1) {
            setTaskContainerWidthPercent('100%');
            setTaskEditWidthPercent('0%');
        } else {
            setTaskContainerWidthPercent('calc(70% - 500px)');
            setTaskEditWidthPercent('500px');
        }
    }, [selectedSubtask]);

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);
        setTimeout(() => {
            setPromptText(data.taskInput);
            const placeholderModelResponse =
                'Let’s find out...let me generate a roadmap to figure out if you can afford this house!';
            setModelResponseText(placeholderModelResponse);
            try {
                // const path = 'version/assets/';
                // await monolithStore.runQuery(
                //     `DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
                // );
                // const upload = await monolithStore.uploadFile(
                //     [data.uploadFile],
                //     configStore.store.insightID,
                //     id,
                //     path,
                // );
                // notification.add({
                //     color: 'success',
                //     message: 'Succesfully Uploaded File',
                // });
                // console.log({ upload });
                // reset();
            } catch (e) {
                console.error(e);

                notification.add({
                    color: 'error',
                    message: e.message,
                });
            } finally {
                setIsLoading(false);
            }
        }, 500);
    });

    const isBorders = false; // for testing

    const ParentContainer = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid black' : 'none',
        minWidth: '650px',
    }));

    const TitleContainer = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid green' : 'none',
        boxSizing: 'border-box',
        marginBottom: '10px',
        height: '50px',
        width: '100%',
    }));

    const LowerParentContainer = styled('div')(({ theme }) => ({
        height: 'calc(100vh - 175px)', // contained vertically
        border: isBorders ? '1px solid black' : 'none',
        padding: '20px 0 0 0',
        display: 'flex',
        width: '100%',
    }));

    const LeftParentContainer = styled('div')(({ theme }) => ({
        border: isBorders ? '4px solid blue' : 'none',
        flexBasis: 'calc(70% - 500px)',
        padding: '20px 20px 30px 20px',
        transition: 'width .2s',
        backgroundColor: '#eee',
        flexDirection: 'column',
        borderRadius: '20px',
        display: 'flex',
        flex: '1',
    }));

    const RightParentContainer = styled('div')(({ theme }) => ({
        transition: 'width .2s, margin-left .2s, display 0s',
        border: isBorders ? '1px solid red' : 'none',
        backgroundColor: '#eee',
        borderRadius: '20px',
        flexBasis: '500px',
        marginLeft: '0px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
    }));

    const LeftInnerTopDiv = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid orange' : 'none',
        overflow: promptText ? 'scroll' : 'hidden',
        width: '100%',
        padding: '0px',
        boxSizing: 'border-box',
    }));

    const LeftInnerBottomDiv = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid green' : 'none',
        marginTop: 'auto',
        height: '50px',
        width: '100%',
    }));

    const SubTaskParentContainerNew = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid violet' : 'none',
        justifyContent: 'flex-end',
        marginBottom: '20px',
        display: 'flex',
        width: '100%',
    }));

    const SubTaskInnerContainer = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid red' : 'none',
        flexGrow: '1',
    }));

    const SubTaskPlayButton = styled('div')(({ theme }) => ({
        border: isBorders ? '1px solid green' : 'none',
        alignItems: 'center',
        display: 'flex',
        height: '75px',
        width: '50px',
    }));

    const handleMount = (editor, monaco) => {
        editor.getAction('editor.action.formatDocument').run();
        // const exposedQueryParameterDescription = (
        //     exposedParameter: string,
        //     queryId: string,
        // ): string => {
        //     switch (exposedParameter) {
        //         case 'id':
        //         case 'mode':
        //             return `Returns the ${exposedParameter} of query ${queryId}`;
        //         case 'isExecuted':
        //             return `Returns whether query ${queryId} has executed`;
        //         case 'isLoading':
        //             return `Returns the loading state for query ${queryId}`;
        //         case 'isError':
        //             return `Returns whether query ${queryId} has an error`;
        //         case 'error':
        //             return `Returns the error for query ${queryId} if it exists`;
        //         case 'list':
        //             return `Returns an ordered list of cell IDs for query ${queryId}`;
        //         default:
        //             return `Reference the ${exposedParameter} parameter of query ${queryId}`;
        //     }
        // };

        // add editor completion suggestions based on block values and query outputs
        // const generateSuggestions = (range) => {
        //     const suggestions = [];
        //     Object.values(state.blocks).forEach((block: Block) => {
        //         // only input block types will have values
        //         const inputBlockWidgets = Object.keys(DefaultBlocks).filter(
        //             (block) =>
        //                 DefaultBlocks[block].type === BLOCK_TYPE_INPUT,
        //         );
        //         if (inputBlockWidgets.includes(block.widget)) {
        //             suggestions.push({
        //                 label: {
        //                     label: `{{block.${block.id}.value}}`,
        //                     description: block.data?.value
        //                         ? JSON.stringify(block.data?.value)
        //                         : '',
        //                 },
        //                 kind: monaco.languages.CompletionItemKind.Variable,
        //                 documentation: `Returns the value of block ${block.id}`,
        //                 insertText: `{{block.${block.id}.value}}`,
        //                 range: range,
        //             });
        //         }
        //     });

        // notebook.queriesList.forEach((query: QueryState) => {
        //     // push all exposed values
        //     Object.keys(query._exposed).forEach(
        //         (exposedParameter: string) => {
        //             suggestions.push({
        //                 label: {
        //                     label: `{{query.${query.id}.${exposedParameter}}}`,
        //                     description: query._exposed[
        //                         exposedParameter
        //                     ]
        //                         ? JSON.stringify(
        //                               query._exposed[exposedParameter],
        //                           )
        //                         : '',
        //                 },
        //                 kind: monaco.languages.CompletionItemKind
        //                     .Variable,
        //                 documentation: exposedQueryParameterDescription(
        //                     exposedParameter,
        //                     query.id,
        //                 ),
        //                 insertText: `{{query.${query.id}.${exposedParameter}}}`,
        //                 range: range,
        //                 detail: query.id,
        //             });
        //         },
        //     );
        // });

        // return suggestions;
        // };

        // monaco.languages.registerCompletionItemProvider('json', {
        //     provideCompletionItems: (model, position) => {
        //         const word = model.getWordUntilPosition(position);
        //         // getWordUntilPosition doesn't track when words are led by special characters
        //         // we need to chack for wrapping curly brackets manually to know what to replace

        //         // word is not empty, completion was triggered by a non-special character
        //         if (word.word !== '') {
        //             // return empty suggestions to trigger built in typeahead
        //             return {
        //                 suggestions: [],
        //             };
        //         }

        //         // triggerCharacters is triggered per character, so we need to check if the users has typed "{" or "{{"
        //         const specialCharacterStartRange = {
        //             startLineNumber: position.lineNumber,
        //             endLineNumber: position.lineNumber,
        //             startColumn: word.startColumn - 2,
        //             endColumn: word.startColumn,
        //         };
        //         const preceedingTwoCharacters = model.getValueInRange(
        //             specialCharacterStartRange,
        //         );
        //         const replaceRangeStartBuffer =
        //             preceedingTwoCharacters === '{{' ? 2 : 1;
        //         // python editor will automatically add closed bracket when you type a start one
        //         // need to replace the closed brackets appropriately
        //         const specialCharacterEndRange = {
        //             startLineNumber: position.lineNumber,
        //             endLineNumber: position.lineNumber,
        //             startColumn: word.endColumn,
        //             endColumn: word.endColumn + 2,
        //         };
        //         const followingTwoCharacters = model.getValueInRange(
        //             specialCharacterEndRange,
        //         );
        //         const replaceRangeEndBuffer =
        //             followingTwoCharacters === '}}'
        //                 ? 2
        //                 : followingTwoCharacters == '} ' ||
        //                   followingTwoCharacters == '}'
        //                 ? 1
        //                 : 0;

        //         // compose range that we want to replace with the suggestion
        //         const replaceRange = {
        //             startLineNumber: position.lineNumber,
        //             endLineNumber: position.lineNumber,
        //             startColumn: word.startColumn - replaceRangeStartBuffer,
        //             endColumn: word.endColumn + replaceRangeEndBuffer,
        //         };
        //         return {
        //             suggestions: generateSuggestions(replaceRange),
        //         };
        //     },
        //     triggerCharacters: ['{'],
        // });

        // add LLM prompting and word-wrap actions to editor
        // editor.addAction({
        //     contextMenuGroupId: '1_modification',
        //     contextMenuOrder: 2,
        //     id: 'toggle-word-wrap',
        //     label: 'Toggle Word Wrap',
        //     keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],

        //     run: async (editor) => {
        //         wordWrapRef.current = !wordWrapRef.current;
        //         editor.updateOptions({
        //             wordWrap: wordWrapRef.current ? 'on' : 'off',
        //         });
        //     },
        // });

        // editor.addAction({
        //     contextMenuGroupId: '1_modification',
        //     contextMenuOrder: 1,
        //     id: 'prompt-LLM',
        //     label: 'Generate Code',
        //     keybindings: [
        //         monaco.KeyMod.CtrlCmd |
        //             monaco.KeyMod.Shift |
        //             monaco.KeyCode.KeyG,
        //     ],

        //     run: async (editor) => {
        //         const selection = editor.getSelection();
        //         const selectedText = editor
        //             .getModel()
        //             .getValueInRange(selection);

        //         let LLMReturnText = '';
        //         switch (language) {
        //             case 'html':
        //                 LLMReturnText = await promptLLM(
        //                     `Create code for an HTML file with the user prompt: ${selectedText}`, // filetype should be sent as param to LLM
        //                 );
        //                 break;
        //             case 'json':
        //                 LLMReturnText = await promptLLM(
        //                     `Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure 'data' is a top-level key in the JSON object. Use the following user prompt: ${selectedText}`,
        //                 );
        //                 break;
        //         }

        //         // adds LLM return text after response
        //         editor.executeEdits('custom-action', [
        //             {
        //                 range: new monaco.Range(
        //                     selection.endLineNumber + 2,
        //                     1,
        //                     selection.endLineNumber + 2,
        //                     1,
        //                 ),
        //                 text: `\n\n${LLMReturnText}\n`,
        //                 forceMoveMarkers: true,
        //             },
        //         ]);

        //         // highligts LLM return text after response
        //         editor.setSelection(
        //             new monaco.Range(
        //                 selection.endLineNumber + 3,
        //                 1,
        //                 selection.endLineNumber +
        //                     3 +
        //                     LLMReturnText.split('\n').length,
        //                 1,
        //             ),
        //         );
        //     },
        // });
    };

    const onChange = (value: string) => {
        console.log({ newValue: value });
        // // set the value
        // setValue(value);

        // // clear out he old timeout
        // if (timeoutRef.current) {
        //     clearTimeout(timeoutRef.current);
        //     timeoutRef.current = null;
        // }

        // timeoutRef.current = setTimeout(() => {
        //     try {
        //         // set the value
        //         setData(path, value as PathValue<D['data'], typeof path>);
        //     } catch (e) {
        //         console.log(e);
        //     }
        // }, 300);
    };

    const DUMMY_JSON = `

        {
            "imageurl": "/barbie_dream_house.png",
            "is_house": true,
            "color": "pink",
            "bedrooms": "3+",
            "has_pool": true,
            "has_slide": true,
            "cost": ""
        }
    `;

    return (
        <ParentContainer>
            <TitleContainer>
                <Typography variant="h4">AI Conductor</Typography>
                <Typography variant="body1">
                    Description / Instructions
                </Typography>
            </TitleContainer>
            <LowerParentContainer>
                <LeftParentContainer
                    style={{
                        flexBasis: taskContainerWidthPercent,
                        transition: 'width .2s',
                    }}
                >
                    <LeftInnerTopDiv>
                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        padding: '16px',
                                        display: promptText ? 'none' : 'flex',
                                        marginBottom: '20px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AutoFixHigh
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    Define a task and AI Conductor will generate
                                    a roadmap to help you solve it!
                                </Typography>
                            </SubTaskInnerContainer>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: promptText ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        // display: promptText ? 'auto' : 'none',
                                        display: promptText ? 'flex' : 'none',
                                        backgroundColor: '#fff',
                                        marginBottom: '20px',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        // flexDirection: 'column',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                        border: isBorders
                                            ? '1px solid goldenrod'
                                            : 'none',
                                    }}
                                >
                                    <Person
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    {promptText}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>
                                <div
                                    style={{
                                        border: isBorders
                                            ? '2px dashed green'
                                            : 'none',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        width: '100%',
                                    }}
                                >
                                    <IconButton
                                        sx={{
                                            border: isBorders
                                                ? '1px solid red'
                                                : 'none',
                                            display: promptText
                                                ? 'auto'
                                                : 'none',
                                        }}
                                    >
                                        <PlayArrow />
                                    </IconButton>
                                </div>
                            </SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: promptText ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        display: promptText ? 'flex' : 'none',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        marginBottom: '20px',
                                        borderRadius: '12px',
                                        padding: '16px',
                                    }}
                                >
                                    <AutoFixHigh
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    {modelResponseText}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton></SubTaskPlayButton>
                        </SubTaskParentContainerNew>

                        {promptText &&
                            conductor.steps.map((step, i) => {
                                return (
                                    <SubTaskParentContainerNew>
                                        <SubTaskInnerContainer>
                                            <NewConductorStep
                                                key={i}
                                                taskIndex={i}
                                                type={'app'}
                                                step={step}
                                                selectedSubtask={
                                                    selectedSubtask
                                                }
                                                setSelectedSubtask={
                                                    setSelectedSubtask
                                                }
                                                taskEditorHistory={
                                                    taskEditorHistory
                                                }
                                                setTaskEditorHistory={
                                                    setTaskEditorHistory
                                                }
                                                openAccordionIndexesSet={
                                                    openAccordionIndexesSet
                                                }
                                                setOpenAccordionIndexesSet={
                                                    setOpenAccordionIndexesSet
                                                }
                                            />
                                        </SubTaskInnerContainer>
                                        <SubTaskPlayButton>
                                            <div
                                                style={{
                                                    border: isBorders
                                                        ? '2px dashed green'
                                                        : 'none',
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    width: '100%',
                                                }}
                                            >
                                                <IconButton
                                                    sx={{
                                                        border: isBorders
                                                            ? '1px solid red'
                                                            : 'none',
                                                    }}
                                                >
                                                    <PlayArrow />
                                                </IconButton>
                                            </div>
                                        </SubTaskPlayButton>
                                    </SubTaskParentContainerNew>
                                );
                            })}

                        <Controller
                            name={'uploadFile'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <FileDropzone
                                        style={{
                                            flex: '1',
                                            margin: '0 0 20px 0',
                                            borderRadius: '20px',
                                            // display: promptText ? 'auto' : 'none',
                                            display: 'none',
                                        }}
                                        multiple={false}
                                        value={field.value}
                                        // disabled={isLoading}
                                        onChange={(newValues) => {
                                            field.onChange(newValues);
                                            console.log({ newValues });
                                        }}
                                    />
                                );
                            }}
                        />
                    </LeftInnerTopDiv>
                    <Controller
                        name={'uploadFile'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <FileDropzone
                                    style={{
                                        flex: '1',
                                        margin: '0 5px 20px 0',
                                        borderRadius: '20px',
                                        display: promptText ? 'none' : 'auto',
                                    }}
                                    multiple={false}
                                    value={field.value}
                                    // disabled={isLoading}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                        console.log({ newValues });
                                    }}
                                />
                            );
                        }}
                    />
                    <LeftInnerBottomDiv>
                        <Controller
                            name={'taskInput'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <StyledTextField
                                        label="Name"
                                        variant="outlined"
                                        value={field.value ? field.value : ''}
                                        placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        fullWidth={true}
                                        InputProps={{
                                            startAdornment: (
                                                <span
                                                    style={{
                                                        marginRight: '15px',
                                                        display: 'inline-block',
                                                        width: '100px',
                                                    }}
                                                >
                                                    <b>Chat</b>
                                                    <IconButton
                                                        onClick={
                                                            taskSubmitHandler
                                                        }
                                                    >
                                                        <KeyboardArrowDown />
                                                    </IconButton>
                                                </span>
                                            ),
                                            endAdornment: (
                                                <>
                                                    <IconButton disabled>
                                                        <Mic />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={
                                                            taskSubmitHandler
                                                        }
                                                    >
                                                        <ArrowUpward />
                                                    </IconButton>
                                                </>
                                            ),
                                        }}
                                    />
                                );
                            }}
                        />
                    </LeftInnerBottomDiv>
                </LeftParentContainer>
                <RightParentContainer
                    style={{
                        marginLeft:
                            taskContainerWidthPercent == '0%' ? '0px' : '20px',
                        display: taskEditWidthPercent == '0%' ? 'none' : 'flex',
                        width: taskEditWidthPercent,
                    }}
                >
                    {/* RightInnerContainer */}
                    <div
                        style={{
                            height: '300px',
                            width: '100%',
                            border: isBorders ? '1px solid pink' : 'none',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: isBorders
                                    ? '1px solid lightgreen'
                                    : 'none',
                            }}
                        >
                            <Typography
                                variant={'body1'}
                                sx={
                                    {
                                        // display: 'inline-block'
                                    }
                                }
                            >
                                <b>
                                    Selected Task {selectedSubtask + 1} JSON
                                    Editor
                                </b>
                            </Typography>
                            <IconButton
                                onClick={() => {
                                    setTaskContainerWidthPercent('100%');
                                    setTaskEditWidthPercent('0%');
                                    setSelectedSubtask(-1);
                                }}
                                // sx={{ display: 'inline-block' }}
                            >
                                <Close />
                            </IconButton>
                        </div>

                        {/* <div
                            style={{
                                border: '1px solid violet'
                            }}
                        >
                            <Typography variant={'h6'}>
                                {' '}
                                Overall Input Pool
                            </Typography>
                            <div>{JSON.stringify(conductor.inputPool)}</div>
                        </div> */}

                        <div
                            style={{
                                borderRadius: '10px',
                                width: '100%',
                                overflow: 'auto',
                                flex: '1',
                                // border: isBorders ? '1px solid olive' : 'none',
                                marginTop: '20px',
                                marginBottom: '20px',
                                height: `220px`, // make dynamic based on editor value line count
                                // marginTop: '20px',
                            }}
                        >
                            <Editor
                                width="100%"
                                height="100%"
                                value={DUMMY_JSON}
                                // value={JSON.stringify(conductor.inputPool)}
                                language={'json'}
                                options={{
                                    lineNumbers: 'off',
                                    readOnly: false,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    lineHeight: 19,
                                    overviewRulerBorder: false,
                                }}
                                onChange={(e) => {
                                    onChange(e);
                                }}
                                onMount={handleMount}
                            />
                        </div>
                    </div>

                    <Button
                        color="secondary"
                        variant="outlined"
                        sx={{
                            width: '200px',
                        }}
                    >
                        Update and run task
                    </Button>
                </RightParentContainer>
            </LowerParentContainer>
        </ParentContainer>
    );
});
