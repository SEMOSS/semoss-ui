import { CalendarDays, NotepadText, Zap } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@semoss/ui/next";

const SUGGESTIONS = [
	{
		label: "What do I need to do today?",
		icon: CalendarDays,
		prompt: "Look at my mail, chats and calendar and tell me what I need to do today, most important first.",
	},
	{
		label: "Prep me for my next meeting",
		icon: NotepadText,
		prompt: "Prepare me for my next meeting today: who is in it, the latest threads with them, files shared, what I owe them and questions to ask.",
	},
	{
		label: "What am I waiting on?",
		icon: Zap,
		prompt: "What am I waiting on from other people, how long has each been waiting, and who should I nudge?",
	},
];

/** Starter questions fill the ask box; nothing is sent until the owner presses Send. */
export function TodaySuggestions() {
	const navigate = useNavigate();
	return (
		<div className="mt-4 flex flex-wrap justify-center gap-3">
			{SUGGESTIONS.map(({ label, icon: Icon, prompt }) => (
				<Button
					key={label}
					type="button"
					variant="outline"
					className="h-11 rounded-full bg-card px-5 has-[>svg]:px-5"
					onClick={() =>
						void navigate("/", { replace: true, state: { prompt } })
					}
				>
					<Icon aria-hidden="true" />
					{label}
				</Button>
			))}
		</div>
	);
}
