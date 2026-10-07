import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";

/** Work identity stays decorative beside each message's visible author. */
export function WorkMessageAvatar({
	isUser,
}: {
	/** Whether this is the user's own prompt. */ isUser: boolean;
}) {
	if (isUser) return <PersonAvatar name="You" className="size-6" />;
	return (
		<Avatar className="size-6 shrink-0" aria-hidden="true">
			<AvatarFallback className="bg-primary/10 text-primary">
				<Sparkles className="size-4" />
			</AvatarFallback>
		</Avatar>
	);
}
