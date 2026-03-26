import { MoonStarIcon, SunIcon } from "lucide-react";
import type React from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useTheme,
} from "@semoss/ui/next";

export const ThemeToggle: React.FC = () => {
	const { theme, setTheme } = useTheme();

	const isDark =
		theme === "dark" ||
		(theme === "system" &&
			document.documentElement.classList.contains("dark"));

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={
						isDark ? "Switch to light mode" : "Switch to dark mode"
					}
					onClick={() => setTheme(isDark ? "light" : "dark")}
				>
					{isDark ? <SunIcon /> : <MoonStarIcon />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isDark ? "Switch to light mode" : "Switch to dark mode"}
			</TooltipContent>
		</Tooltip>
	);
};
