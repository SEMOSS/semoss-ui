import { ThumbDownOffAlt, ThumbUpOffAlt } from "@mui/icons-material";
import { useState } from "react";
import { IconButton, Stack, styled, useNotification } from "@semoss/ui";

interface FeedbackButtonsProps {
	messageId: string;
	onFeedbackCall: (messageId: string, value: "true" | "false") => void;
	initialValue?: "true" | "false" | null;
}

const StyledIcon = styled(IconButton)(() => ({
	opacity: 0.7,
	padding: 0,
}));

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
	messageId,
	onFeedbackCall,
	initialValue = null,
}) => {
	const notification = useNotification();

	const [feedback, setFeedback] = useState<"true" | "false" | null>(
		initialValue,
	);

	const handleFeedback = (value: "true" | "false") => {
		if (feedback) return;

		setFeedback(value);
		onFeedbackCall(messageId, value);

		notification.add({
			color: "success",
			message: "Successfully added feedback",
		});
	};

	return (
		<Stack direction="row" display="flex" alignItems="center">
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
		</Stack>
	);
};
