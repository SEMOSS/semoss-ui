import React, { useState, useEffect, useRef } from 'react';

import {
    Form,
    Input,
    Textarea,
    Button,
    Scroll,
    IconButton,
    Icon,
    Table,
    styled,
    theme,
    keyframes,
} from '@semoss/components';

import { useForm } from 'react-hook-form';
import { Field } from '../form';
import { Resizable } from 're-resizable';

interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}

// ----------------------------------------------
// Icons ----------------------------------------
// ----------------------------------------------
const mdiMicrophone =
    'M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z';
const mdiSend = 'M2,21L23,12L2,3V10L17,12L2,14V21Z';
const mdiRestore =
    'M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z';
const mdiAccount =
    'M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z';
const mdiChevronUp =
    'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z';
const mdiChevronDown =
    'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z';
const mdiContentCopy =
    'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z';
const mdiSquareEditOutline =
    'M5,3C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19H5V5H12V3H5M17.78,4C17.61,4 17.43,4.07 17.3,4.2L16.08,5.41L18.58,7.91L19.8,6.7C20.06,6.44 20.06,6 19.8,5.75L18.25,4.2C18.12,4.07 17.95,4 17.78,4M15.37,6.12L8,13.5V16H10.5L17.87,8.62L15.37,6.12Z';
const mdiArrowRightBoldBoxOutline =
    'M17,12L12,17V14H8V10H12V7L17,12M3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19M5,19H19V5H5V19Z';
const mdiCodeTags =
    'M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z';
// ----------------------------------------------
// Styles ---------------------------------------
// ----------------------------------------------
const StyledPreviewPopover = styled('div', {
    display: 'block',
    position: 'absolute',
    transform: 'translateX(-50%)',
    backgroundColor: theme.colors.base,
    borderColor: theme.colors['grey-4'],
    borderWidth: theme.borderWidths.default,
    borderRadius: '.5rem',
    boxShadow: theme.shadows.default,
    padding: theme.space['4'],
    zIndex: '30',
    top: '0rem',
    outline: 'none',
    '&:focus': {
        outline: `2px solid ${theme.colors['primary-1']}`,
        outlineOffset: '2px',
    },
});

const StyledPreviewContent = styled('div', {
    display: 'flex',
    height: '90%',
    paddingTop: '1rem',
    gap: '1rem',
    flexDirection: 'column',
    overflow: 'scroll',
});

const StyledPreviewTable = styled('div', {
    height: '13rem',
});

// SQL DIV
const StyledSqlSection = styled('div', {
    height: '6rem',
});

const StyledSqlContent = styled('div', {
    display: 'flex',
    backgroundColor: theme.colors.base,
    borderColor: theme.colors['grey-4'],
    borderWidth: theme.borderWidths.default,
    borderRadius: theme.radii.default,
});

const StyledEditSql = styled('div', {
    padding: '0.5rem',
    height: '6rem',
    width: '85%',
    overflow: 'scroll',
    lineHeight: '1.5rem',
});

const StyledSQLActionDiv = styled('div', {
    display: 'flex',
    width: '15%',
});

const StyledSQLActionButtonDiv = styled('div', {
    display: 'flex',
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeft: `${theme.borderWidths.default} solid ${theme.colors['grey-4']}`,
});

const StyledDiv = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.space['2'],
    lineHeight: theme.space['6'],
});

const StyledField = styled('div', {
    display: 'inline-block',
    minWidth: theme.space['20'],
    maxWidth: theme.space['40'],
});

// END OF PREVIEW ------------------------
const mooseGradient = 'linear-gradient(45deg, #4394e4, #975fe4)';
const linearGradientText = {
    backgroundImage: mooseGradient,
    backgroundSize: '100%',
    backgroundRepeat: 'repeat',
    fontWeight: theme.fontWeights['bold'],

    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    MozBackgroundClip: 'text',
    MozTextFillColor: 'transparent',
};

const StyledResizableContent = styled(Resizable, {
    display: 'flex',
    flexDirection: 'column',
    // width: '25rem',
    // height: '30rem',
});

const StyledHeaderContent = styled('div', {
    display: 'flex',
    alignItems: 'center',
    fontSize: theme.fontSizes.xl,
    backgroundColor: theme.colors.base,
    height: '10%',
    boxShadow: `0 4px 6px -6px ${theme.colors['grey-3']}`,
});

const StyledHeader = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '1rem',
    gap: theme.space['2'],
    fontWeight: theme.fontWeights['semibold'],
});

const StyledColoredHeader = styled('span', {
    ...linearGradientText,
    fontWeight: theme.fontWeights['bold'],
});

const StyledMessageContent = styled('div', {
    height: '75%',
    maxHeight: '75%',
    display: 'flex',
    flexDirection: 'column',
    paddingRight: theme.space['2'],
    paddingTop: '1rem',
});

const StyledMessageLeft = styled('div', {
    display: 'flex',
    color: 'black',
    gap: theme.space['2'],
    marginBottom: '1rem',
});

const StyledGreyBubble = styled('div', {
    background: theme.colors['grey-5'],
    borderRadius: theme.space['2'],
    padding: theme.space['2'],
    maxWidth: '80%',
});

const StyledMessageRight = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    color: 'black',
    gap: theme.space['2'],
    marginBottom: '1rem',
});

const StyledBlueBubble = styled('div', {
    background: theme.colors['primary-1'],
    borderRadius: theme.space['2'],
    padding: theme.space['2'],
    maxWidth: '80%',
    color: theme.colors['base'],
});

const StyledIconDiv = styled('div', {
    width: '1rem',
    height: '1rem',
});

const StyledUserIcon = styled(Icon, {
    variants: {
        color: {
            assistant: {
                color: theme.colors['grey-3'],
            },
            user: {
                // color: '#86BC25',
                color: theme.colors['primary-1'],
            },
        },
    },
});

const StyledIconPlaceholder = styled('div', {
    width: '1rem',
});

const StyledDocQAMessage = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.space['2'],
});

const StyledNotBubble = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '1.5rem',
    marginBottom: '1rem',
});

const StyledAnswerSample = styled('div', {
    width: '95%',
    height: '95%',
});

const StyledTableContainer = styled('div', {
    maxWidth: 'fit-content',
    maxHeight: 'fit-content',
});

const StyledScroll = styled('div', {
    overflowX: 'scroll',
    overflowY: 'scroll',
    height: '8rem',
});

const StyledPreviewTableScroll = styled('div', {
    overflowX: 'scroll',
    overflowY: 'scroll',
    height: '100%',
});

const StyledTable = styled(Table, {
    tableLayout: 'auto',
});

const StyledSQLAnswerPreview = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: theme.fontSizes['sm'],
    fontWeight: theme.fontWeights['semibold'],
});

const StyledAccordionHeader = styled('div', {
    display: 'flex',
    gap: theme.space['2'],
});

const StyledDocQABestAnswer = styled('span', {
    ...linearGradientText,
});

const StyledDocQaBullet = styled('div', {
    display: 'flex',
    gap: theme.space['2'],
    marginLeft: theme.space['2'],
});

const StyledDocQaBulletAnswer = styled('div', {
    marginTop: theme.space['2'],
});

const StyledDocQaBulletCallback = styled('span', {
    '&:hover': {
        cursor: 'pointer',
        color: '#86BC25',
        ...linearGradientText,
    },
});

const StyledDocQaBulletLink = styled('a', {
    ...linearGradientText,
    textDecoration: 'underline',
    '&:hover': {
        cursor: 'pointer',
        textDecoration: 'underline',
    },
});

const StyledFillFormOutput = styled('div', {
    height: '10rem',
});

const StyledScrollableFillFormFields = styled('div', {
    height: '8rem',
});

const StyledFillFormFields = styled('div', {
    marginBottom: theme.space['2'],
});

const StyledApplyButtonDiv = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.space['2'],
});

const ScrollRefDiv = styled('div', {
    height: theme.space['2'],
});

const StyledFooterContent = styled('div', {
    height: '10%',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.colors.base,
    paddingTop: '1rem',
    gap: theme.space['2'],
    borderTop: `solid ${theme.colors['grey-5']}`,
});

const StyledInput = styled(Input, {
    border: 'none',
});

const StyledButtonGroup = styled('div', {
    display: 'flex',
    gap: theme.space['2'],
});

const dotAnimation = keyframes({
    '0%': {
        transform: 'rotate(0deg) scale(0.8)',
    },
    '50%': {
        transform: 'rotate(360deg) scale(1.2)',
    },
    '100%': {
        transform: 'rotate(720deg) scale(0.8)',
    },
});

const StyledDots = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});

const StyledDot = styled('div', {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: theme.colors['grey-3'],
    margin: '0 2px',
    animation: `${dotAnimation} 1s ease-in-out infinite`,

    '&:nth-child(2)': {
        animationDelay: '0.2s',
    },

    '&:nth-child(3)': {
        animationDelay: '0.4s',
    },
});

const StyledTableDiv = styled('div', {
    width: '10rem',
    height: '10rem',
});

interface DocQAProps {
    model: 'docqa';
    filePath: string;
    project: string;
    callback: () => null;
}
interface Text2SQLProps {
    model: 'text2sql';
    frame: string;
    callback: () => null;
}
interface FillFormProps {
    model: 'fillform';
    formFields: string[];
    callback: () => null;
}

type MooseOptions = DocQAProps | Text2SQLProps | FillFormProps;

export interface MooseProps {
    options: any[];
    // options: Array<DocQAProps, Text2SQLProps, FillFormProps>;
    // options: MooseOptions[];
    insightID: string;
    messages: any[];
    selectedModel: any;
    setMessages: any;
    setUpdated: any;
    setSelectedModel: any;
    semossCoreService: any;

    buttonRefs: any;
    addButtonRef: (button: {
        text: string;
        ref: React.MutableRefObject<unknown>;
    }) => void;
}

// DS for each moose message
interface MessageInterface {
    // Is this an answer from our assistant or the question we asked
    assistant: boolean;
    // Verbiage/Actions to show user
    message: any;
    // Show Message Bubble or Results / For Styles
    isNotBubble?: boolean;
}

// ----------------------------------------------
// Messages -------------------------------------
// ----------------------------------------------
const ANSWER_MESSAGES = [
    'Here is a preview of the best answer I could find.',
    "Here's the most appropriate answer I was able to discover.",
    "I've searched extensively and this appears to be the most fitting response.",
    'Based on my investigation, this is the most accurate preview I could find.',
    "I've done my best to find the most suitable answer, and this is what I came up with.",
    'Through careful consideration and research, this is the most fitting response I could provide.',
    'This is the most suitable solution I could find after exploring various options.',
    "I've explored all the available information and this is the best answer I could find.",
    'After thorough research and consideration, this appears to be the most fitting response.',
    'This is the most appropriate answer I could find after analyzing all the available information.',
];

const NO_ANSWER_MESSAGES = [
    "I'm sorry I was not able to find your answer",
    'I apologize I was unable to locate the answer you were looking for.',
    'I regret to inform you that I could not find the answer you were seeking.',
    "I'm sorry to say that I was not able to find the answer you were searching for.",
    "Unfortunately, I couldn't locate the answer you were looking for, and for that I apologize.",
];

const OPTION_MESSAGES = [
    'Absolutely, let me present the available options for you to select from.',
    'Certainly, here are the choices you can consider.',
    "No problem, I'll outline the alternatives that you can choose from.",
    'Sure, here are the possible options for you to decide on.',
    'Without a doubt, let me lay out the options that are available for you to choose from.',
];

const FORM_MESSAGES = [
    'Wonderful, all questions will be answered on the form.',
    'Fantastic, the form will be the platform for all questions to be performed.',
    'Brilliant, the form will be the means to perform all questions.',
    'Excellent, all questions will be completed on the form.',
    'Awesome all questions will be performed on the form',
];

const DOCQA_MESSAGES = [
    'Great, all inquiries will be addressed based on the document.',
    'Fantastic, the document will cover all of your questions.',
    'Excellent, the document will include responses to all your questions.',
    'Wonderful, every question will be tackled on the document.',
    'Terrific, the document will encompass all of the questions.',
];

const TEXT2SQL_MESSAGES = [
    'Wonderful, all inquiries will be answered using your underlying data.',
    'Excellent, the underlying data will be used to address all of the questions.',
    'Fantastic, your data will provide the foundation for answering every question.',
    'Marvelous, all questions will be performed based on the underlying data.',
    'Tremendous, the underlying data will serve as the source for answering all of the questions.',
];

const TEXT2SQL_WELCOME =
    'I help people find answers in their data fast. How can I help you?';
const DOCQA_WELCOME =
    'I help people find answers in their documents fast. How can I help you?';
const FILLFORM_WELCOME =
    'I help users fill forms quicker.  Please enter a prompt.';

// Added this for TS error in next block
declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

// For Speech Recognition API
let speech;
if ('webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.webkitSpeechRecognition;
    speech = new SpeechRecognition();
    speech.continuous = true;
} else {
    speech = null;
}

export const MooseContent = (props: MooseProps) => {
    const {
        options,
        messages,
        setMessages,
        setUpdated,
        selectedModel,
        setSelectedModel,
        insightID,
        semossCoreService,
        buttonRefs,
        addButtonRef,
    } = props; // Will get switched to context

    console.log(props);

    const [question, setQuestion] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);

    const [dataForPreview, setDataForPreview] = useState({});
    const [sqlView, setSqlView] = useState<'preview' | 'params' | 'full-edit'>(
        'preview',
    );
    const [splitJSXSqlEdit, setSplitJSXSqlEdit] = useState<any[]>([]); // string with JSX to map

    const messagesEndRef = useRef<HTMLDivElement | null>(null); // ref to scroll to
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState({ width: 450, height: 500 });

    // const buttonRefs = useRef([]); // Keeps track of buttons that keep open preview pane

    const {
        getValues,
        reset,
        control,
        formState: { dirtyFields },
    } = useForm({
        defaultValues: {},
    });

    /**
     * @desc Handles new messages being added and prompt message
     */
    useEffect(() => {
        console.log('MooseContent useEffect, new message has been added.');
        if (!messages.length) {
            // initial prompt messages
            const messagesForUser = [
                {
                    assistant: true,
                    message:
                        "Hi, I'm Maximoose.  SEMOSS's smart assistant for data inquiries.",
                },
            ];

            let message = '';
            if (!selectedModel) {
                message =
                    'I have a few types of questions I can help you with.  Please choose one below:';
            } else if (selectedModel === 'docqa') {
                message = DOCQA_WELCOME;
            } else if (selectedModel === 'text2sql') {
                message = TEXT2SQL_WELCOME;
            } else if (selectedModel === 'fillform') {
                message = FILLFORM_WELCOME;
            }

            messagesForUser.push({
                assistant: true,
                message: message,
            });

            setMessages(messagesForUser);
        } else if (messages.length === 2) {
            if (options.length > 1 && !selectedModel) {
                getPromptMessages(); // there isn't a selected model or no other options
            }
        } else {
            messagesEndRef.current?.scrollIntoView(true); // scroll last message into frame
        }

        return () => {
            console.warn('cleaning up Moose Content');
            setQuestion('');
            setListening(false);
        };
    }, [messages.length]);

    /**
     * @desc Voice Recognition
     */
    useEffect(() => {
        speech.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuestion(transcript); // Set our Question
            setListening(false); // Turn Listening Off
        };
        speech.onerror = (event) => {
            console.error('Speech recognition error occurred: ' + event.error);
            setListening(false); // Turn Listening Off
        };

        return () => {
            console.warn('Cleaning up speech recognition');
            speech.stop();
            setListening(false);
        };
    }, [question]);

    /**
     * @desc listener for show more buttons
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isButton = buttonRefs.current.some((button) =>
                button.ref.current.contains(event.target),
            );
            const isPopoverContent = popoverRef.current?.contains(event.target);

            console.log(openPreview);
            if (!isButton && !isPopoverContent) {
                setOpenPreview(false);
                reset({});
                // setState({ width: 25, height: 30 });
            }

            if (!isPopoverContent) {
                setSqlView('preview');
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [popoverRef]);

    /**
     * @desc handles changes to the generated query in preview pane
     */
    useEffect(() => {
        if (dataForPreview['generated_query'] && dataForPreview['params']) {
            splitStringWithJSX();
        }
    }, [dataForPreview['generated_query']]);

    /**
     * @name splitStringWithJSX
     */
    const splitStringWithJSX = () => {
        let mutableStr = dataForPreview['generated_query'];
        const list: any[] = [];

        // Iterate through params
        Object.entries(dataForPreview['params']).forEach((kv) => {
            const res = mutableStr.split(`<${kv[0]}>`);

            // Push SQL portion
            list.push(res[0]);
            // Push Field for the blocker
            list.push(
                <Field<Record<string, unknown>>
                    name={kv[0]}
                    control={control}
                    rules={{
                        required: false,
                    }}
                    options={{
                        component:
                            typeof kv[1] === 'string'
                                ? 'input'
                                : 'numberpicker',
                    }}
                    description=""
                    layout="horizontal"
                ></Field>,
            );

            // Clear string thats added to list already
            mutableStr = res[1];
        });

        // Set list of sql and JSX
        setSplitJSXSqlEdit(list);
    };

    /**
     * @name replaceParamsAndFilter
     * @desc executes pixel and returns a sql to be run on frame
     */
    const replaceParamsAndFilter = () => {
        const message = semossCoreService.utility.random('meta-pixel');
        const commands: PixelCommand[] = [];
        const opt = options.find((obj) => obj.model === 'text2sql');
        const dfs = Object.entries(dirtyFields);
        const vals = getValues();

        if (!dfs.length) {
            opt.callback(dataForPreview['sql']); // execute sql
            return;
        }

        let pixel = '';

        dfs.forEach((kv, i) => {
            const value = vals[kv[0]];
            pixel += `ReplaceParam("${dataForPreview['id']}", "${kv[0]}", "${value}");`;
        });

        // There is a possibility of multiple indexes in our pixelReturn; The last non error index will have our true sql that will be executed;
        semossCoreService.once(message, async function (response) {
            const pixelReturn = response.pixelReturn;

            let cont = true;
            let i = pixelReturn.length - 1;
            let generated = false;

            // reverse loop for last working sql
            while (cont) {
                if (i === -1) {
                    cont = false;
                    return;
                }
                // Each pixel return output
                const output = pixelReturn[i].output,
                    type = pixelReturn[i].operationType[0];
                // No Error
                if (type.indexOf('ERROR') === -1) {
                    if (!generated) {
                        let newHeaders = [];
                        let newVals = [];
                        // get new headers and values for preview
                        await getPreviewHeadersAndValues(output.query).then(
                            (resp) => {
                                newHeaders = resp.headers;
                                newVals = resp.values;
                            },
                        );

                        // edit sql preview in state
                        setDataForPreview({
                            ...dataForPreview,
                            headers: newHeaders,
                            values: newVals,
                            sql: output.query,
                            editted_sql: output.query,
                            generated_query: output.generated_query,
                        });

                        setSqlView('preview');
                        generated = true;
                    }
                }
                i--;
            }
        });

        commands.push({
            type: 'Pixel',
            components: [pixel],
            terminal: true,
        });

        semossCoreService.emit('meta-pixel', {
            commandList: commands,
            listeners: [],
            response: message,
            insightID: insightID,
        });
    };

    // ----------------------------------------------
    // API Execution --------------------------------
    // ----------------------------------------------
    /**
     * @name executeQuestion
     * @desc Hits Moose reactor for 'docqa' | 'text2sql' | 'fillform', and handles responses per each model type
     */
    const executeQuestion = () => {
        const message = semossCoreService.utility.random('meta-pixel');
        const type = selectedModel; // prefix for moose reactor
        let pixel;

        // selected option from props
        const opt = options.find((obj) => obj.model === type);

        if (!opt) {
            return;
        }

        // construct pixel
        if (type === 'docqa') {
            pixel = `Moose ( filePath = [ "${opt.filePath}" ] , model = [ "${opt.modelType}" ] , threshold = "20" , rowCount = "3" , source = "true" , project =["${opt.project}"], command = [ "docqa: ${question}" ] ) ;`;
        } else if (type === 'fillform') {
            pixel = `Moose ( command = [ "fillform: ${question}" ] , form_fields = [${JSON.stringify(
                opt.form_fields,
            )}])`;
        } else {
            pixel = `Moose(frame=[LastUsedFrame()], command=["text2sql:${question}"]);`;
        }

        semossCoreService.once(message, async function (response) {
            const pixelResponseType = response.pixelReturn[0].operationType;
            const pixelResponse = response.pixelReturn[0].output;

            // mutable messages to add answers to
            const newMessages = messages;

            if (pixelResponseType.indexOf('ERROR') > -1) {
                console.error('error with moose pixel', pixel);
                return;
            }

            let formattedMessages;
            if (type === 'docqa') {
                const results: any[] = pixelResponse['data'];
                formattedMessages = await formatDocQAResponseMessages(
                    opt.modelType === 'farbot_embed'
                        ? DUMMY_DATA_FARBOT_EMBED
                        : results,
                    opt.modelType,
                );
            } else if (type === 'fillform') {
                formattedMessages = await formatFillFormResponseMessages(
                    pixelResponse,
                );
            } else if (type === 'text2sql') {
                const results = pixelResponse[0]['output'];
                const response = {
                    Query: results.Query,
                    SAMPLE: results.SAMPLE,
                };

                formattedMessages = await formatText2SqlMessages(response);
            }

            formattedMessages.forEach((fm) => {
                newMessages.push(fm);
            });

            setMessages(newMessages); // answer messages to show user
            setLoading(false); // Turn thinking bubble off
        });

        semossCoreService.emit('meta-pixel', {
            commandList: [
                {
                    type: 'Pixel',
                    components: [pixel],
                    meta: true,
                    terminal: true,
                },
            ],
            listeners: [],
            response: message,
            insightID: insightID,
        });
    };

    // ----------------------------------------------
    // General Chatbot Helpers ----------------------
    // ----------------------------------------------
    /**
     * @name getPromptMessages
     * @desc questions to present to user on mount
     */
    const getPromptMessages = async () => {
        const newMessages = messages;
        const modelPromptMessage = await modelPrompt(-1, undefined);

        newMessages.push(modelPromptMessage);
        setMessages(newMessages);
        setUpdated((prevState) => prevState + 1);
    };

    /**
     * @name addQuestionToHistory
     * @desc Adds user question to message history
     */
    const addQuestionToHistory = () => {
        // mutable copy of messages
        const newMessages = messages;

        // pushes users question
        newMessages.push({
            assistant: false,
            message: question,
        });

        setMessages(newMessages);
        setQuestion('');
    };

    /**
     * @name formatSelectModelMessage
     * @param index - -1 means add; anything else means disable
     * @param selModel - means user made selection
     */
    const formatSelectModelMessage = async (index, selModel?) => {
        setLoading(true);
        const messageList = messages; // mutable copy of messages
        const randomIndex = Math.floor(Math.random() * 5);
        let selectionMessage = '';

        if (index === -1) {
            const optionsMessage = OPTION_MESSAGES[randomIndex];
            messageList.push({
                assistant: true,
                message: optionsMessage,
            });
        } else {
            selectionMessage =
                selModel === 'docqa'
                    ? DOCQA_MESSAGES[randomIndex]
                    : selModel === 'fillform'
                    ? FORM_MESSAGES[randomIndex]
                    : TEXT2SQL_MESSAGES[randomIndex];
            setSelectedModel(selModel);
        }

        const selectModelMessage = await modelPrompt(index, selModel);

        index === -1
            ? messageList.push(selectModelMessage)
            : (messageList[index] = selectModelMessage);

        index !== -1 &&
            messageList.push({
                assistant: true,
                message: selectionMessage,
            });

        setMessages(messageList);
        setLoading(false);

        index !== -1 && setUpdated((prevState) => prevState + 1);
    };

    /**
     * @name modelPrompt
     * @param index -1 means new buttons; anything else disable
     * @param selModel possibly undefined if index is -1 else user made selection
     * @returns
     */
    const modelPrompt = (index, selModel) => {
        return {
            assistant: true,
            message: (
                <StyledApplyButtonDiv>
                    {options.map((opt, i) => {
                        return (
                            <Button
                                key={i}
                                variant={
                                    selModel !== opt.model
                                        ? 'outline'
                                        : 'filled'
                                }
                                onClick={() => {
                                    formatSelectModelMessage(
                                        index === -1
                                            ? messages.length - 1
                                            : index,
                                        opt.model,
                                    );
                                }}
                                autoFocus={false}
                                disabled={index === -1 ? false : true}
                            >
                                {opt.model === 'docqa'
                                    ? 'Document Query'
                                    : opt.model === 'fillform'
                                    ? 'Form Fill'
                                    : 'Filter'}
                            </Button>
                        );
                    })}
                </StyledApplyButtonDiv>
            ),
            isNotBubble: true,
        };
    };

    /**
     * @name addButtonToRefs
     * @param e
     * @desc really ugly fix this add ref when making the button rather than when it's clicked
     */
    const addButtonToRefs = (e, data, sql) => {
        // Set SQL To show in Preview it's data
        setDataForPreview({
            ...dataForPreview,
            headers: data.headers,
            values: data.values,
            sql: sql,
        });

        // Open Preview Pane
        setOpenPreview(true);

        const isButton = buttonRefs.current.some((button) =>
            button.ref.current.contains(e.target),
        );

        if (!isButton) {
            const bRef = React.createRef<unknown>();
            (bRef as React.MutableRefObject<unknown>).current = e.target;
            const newButton = {
                text: e.target.textContent,
                ref: bRef,
            };

            addButtonRef(newButton);
        }

        // buttonRefs.current.push(newButton);
    };

    /**
     * @name copyToClipboard
     * @param sql
     */
    const copyToClipboard = (sql: string) => {
        console.log(dataForPreview);
        navigator.clipboard.writeText(sql);

        semossCoreService.emit('alert', {
            color: 'success',
            text: 'Successfully copied to clipboard',
        });
    };

    /**
     * @name refreshChatbot
     * @desc clears messages and clears input
     */
    const refreshChatbot = () => {
        const blankChat: MessageInterface[] = [];
        const opt = options.find((obj) => obj.model === 'text2sql');
        blankChat.push(messages[0]);

        blankChat.push({
            assistant: true,
            message:
                selectedModel === 'text2sql'
                    ? TEXT2SQL_WELCOME
                    : selectedModel === 'fillform'
                    ? FILLFORM_WELCOME
                    : DOCQA_WELCOME,
        });

        setMessages(blankChat);
        setQuestion('');

        if (opt.unfilter) {
            opt.unfilter();
        }
    };
    // ----------------------------------------------
    // DOCQA Helpers --------------------------------
    // ----------------------------------------------
    /**
     * @name formatDocQAResponseMessages
     * @param response
     * @param model
     * @returns list of messages
     */
    const formatDocQAResponseMessages = async (
        response,
        model: 'siamese' | 'farbot_embed',
    ) => {
        const messageList: MessageInterface[] = [];
        let highScoreIndex = 0; // Only for Siamese model

        if (model === 'siamese') {
            if (!response.length) {
                const noAnswerMessage =
                    NO_ANSWER_MESSAGES[Math.floor(Math.random() * 5)];
                return [
                    {
                        assistant: true,
                        message: noAnswerMessage,
                    },
                ];
            }
            let currentHigh = 0;

            for (let i = 0; i < response.length; i++) {
                if (response[i].score > currentHigh) {
                    currentHigh = response[i].score;
                    highScoreIndex = i;
                }
            }
        } else if (model === 'farbot_embed') {
            if (!response['relevant_docs'].length) {
                const noAnswerMessage =
                    NO_ANSWER_MESSAGES[Math.floor(Math.random() * 5)];
                return [
                    {
                        assistant: true,
                        message: noAnswerMessage,
                    },
                ];
            }
        }

        const randomMessage = ANSWER_MESSAGES[Math.floor(Math.random() * 10)];
        messageList.push({
            assistant: true,
            message: (
                <StyledDocQAMessage>
                    <span>{randomMessage}</span>
                    <StyledDocQABestAnswer>
                        {model === 'farbot_embed'
                            ? response.summary
                            : response[highScoreIndex].answer}
                    </StyledDocQABestAnswer>
                </StyledDocQAMessage>
            ),
        });

        // used to know what accordion to open or close
        const resultsMessageIndex = messages.length + 1;

        const relevantInfoAccordion = await formatRelevantInfoMessage(
            model === 'farbot_embed' ? response['relevant_docs'] : response,
            model,
            true,
            resultsMessageIndex,
        );

        messageList.push(relevantInfoAccordion);

        return messageList;
    };

    /**
     * @name formatRelevantInfoMessage
     * @param {results} -- populates accordion
     * @param {model} -- results are different based on model
     * @param {openAccordion} -- state of the accordion
     * @param {messageIndex} -- index in message list in state
     *
     */
    const formatRelevantInfoMessage = (
        results: any[],
        model: 'siamese' | 'farbot_embed',
        openAccordion: boolean,
        messageIndex: number,
    ) => {
        // selected option from props
        const opt = options.find((obj) => obj.model === 'docqa');

        return {
            assistant: true,
            message: (
                <StyledAnswerSample>
                    <StyledAccordionHeader>
                        <h2>Relevant Information</h2>
                        <IconButton
                            color="grey"
                            onClick={async () => {
                                const newMessages = messages;

                                // message with new accordion state
                                const switchedAccordionMessage =
                                    await formatRelevantInfoMessage(
                                        results,
                                        model,
                                        !openAccordion,
                                        messageIndex,
                                    );

                                newMessages[messageIndex] =
                                    switchedAccordionMessage;

                                setMessages(newMessages);
                                // This is an issue: messages state change is one step behind
                                setUpdated((prevState) => prevState + 1);
                            }}
                        >
                            <Icon
                                path={
                                    openAccordion
                                        ? mdiChevronUp
                                        : mdiChevronDown
                                }
                            ></Icon>
                        </IconButton>
                    </StyledAccordionHeader>

                    {openAccordion && (
                        <div>
                            {results.map((r, i) => {
                                return (
                                    <StyledDocQaBullet key={i}>
                                        <div>
                                            <span>[{i + 1}]</span>
                                        </div>
                                        <StyledDocQaBulletAnswer>
                                            <div>
                                                {model === 'farbot_embed'
                                                    ? r.section
                                                    : r.answer}
                                            </div>
                                            <div>
                                                Source:{' '}
                                                {opt.callback ? (
                                                    <StyledDocQaBulletCallback
                                                        onClick={() =>
                                                            opt.callback(r)
                                                        }
                                                    >
                                                        {model ===
                                                        'farbot_embed'
                                                            ? r.meta.id
                                                            : r.meta.title}
                                                    </StyledDocQaBulletCallback>
                                                ) : (
                                                    <StyledDocQaBulletLink
                                                        href={
                                                            model ===
                                                            'farbot_embed'
                                                                ? r.URL
                                                                : r.meta.URL
                                                        }
                                                    >
                                                        {model ===
                                                        'farbot_embed'
                                                            ? r.meta.id
                                                            : r.meta.title}
                                                    </StyledDocQaBulletLink>
                                                )}
                                            </div>
                                        </StyledDocQaBulletAnswer>
                                    </StyledDocQaBullet>
                                );
                            })}
                        </div>
                    )}
                </StyledAnswerSample>
            ),
            isNotBubble: true,
        };
    };

    // ----------------------------------------------
    // Fillform Helpers -----------------------------
    // ----------------------------------------------
    /**
     * @name formatFillFormResponseMessages
     * @param response
     * @param model
     * @returns list of messages
     */
    const formatFillFormResponseMessages = async (response) => {
        const messageList: MessageInterface[] = [];

        if (response === null || response === '') {
            // error handle as well
            return [
                {
                    assistant: true,
                    message:
                        "My apologies, we weren't able to parse your prompt. Please try again.",
                },
            ];
        }

        messageList.push({
            assistant: true,
            message: 'These are the fields that were parsed.',
        });

        // used to know what accordion to open or close
        const resultsMessageIndex = messages.length + 1;

        const resultsAccordion = await formatFillFormMessage(
            response,
            true,
            resultsMessageIndex,
        );

        messageList.push(resultsAccordion);

        return messageList;
    };

    const formatFillFormMessage = (
        results,
        openAccordion: boolean,
        messageIndex: number,
    ) => {
        const opt = options.find((obj) => obj.model === 'fillform');
        const resultsList = Object.entries(results);

        return {
            assistant: true,
            message: (
                <StyledAnswerSample>
                    <StyledAccordionHeader>
                        <h2>Results</h2>
                        <IconButton
                            onClick={async () => {
                                const newMessages = messages;
                                // message with new accordion state
                                const switchedAccordionMessage =
                                    await formatFillFormMessage(
                                        results,
                                        !openAccordion,
                                        messageIndex,
                                    );

                                newMessages[messageIndex] =
                                    switchedAccordionMessage;

                                setMessages(newMessages);
                                // This is an issue: messages state change is one step behind
                                setUpdated((prevState) => prevState + 1);
                            }}
                        >
                            <Icon
                                path={
                                    openAccordion
                                        ? mdiChevronUp
                                        : mdiChevronDown
                                }
                            ></Icon>
                        </IconButton>
                    </StyledAccordionHeader>
                    {openAccordion && (
                        <StyledFillFormOutput>
                            <StyledScrollableFillFormFields>
                                <Scroll>
                                    {resultsList.map(
                                        (k: [string, string], i) => {
                                            return (
                                                <StyledFillFormFields key={i}>
                                                    <span title={k[0]}>
                                                        {k[0]}:
                                                    </span>
                                                    <Input
                                                        value={k[1]}
                                                        disabled={true}
                                                    />
                                                </StyledFillFormFields>
                                            );
                                        },
                                    )}
                                </Scroll>
                            </StyledScrollableFillFormFields>
                            {opt.callback && (
                                <StyledApplyButtonDiv>
                                    <Button
                                        variant={'outline'}
                                        onClick={() => opt.callback(results)}
                                        autoFocus={false}
                                    >
                                        Apply
                                    </Button>
                                </StyledApplyButtonDiv>
                            )}
                        </StyledFillFormOutput>
                    )}
                </StyledAnswerSample>
            ),
            isNotBubble: true,
        };
    };

    // ----------------------------------------------
    // Text2sql Helpers -----------------------------
    // ----------------------------------------------
    const formatText2SqlMessages = async (response) => {
        const messageList: MessageInterface[] = [];
        // selected option from props
        const opt = options.find((obj) => obj.model === 'text2sql');

        if (!response.Query) {
            return [
                {
                    assistant: true,
                    message:
                        "My apologies, we weren't able to parse your prompt. Please try again.",
                },
            ];
        }

        // Show Preview button if there's data to show
        let data = null;

        // Get Preview data instead of string that gets sent back in sample
        await getSQLPreview(response.Query)
            .then((resp) => {
                data = resp.data;

                const randomMessage =
                    ANSWER_MESSAGES[Math.floor(Math.random() * 10)];
                const messages2Add = resp.message;

                messageList.push({
                    assistant: true,
                    message: randomMessage,
                });

                messageList.push(messages2Add);

                opt.callback &&
                    messageList.push({
                        assistant: true,
                        message: (
                            <StyledApplyButtonDiv>
                                {data && (
                                    <Button
                                        variant={'outline'}
                                        onClick={(e) =>
                                            addButtonToRefs(
                                                e,
                                                data,
                                                response.Query,
                                            )
                                        }
                                    >
                                        Show More
                                    </Button>
                                )}
                                <Button
                                    variant={'outline'}
                                    onClick={() => opt.callback(response.Query)}
                                >
                                    Apply Filter
                                </Button>
                            </StyledApplyButtonDiv>
                        ),
                        isNotBubble: true,
                    });
            })
            .catch((err) => {
                messageList.push(err.message);
            });

        return messageList;
    };

    const getPreviewHeadersAndValues = (sql: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const message = semossCoreService.utility.random('meta-pixel');

            const pixel = semossCoreService.pixel.build([
                {
                    type: 'Pixel',
                    components: ['Frame(frame=[LastUsedFrame()])'],
                    meta: true,
                },
                {
                    type: 'query',
                    components: [sql],
                },
                {
                    type: 'limit',
                    components: [20],
                },
                {
                    type: 'collect',
                    components: [20],
                    terminal: true,
                },
            ]);

            semossCoreService.once(message, async function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: `Error getting preview; Pixel: ${pixel}`,
                    });

                    resolve({
                        headers: [],
                        values: [],
                    });
                }

                // deconstruct for resolve
                const headers = output.data.headers,
                    values = output.data.values;

                resolve({
                    headers: headers,
                    values: values,
                });
            });

            semossCoreService.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
                insightID: insightID,
            });
        });
    };

    /**
     * @name getSQLPreview
     * @param sql
     * @returns messaage that gets generated from response from pixel
     */
    const getSQLPreview = (sql: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const message = semossCoreService.utility.random('meta-pixel');

            const pixel = semossCoreService.pixel.build([
                {
                    type: 'Pixel',
                    components: ['Frame(frame=[LastUsedFrame()])'],
                    meta: true,
                },
                {
                    type: 'query',
                    components: [sql],
                },
                {
                    type: 'limit',
                    components: [20],
                },
                {
                    type: 'collect',
                    components: [20],
                    terminal: true,
                },
            ]);

            semossCoreService.once(message, async function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: `Error ${pixel}`,
                    });

                    reject({
                        data: null,
                        message: {
                            assistant: true,
                            message:
                                "My apologies, we weren't able to parse your prompt. Please try again.",
                        },
                    });

                    return;
                }

                // deconstruct for resolve
                const headers = output.data.headers,
                    values = output.data.values;

                resolve({
                    data: {
                        headers: headers,
                        values: values,
                    },
                    message: {
                        assistant: true,
                        message: (
                            <StyledAnswerSample>
                                <StyledTableContainer>
                                    <StyledScroll>
                                        <StyledTable
                                            sticky={true}
                                            border={false}
                                        >
                                            <Table.Head>
                                                <Table.Row>
                                                    {headers.map((col, i) => {
                                                        return (
                                                            <Table.Cell key={i}>
                                                                {col
                                                                    .replaceAll(
                                                                        '_',
                                                                        ' ',
                                                                    )
                                                                    .toUpperCase()}
                                                            </Table.Cell>
                                                        );
                                                    })}
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {!values.length && (
                                                    <Table.Row>
                                                        <Table.Cell
                                                            colSpan={
                                                                headers.length
                                                            }
                                                        >
                                                            No Values to Show
                                                        </Table.Cell>
                                                    </Table.Row>
                                                )}
                                                {values.map((row, i) => {
                                                    return (
                                                        <Table.Row key={i}>
                                                            {row.map(
                                                                (
                                                                    val,
                                                                    index,
                                                                ) => {
                                                                    return (
                                                                        <Table.Cell
                                                                            key={
                                                                                index
                                                                            }
                                                                        >
                                                                            {
                                                                                val
                                                                            }
                                                                        </Table.Cell>
                                                                    );
                                                                },
                                                            )}
                                                        </Table.Row>
                                                    );
                                                })}
                                            </Table.Body>
                                        </StyledTable>
                                    </StyledScroll>
                                    <StyledSQLAnswerPreview>
                                        Showing {values.length} of{' '}
                                        {values.length}
                                    </StyledSQLAnswerPreview>
                                </StyledTableContainer>
                            </StyledAnswerSample>
                        ),
                        isNotBubble: true,
                    },
                });
            });

            semossCoreService.emit('meta-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
                insightID: insightID,
            });
        });
    };

    // ----------------------------------------------
    // ParseSQLWrapper Helpers ----------------------
    // ----------------------------------------------
    /**
     * @name parseSql2Wrapper
     * @param sql
     */
    const parseSql2Wrapper = (sql) => {
        const message = semossCoreService.utility.random('meta-pixel');
        const commands: PixelCommand[] = [];
        const pixel = `ParseSQL2Wrapper("<encode>${sql}</encode>")`;

        semossCoreService.once(message, function (response) {
            const output = response.pixelReturn[0].output,
                type = response.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                console.warn('error with parsesql2wrapper');
                return;
            }

            // react hook form set new vals
            reset(output.params);

            // Handle this better
            setDataForPreview({
                id: output.ID,
                headers: dataForPreview['headers'],
                values: dataForPreview['values'],
                sql: dataForPreview['sql'],
                editted_sql: dataForPreview['sql'],
                generated_query: output.generated_query,
                params: output.params,
            });
        });

        commands.push({
            type: 'Pixel',
            components: [pixel],
            terminal: true,
        });

        semossCoreService.emit('meta-pixel', {
            commandList: commands,
            listeners: [],
            response: message,
            insightID: insightID,
        });
    };

    console.log('width height', `${state.width} : ${state.height}`);
    return (
        <>
            {openPreview && (
                <StyledPreviewPopover
                    tabIndex={0}
                    ref={popoverRef}
                    style={{
                        width: state.width,
                        height: state.height + 35, // Figure out the math behind this
                        right: state.width / 1.5, // Figure out the math behind this
                    }}
                >
                    <StyledHeaderContent>
                        <StyledHeader>
                            <h2>Preview Pane</h2>
                        </StyledHeader>
                    </StyledHeaderContent>
                    <StyledPreviewContent>
                        <StyledPreviewTable>
                            <StyledPreviewTableScroll>
                                <StyledTable sticky={true} border={false}>
                                    <Table.Head>
                                        <Table.Row>
                                            {dataForPreview['headers'].map(
                                                (col, i) => {
                                                    return (
                                                        <Table.Cell key={i}>
                                                            {col
                                                                .replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                )
                                                                .toUpperCase()}
                                                        </Table.Cell>
                                                    );
                                                },
                                            )}
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {!dataForPreview['values'].length && (
                                            <Table.Row>
                                                <Table.Cell
                                                    colSpan={
                                                        dataForPreview[
                                                            'headers'
                                                        ].length
                                                    }
                                                >
                                                    No Values to Show
                                                </Table.Cell>
                                            </Table.Row>
                                        )}
                                        {dataForPreview['values'].map(
                                            (row, i) => {
                                                return (
                                                    <Table.Row key={i}>
                                                        {row.map(
                                                            (val, index) => {
                                                                return (
                                                                    <Table.Cell
                                                                        key={
                                                                            index
                                                                        }
                                                                    >
                                                                        {val}
                                                                    </Table.Cell>
                                                                );
                                                            },
                                                        )}
                                                    </Table.Row>
                                                );
                                            },
                                        )}
                                    </Table.Body>
                                </StyledTable>
                            </StyledPreviewTableScroll>
                        </StyledPreviewTable>
                        <StyledSqlSection>
                            <StyledSqlContent>
                                <StyledEditSql>
                                    {sqlView === 'preview' ? (
                                        dataForPreview['sql']
                                    ) : sqlView === 'params' ? (
                                        <Form>
                                            <StyledDiv>
                                                {/* <Button
                                                    onClick={() =>
                                                        console.log(getValues())
                                                    }
                                                >
                                                    See Vals
                                                </Button> */}
                                                {splitJSXSqlEdit.map(
                                                    (el, i) => {
                                                        if (
                                                            typeof el ===
                                                            'string'
                                                        ) {
                                                            return (
                                                                <span key={i}>
                                                                    <b>{el}</b>
                                                                </span>
                                                            );
                                                        } else {
                                                            return (
                                                                <StyledField
                                                                    key={i}
                                                                >
                                                                    {el}
                                                                </StyledField>
                                                            );
                                                        }
                                                    },
                                                )}
                                            </StyledDiv>
                                        </Form>
                                    ) : (
                                        <Textarea
                                            value={
                                                dataForPreview['editted_sql']
                                            }
                                            onChange={(v) => {
                                                setDataForPreview({
                                                    ...dataForPreview,
                                                    editted_sql: v,
                                                });
                                            }}
                                        ></Textarea>
                                    )}
                                </StyledEditSql>
                                <StyledSQLActionDiv>
                                    <StyledSQLActionButtonDiv>
                                        {sqlView === 'preview' ? (
                                            <IconButton
                                                size="sm"
                                                color="grey"
                                                title="Copy to Clipboard"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        dataForPreview['sql'],
                                                    )
                                                }
                                            >
                                                <Icon
                                                    path={mdiContentCopy}
                                                ></Icon>
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                size="sm"
                                                color="grey"
                                                title={
                                                    sqlView === 'params'
                                                        ? 'Fully Edit SQL'
                                                        : 'Edit SQL Params'
                                                }
                                                onClick={() => {
                                                    if (sqlView === 'params') {
                                                        setSqlView('full-edit');
                                                    } else {
                                                        setSqlView('params');
                                                    }
                                                }}
                                            >
                                                <Icon
                                                    path={
                                                        sqlView === 'params'
                                                            ? mdiSquareEditOutline
                                                            : mdiCodeTags
                                                    }
                                                ></Icon>
                                            </IconButton>
                                        )}
                                    </StyledSQLActionButtonDiv>
                                    <StyledSQLActionButtonDiv>
                                        {sqlView === 'preview' ? (
                                            <IconButton
                                                size="sm"
                                                color="grey"
                                                title="Edit Params"
                                                onClick={async () => {
                                                    setSqlView('params');
                                                    // Parse SQL To Wrapper
                                                    await parseSql2Wrapper(
                                                        dataForPreview['sql'],
                                                    );
                                                }}
                                            >
                                                <Icon path={mdiCodeTags}></Icon>
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                size="sm"
                                                color="grey"
                                                title="Preview edits"
                                                onClick={() => {
                                                    if (sqlView === 'params') {
                                                        replaceParamsAndFilter();
                                                    } else {
                                                        // edit sql query in state
                                                        setDataForPreview({
                                                            ...dataForPreview,
                                                            sql: dataForPreview[
                                                                'editted_sql'
                                                            ],
                                                        });

                                                        setSqlView('preview');
                                                    }
                                                }}
                                            >
                                                <Icon
                                                    path={
                                                        mdiArrowRightBoldBoxOutline
                                                    }
                                                ></Icon>
                                            </IconButton>
                                        )}
                                    </StyledSQLActionButtonDiv>
                                </StyledSQLActionDiv>
                            </StyledSqlContent>
                        </StyledSqlSection>
                        <StyledApplyButtonDiv>
                            <Button
                                color="grey"
                                variant={'outline'}
                                onClick={() => {
                                    setOpenPreview(false);
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                disabled={sqlView !== 'preview'}
                                variant={'outline'}
                                onClick={() => {
                                    const opt = options.find(
                                        (obj) => obj.model === 'text2sql',
                                    );
                                    opt.callback(dataForPreview['sql']);
                                }}
                            >
                                Apply To Frame
                            </Button>
                        </StyledApplyButtonDiv>
                    </StyledPreviewContent>
                </StyledPreviewPopover>
            )}
            <StyledResizableContent
                style={{}}
                size={{ width: state.width, height: state.height }}
                onResizeStop={(e, direction, ref, d) => {
                    const w = state.width + d.width,
                        h = state.height + d.height;

                    setState({
                        width: w < 450 ? 450 : w,
                        height: h < 250 ? 250 : h,
                    });
                }}
            >
                <StyledHeaderContent>
                    <StyledHeader>
                        <h2>
                            Moose,{' '}
                            <StyledColoredHeader>
                                the Smart Assistant
                            </StyledColoredHeader>
                        </h2>
                    </StyledHeader>
                </StyledHeaderContent>
                <Scroll type={'scroll'}>
                    <StyledMessageContent>
                        {messages.map(
                            (messageGroup: MessageInterface, index) => {
                                if (messageGroup.assistant) {
                                    if (messageGroup.isNotBubble) {
                                        return (
                                            <StyledNotBubble key={index}>
                                                {messageGroup.message}
                                            </StyledNotBubble>
                                        );
                                    } else {
                                        return (
                                            <StyledMessageLeft key={index}>
                                                {index === 0 ||
                                                !messages[
                                                    index === 0 ? 0 : index - 1
                                                ].assistant ? (
                                                    <StyledIconDiv>
                                                        <StyledUserIcon
                                                            size={'md'}
                                                            path={mdiAccount}
                                                            color={'assistant'}
                                                        ></StyledUserIcon>
                                                    </StyledIconDiv>
                                                ) : (
                                                    <StyledIconPlaceholder>
                                                        &nbsp;
                                                    </StyledIconPlaceholder>
                                                )}
                                                <StyledGreyBubble>
                                                    {messageGroup.message}
                                                </StyledGreyBubble>
                                            </StyledMessageLeft>
                                        );
                                    }
                                } else {
                                    return (
                                        <StyledMessageRight key={index}>
                                            <StyledBlueBubble>
                                                {messageGroup.message}
                                            </StyledBlueBubble>
                                            <StyledIconDiv>
                                                <StyledUserIcon
                                                    size={'md'}
                                                    path={mdiAccount}
                                                    color={'user'}
                                                ></StyledUserIcon>
                                            </StyledIconDiv>
                                        </StyledMessageRight>
                                    );
                                }
                            },
                        )}
                        {loading && (
                            <StyledMessageLeft>
                                <StyledIconDiv>
                                    <StyledUserIcon
                                        size={'md'}
                                        path={mdiAccount}
                                        color={'assistant'}
                                    ></StyledUserIcon>
                                </StyledIconDiv>{' '}
                                <StyledGreyBubble>
                                    <StyledDots>
                                        <StyledDot></StyledDot>
                                        <StyledDot></StyledDot>
                                        <StyledDot></StyledDot>
                                    </StyledDots>
                                </StyledGreyBubble>
                            </StyledMessageLeft>
                        )}
                        <ScrollRefDiv ref={messagesEndRef}>&nbsp;</ScrollRefDiv>
                    </StyledMessageContent>
                </Scroll>
                <StyledFooterContent>
                    <StyledInput
                        type="text"
                        value={question}
                        placeholder={'Ask me anything....'}
                        disabled={!selectedModel || loading}
                        onChange={(val) => {
                            if (typeof val === 'string') setQuestion(val);
                        }}
                        onKeyDown={async (e) => {
                            if (e.code === 'Enter') {
                                if (!question) return;
                                const q = question; // copy before it changes in state
                                setLoading(true); // show thinking bubble

                                await addQuestionToHistory(); // adds user question
                                if (
                                    q === 'change model' &&
                                    options.length > 1
                                ) {
                                    setSelectedModel(null);
                                    await formatSelectModelMessage(-1);
                                    setLoading(false);
                                } else {
                                    console.log('executing question');
                                    executeQuestion(); // execute pixel
                                }
                            }
                        }}
                    />
                    <StyledButtonGroup>
                        <IconButton
                            size="sm"
                            color={'grey'}
                            disabled={!selectedModel || loading}
                            onClick={async () => {
                                if (!question) return;
                                // copy before it changes in state
                                const q = question;
                                // show thinking bubble
                                setLoading(true);
                                // adds user question
                                await addQuestionToHistory();

                                if (q === 'change model') {
                                    // show user model options for selection
                                    await formatSelectModelMessage(-1);
                                    // showModelPrompt(-1);
                                    setLoading(false);
                                } else {
                                    // execute pixel
                                    executeQuestion();
                                }
                            }}
                        >
                            <Icon path={mdiSend}></Icon>
                        </IconButton>
                        <IconButton
                            size="sm"
                            color={listening ? 'error' : 'grey'}
                            disabled={!selectedModel || loading || !speech}
                            onClick={() => {
                                if (!listening) {
                                    setListening(true);
                                    speech.start();
                                }
                            }}
                        >
                            <Icon path={mdiMicrophone}></Icon>
                        </IconButton>
                        <IconButton
                            size="sm"
                            color={'grey'}
                            disabled={!selectedModel || loading || listening}
                            onClick={() => {
                                refreshChatbot();
                            }}
                        >
                            <Icon path={mdiRestore}></Icon>
                        </IconButton>
                    </StyledButtonGroup>
                </StyledFooterContent>
            </StyledResizableContent>
        </>
    );
};

const DUMMY_DATA_FARBOT_EMBED = {
    summary:
        'contract may include an option clause with the period for exercising the option limited to the date in the contract for notification that funds are available for the next succeeding program year. the contractor agrees that the option quantities will reflect only those recurring costs and a reasonable profit or fee necessary to furnish the additional option quantities. when the total performance period, including options, is more than three years, the d&f prepared in accordance with this paragraph shall be signed by the contracting officer.',
    relevant_docs: [
        {
            meta: {
                file: '/Users/kunalppatel9/Documents/SEMOSS/workspace/Semoss_Dev/project/QA5__7f99f6e8-cebf-445f-b04a-004ea306df84/app_root/version/assets/qa5pdf/FAR_dita_html/2.101.html',
                id: 'FAR_2_101__d75e1913',
                uuid: 5799,
                prev: 5798,
                next: 5800,
                _split_id: 0,
                vector_id: '4366',
            },
            url: 'https://www.acquisition.gov/far/part-2#FAR_2_101',
            section: '2.101',
            score: 0.9770656824111938,
            content:
                'option means a unilateral right in a contract by which, for a specified time, the government may elect to purchase additional supplies or services called for by the contract, or may elect to extend the term of the contract.',
        },
        {
            meta: {
                file: '/Users/kunalppatel9/Documents/SEMOSS/workspace/Semoss_Dev/project/QA5__7f99f6e8-cebf-445f-b04a-004ea306df84/app_root/version/assets/qa5pdf/FAR_dita_html/6.302-2.html',
                id: 'FAR_6_302_2__d395e100',
                uuid: 31593,
                prev: 31592,
                next: 31595,
                _split_id: 0,
                vector_id: '29599',
            },
            url: 'https://www.acquisition.gov/far/part-6#FAR_6_302',
            section: '6.302',
            score: 0.8351371884346008,
            content:
                '(ii) may not exceed one year, including all options, unless the head of the agency determines that exceptional circumstances apply. this determination must be documented in the contract file.',
        },
    ],
};
