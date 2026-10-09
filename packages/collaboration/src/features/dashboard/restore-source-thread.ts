import { getCalendarEvent, getMail } from "@/features/connectors/api/microsoft";
import {
	importCalendarEvent,
	importOutlookMail,
} from "@/features/connectors/api/source-mapping";
import type { ImportedSource } from "@/features/connectors/types";
import type { InsightActions } from "@/lib/pixel";

/** Source-linked local threads can be reconstructed after reload without creating a new chat. */
export async function restoreSourceThread(
	actions: InsightActions,
	threadId: string,
): Promise<ImportedSource | null> {
	if (threadId.startsWith("connected:outlook:"))
		return importOutlookMail(
			await getMail(actions, threadId.slice("connected:outlook:".length)),
			"inbox",
		);
	if (threadId.startsWith("connected:calendar:"))
		return importCalendarEvent(
			await getCalendarEvent(
				actions,
				threadId.slice("connected:calendar:".length),
			),
		);
	return null;
}
