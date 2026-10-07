import { MailPlus, Sparkles } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { ThreadWelcome } from "./thread-welcome";

/** Explicit entry points before a fresh thread opens its composer. */
export function ThreadQuickActions({
	hasSourceEmail,
	onSelect,
	isAssistantOpen = false,
	showWelcome = false,
	isDraftDisabled = false,
}: {
	hasSourceEmail: boolean;
	isAssistantOpen?: boolean;
	/** Only true once history confirms a fresh, idle thread. */
	showWelcome?: boolean;
	isDraftDisabled?: boolean;
	onSelect: (mode: "assistant" | "draft") => void;
}) {
	if (isAssistantOpen && !hasSourceEmail) return null;
	const actions = (
		<fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
			<legend className="sr-only">Thread quick actions</legend>
			{!isAssistantOpen && (
				<Button
					type="button"
					variant="default"
					className="min-h-11"
					onClick={() => onSelect("assistant")}
				>
					<Sparkles aria-hidden="true" />
					Ask Assistant
				</Button>
			)}
			{hasSourceEmail && (
				<Button
					type="button"
					variant="outline"
					className="min-h-11"
					disabled={isDraftDisabled}
					onClick={() => onSelect("draft")}
				>
					<MailPlus aria-hidden="true" className="text-primary" />
					Draft reply
				</Button>
			)}
		</fieldset>
	);
	return showWelcome ? (
		<ThreadWelcome hasSourceEmail={hasSourceEmail}>{actions}</ThreadWelcome>
	) : (
		actions
	);
}
