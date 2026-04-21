import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { IconButton, Stack, styled } from "@semoss/ui";
import { toast } from "@semoss/ui/next";

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
	const [feedback, setFeedback] = useState<"true" | "false" | null>(
		initialValue,
	);

	const handleFeedback = (value: "true" | "false") => {
		if (feedback) return;

		setFeedback(value);
		onFeedbackCall(messageId, value);

		toast.success("Successfully added feedback");
	};

	return (
		<Stack direction="row" display="flex" alignItems="center">
			<StyledIcon
				onClick={() => handleFeedback("true")}
				disabled={!!feedback}
			>
				<ThumbsUp className="size-4" />
			</StyledIcon>

			<StyledIcon
				onClick={() => handleFeedback("false")}
				disabled={!!feedback}
			>
				<ThumbsDown className="size-4" />
			</StyledIcon>
		</Stack>
	);
};
