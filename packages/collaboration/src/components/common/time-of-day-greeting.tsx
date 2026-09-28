import { type LucideIcon, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/** How often to re-read the clock so a page left open rolls over to the next greeting. */
const CLOCK_CHECK_INTERVAL_MS = 60_000;

const GREETINGS = {
	morning: { label: "Good morning", icon: Sunrise },
	afternoon: { label: "Good afternoon", icon: Sun },
	evening: { label: "Good evening", icon: Sunset },
	night: { label: "Good evening", icon: Moon },
} as const satisfies Record<TimeOfDay, { label: string; icon: LucideIcon }>;

/** Maps the local hour of `date` to its greeting period. */
function getTimeOfDay(date: Date): TimeOfDay {
	const hour = date.getHours();
	if (hour < 5) return "night";
	if (hour < 12) return "morning";
	if (hour < 17) return "afternoon";
	if (hour < 21) return "evening";
	return "night";
}

/** Greeting and decorative icon for the user's current local time of day. */
export function TimeOfDayGreeting() {
	const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay(new Date()));

	useEffect(() => {
		const interval = window.setInterval(() => {
			setTimeOfDay(getTimeOfDay(new Date()));
		}, CLOCK_CHECK_INTERVAL_MS);
		return () => window.clearInterval(interval);
	}, []);

	const { label, icon: Icon } = GREETINGS[timeOfDay];
	return (
		<span className="flex items-center gap-2">
			{label}
			<Icon className="size-6 text-warning" aria-hidden="true" />
		</span>
	);
}
