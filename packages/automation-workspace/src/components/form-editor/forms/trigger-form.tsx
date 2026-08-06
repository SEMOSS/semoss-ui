import { CopyButton } from "./shared";

export interface TriggerFormProps {
	/** Id of the app the trigger pixel call targets */
	appId: string;
}

export function TriggerForm({ appId }: TriggerFormProps) {
	const triggerCall = `TriggerAutomation(project=["${appId}"])`;

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border border-border bg-muted/30 p-3">
				<p className="mb-1.5 font-medium text-xs">
					Trigger from another app
				</p>
				<div className="flex items-center gap-2">
					<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
						{triggerCall}
					</code>
					<CopyButton value={triggerCall} />
				</div>
				<p className="mt-1.5 text-[10px] text-muted-foreground">
					Copy this code into any button or app to start this
					automation.
				</p>
			</div>
		</div>
	);
}
