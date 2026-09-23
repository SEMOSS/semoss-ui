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
}: {
	agent: AvatarAgent;
	size?: "xs" | "sm" | "md" | "lg";
	/** Keeps conversational avatars circular while allowing directory portraits. */
	shape?: "circle" | "rounded";
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
				},
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
				<span className={size === "lg" ? "text-lg" : "text-xs"}>
					{buildInitials(agent.name) || "?"}
				</span>
			)}
		</span>
	);
}
