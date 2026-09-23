import { useState } from "react";
import { cn } from "@semoss/ui/next";
import { agentIcons } from "@/components/common/agent-icons";
import type { Agent, AgentTone } from "@/types/agent";

const avatarColors: Record<AgentTone, string> = {
	green: "bg-accent text-link border-primary/20",
	teal: "bg-chart-2/10 text-chart-2 border-chart-2/20",
	blue: "bg-chart-3/10 text-chart-3 border-chart-3/20",
	amber: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export function AgentAvatar({
	agent,
	size = "md",
	shape = "circle",
}: {
	agent: Agent;
	size?: "xs" | "sm" | "md" | "lg";
	/** Keeps conversational avatars circular while allowing directory portraits. */
	shape?: "circle" | "rounded";
}) {
	const [failed, setFailed] = useState("");
	const Icon = agentIcons[agent.icon];
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden border",
				avatarColors[agent.tone],
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
				<Icon className="size-1/2" />
			)}
		</span>
	);
}
