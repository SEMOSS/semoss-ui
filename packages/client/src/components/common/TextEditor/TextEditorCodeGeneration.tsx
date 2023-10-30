import { useState, useMemo } from 'react';
import {
    Button,
    Modal,
    IconButton,
    TextField,
    Skeleton,
    useNotification,
    styled,
    Typography,
    Stack,
    Select,
    Menu,
} from '@semoss/ui';
import {
    AutoAwesome,
    ContentCopyOutlined,
    ExpandMore,
} from '@mui/icons-material/';

import { usePixel, useRootStore } from '@/hooks';

const StyledGenerateButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'full',
})<{
    /** Track if the button should be full width */
    full: boolean;
}>(({ theme, full }) => {
    const palette = theme.palette as unknown as {
        purple: Record<string, string>;
    };

    return {
        backgroundColor: palette.purple['400'],
        color: theme.palette.background.paper,
        gap: theme.spacing(1),
        width: full ? '100%' : '',
        '&:hover': {
            backgroundColor: palette.purple['200'],
        },
    };
});

const StyledExpandCode = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    background: theme.palette.secondary.main,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0px 0px`,
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.secondary.light,
    borderRadius: `0px 0px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
    padding: theme.spacing(2),
    margin: '0px',
    overflowX: 'scroll',
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
}));

const StyledSkeletonContainer = styled('div')(() => ({
    height: '200px',
}));

export const TextEditorCodeGeneration = () => {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [model, setModel] = useState('');
    const [code, setCode] = useState('');
    const [prompt, setPrompt] = useState('');

    const myEngines = usePixel<{ app_id: string; app_name: string }[]>(`
    MyEngines(engineTypes=['MODEL']);
    `);

    const options = useMemo(() => {
        if (myEngines.status !== 'SUCCESS') {
            return [];
        }

        return myEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
        }));
    }, [myEngines.status, myEngines.data]);

    /**
     * Assitant for adding code
     *
     */
    const generateCode = async () => {
        try {
            if (!model) {
                throw new Error('Model is required');
            }

            if (!prompt) {
                throw new Error('Prompt is required');
            }

            // turn on loading
            setIsLoading(true);

            const response = await monolithStore.runQuery(
                `LLM(engine=["${model}"], command=["${prompt}"])`,
            );

            const { output, operationType } = response.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                throw new Error(output);
            }

            // Regex anything between the 3 backticks
            const codeMatch = output.response.match(
                /```[\s\S]*?\n([\s\S]*)\n```/,
            );

            // TODO: Figure out if there is a particular LLM that will have a consistent response structure
            if (!codeMatch) {
                throw new Error('Unable to parse generated code');
            }

            // Will this be multiple indexes
            if (codeMatch.length > 1) {
                setCode(codeMatch[1]);
            }
        } catch (e) {
            console.log(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn off loading
            setIsLoading(false);
        }
    };

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
    };

    return (
        <>
            <StyledGenerateButton
                full={true}
                variant="contained"
                color="secondary"
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                <AutoAwesome />
                Generate Code
            </StyledGenerateButton>
            {/* Generate Code Modal */}
            <Modal open={isOpen} maxWidth="xl">
                <Modal.Title>
                    <Typography variant="h5">Generate Code</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Stack direction="column">
                        <Select
                            fullWidth={true}
                            label={'Model'}
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        >
                            {options.map((m) => (
                                <Menu.Item key={m.app_id} value={m.app_id}>
                                    {m.app_name}
                                </Menu.Item>
                            ))}
                        </Select>
                        <TextField
                            fullWidth={true}
                            label="Prompt"
                            helperText={
                                'Example prompt: "Write me a html form that intakes patient information"'
                            }
                            onKeyDown={(e) => {
                                if (e.code === 'Enter') {
                                    generateCode();
                                }
                            }}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                            }}
                            rows={3}
                        ></TextField>
                        {isLoading ? (
                            <>
                                <StyledSkeletonContainer>
                                    <Skeleton
                                        variant={'rectangular'}
                                        width={'100%'}
                                        height={'100%'}
                                    />
                                </StyledSkeletonContainer>
                            </>
                        ) : null}
                        {!isLoading && code ? (
                            <div>
                                <StyledExpandCode>
                                    &nbsp;
                                    <Button
                                        size={'medium'}
                                        variant="outlined"
                                        startIcon={
                                            <ContentCopyOutlined
                                                color={'inherit'}
                                            />
                                        }
                                        onClick={() => copy(code)}
                                    >
                                        Copy
                                    </Button>
                                </StyledExpandCode>
                                <StyledCodeBlock>
                                    <StyledCodeContent>
                                        {code}
                                    </StyledCodeContent>
                                </StyledCodeBlock>
                            </div>
                        ) : null}
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => {
                            setIsOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <StyledGenerateButton
                        full={false}
                        onClick={() => {
                            generateCode();
                        }}
                    >
                        Generate
                    </StyledGenerateButton>
                </Modal.Actions>
            </Modal>
        </>
    );
};
