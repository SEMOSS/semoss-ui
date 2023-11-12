import { Grid, IconButton, Modal } from '@semoss/ui';
import CloseIcon from '@mui/icons-material/Close';
import { PromptCard } from './PromptCard';
import { PromptExamples } from './examples';
import { Builder, Token } from '../prompt.types';
import { setBlocksAndOpenUIBuilder } from '../prompt.helpers';
import { useNavigate } from 'react-router-dom';

export function PromptLibraryDialog(props: {
    builder: Builder;
    promptLibraryOpen: boolean;
    closePromptLibrary: () => void;
}) {
    const navigate = useNavigate();

    function openUIBuilderForTemplate(
        title: string,
        context: string,
        inputs: Token[],
        inputTypes: object,
    ) {
        const templateBuilder: Builder = JSON.parse(
            JSON.stringify(props.builder),
        );
        templateBuilder.title.value = templateBuilder.title.value ?? title;
        templateBuilder.context.value = context;
        templateBuilder.inputs.value = inputs;
        templateBuilder.inputTypes.value = inputTypes;
        setBlocksAndOpenUIBuilder(templateBuilder, navigate);
    }

    return (
        <Modal
            onClose={(_, reason: string) => {
                if (reason && reason == 'backdropClick') {
                    return;
                }
                props.closePromptLibrary();
            }}
            aria-labelledby="dialog-title"
            fullWidth
            maxWidth="lg"
            open={props.promptLibraryOpen}
        >
            <Modal.Title sx={{ m: 0, p: 2 }}>Prompt Library</Modal.Title>
            <IconButton
                aria-label="close"
                onClick={() => props.closePromptLibrary()}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <CloseIcon />
            </IconButton>
            <Modal.Content>
                <Grid container spacing={2}>
                    {Array.from(PromptExamples, (examplePrompt, i) => {
                        return (
                            <Grid item xs={4} key={i}>
                                <PromptCard
                                    title={examplePrompt.title}
                                    context={examplePrompt.context}
                                    openUIBuilderForTemplate={() => {
                                        openUIBuilderForTemplate(
                                            examplePrompt.title,
                                            examplePrompt.context,
                                            examplePrompt.inputs,
                                            examplePrompt.inputTypes,
                                        );
                                    }}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            </Modal.Content>
        </Modal>
    );
}
