import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { NotificationConfig } from "@/pages/workflow/workflow.types";
import { BoundInput } from "./shared";

export function NotificationForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: NotificationConfig;
	upstreamVars: string[];
	onChange: (c: NotificationConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Recipient User ID"
				value={config.recipientId}
				placeholder="${user_id} or a literal SEMOSS user ID"
				onChange={(v) => onChange({ ...config, recipientId: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Title"
				value={config.title}
				placeholder="Workflow completed: ${run_id}"
				onChange={(v) => onChange({ ...config, title: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Message</FieldLabel>
				<div className="relative">
					<Textarea
						value={config.message}
						onChange={(e) =>
							onChange({ ...config, message: e.target.value })
						}
						placeholder="Processed ${row_count} records. See workflow run for details."
						rows={3}
					/>
					{upstreamVars.length > 0 && (
						<div className="mt-1 flex flex-wrap gap-1">
							{upstreamVars.map((v) => (
								<button
									key={v}
									type="button"
									className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent"
									onClick={() =>
										onChange({
											...config,
											message: `${config.message}\${${v}}`,
										})
									}
								>
									{`\${${v}}`}
								</button>
							))}
						</div>
					)}
				</div>
			</Field>
			<Field>
				<FieldLabel>Priority</FieldLabel>
				<Select
					value={config.priority ?? "MEDIUM"}
					onValueChange={(v) =>
						onChange({
							...config,
							priority: v as NotificationConfig["priority"],
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="HIGH">High</SelectItem>
						<SelectItem value="MEDIUM">Medium</SelectItem>
						<SelectItem value="LOW">Low</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<div className="rounded-md border border-border border-dashed p-3 text-[10px] text-muted-foreground">
				The recipient sees this notification in the SEMOSS notification
				bell. They must have a SEMOSS account — use their exact user ID.
			</div>
		</div>
	);
}
