import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	AppConfig,
	ProjectOption,
} from "../../../domain/automation.types";
import { insight } from "../../../semoss/client";
import { BoundInput } from "./shared";

export interface AppEngineFormProps {
	/** Current node config */
	config: AppConfig;
	/** Projects available to run the pixel expression inside of */
	projects: ProjectOption[];
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: AppConfig) => void;
	/** The automation's own project ID — used to fetch reactors when no app context is selected */
	currentAppId: string;
}

export function AppEngineForm({
	config,
	projects,
	upstreamVars,
	onChange,
	currentAppId,
}: AppEngineFormProps) {
	const [reactorSearch, setReactorSearch] = useState("");
	const [sigLoading, setSigLoading] = useState<string | null>(null);
	const [reactorDescription, setReactorDescription] = useState("");
	const [reactorParams, setReactorParams] = useState<
		{
			name: string;
			type: string;
			required: boolean;
			description?: string;
		}[]
	>([]);

	const effectiveProjectId = config.appId || currentAppId;

	const { data: reactorData, status: reactorStatus } = usePixel<string[]>(
		effectiveProjectId
			? `GetProjectAvailableReactors(project=["${effectiveProjectId}"]);`
			: "",
		{ data: [] },
	);

	const reactors = reactorData ?? [];

	const filteredReactors = useMemo(() => {
		const q = reactorSearch.trim().toLowerCase();
		if (!q) return reactors;
		return reactors.filter((r) => r.toLowerCase().includes(q));
	}, [reactors, reactorSearch]);

	const loading = reactorStatus === "INITIAL" || reactorStatus === "LOADING";

	const handleReactorClick = async (name: string) => {
		setSigLoading(name);
		setReactorDescription("");
		setReactorParams([]);
		try {
			const timeout = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), 2000),
			);
			const result = await Promise.race([
				insight.actions.run(
					`GetReactorSignature(project=["${effectiveProjectId}"], reactor=["${name}"]);`,
				),
				timeout,
			]);
			const pixelReturns = result.pixelReturn ?? [];
			const raw = pixelReturns[pixelReturns.length - 1]?.output;
			if (typeof raw === "string") {
				const parsed = JSON.parse(raw) as {
					template?: string;
					description?: string;
					params?: {
						name: string;
						type: string;
						required: boolean;
						description?: string;
					}[];
				};
				onChange({ ...config, pixel: parsed.template ?? `${name}()` });
				if (parsed.description)
					setReactorDescription(parsed.description);
				if (parsed.params?.length) setReactorParams(parsed.params);
			} else {
				onChange({ ...config, pixel: `${name}()` });
			}
		} catch {
			onChange({ ...config, pixel: `${name}()` });
		} finally {
			setSigLoading(null);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel>App Context (optional)</FieldLabel>
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
					Run this function inside a specific app's context
					(optional).
				</p>
			</Field>

			{/* Custom reactor browser */}
			{(loading || reactors.length > 0) && (
				<Field>
					<FieldLabel>Custom Functions</FieldLabel>
					{loading ? (
						<p className="text-muted-foreground text-xs">
							Loading functions...
						</p>
					) : (
						<>
							{reactors.length > 5 && (
								<Input
									value={reactorSearch}
									onChange={(e) =>
										setReactorSearch(e.target.value)
									}
									placeholder="Search functions..."
									className="mb-1.5 h-7 text-xs"
								/>
							)}
							<div className="max-h-36 divide-y overflow-y-auto rounded-lg border">
								{filteredReactors.length === 0 ? (
									<p className="px-3 py-2 text-muted-foreground text-xs">
										No functions match "{reactorSearch}"
									</p>
								) : (
									filteredReactors.map((name) => (
										<button
											key={name}
											type="button"
											disabled={sigLoading !== null}
											className="flex w-full items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors hover:bg-muted disabled:opacity-50"
											onClick={() =>
												handleReactorClick(name)
											}
										>
											<span>{name}</span>
											{sigLoading === name && (
												<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
											)}
										</button>
									))
								)}
							</div>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Click a function to auto-fill its parameters.
							</p>
						</>
					)}
				</Field>
			)}

			<div className="relative">
				<BoundInput
					label="Function Call"
					value={config.pixel}
					placeholder='MyFunction(param=[""])'
					onChange={(v) => onChange({ ...config, pixel: v })}
					upstreamVars={upstreamVars}
					mono
				/>
				{sigLoading !== null && (
					<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>
			{(reactorDescription || reactorParams.length > 0) && (
				<div className="flex flex-col gap-2">
					{reactorDescription && (
						<p className="text-[11px] text-muted-foreground">
							{reactorDescription}
						</p>
					)}
					{reactorParams.length > 0 && (
						<div className="rounded-lg border bg-muted/30 px-3 py-2">
							<p className="mb-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
								Parameters
							</p>
							<div className="flex flex-col gap-1">
								{reactorParams.map((p) => (
									<div
										key={p.name}
										className="flex items-baseline gap-2 text-[11px]"
									>
										<code className="font-mono text-foreground">
											{p.name}
										</code>
										<span className="text-muted-foreground/70">
											{p.type}
										</span>
										<span
											className={
												p.required
													? "text-foreground/60"
													: "text-muted-foreground/50"
											}
										>
											{p.required
												? "required"
												: "optional"}
										</span>
										{p.description && (
											<span className="text-muted-foreground/60">
												— {p.description}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
