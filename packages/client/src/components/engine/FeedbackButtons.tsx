import { ThumbDownOffAlt, ThumbUpOffAlt } from "@mui/icons-material";
import { Box, IconButton, Snackbar } from "@mui/material";
import { useState } from "react";
import { styled } from "@semoss/ui";

interface FeedbackButtonsProps {
	messageId: string;
	onFeedbackCall: (messageId: string, value: "true" | "false") => void;
	initialValue?: "true" | "false" | null;
}

const StyledIcon = styled(IconButton)(() => ({
	opacity: 0.7,
	padding: 0,
}));

const StyledSnackBar = styled(Snackbar)(({ theme }) => ({
	"& .MuiSnackbarContent-root": {
		background: theme.palette.primary.main,
		color: theme.palette.primary.contrastText,
	},
}));

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
	messageId,
	onFeedbackCall,
	initialValue = null,
}) => {
	const [feedback, setFeedback] = useState<"true" | "false" | null>(
		initialValue,
	);
	const [showThanks, setShowThanks] = useState(false);

	const handleFeedback = (value: "true" | "false") => {
		if (feedback) return;

		setFeedback(value);
		onFeedbackCall(messageId, value);
		setShowThanks(true);
	};

	return (
		<Box display="flex" alignItems="center" mt={1}>
			<StyledIcon
				onClick={() => handleFeedback("true")}
				disabled={!!feedback}
			>
				<ThumbUpOffAlt fontSize="small" />
			</StyledIcon>

			<StyledIcon
				onClick={() => handleFeedback("false")}
				disabled={!!feedback}
			>
				<ThumbDownOffAlt fontSize="small" />
			</StyledIcon>

			{showThanks && (
				<StyledSnackBar
					open={showThanks}
					message="Thank you for your feedback!"
					autoHideDuration={3000}
					onClose={() => setShowThanks(false)}
					anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				/>
			)}
		</Box>
	);
};
