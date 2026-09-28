import { CircleAlert, CircleX, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Spinner } from "@semoss/ui/next";
import type { Session } from "@/types/session";

export interface SidebarRoomStatus {
	icon: ReactNode;
	label: string;
	className: string;
	priority: number;
	keywords: string;
}

/** Returns the effective, actionable room status in display priority order. */
export function getSidebarRoomStatus(room: Session): SidebarRoomStatus | null {
	if (room.status === "Stopped") {
		return {
			icon: <CircleX className="size-3.5" aria-hidden="true" />,
			label: "Error",
			className: "text-destructive",
			priority: 0,
			keywords: "error failed stopped",
		};
	}

	if (room.status === "Your review") {
		return {
			icon: <CircleAlert className="size-3.5" aria-hidden="true" />,
			label: "Needs your review",
			className: "text-warning",
			priority: 1,
			keywords: "pending review needs your review your turn",
		};
	}

	if (room.status === "In progress") {
		return {
			icon: (
				<Spinner
					className="size-3.5 motion-reduce:animate-none"
					aria-hidden="true"
				/>
			),
			label: "Working",
			className: "text-primary",
			priority: 2,
			keywords: "working in progress running",
		};
	}

	if (room.unread) {
		return {
			icon: <Mail className="size-3.5" aria-hidden="true" />,
			label: "Unread",
			className: "text-primary",
			priority: 3,
			keywords: "unread new update",
		};
	}

	return null;
}
