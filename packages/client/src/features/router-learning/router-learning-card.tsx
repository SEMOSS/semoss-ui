import { useState } from "react";
import { useSession } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Muted,
	Spinner,
	Switch,
} from "@semoss/ui/next";
import { useRouterLearning } from "./use-router-learning";

const MAX_CHANGES = 2;
const LINE_LENGTH = 60;

const trim = (text: string) =>
	text.length > LINE_LENGTH ? `${text.slice(0, LINE_LENGTH - 3)}...` : text;
const when = (instant?: string) =>
	instant
		? new Date(instant).toLocaleString([], {
				dateStyle: "medium",
				timeStyle: "short",
			})
		: "-";
const usd = (micros: number) => `$${(micros / 1e6).toFixed(4)}`;

interface RouterLearningCardProps {
	/** Id of the model router engine */
	engineId: string;
}

/**
 * The Learning card of a model router's settings: the switch, the cost per step from the
 * oldest to the live version, the models in use and the version history with undo.
 */
export const RouterLearningCard = ({ engineId }: RouterLearningCardProps) => {
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	const { query, costs, config, setLearning, rollback } =
		useRouterLearning(engineId);
	const status = query.status === "SUCCESS" && query.data ? query.data : null;
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [rollbackTo, setRollbackTo] = useState<string | null>(null);

	/** Runs a change, showing why it failed in the card. */
	const attempt = async (action: () => Promise<void>) => {
		setBusy(true);
		setError("");
		try {
			await action();
			return true;
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : String(e));
			return false;
		} finally {
			setBusy(false);
		}
	};

	const routes = config?.routes ?? [];
	// the model that proposes changes: the one already set, else the strongest route, else the first
	const optimizerModelId =
		status?.optimizer_model ||
		(routes.find((r) => r.name === config?.strong_route) ?? routes[0])
			?.engine_id;
	const [draft, setDraft] = useState<string | null>(null);
	const shown = draft ?? String(status?.min_new_tasks ?? "");
	const validDraft = /^\d+$/.test(shown.trim());
	const [picked, setPicked] = useState<string | null>(null);
	const turnOn = (frequency = picked ?? undefined) =>
		attempt(() =>
			setLearning({
				engineId,
				enabled: true,
				optimizerModelId,
				minNewTasks: validDraft ? Number(shown) : undefined,
				frequency,
			}),
		);
	/** Saves the number when it changed and learning is on; off, it is sent when the switch goes on. */
	const commitDraft = () => {
		if (
			status?.enabled &&
			validDraft &&
			Number(shown) !== status.min_new_tasks
		) {
			turnOn();
		}
	};
	const doRollback = async (version: string) => {
		if (await attempt(() => rollback(version))) {
			setRollbackTo(null);
		}
	};

	const versions = status?.versions ?? [];
	const locked =
		!isAdmin || busy || !(status?.mode === "subtask" || status?.enabled);

	// the cost of the oldest version that has one, and of the live version
	const cost = new Map(
		(costs?.cost_by_version ?? []).map((c) => [
			c.config_version,
			c.avg_cost_micros_per_priced_step,
		]),
	);
	const oldest = [...versions]
		.reverse()
		.find((v) => typeof cost.get(v.version) === "number");
	const before = oldest ? cost.get(oldest.version) : undefined;
	const now = cost.get(status?.current_version ?? "");
	const models = config?.subtasks?.length
		? config.subtasks.map((s) => ({
				key: s.id,
				label: trim(s.definition || s.id),
				model: s.route,
			}))
		: routes.map((r) => ({ key: r.engine_id, label: "", model: r.name }));

	return (
		<Card>
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-3">
					<CardTitle>Learning</CardTitle>
					{status ? (
						<div className="flex items-center gap-2">
							{busy ? <Spinner className="size-4" /> : null}
							{status.enabled && status.paused ? (
								<Button
									type="button"
									size="sm"
									disabled={locked}
									onClick={() => turnOn()}
								>
									Resume
								</Button>
							) : null}
							<Switch
								aria-label="Learning"
								checked={status.enabled}
								disabled={locked}
								onCheckedChange={(on) =>
									on
										? turnOn()
										: attempt(() =>
												setLearning({
													engineId,
													enabled: false,
												}),
											)
								}
							/>
						</div>
					) : null}
				</div>
				<Muted>
					Lets this router get cheaper over time. Every change is
					tested first and can be undone.
				</Muted>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{query.status === "ERROR" ? (
					<Alert variant="destructive">
						<AlertDescription>
							{query.error?.message ||
								"The router learning status could not be read"}
						</AlertDescription>
					</Alert>
				) : !status ? (
					<div className="flex justify-center py-4">
						<Spinner />
					</div>
				) : (
					<>
						{!isAdmin ? (
							<Muted>Only an admin can change learning.</Muted>
						) : status.mode !== "subtask" && !status.enabled ? (
							<Muted>Learning applies to subtask routers.</Muted>
						) : null}
						{status.min_new_tasks !== undefined ? (
							<div className="flex flex-col gap-1">
								<label
									htmlFor={`${engineId}-min-new-tasks`}
									className="text-sm"
								>
									Learn after this many new tasks
								</label>
								<Input
									id={`${engineId}-min-new-tasks`}
									className="w-40"
									inputMode="numeric"
									value={shown}
									disabled={!isAdmin || busy}
									aria-invalid={!validDraft}
									onChange={(e) => setDraft(e.target.value)}
									onBlur={commitDraft}
									onKeyDown={(e) =>
										e.key === "Enter" && commitDraft()
									}
								/>
								{status.new_tasks_since_last_attempt !==
								undefined ? (
									<Muted>{`${status.new_tasks_since_last_attempt} so far. Learning starts within minutes of this many new tasks coming in.`}</Muted>
								) : null}
							</div>
						) : null}
						{status.frequency !== undefined ? (
							<div className="flex flex-col gap-1">
								<label
									htmlFor={`${engineId}-frequency`}
									className="text-sm"
								>
									Also check
								</label>
								<select
									id={`${engineId}-frequency`}
									className="h-9 w-40 rounded-md border bg-background px-2 text-sm"
									value={picked ?? status.frequency}
									disabled={!isAdmin || busy}
									onChange={(e) => {
										setPicked(e.target.value);
										if (status.enabled) {
											turnOn(e.target.value);
										}
									}}
								>
									<option value="off">Off</option>
									<option value="hourly">Every hour</option>
									<option value="daily">Every day</option>
									<option value="weekly">Every week</option>
									{status.frequency === "custom" ? (
										<option value="custom" disabled>
											Custom
										</option>
									) : null}
								</select>
								<Muted>
									Or sooner when this many new tasks have
									piled up. Skipped when nothing new came in.
								</Muted>
							</div>
						) : null}
						{error ? (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						) : null}

						{typeof before === "number" &&
						typeof now === "number" &&
						oldest?.version !== status.current_version ? (
							<div className="text-sm">
								{`Cost per step: ${usd(before)} -> ${usd(now)}`}
							</div>
						) : null}

						{models.length > 0 ? (
							<section className="flex flex-col gap-2">
								<h4 className="font-medium text-base">
									Models in use
								</h4>
								{models.map((m) => (
									<div
										key={m.key}
										className="flex justify-between gap-3 text-sm"
									>
										<span>{m.label}</span>
										<span className="font-medium">
											{m.model}
										</span>
									</div>
								))}
							</section>
						) : null}

						<section className="flex flex-col gap-2">
							<h4 className="font-medium text-base">History</h4>
							{versions.map((v) => {
								const changes = v.changes ?? [];
								return (
									<div
										key={v.version}
										className="flex items-start justify-between gap-3 border-b pb-2"
									>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-medium">
													{v.version}
												</span>
												<Muted>
													{when(v.committed_at)}
												</Muted>
											</div>
											<ul className="list-disc pl-5 text-sm">
												{changes
													.slice(0, MAX_CHANGES)
													.map((line) => (
														<li key={line}>
															{trim(line)}
														</li>
													))}
												{changes.length >
												MAX_CHANGES ? (
													<li className="list-none">
														{`+${changes.length - MAX_CHANGES} more`}
													</li>
												) : null}
											</ul>
										</div>
										{v.version ===
										status.current_version ? (
											<Badge>Live</Badge>
										) : (
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={locked}
												aria-label={`Undo to ${v.version}`}
												onClick={() =>
													setRollbackTo(v.version)
												}
											>
												Undo
											</Button>
										)}
									</div>
								);
							})}
						</section>
					</>
				)}
			</CardContent>
			<Dialog
				open={rollbackTo !== null}
				onOpenChange={(open) =>
					open || busy ? null : setRollbackTo(null)
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Undo to {rollbackTo}</DialogTitle>
						<DialogDescription>
							This restores {rollbackTo} as a new commit, applies
							it to the running router now, and pauses learning
							until you resume it.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={() => setRollbackTo(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={busy}
							onClick={() => rollbackTo && doRollback(rollbackTo)}
						>
							{busy ? <Spinner className="size-4" /> : null}
							Roll back
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
