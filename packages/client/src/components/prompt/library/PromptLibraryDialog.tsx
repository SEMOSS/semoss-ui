import { Grid, IconButton, Modal } from '@semoss/ui';
import CloseIcon from '@mui/icons-material/Close';
import { PromptCard } from './PromptCard';
import { PromptExamples } from './examples';

export function PromptLibraryDialog(props: {
    promptLibraryOpen: boolean;
    closePromptLibrary: () => void;
}) {
    return (
        <Modal
            onClose={(_, reason: string) => {
                if (reason && reason == 'backdropClick') {
                    return;
                }
                props.closePromptLibrary();
            }}
            aria-labelledby="dialog-title"
            // disableEscapeKeyDown
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
                    {Array.from(PromptExamples, (example, i) => {
                        return (
                            <Grid item xs={4} key={i}>
                                <PromptCard
                                    description={example.description}
                                    context={example.context}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            </Modal.Content>
        </Modal>
    );
}
