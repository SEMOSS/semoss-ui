import { Close } from "@mui/icons-material";
import type React from "react";
import { Button, IconButton, Modal, Stack, Typography } from "@semoss/ui";

interface LinkStepOverlayProps {
	/** Callback triggered when the tool model is closed */
	onClose: (success: boolean) => void;
}

export const LinkStepOverlay: React.FC<LinkStepOverlayProps> = (props) => {
	const { onClose } = props;

	return (
		<Modal
			open={true}
			onClose={() => onClose(false)}
			aria-labelledby="Link tool"
			aria-describedby="Link tool"
			maxWidth={"md"}
			fullWidth={true}
			scroll="paper"
		>
			<Modal.Title>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="h6">Link Tool</Typography>
					<IconButton size="small" onClick={() => onClose(false)}>
						<Close />
					</IconButton>
				</Stack>
			</Modal.Title>
			<Modal.Content>
				<Stack direction={"column"} spacing={2}>
					<Modal.ContentText>
						Link a tool to this step.
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
					Link
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
