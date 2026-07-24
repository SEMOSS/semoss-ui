import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@semoss/ui/next";
import type { AutomationConfigEntry } from "@/pages/automation/automation.types";

interface AutomationConfigTabProps {
	config: AutomationConfigEntry[];
	onChange: (config: AutomationConfigEntry[]) => void;
}

export function AutomationConfigTab({
	config,
	onChange,
}: AutomationConfigTabProps) {
	const [revealed, setRevealed] = useState<Set<number>>(new Set());

	const add = () =>
		onChange([...config, { key: "", value: "", sensitive: false }]);

	const update = (i: number, patch: Partial<AutomationConfigEntry>) =>
		onChange(config.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

	const remove = (i: number) =>
		onChange(config.filter((_, idx) => idx !== i));

	const toggleReveal = (i: number) => {
		const next = new Set(revealed);
		next.has(i) ? next.delete(i) : next.add(i);
		setRevealed(next);
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			{config.length === 0 ? (
				<p className="rounded-md border border-border border-dashed py-8 text-center text-muted-foreground text-xs">
					No config entries yet. Add one below.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{/* header */}
					<div className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-1">
						<span className="font-medium text-muted-foreground text-xs">
							Key
						</span>
						<span className="font-medium text-muted-foreground text-xs">
							Value
						</span>
						<span className="font-medium text-muted-foreground text-xs">
							Sensitive
						</span>
						<span />
					</div>

					{config.map((entry, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: config entries have no stable id; list only grows/shrinks at the end, never reorders
							key={i}
							className="grid grid-cols-[1fr_2fr_auto_auto] items-center gap-2"
						>
							<Input
								value={entry.key}
								onChange={(e) =>
									update(i, { key: e.target.value })
								}
								placeholder="KEY_NAME"
								className="font-mono text-xs"
							/>
							<div className="relative flex items-center">
								<Input
									value={entry.value}
									onChange={(e) =>
										update(i, { value: e.target.value })
									}
									placeholder="value or https://..."
									type={
										entry.sensitive && !revealed.has(i)
											? "password"
											: "text"
									}
									className="pr-8 text-xs"
								/>
								{entry.sensitive && (
									<button
										type="button"
										onClick={() => toggleReveal(i)}
										className="absolute right-2 text-muted-foreground hover:text-foreground"
									>
										{revealed.has(i) ? (
											<EyeOff className="h-3.5 w-3.5" />
										) : (
											<Eye className="h-3.5 w-3.5" />
										)}
									</button>
								)}
							</div>
							<div className="flex items-center justify-center">
								<input
									type="checkbox"
									checked={entry.sensitive}
									onChange={(e) =>
										update(i, {
											sensitive: e.target.checked,
										})
									}
									className="h-3.5 w-3.5 rounded border-border"
									title="Mark as sensitive (stored encrypted)"
								/>
							</div>
							<button
								type="button"
								onClick={() => remove(i)}
								className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			<Button
				variant="outline"
				size="sm"
				className="self-start"
				onClick={add}
			>
				<Plus className="mr-1.5 h-3.5 w-3.5" />
				Add entry
			</Button>

			<div className="rounded-md bg-muted/40 p-3">
				<p className="font-medium text-muted-foreground text-xs">
					Usage in node fields
				</p>
				<ul className="mt-1 space-y-0.5 text-muted-foreground text-xs">
					<li>
						<code className="rounded bg-muted px-1">
							{"${config.MIRTH_API_URL}"}
						</code>{" "}
						— resolved at runtime
					</li>
					<li>
						<code className="rounded bg-muted px-1">
							{"${config.BASE_URL}"}
						</code>{" "}
						— resolved at runtime
					</li>
					<li>Sensitive values are never exposed in run logs.</li>
				</ul>
			</div>
		</div>
	);
}
