import type { WaitConfig } from "../../../domain/automation.types";
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
				Maximum 3600 seconds (1 hour). You can reference an earlier
				step's output — see Help for details.
			</p>
		</div>
	);
}
