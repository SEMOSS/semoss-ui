import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Button, toast } from "@semoss/ui/next";

interface FeedbackButtonsProps {
	messageId: string;
	onFeedbackCall: (messageId: string, value: "true" | "false") => void;
	initialValue?: "true" | "false" | null;
}

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
		<div className="flex items-center">
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={() => handleFeedback("true")}
				disabled={!!feedback}
				className="opacity-70"
			>
				<ThumbsUp className="size-4" />
			</Button>

			<Button
				variant="ghost"
				size="icon-sm"
				onClick={() => handleFeedback("false")}
				disabled={!!feedback}
				className="opacity-70"
			>
				<ThumbsDown className="size-4" />
			</Button>
		</div>
	);
};
