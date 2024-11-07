import { useEffect, useState } from 'react';
import {
    Button,
    Stack,
    Typography,
    TextField,
    styled,
    Modal,
    FormControl,
    Autocomplete,
} from '@semoss/ui';
import { usePixel, useRootStore } from '@/hooks';
import { ModeCommentOutlined } from '@mui/icons-material';
import { validateHeaderName } from 'http';

interface PromptModalProps {
    isOpen: boolean;
    onClose(reload: boolean): void;
    mode: string;
    inputContext?: any;
    inputTitle?: any;
    inputIntent?: any;
    inputTags?: any;
    prompt?: any;
}

const StyledStack = styled(Stack)(() => ({
    margin: '24px 16px',
}));

const StyledTypographyLabel = styled(Typography)(() => ({
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    /* Typography/Body 1 */
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '150%' /* 24px */,
    letterSpacing: '0.15px',
}));

const StyledTypographyTitle = styled(Typography)(() => ({
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    /* Typography/Body 1 */
    fontFamily: 'Inter',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '160%' /* 24px */,
    letterSpacing: '0.15px',
}));

export const PromptModal = (props: PromptModalProps) => {
    const { configStore, monolithStore } = useRootStore();
    const { isOpen, onClose, mode, prompt } = props;
    const [context, setContext] = useState('');
    const [title, setTitle] = useState('');
    const [intent, setIntent] = useState('');
    const [tags, setTags] = useState([]);

    const addPrompt = () => {
        const promptMap = {
            context: context,
            title: title,
            intent: intent,
            tags: tags,
        };
        const stringified =
            'AddPrompt ( map = [' + JSON.stringify(promptMap) + ' ])';
        monolithStore.runQuery(stringified).then((response) => {
            const { pixelReturn } = response;
            onClose(true);
        });
    };

    const updatePrompt = () => {
        console.log(prompt);
        const promptMap = {
            context: context,
            title: title,
            intent: intent,
            tags: tags,
            id: prompt['id'],
        };
        const stringified =
            'UpdatePrompt ( map = [' + JSON.stringify(promptMap) + ' ])';
        monolithStore.runQuery(stringified).then((response) => {
            const { pixelReturn } = response;
            onClose(true);
        });
    };

    const disableCreate = () => {
        return title == '' || title == null || context == '' || context == null;
    };

    const createContextString = () => {
        const stringArr = [];
        if (prompt?.['inputs']) {
            prompt['inputs'].forEach((input) => {
                let currInput = '';
                if (input.type != 'text') {
                    currInput = '{{' + input.key + '}}';
                    stringArr.push(currInput);
                } else {
                    stringArr.push(input.key);
                }
            });

            return stringArr.join(' ');
        } else if (prompt?.['context']) {
            return prompt?.['context'];
        }

        return '';
    };

    useEffect(() => {
        if (mode == 'Edit' || prompt != null) {
            console.log(createContextString());
            setContext(createContextString());
            setTitle(prompt['title']);
            setIntent(prompt['intent']);
            setTags(prompt['tags']);
        }
    }, [mode, prompt]);
    return (
        <Modal open={isOpen} maxWidth={'md'} fullWidth={true}>
            <Modal.Title>{mode} Prompt</Modal.Title>
            <Modal.Content>
                <StyledStack
                    spacing={2}
                    direction={'column'}
                    alignItems={'flex-start'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Prompt Title
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <TextField
                            variant={'outlined'}
                            value={title}
                            fullWidth
                            sx={{ width: '100%' }}
                            onChange={(e) => {
                                setTitle(e.target.value);
                            }}
                        ></TextField>
                    </FormControl>
                </StyledStack>
                <StyledStack
                    spacing={2}
                    direction={'column'}
                    alignItems={'flex-start'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Prompt Context
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <TextField
                            variant={'outlined'}
                            value={context}
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ width: '100%' }}
                            onChange={(e) => {
                                setContext(e.target.value);
                            }}
                        ></TextField>
                    </FormControl>
                </StyledStack>
                <StyledStack
                    spacing={2}
                    direction={'column'}
                    alignItems={'flex-start'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Intent
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <TextField
                            label={'Intent'}
                            variant={'outlined'}
                            value={intent}
                            sx={{ width: '100%' }}
                            fullWidth
                            onChange={(e) => {
                                setIntent(e.target.value);
                            }}
                        ></TextField>
                    </FormControl>
                </StyledStack>
                <StyledStack
                    spacing={2}
                    direction={'column'}
                    alignItems={'flex-start'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Tags
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <Autocomplete
                            value={tags}
                            fullWidth
                            multiple
                            onChange={(_, newValue) => {
                                setTags(newValue);
                            }}
                            options={[]}
                            freeSolo
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder='Press "Enter" to add tag'
                                />
                            )}
                        />
                    </FormControl>
                </StyledStack>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button
                    color={'primary'}
                    variant={'contained'}
                    onClick={() => {
                        if (mode == 'Edit') {
                            updatePrompt();
                        } else {
                            addPrompt();
                        }
                    }}
                    disabled={disableCreate()}
                >
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
