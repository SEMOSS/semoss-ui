import { Avatar, AvatarFallback, cn } from "@semoss/ui/next";

/** Initials provide a stable identity without importing fictional profile photos. */
export function PersonAvatar({
	name,
	initials,
	className,
	tone,
}: {
	name: string;
	initials?: string;
	className?: string;
	/** Replaces the color picked from the name. */
	tone?: string;
}) {
	const tones = [
		"bg-chart-1/10 text-chart-1",
		"bg-chart-2/10 text-chart-2",
		"bg-chart-3/10 text-chart-3",
		"bg-primary/10 text-primary",
	];
	const nameTone =
		tones[
			[...name].reduce(
				(value, letter) => value + letter.charCodeAt(0),
				0,
			) % tones.length
		];
	return (
		<Avatar
			className={cn("size-10 shrink-0", className)}
			aria-hidden="true"
		>
			<AvatarFallback
				// some chart colors are too deep to read as text on the dark theme
				className={cn(
					"font-medium text-xs dark:text-foreground",
					tone ?? nameTone,
				)}
			>
				{initials ||
					name
						.split(/\s+/)
						.slice(0, 2)
						.map((part) => part[0])
						.join("")
						.toUpperCase()}
			</AvatarFallback>
		</Avatar>
	);
}
