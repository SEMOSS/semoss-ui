import { useNavigate } from "react-router";
import { Button } from "@semoss/ui/next";

const SUGGESTIONS = [
	{
		label: "What do I need to do today?",
		prompt: "Look at my mail, chats and calendar and tell me what I need to do today, most important first.",
	},
	{
		label: "Prep me for my next meeting",
		prompt: "Prepare me for my next meeting today: who is in it, the latest threads with them, files shared, what I owe them and questions to ask.",
	},
	{
		label: "What am I waiting on?",
		prompt: "What am I waiting on from other people, how long has each been waiting, and who should I nudge?",
	},
];

/** Starter questions fill the ask box; nothing is sent until the owner presses Send. */
export function TodaySuggestions() {
	const navigate = useNavigate();
	return (
		<div className="mt-2 flex flex-wrap gap-2">
			{SUGGESTIONS.map(({ label, prompt }) => (
				<Button
					key={label}
					type="button"
					size="sm"
					variant="outline"
					className="h-8 rounded-full font-normal text-muted-foreground"
					onClick={() =>
						void navigate("/", { replace: true, state: { prompt } })
					}
				>
					{label}
				</Button>
			))}
		</div>
	);
}
