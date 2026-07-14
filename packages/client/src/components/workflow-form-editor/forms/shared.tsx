import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { EngineOption } from "@/pages/workflow/workflow.types";

/**
 * Shared engine dropdown used by all step-form files and the canvas settings panel.
 * Pass `triggerClassName` / `labelClassName` to override default sizing for
 * panel or inline-card contexts.
 */
export function EngineSelect({
	label,
	value,
	engines,
	onChange,
	triggerClassName = "h-8 text-xs",
	labelClassName = "text-xs",
}: {
	label: string;
	value: string;
	engines: EngineOption[];
	onChange: (v: string) => void;
	triggerClassName?: string;
	labelClassName?: string;
}) {
	return (
		<Field>
			<FieldLabel className={labelClassName}>{label}</FieldLabel>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={triggerClassName}>
					<SelectValue
						placeholder={
							engines.length
								? `Select ${label.toLowerCase()}…`
								: "No engines available"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{engines.map((e) => (
						<SelectItem
							key={e.engine_id}
							value={e.engine_id}
							className="py-1.5 text-xs"
						>
							<span className="flex flex-col gap-0.5">
								<span>
									{e.engine_display_name ?? e.engine_name}
								</span>
								<span className="font-mono text-[10px] text-muted-foreground">
									{e.engine_id}
								</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}
