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
    width: '100px',
}));

export const PromptModal = (props: PromptModalProps) => {
    const { configStore, monolithStore } = useRootStore();
    const { isOpen, onClose, mode, prompt } = props;
    const [context, setContext] = useState('');
    const [title, setTitle] = useState('');
    const [intent, setIntent] = useState('');
    const [tags, setTags] = useState([]);

    const addPrompt = () => {
        let promptMap = {
            context: context,
            title: title,
            intent: intent,
            tags: tags,
        };
        let stringified =
            'AddPrompt ( map = [' + JSON.stringify(promptMap) + ' ])';
        monolithStore.runQuery(stringified).then((response) => {
            const { pixelReturn } = response;
            onClose(true);
        });
    };

    const updatePrompt = () => {
        console.log(prompt);
        let promptMap = {
            context: context,
            title: title,
            intent: intent,
            tags: tags,
            id: prompt['ID'],
        };
        let stringified =
            'UpdatePrompt ( map = [' + JSON.stringify(promptMap) + ' ])';
        monolithStore.runQuery(stringified).then((response) => {
            const { pixelReturn } = response;
            onClose(true);
        });
    };

    useEffect(() => {
        if (mode == 'Edit') {
            setContext(prompt['CONTEXT']);
            setTitle(prompt['TITLE']);
            setIntent(prompt['INTENT']);
            setTags(prompt['tags']);
        }
    }, [mode, prompt]);
    return (
        <Modal open={isOpen} maxWidth={'md'} fullWidth={true}>
            <Modal.Title>{mode} Prompt</Modal.Title>
            <Modal.Content>
                <StyledStack
                    spacing={2}
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Context
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <TextField
                            label={'Context'}
                            variant={'outlined'}
                            value={context}
                            fullWidth
                            sx={{ width: '100%' }}
                            onChange={(e) => {
                                setContext(e.target.value);
                            }}
                        ></TextField>
                    </FormControl>
                </StyledStack>
                <StyledStack
                    spacing={2}
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <StyledTypographyLabel variant="body1">
                        Title
                    </StyledTypographyLabel>
                    <FormControl fullWidth>
                        <TextField
                            label={'Title'}
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
                    direction={'row'}
                    alignItems={'center'}
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
                    direction={'row'}
                    alignItems={'center'}
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
                                console.log(newValue);
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
                >
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
