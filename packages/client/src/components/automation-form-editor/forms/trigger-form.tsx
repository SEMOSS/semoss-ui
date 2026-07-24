import { CopyButton } from "./shared";

export function TriggerForm({ appId }: { appId: string }) {
	const pixelCall = `TriggerAutomation(project=["${appId}"])`;

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border border-border bg-muted/30 p-3">
				<p className="mb-1.5 font-medium text-xs">
					Pixel call (from any app or the SEMOSS console)
				</p>
				<div className="flex items-center gap-2">
					<code className="flex-1 break-all rounded bg-muted px-2 py-1 font-mono text-[10px]">
						{pixelCall}
					</code>
					<CopyButton value={pixelCall} />
				</div>
				<p className="mt-1.5 text-[10px] text-muted-foreground">
					Use this in a button's pixel expression or any app insight
					to trigger this automation on demand.
				</p>
			</div>
		</div>
	);
}
