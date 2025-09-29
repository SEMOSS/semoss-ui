import { Close } from "@mui/icons-material";
import type React from "react";
import {
    Button,
    IconButton,
    Modal,
    Stack,
    Typography
} from "@semoss/ui";

interface RemoveStepOverlayProps {
    /** Callback triggered when the tool model is closed */
    onClose: (success: boolean, step?: {
        position: number;
        details: unknown;
    }) => void;
}



export const RemoveStepOverlay: React.FC<RemoveStepOverlayProps> = (props) => {
    const { onClose } = props;

    return (
        <Modal
            open={true}
            onClose={() => onClose(false)}
            aria-labelledby="Remove step"
            aria-describedby="Remove step"
            maxWidth={"md"}
            fullWidth={true}
            scroll="paper"
        >
            <Modal.Title>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Remove Step</Typography>
                    <IconButton size="small" onClick={() => onClose(false)}>
                        <Close />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content>
                <Stack direction={"column"} spacing={2}>
                    <Modal.ContentText>
                        Remove a new step to your plan.
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
                    Remove
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
