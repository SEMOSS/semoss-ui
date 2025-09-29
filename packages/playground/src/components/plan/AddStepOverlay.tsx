import { Close } from "@mui/icons-material";
import type React from "react";
import {
    Button,
    IconButton,
    Modal,
    Stack,
    Typography
} from "@semoss/ui";


interface AddStepOverlayProps {
    /** Callback triggered when the tool model is closed */
    onClose: (success: boolean, step?: {
        position: number;
        details: unknown;
    }) => void;
}



export const AddStepOverlay: React.FC<AddStepOverlayProps> = (props) => {
    const { onClose } = props;

    return (
        <Modal
            open={true}
            onClose={() => onClose(false)}
            aria-labelledby="Add step"
            aria-describedby="Add step"
            maxWidth={"md"}
            fullWidth={true}
            scroll="paper"
        >
            <Modal.Title>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Add Step</Typography>
                    <IconButton size="small" onClick={() => onClose(false)}>
                        <Close />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content>
                <Stack direction={"column"} spacing={2}>
                    <Modal.ContentText>
                        Add a new step to your plan.
                    </Modal.ContentText>
                    <Stack direction={"row"} width={"100%"} spacing={3}>
                        Details
                    </Stack>

                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button variant="text" onClick={() => onClose(false)}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        onClose(true);
                    }}
                >
                    Add
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
