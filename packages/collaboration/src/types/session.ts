import type { Origin } from "./origin";

export interface Session {
	id: string;
	agentId: string;
	modelId?: string;
	title: string;
	origin: Origin;
	status: "Your review" | "Ready" | "In progress" | "Stopped";
	updatedAt: string;
	unread: boolean;
	pinned: boolean;
	routine?: boolean;
	preview: string;
}
