import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
import type { EmailConfig } from "@/pages/workflow/workflow.types";
import { BoundInput } from "./shared";

export function EmailForm({
	config,
	upstreamVars,
	onChange,
}: {
	config: EmailConfig;
	upstreamVars: string[];
	onChange: (c: EmailConfig) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<BoundInput
				label="To"
				value={config.to}
				placeholder="user@company.com"
				onChange={(v) => onChange({ ...config, to: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="CC (optional)"
				value={config.cc ?? ""}
				placeholder="manager@company.com"
				onChange={(v) => onChange({ ...config, cc: v })}
				upstreamVars={upstreamVars}
			/>
			<BoundInput
				label="Subject"
				value={config.subject}
				placeholder="Report for ${report_date}"
				onChange={(v) => onChange({ ...config, subject: v })}
				upstreamVars={upstreamVars}
			/>
			<Field>
				<FieldLabel>Body</FieldLabel>
				<div className="relative">
					<Textarea
						value={config.body}
						onChange={(e) =>
							onChange({ ...config, body: e.target.value })
						}
						placeholder="Hello,&#10;&#10;Here are today's results: ${model_out}"
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
											body: `${config.body}\${${v}}`,
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
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/correctness/useUniqueElementIds: single email form instance per panel */}
					<input
						type="checkbox"
						id="email-html"
						checked={config.isHtml ?? false}
						onChange={(e) =>
							onChange({ ...config, isHtml: e.target.checked })
						}
						className="h-3.5 w-3.5 rounded"
					/>
					<label
						htmlFor="email-html"
						className="cursor-pointer text-sm"
					>
						HTML email
					</label>
				</div>
				<p className="mt-1 text-[10px] text-muted-foreground">
					Check this if your body contains HTML markup. Leave
					unchecked for plain text.
				</p>
			</Field>
		</div>
	);
}
