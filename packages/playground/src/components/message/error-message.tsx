import { CircleAlert, MessageCircleIcon } from "lucide-react";
import { Alert, AlertTitle, Button } from "@semoss/ui/next";

export interface ErrorMessageProps {
	onTryAgain?: () => void;
}

/**
 * Renders a generic error message component prompting the user to try again
 *
 * @component
 */
export const ErrorMessage = ({ onTryAgain }: ErrorMessageProps) => {
	return (
		<div className="group mb-0 flex w-full flex-col gap-4 overflow-hidden">
			<div className="group flex flex-row items-center gap-2">
				<MessageCircleIcon className="size-4" />
				<span className="mr-0.5 font-medium text-base">AI</span>
			</div>
			<Alert
				variant="destructive"
				className="flex items-center justify-between"
			>
				<div className="flex items-center gap-2">
					<CircleAlert className="aspect-square size-4" />
					<AlertTitle>
						Unable to process request. Please check your connection,
						copy your message, and refresh.
					</AlertTitle>
				</div>
				{onTryAgain && (
					<Button
						onClick={onTryAgain}
						size="sm"
						variant="destructive"
						className="flex h-6 items-center justify-center gap-2 rounded-md bg-custom-background-dark-input-30! px-3 py-2 text-base-foreground! hover:bg-custom-background-dark-input-30! hover:text-base-foreground!"
					>
						Try again
					</Button>
				)}
			</Alert>
		</div>
	);
};
