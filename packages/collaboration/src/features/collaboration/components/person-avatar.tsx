import { Avatar, AvatarFallback } from "@semoss/ui/next";

/** Initials provide a stable identity without importing fictional profile photos. */
export function PersonAvatar({
	name,
	initials,
}: {
	name: string;
	initials?: string;
}) {
	return (
		<Avatar className="size-9 shrink-0" aria-hidden="true">
			<AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
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
