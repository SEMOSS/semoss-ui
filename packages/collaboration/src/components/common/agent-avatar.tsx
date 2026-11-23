import { useState } from "react";
import { cn } from "@semoss/ui/next";
import { buildInitials } from "@semoss/utility";

interface AvatarAgent {
	name: string;
	avatar?: string;
}

export function AgentAvatar({
	agent,
	size = "md",
	shape = "circle",
	className,
}: {
	agent: AvatarAgent;
	/** `xl` is the portrait of a scene the agent is the subject of. */
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	/** Keeps conversational avatars circular while allowing directory portraits. */
	shape?: "circle" | "rounded";
	/** Sizes or positions the portrait for its containing surface. */
	className?: string;
}) {
	const [failed, setFailed] = useState("");
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden border border-primary/20 bg-accent font-medium text-primary",
				shape === "circle" ? "rounded-full" : "rounded-xl",
				{
					"size-6": size === "xs",
					"size-8": size === "sm",
					"size-10": size === "md",
					"size-16": size === "lg",
					"size-24": size === "xl",
				},
				className,
			)}
		>
			{agent.avatar && failed !== agent.avatar ? (
				<img
					src={agent.avatar}
					alt=""
					className="size-full object-cover"
					onError={() => setFailed(agent.avatar ?? "")}
				/>
			) : (
				<span
					className={
						size === "xl"
							? "text-3xl"
							: size === "lg"
								? "text-lg"
								: "text-xs"
					}
				>
					{/* two letters fit every size; a long name's would spill out of the circle. A possessive is
					    no word of its own: "Ryan's Digital Twin" is RD, not RS. */}
					{buildInitials(
						agent.name.replace(/['’]s(?=\s|$)/g, ""),
						2,
					) || "?"}
				</span>
			)}
		</span>
	);
}
