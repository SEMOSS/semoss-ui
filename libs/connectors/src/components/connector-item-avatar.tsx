import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, cn } from "@semoss/ui/next";
import { getAuthorInitials } from "./connector-author-avatar";

// The colors a name can have: the ones light letters read on. Solid on the light theme; a tint on the dark theme,
// whose chart colors run too light for light letters. chart-4 and chart-5 are yellows, which light letters are lost on.
const TONES = [
	"bg-chart-1 dark:bg-chart-1/40",
	"bg-chart-2 dark:bg-chart-2/40",
	"bg-chart-3 dark:bg-chart-3/40",
	"bg-primary dark:bg-primary/40",
];

/** Props for {@link ConnectorItemAvatar}. */
interface ConnectorItemAvatarProps {
	/**
	 * Who the item is from, or what a group is called. It picks the color, so
	 * a name keeps its color down a list, and gives the initials.
	 */
	name: string;
	/** Drawn in place of the initials, for an item that is not one person's, such as a group chat. */
	icon?: LucideIcon;
	/**
	 * Where the person's picture is, when the host has one to show. It covers
	 * the initials once it loads, and one that cannot be read leaves them.
	 */
	photoUrl?: string;
}

/**
 * What a row leads with where a host gives its viewer a page: a colored disc
 * with the initials of who the item is from, as a mail app has beside each
 * email, under their picture where the host has one. Decorative: the row
 * names the person beside it.
 */
export const ConnectorItemAvatar = ({
	name,
	icon: Icon,
	photoUrl,
}: ConnectorItemAvatarProps) => {
	// the picture that could not be read, so another person's is still tried
	const [failedPhotoUrl, setFailedPhotoUrl] = useState<string>();
	let sum = 0;
	for (const letter of name) {
		sum += letter.charCodeAt(0);
	}
	return (
		<Avatar aria-hidden className="me-1 size-9">
			<AvatarFallback
				className={cn(
					"font-medium text-primary-foreground text-sm",
					TONES[sum % TONES.length],
				)}
			>
				{Icon ? <Icon className="size-4.5" /> : getAuthorInitials(name)}
			</AvatarFallback>
			{photoUrl && photoUrl !== failedPhotoUrl ? (
				// a plain image over the initials, which show until it loads: it is not asked for until its row
				// is near the screen, where the avatar primitive's image loads at once
				<img
					src={photoUrl}
					alt=""
					loading="lazy"
					className="absolute inset-0 size-full object-cover"
					onError={() => setFailedPhotoUrl(photoUrl)}
				/>
			) : null}
		</Avatar>
	);
};
