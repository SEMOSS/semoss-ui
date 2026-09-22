import type { Origin } from "./origin";

interface ThreadItem {
	id: string;
	type: "message" | "email" | "document" | "update";
	author?: "You" | string;
	title: string;
	body: string;
	time: string;
	day?: string;
	from?: string;
}

export interface Session {
	id: string;
	agentId: string;
	title: string;
	origin: Origin;
	status: "Your review" | "Ready" | "In progress" | "Stopped";
	updatedAt: string;
	unread: boolean;
	pinned: boolean;
	routine?: boolean;
	preview: string;
	instructions?: string;
	thread: ThreadItem[];
}
