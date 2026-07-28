import type { WaitConfig } from "../../automation.types";
import { BoundInput } from "./shared";

export function WaitForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: WaitConfig;
	upstreamVars: string[];
	onChange: (c: WaitConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="Seconds to Wait"
				value={config.seconds}
				placeholder="30"
				onChange={(v) => onChange({ ...config, seconds: v })}
				upstreamVars={upstreamVars}
			/>
			<p className="text-muted-foreground text-xs">
				Supports{" "}
				<code className="rounded bg-muted px-1">
					{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal */}
					{"${var}"}
				</code>{" "}
				templates. Maximum 3600 seconds (1 hour). Use{" "}
				<code className="rounded bg-muted px-1">
					{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal */}
					{"${config.KEY}"}
				</code>{" "}
				to reference a config value.
			</p>
		</div>
	);
}
