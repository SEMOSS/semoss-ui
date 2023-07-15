import { useEffect, useState } from 'react';
import {
    styled,
    Chip,
    Stack,
    Select,
    TextField,
    Button,
    Menu,
} from '@semoss/ui';

import { NodeComponent, NodeConfig } from '@/components/pipeline';

const PROMPTS_API = [
    {
        id: 'prompt--0',
        name: 'English Translator',
        prompt: 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.',
    },
    {
        id: 'prompt--1',
        name: 'Interviewer',
        prompt: 'I want you to act as an interviewer. I will be the candidate and you will ask me the interview questions for the `position` position. I want you to only reply as the interviewer. Do not write all the conservation at once. I want you to only do the interview with me. Ask me the questions and wait for my answers. Do not write explanations. Ask me the questions one by one like an interviewer does and wait for my answers.',
    },
    {
        id: 'prompt--2',
        name: 'JavaScript Console',
        prompt: 'I want you to act as a javascript console. I will type commands and you will reply with what the javascript console should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. when i need to tell you something in english, i will do so by putting text inside curly brackets {like this}.',
    },
    {
        id: 'prompt--3',
        name: 'Excel Sheet',
        prompt: "I want you to act as a text based excel. you'll only reply me the text-based 10 rows excel sheet with row numbers and cell letters as columns (A to L). First column header should be empty to reference row number. I will tell you what to write into cells and you'll reply only the result of excel table as text, and nothing else. Do not write explanations. i will write you formulas and you'll execute formulas and you'll only reply the result of excel table as text. First, reply me the empty sheet.",
    },
    {
        id: 'prompt--4',
        name: 'Travel Guide',
        prompt: 'I want you to act as a travel guide. I want you suggest a place to visit near {location}. In some cases, I will also give you the type of places I will visit. You will also suggest me places that are good to visit at {time}',
    },
    {
        id: 'prompt--5',
        name: 'Motivational Speaker',
        prompt: 'I want you to act as a motivational speaker. Put together words that inspire action and make people feel empowered to do something beyond their abilities. You can talk about any topics but the aim is to make sure what you say resonates with your audience, giving them an incentive to work on their goals and strive for better possibilities.',
    },
    {
        id: 'prompt--6',
        name: 'Tech Reviewer',
        prompt: 'I want you to act as a tech reviewer. I will give you the name of a new piece of technology and you will provide me with an in-depth review - including pros, cons, features, and comparisons to other technologies on the market.',
    },
];

const StyledContainer = styled(Stack)(({ theme }) => ({
    position: 'relative',
    width: `${theme.breakpoints.values.sm}px`,
}));

const StyledTokenContainer = styled('div')(({ theme }) => ({
    minHeight: '250px',
    width: '100%',
    borderWidth: '1px',
    // borderColor: theme.palette.outline, // TODO: create a theme variable
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    lineHeight: theme.spacing(5),
}));

/**
 * Prompt tokens
 */
type PromptToken =
    | {
          id: string;
          type: 'text';
          value: string;
      }
    | {
          id: string;
          type: 'input';
          name: string;
          value: string;
      };

let id = 0;
const generateTokenId = () => {
    return `token--${++id}`;
};

interface PromptNodeConfig extends NodeConfig<'prompt-node'> {
    parameters: {
        PROMPT: 'custom';
    };
}

export const PromptNode: NodeComponent<PromptNodeConfig> = (props) => {
    const { parameters, actions } = props;

    // TODO: Fix. This is hacky. Should use a proper library.
    const [prompt, setPrompt] = useState<string>('');
    const [tokens, setTokens] = useState<PromptToken[]>(
        (parameters.PROMPT.value || []) as PromptToken[],
    );

    const [tokenMenuActive, setTokenMenuActive] = useState<boolean>(false);
    const [tokenMenuPosition, setTokenMenuPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const [activeToken, setActiveToken] = useState<{
        token: string;
        text: string;
        offset: number;
    } | null>(null);
    /**
     * Open the menu when the container has a selection
     * @param event - Mouse event
     */
    const handleTokenActivate = (event: React.MouseEvent) => {
        const selection = window.getSelection();

        let token = '';
        let text = '';
        let offset = 0;
        if (selection) {
            // get the token from the parentElement
            const parentElement = selection.anchorNode.parentElement;
            token = parentElement.getAttribute('data-token');

            // set the offset
            offset = selection.anchorOffset || 0;

            // get the text
            text = selection.toString();
        }

        // ignore if there is no text selected
        if (!token || !text) {
            // set as inactive
            setTokenMenuActive(false);

            // save the position
            setTokenMenuPosition({
                top: 0,
                left: 0,
            });

            //clear the text
            setActiveToken(null);
            return;
        }

        // save the position
        setTokenMenuPosition({
            top: event.clientY + 16,
            left: event.clientX - 16,
        });

        // set the text
        setActiveToken({
            token: token,
            text: text,
            offset: offset,
        });

        // set as active
        setTokenMenuActive(true);
    };

    /**
     * Convert the user selection to a token
     * @param type - type selected by the user
     */
    const convertToToken = (type: 'input') => {
        // there needs to be an active token
        if (!activeToken) {
            return;
        }

        // set as inactive
        setTokenMenuActive(false);

        // get the strings before the token
        const pre = [];
        let current: PromptToken | null = null;
        const post = [];

        // find the index of the token
        for (let idx = 0, len = tokens.length; idx < len; idx++) {
            const t = tokens[idx];

            if (tokens[idx].id === activeToken.token) {
                current = t;
                continue;
            } else if (!current) {
                pre.push(t);
            } else {
                post.push(t);
            }
        }

        // check if the token is there
        if (!current || current.type !== 'text') {
            return;
        }

        // if there is stuff before add it as a node
        const before = current.value.slice(0, activeToken.offset);
        if (before) {
            pre.push({
                id: generateTokenId(),
                type: 'text',
                value: before,
            });
        }

        const updated: PromptToken = {
            id: generateTokenId(),
            type: type,
            name: activeToken.text,
            value: '',
        };

        // if there is stuff after add it as a node
        const after = current.value.slice(
            activeToken.offset + activeToken.text.length,
            current.value.length,
        );
        if (after) {
            post.unshift({
                id: generateTokenId(),
                type: 'text',
                value: after,
            });
        }

        // update the tokens
        setTokens([...pre, updated, ...post]);
    };

    /**
     * Render the view of a token
     * @param token - token that will be rendered
     * @returns the rendered token
     */
    const renderToken = (token: PromptToken) => {
        if (token.type === 'input') {
            return (
                <Chip
                    variant={'outlined'}
                    label={token.name}
                    sx={{ display: 'inline' }}
                />
            );
        }

        return <>{token.value}</>;
    };

    /**
     * Preview the token the view of a token
     * @param token - token that will be rendered
     * @returns the rendered token
     */
    const previewToken = (token: PromptToken) => {
        if (token.type === 'input') {
            return (
                <TextField
                    size="small"
                    defaultValue={''}
                    variant={'outlined'}
                    label={token.name}
                />
            );
        }

        return <>{token.value}</>;
    };

    // rest the tokens when the prompt changes
    useEffect(() => {
        const updated: PromptToken[] = [];

        // only add a token if it is prompt
        if (prompt) {
            updated.push({
                id: generateTokenId(),
                type: 'text',
                value: prompt,
            });
        }

        setTokens(updated);
    }, [prompt]);

    return (
        <StyledContainer spacing={2}>
            <Select
                label="Select Prompt"
                defaultValue={''}
                onChange={(e) => {
                    // set the prompt
                    setPrompt(e.target.value as string);
                }}
            >
                {PROMPTS_API.map((p) => (
                    <Select.Item key={p.id} value={p.prompt}>
                        {p.name}
                    </Select.Item>
                ))}
            </Select>
            <StyledTokenContainer onMouseUp={(e) => handleTokenActivate(e)}>
                {tokens.map((t) => {
                    return (
                        <span key={t.id} data-token={t.id}>
                            {renderToken(t)}
                        </span>
                    );
                })}
            </StyledTokenContainer>
            <Menu
                open={tokenMenuActive}
                //@ts-expect-error This is an error in the typing of the component
                anchorReference="anchorPosition"
                anchorPosition={
                    tokenMenuPosition !== null ? tokenMenuPosition : undefined
                }
            >
                <Menu.Item
                    dense
                    onClick={() => {
                        convertToToken('input');
                    }}
                    value={''}
                >
                    To Input
                </Menu.Item>
            </Menu>
            <StyledTokenContainer>
                {tokens.map((t) => {
                    return (
                        <span key={t.id} data-token={t.id}>
                            {previewToken(t)}
                        </span>
                    );
                })}
            </StyledTokenContainer>
            <Stack direction={'row'} justifyContent={'flex-end'}>
                <Button
                    variant="contained"
                    onClick={() => {
                        // run the pixel
                        actions.run({
                            PROMPT: {
                                type: 'custom',
                                value: prompt,
                            },
                        });
                    }}
                >
                    Save
                </Button>
            </Stack>
        </StyledContainer>
    );
};

PromptNode.guid = 'prompt-node';
PromptNode.config = {
    parameters: {
        PROMPT: {
            type: 'custom',
            value: [],
        },
    },
    input: [],
    output: ['PROMPT'],
};
PromptNode.display = {
    name: 'Prompt',
    description: '',
    icon: '',
};
PromptNode.toPixel = () => '';
