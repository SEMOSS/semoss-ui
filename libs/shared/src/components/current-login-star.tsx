import { Star } from "lucide-react";
import { cn } from "@semoss/ui/next";

/** Props for {@link CurrentLoginStar}. */
export interface CurrentLoginStarProps {
	/** Classes for the badge, such as where it sits */
	className?: string;
}

/**
 * A small star badge for the corner of a login's logo, marking the login the
 * session is signed in with. It is decorative: say so in the logo's title and
 * screen reader text. Its parent needs `relative`.
 */
export const CurrentLoginStar = ({ className }: CurrentLoginStarProps) => (
	<span
		aria-hidden
		className={cn(
			"-end-1 -top-1 absolute flex size-3 items-center justify-center rounded-full bg-background",
			className,
		)}
	>
		<Star className="size-2.5 fill-primary text-primary" />
	</span>
);
