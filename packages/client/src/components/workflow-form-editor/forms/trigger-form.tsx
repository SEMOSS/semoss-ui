import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Env } from "@semoss/sdk";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	EngineOption,
	TriggerConfig,
	TriggerMode,
} from "@/pages/workflow/workflow.types";
import { CopyButton, EngineSelect } from "./shared";

export const TRIGGER_MODE_OPTIONS: {
	value: TriggerMode;
	label: string;
	description: string;
}[] = [
	{
		value: "manual",
		label: "Manual",
		description: "Run manually via the UI or pixel call",
	},
	{
		value: "schedule",
		label: "Scheduled",
		description: "Run on a Quartz cron expression",
	},
	{
		value: "webhook",
		label: "Webhook",
		description: "Run via an HTTP POST with a secret",
	},
	{
		value: "storage-poll",
		label: "Storage Watch",
		description: "Run when new files appear in a storage path",
	},
	{
		value: "db-poll",
		label: "Database Watch",
		description: "Run when a query result changes",
	},
];

export function TriggerForm({
	config,
	appId,
	engines,
	onChange,
	onScheduleActivate,
	onScheduleDeactivate,
	onGenerateWebhookSecret,
}: {
	config: TriggerConfig;
	appId: string;
	engines: Record<string, EngineOption[]>;
	onChange: (c: TriggerConfig) => void;
	onScheduleActivate: (
		cron: string,
		timezone: string,
		recipe: string,
	) => Promise<string | null>;
	onScheduleDeactivate: (jobId: string) => Promise<void>;
	onGenerateWebhookSecret: () => Promise<string | null>;
}) {
	const [activatingSchedule, setActivatingSchedule] = useState(false);
	const [generatingSecret, setGeneratingSecret] = useState(false);
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
	const [pollActivating, setPollActivating] = useState(false);

	const pixelCall = `TriggerWorkflow(project=["${appId}"])`;
	const webhookUrl = `${window.location.origin}${Env.MODULE}/api/workflow/${appId}/trigger`;

	const activateSchedule = async () => {
		if (!config.cronExpression.trim()) return;
		setActivatingSchedule(true);
		try {
			// Remove existing job first — "Apply changes" is an update, not a second registration
			if (config.quartzJobId) {
				await onScheduleDeactivate(config.quartzJobId);
			}
			const recipe = `TriggerWorkflow(project=["${appId}"])`;
			const jobId = await onScheduleActivate(
				config.cronExpression,
				config.cronTimezone ?? "UTC",
				recipe,
			);
			if (jobId) onChange({ ...config, quartzJobId: jobId });
		} finally {
			setActivatingSchedule(false);
		}
	};

	const deactivateSchedule = async () => {
		if (!config.quartzJobId) return;
		setActivatingSchedule(true);
		try {
			await onScheduleDeactivate(config.quartzJobId);
			onChange({ ...config, quartzJobId: undefined });
		} finally {
			setActivatingSchedule(false);
		}
	};

	const generateSecret = async () => {
		setGeneratingSecret(true);
		try {
			const secret = await onGenerateWebhookSecret();
			if (secret) {
				setRevealedSecret(secret);
				onChange({ ...config, webhookSecret: secret });
			}
		} finally {
			setGeneratingSecret(false);
		}
	};

	const activatePoll = async (pollType: "storage-poll" | "db-poll") => {
		const intervalCron =
			pollType === "storage-poll"
				? config.storagePollIntervalCron
				: config.dbPollIntervalCron;
		if (!intervalCron?.trim()) return;
		setPollActivating(true);
		try {
			// Remove existing poll job first before registering updated one
			const existingJobId =
				pollType === "storage-poll"
					? config.storagePollJobId
					: config.dbPollJobId;
			if (existingJobId) {
				await onScheduleDeactivate(existingJobId);
			}
			const recipe = `CheckWorkflowPollTrigger(project=["${appId}"], type=["${pollType}"])`;
			const jobId = await onScheduleActivate(intervalCron, "UTC", recipe);
			if (jobId) {
				if (pollType === "storage-poll")
					onChange({ ...config, storagePollJobId: jobId });
				else onChange({ ...config, dbPollJobId: jobId });
			}
		} finally {
			setPollActivating(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Mode selector */}
			<Field>
				<FieldLabel>Trigger Mode</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(v) =>
						onChange({ ...config, mode: v as TriggerMode })
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TRIGGER_MODE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								<span className="flex flex-col gap-0.5">
									<span>{opt.label}</span>
									<span className="text-[10px] text-muted-foreground">
										{opt.description}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Field>

			{/* Manual — pixel call reference */}
			{config.mode === "manual" && (
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<p className="mb-1.5 font-medium text-xs">
						Pixel call (from any app or custom pixel node)
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
							{pixelCall}
						</code>
						<CopyButton value={pixelCall} />
					</div>
					<p className="mt-1.5 text-[10px] text-muted-foreground">
						Use this in a button's pixel expression or any app
						insight to trigger this workflow on demand.
					</p>
				</div>
			)}

			{/* Schedule */}
			{config.mode === "schedule" && (
				<>
					<Field>
						<FieldLabel>Cron Expression</FieldLabel>
						<Input
							value={config.cronExpression}
							onChange={(e) =>
								onChange({
									...config,
									cronExpression: e.target.value,
								})
							}
							placeholder="0 0 6 * * ?"
							className="font-mono text-sm"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Quartz format. Daily at 6 AM:{" "}
							<code>0 0 6 * * ?</code> · Weekdays 9 AM:{" "}
							<code>0 0 9 ? * MON-FRI</code>
						</p>
					</Field>
					<Field>
						<FieldLabel>Timezone</FieldLabel>
						<Input
							value={config.cronTimezone ?? "UTC"}
							onChange={(e) =>
								onChange({
									...config,
									cronTimezone: e.target.value,
								})
							}
							placeholder="UTC"
						/>
					</Field>

					{/* enable / disable toggle */}
					<div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-sm">
								{config.quartzJobId ? "Enabled" : "Disabled"}
							</span>
							<span className="text-[10px] text-muted-foreground">
								{config.quartzJobId
									? `Job ${config.quartzJobId.slice(0, 8)}…`
									: "Schedule will not run"}
							</span>
						</div>
						{activatingSchedule ? (
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						) : (
							<button
								type="button"
								role="switch"
								aria-checked={!!config.quartzJobId}
								onClick={
									config.quartzJobId
										? deactivateSchedule
										: activateSchedule
								}
								disabled={
									activatingSchedule ||
									(!config.quartzJobId &&
										!config.cronExpression.trim())
								}
								title={
									config.quartzJobId
										? "Disable schedule"
										: "Enable schedule"
								}
								className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
									config.quartzJobId
										? "bg-primary"
										: "bg-input"
								}`}
							>
								<span
									className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
										config.quartzJobId
											? "translate-x-6"
											: "translate-x-1"
									}`}
								/>
							</button>
						)}
					</div>

					{/* apply changes — shown when schedule is active and cron/tz edits haven't been pushed yet */}
					{config.quartzJobId && (
						<Button
							size="sm"
							variant="outline"
							onClick={activateSchedule}
							disabled={
								activatingSchedule ||
								!config.cronExpression.trim()
							}
							className="w-full"
						>
							{activatingSchedule ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : (
								<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
							)}
							Apply Changes
						</Button>
					)}
				</>
			)}

			{/* Webhook */}
			{config.mode === "webhook" && (
				<>
					<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Webhook URL</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
								POST {webhookUrl}
							</code>
							<CopyButton value={webhookUrl} />
						</div>
					</div>
					<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Webhook Secret</p>

						{revealedSecret ? (
							<>
								<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
									Copy this now — it won't be shown again
									after you leave this panel.
								</div>
								<div className="flex items-center gap-2">
									<code className="flex-1 select-all break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px]">
										{revealedSecret}
									</code>
									<CopyButton value={revealedSecret} />
								</div>
							</>
						) : config.webhookSecret ? (
							<p className="text-[10px] text-muted-foreground">
								A secret is configured. Rotate it below to
								generate a new one — the current secret will
								stop working.
							</p>
						) : (
							<p className="text-[10px] text-muted-foreground">
								No secret yet. Generate one — it will be shown
								once so you can copy it.
							</p>
						)}

						<Button
							size="sm"
							variant="outline"
							onClick={generateSecret}
							disabled={generatingSecret}
						>
							{generatingSecret ? (
								<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
							) : (
								<RefreshCw className="mr-1.5 h-3 w-3" />
							)}
							{config.webhookSecret
								? "Rotate Secret"
								: "Generate Secret"}
						</Button>
					</div>
					<div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
						<p className="font-medium text-xs">Example curl</p>
						<div className="flex items-start gap-2">
							<code className="flex-1 whitespace-pre-wrap break-all rounded bg-muted px-2 py-1.5 font-mono text-[10px]">
								{`curl -X POST ${webhookUrl} \\\n  -H "X-Webhook-Secret: ${revealedSecret ?? (config.webhookSecret ? "<your-secret>" : "<generate-a-secret-above>")}"`}
							</code>
							<CopyButton
								value={`curl -X POST ${webhookUrl} -H "X-Webhook-Secret: ${revealedSecret ?? (config.webhookSecret ? "<your-secret>" : "<generate-a-secret-above>")}"`}
							/>
						</div>
					</div>
				</>
			)}

			{/* Storage Poll */}
			{config.mode === "storage-poll" && (
				<>
					<EngineSelect
						label="Storage Engine"
						value={config.storagePollEngineId ?? ""}
						engines={engines.STORAGE ?? []}
						onChange={(v) =>
							onChange({ ...config, storagePollEngineId: v })
						}
						triggerClassName=""
						labelClassName=""
					/>
					<Field>
						<FieldLabel>Watch Path</FieldLabel>
						<Input
							value={config.storagePollPath ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									storagePollPath: e.target.value,
								})
							}
							placeholder="/uploads/incoming"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Workflow fires when the file list in this path
							changes (files added or removed).
						</p>
					</Field>
					<Field>
						<FieldLabel>Poll Frequency (Quartz cron)</FieldLabel>
						<Input
							value={
								config.storagePollIntervalCron ?? "0 * * * * ?"
							}
							onChange={(e) =>
								onChange({
									...config,
									storagePollIntervalCron: e.target.value,
								})
							}
							placeholder="0 * * * * ?"
							className="font-mono text-sm"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Every minute: <code>0 * * * * ?</code> · Every 5
							min: <code>0 0/5 * * * ?</code>
						</p>
					</Field>
					{config.storagePollJobId ? (
						<div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
							Poll active · Job ID:{" "}
							<code className="font-mono">
								{config.storagePollJobId.slice(0, 8)}…
							</code>
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => activatePoll("storage-poll")}
							disabled={
								pollActivating ||
								!config.storagePollEngineId ||
								!config.storagePollPath ||
								!config.storagePollIntervalCron
							}
							className="w-full"
						>
							{pollActivating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : null}
							Activate Storage Watch
						</Button>
					)}
				</>
			)}

			{/* DB Poll */}
			{config.mode === "db-poll" && (
				<>
					<EngineSelect
						label="Database Engine"
						value={config.dbPollEngineId ?? ""}
						engines={engines.DATABASE ?? []}
						onChange={(v) =>
							onChange({ ...config, dbPollEngineId: v })
						}
						triggerClassName=""
						labelClassName=""
					/>
					<Field>
						<FieldLabel>Change Detection Query</FieldLabel>
						<Textarea
							value={config.dbPollQuery ?? ""}
							onChange={(e) =>
								onChange({
									...config,
									dbPollQuery: e.target.value,
								})
							}
							placeholder="SELECT MAX(updated_at) FROM orders"
							className="font-mono text-xs"
							rows={3}
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							The workflow fires when this query's result changes
							between polls. Good patterns:{" "}
							<code>MAX(updated_at)</code>, <code>COUNT(*)</code>.
						</p>
					</Field>
					<Field>
						<FieldLabel>Poll Frequency (Quartz cron)</FieldLabel>
						<Input
							value={config.dbPollIntervalCron ?? "0 * * * * ?"}
							onChange={(e) =>
								onChange({
									...config,
									dbPollIntervalCron: e.target.value,
								})
							}
							placeholder="0 * * * * ?"
							className="font-mono text-sm"
						/>
					</Field>
					{config.dbPollJobId ? (
						<div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
							Poll active · Job ID:{" "}
							<code className="font-mono">
								{config.dbPollJobId.slice(0, 8)}…
							</code>
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => activatePoll("db-poll")}
							disabled={
								pollActivating ||
								!config.dbPollEngineId ||
								!config.dbPollQuery ||
								!config.dbPollIntervalCron
							}
							className="w-full"
						>
							{pollActivating ? (
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
							) : null}
							Activate DB Watch
						</Button>
					)}
				</>
			)}
		</div>
	);
}
