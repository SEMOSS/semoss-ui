import { cn } from "@semoss/ui/next";
import type { Agent } from "@/features/agents/types/agent";

export function RuntimeAgentAvatar({
	agent,
	size = "md",
}: {
	agent: Agent;
	size?: "xs" | "sm" | "md" | "lg";
}) {
	const initials = agent.name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-accent font-medium text-link",
				{
					"size-6 text-xs": size === "xs",
					"size-8 text-xs": size === "sm",
					"size-10 text-sm": size === "md",
					"size-16 text-lg": size === "lg",
				},
			)}
		>
			{initials}
		</span>
	);
}
