import { ScrollTextIcon } from "lucide-react";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { RoomAuditLogReport } from "../room-audit-log-report";

/** The room's activity log. One per sidebar. */
export const ROOM_AUDIT_LOG_PANEL: WorkbenchPanelConfig = {
	name: "Activity Log",
	icon: ({ className }) => <ScrollTextIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: () => <RoomAuditLogReport />,
};
