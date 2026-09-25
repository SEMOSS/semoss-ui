import { Avatar, AvatarFallback, cn } from "@semoss/ui/next";

/** Initials provide a stable identity without importing fictional profile photos. */
export function PersonAvatar({
	name,
	initials,
	className,
}: {
	name: string;
	initials?: string;
	className?: string;
}) {
	const tones = [
		"bg-chart-1/10",
		"bg-chart-2/10",
		"bg-chart-3/10",
		"bg-chart-4/10",
		"bg-chart-5/10",
	];
	const tone =
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
				className={cn("font-medium text-foreground text-xs", tone)}
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
