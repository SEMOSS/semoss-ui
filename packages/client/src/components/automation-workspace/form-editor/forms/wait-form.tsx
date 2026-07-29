import type { WaitConfig } from "../../automation.types";
import { BoundInput } from "./shared";

export interface WaitFormProps {
	/** Current node config */
	config: WaitConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: WaitConfig) => void;
}

export function WaitForm({ config, upstreamVars, onChange }: WaitFormProps) {
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
