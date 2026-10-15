import { Avatar, AvatarFallback } from "@semoss/ui/next";

/**
 * Up to two letters for a person: the first letters of their first and last
 * names, or the start of an address that has no name.
 *
 * @param name - A display name or an email address.
 * @return The letters, in upper case, or `?` when there is nothing to use.
 */
export const getAuthorInitials = (name: string): string => {
	const words = name
		.replace(/<[^>]*>/g, " ")
		.replace(/[(),"]/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (words.length === 0) {
		return "?";
	}
	const first = Array.from(words[0]);
	if (words.length === 1 || words[0].includes("@")) {
		return first
			.slice(0, words[0].includes("@") ? 1 : 2)
			.join("")
			.toUpperCase();
	}
	const last = Array.from(words[words.length - 1]);
	return `${first[0]}${last[0]}`.toUpperCase();
};

/** Props for {@link ConnectorAuthorAvatar}. */
export interface ConnectorAuthorAvatarProps {
	/** Who wrote the message. */
	name: string;
}

/**
 * The initials of a message's author, beside their name in a thread or chat,
 * so a reader can follow who says what. Decorative: the name is always shown
 * next to it.
 */
export const ConnectorAuthorAvatar = ({ name }: ConnectorAuthorAvatarProps) => (
	<Avatar aria-hidden className="size-6">
		<AvatarFallback className="font-medium text-muted-foreground text-xs">
			{getAuthorInitials(name)}
		</AvatarFallback>
	</Avatar>
);
