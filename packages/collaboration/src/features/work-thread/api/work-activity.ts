import { download } from "@semoss/sdk";
import {
	type AuditLogReportParams,
	buildExportAuditLogReportPixel,
	type EventData,
} from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions } from "@/lib/pixel";

const text = z
	.string()
	.nullish()
	.transform((value) => value ?? "");
/** Validate audit rows before passing them to shared report components. */
export const threadAuditSchema = z.object({
	totalCount: z.number().int().nonnegative(),
	logs: z.array(
		z
			.object({
				requestId: z.string().optional(),
				startTime: text,
				endTime: text,
				logTimestamp: text,
				request: text,
				response: text,
				tokens: z
					.union([z.string(), z.number()])
					.nullish()
					.transform((value) =>
						value == null ? null : String(value),
					),
				latency: z
					.number()
					.nullish()
					.transform((value) => value ?? 0),
				status: z.string().nullable(),
				engineName: text,
				engineType: text,
				methodName: text,
				userName: text,
				userId: text,
				sessionId: text,
				spanId: text,
				guardrailAction: z.string().nullish(),
				cacheReadTokens: z.number().optional(),
				cacheCreationTokens: z.number().optional(),
				promptTokens: z.number().optional(),
				responseTokens: z.number().optional(),
			})
			.transform(
				(row): EventData => ({
					...row,
					startTime: row.startTime ?? "",
					endTime: row.endTime ?? "",
					logTimestamp: row.logTimestamp ?? "",
					request: row.request ?? "",
					response: row.response ?? "",
					tokens: row.tokens ?? null,
					latency: row.latency ?? 0,
					status: row.status ?? null,
					engineName: row.engineName ?? "",
					engineType: row.engineType ?? "",
					userId: row.userId ?? "",
					sessionId: row.sessionId ?? "",
					spanId: row.spanId ?? "",
				}),
			),
	),
});
/** Export only the room scope and filters currently displayed. */
export async function exportThreadAudit(
	actions: InsightActions,
	insightId: string,
	params: AuditLogReportParams,
	count: number,
	pdf: boolean,
): Promise<void> {
	if (!params.scope.roomId)
		throw new Error("Open a conversation before exporting activity.");
	const key = await callPixel(
		actions,
		buildExportAuditLogReportPixel(params, count || 50, 0, pdf),
		z.string().min(1),
	);
	await download(insightId, key);
}
