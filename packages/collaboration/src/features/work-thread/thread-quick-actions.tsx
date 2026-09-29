import { MailPlus, Sparkles } from "lucide-react";
import { Button } from "@semoss/ui/next";

/** Explicit entry points before a fresh thread opens its composer. */
export function ThreadQuickActions({
	hasSourceEmail,
	onSelect,
}: {
	hasSourceEmail: boolean;
	onSelect: (mode: "assistant" | "draft") => void;
}) {
	return (
		<fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
			<legend className="sr-only">Thread quick actions</legend>
			<Button
				type="button"
				variant="outline"
				className="min-h-11"
				onClick={() => onSelect("assistant")}
			>
				<Sparkles aria-hidden="true" />
				Ask Assistant
			</Button>
			{hasSourceEmail && (
				<Button
					type="button"
					variant="outline"
					className="min-h-11"
					onClick={() => onSelect("draft")}
				>
					<MailPlus aria-hidden="true" />
					Draft
				</Button>
			)}
		</fieldset>
	);
}
