import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";

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
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Good response"
						aria-pressed={feedback === "true"}
						onClick={() => handleFeedback("true")}
						disabled={!!feedback}
						className="opacity-70"
					>
						<ThumbsUp className="size-4" aria-hidden />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Good response</TooltipContent>
			</Tooltip>

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Poor response"
						aria-pressed={feedback === "false"}
						onClick={() => handleFeedback("false")}
						disabled={!!feedback}
						className="opacity-70"
					>
						<ThumbsDown className="size-4" aria-hidden />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Poor response</TooltipContent>
			</Tooltip>
		</div>
	);
};
