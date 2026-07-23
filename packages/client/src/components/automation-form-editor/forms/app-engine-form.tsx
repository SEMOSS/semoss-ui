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
import type {
	AutomationNode,
	CustomPixelConfig,
	ProjectOption,
} from "@/pages/automation/automation.types";

interface AppEngineStepFormProps {
	step: AutomationNode;
	upstreamVars: string[];
	onUpdate: (step: AutomationNode) => void;
}

export function AppEngineStepForm({
	step,
	upstreamVars,
	onUpdate,
}: AppEngineStepFormProps) {
	const c = step.config as unknown as Record<string, unknown>;
	const varHint =
		upstreamVars.length > 0
			? `\${${upstreamVars[upstreamVars.length - 1]}}`
			: undefined;

	return (
		<Field>
			<FieldLabel className="text-xs">Pixel expression</FieldLabel>
			<Textarea
				className="min-h-[100px] font-mono text-xs"
				value={(c.pixel ?? c.pixelExpression ?? "") as string}
				onChange={(e) =>
					onUpdate({
						...step,
						config: {
							...c,
							pixel: e.target.value,
							pixelExpression: e.target.value,
						} as unknown as typeof step.config,
					})
				}
				placeholder={
					varHint
						? `SqlQuery(database=["id"], query=["<encode>${varHint}</encode>"]);`
						: `SqlQuery(database=["id"], query=["<encode>\${query}</encode>"]);`
				}
				rows={5}
			/>
		</Field>
	);
}

export function AppEngineForm({
	config,
	projects,
	upstreamVars,
	onChange,
}: {
	config: CustomPixelConfig;
	projects: ProjectOption[];
	upstreamVars: string[];
	onChange: (c: CustomPixelConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>App / Project Context (optional)</FieldLabel>
				<Select
					value={config.appId ?? ""}
					onValueChange={(v) =>
						onChange({
							...config,
							appId: v === "__none__" ? "" : v,
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Run in default context" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__none__">
							<span className="text-muted-foreground">
								None (default context)
							</span>
						</SelectItem>
						{projects.map((p) => (
							<SelectItem
								key={p.project_id}
								value={p.project_id}
								className="py-1.5 text-xs"
							>
								<span className="flex flex-col gap-0.5">
									<span>
										{p.project_display_name ??
											p.project_name}
									</span>
									<span className="font-mono text-[10px] text-muted-foreground">
										{p.project_id}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="mt-1 text-muted-foreground text-xs">
					When set, the pixel runs inside this app's insight context.
				</p>
			</Field>
			<Field>
				<FieldLabel>Pixel Expression</FieldLabel>
				<p className="mb-1 text-muted-foreground text-xs">
					Use{" "}
					<code className="rounded bg-muted px-1">
						{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal example */}
						{"${varName}"}
					</code>{" "}
					to reference upstream outputs or{" "}
					<code className="rounded bg-muted px-1">
						{/* biome-ignore lint/suspicious/noTemplateCurlyInString: literal example */}
						{"${config.KEY}"}
					</code>{" "}
					for SMSS config.
				</p>
				<Textarea
					value={config.pixel}
					onChange={(e) =>
						onChange({ ...config, pixel: e.target.value })
					}
					placeholder="SyncEsrMetadata(apiUrl=&quot;${config.MIRTH_API_URL}&quot;)"
					className="font-mono text-xs"
					rows={6}
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
										pixel: `${config.pixel}\${${v}}`,
									})
								}
							>
								{`\${${v}}`}
							</button>
						))}
					</div>
				)}
			</Field>
		</div>
	);
}
