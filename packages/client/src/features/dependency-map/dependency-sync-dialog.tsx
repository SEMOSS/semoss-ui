import { RefreshCw } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	List,
	Spinner,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type DependencySyncResult,
	syncAutomaticDependencies,
} from "@/api/dependency-map";
import type { DependencyGraphIndex } from "./dependency-graph";

type SyncState =
	| { readonly status: "confirm" }
	| { readonly status: "running" }
	| { readonly status: "done"; readonly result: DependencySyncResult }
	| { readonly status: "failed"; readonly error: string };

interface DependencySyncDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Opens or closes it */
	onOpenChange: (open: boolean) => void;
	/** The network, to name the items that failed */
	index: DependencyGraphIndex | null;
	/** Reads the map again after a sync */
	onSynced: () => void;
	/** Shows an item that failed on the map */
	onJump: (id: string) => void;
}

/**
 * Sync Automatic Dependencies: works out every item's automatic dependencies
 * again from its saved configuration, then says how many of each kind were
 * read and which failed. It cannot be closed while it runs.
 */
export const DependencySyncDialog = ({
	open,
	onOpenChange,
	index,
	onSynced,
	onJump,
}: DependencySyncDialogProps) => {
	const [state, setState] = useState<SyncState>({ status: "confirm" });
	const isRunning = state.status === "running";

	const handleOpenChange = (next: boolean): void => {
		if (isRunning) {
			return;
		}
		onOpenChange(next);
		if (!next) {
			setState({ status: "confirm" });
		}
	};

	const handleSync = async (): Promise<void> => {
		setState({ status: "running" });
		try {
			const result = await syncAutomaticDependencies();
			setState({ status: "done", result });
			onSynced();
		} catch (error: unknown) {
			setState({
				status: "failed",
				error: getErrorMessage(
					error,
					"The automatic dependencies could not be synced.",
				),
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={!isRunning}
				onEscapeKeyDown={(event) => {
					if (isRunning) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isRunning) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Sync Automatic Dependencies</DialogTitle>
					<DialogDescription>
						Works out the automatic dependencies of every engine,
						agent, automation, blocks app and code app again from
						what each has saved. Dependencies people picked are
						kept. It is safe to run again, and may take a while on a
						large platform.
					</DialogDescription>
				</DialogHeader>
				{state.status === "done" ? (
					<output className="flex flex-col gap-3">
						<p className="text-sm">
							Synced. The map shows the new links.
						</p>
						<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
							{(
								[
									["Engines", state.result.engines],
									["Agents", state.result.agents],
									["Automations", state.result.automations],
									["Blocks apps", state.result.blocks],
									["Code apps", state.result.code],
								] as const
							).map(([label, value]) => (
								<div key={label} className="flex flex-col">
									<dt className="text-muted-foreground text-xs">
										{label}
									</dt>
									<dd className="font-medium">
										{value.toLocaleString()}
									</dd>
								</div>
							))}
						</dl>
						{state.result.failed.length > 0 ? (
							<Alert variant="destructive">
								<AlertTitle>
									{state.result.failed.length.toLocaleString()}{" "}
									could not be read
								</AlertTitle>
								<AlertDescription>
									<List className="my-1 ml-4">
										{state.result.failed.map((id) => {
											const node = index?.nodes.get(id);
											return (
												<li key={id}>
													{node ? (
														<Button
															type="button"
															variant="link"
															size="sm"
															className="h-auto p-0"
															onClick={() => {
																handleOpenChange(
																	false,
																);
																onJump(id);
															}}
														>
															{node.name}
														</Button>
													) : (
														id
													)}
												</li>
											);
										})}
									</List>
									Their links stay as they were. The server
									log says why.
								</AlertDescription>
							</Alert>
						) : null}
					</output>
				) : null}
				{state.status === "failed" ? (
					<Alert variant="destructive">
						<AlertDescription>{state.error}</AlertDescription>
					</Alert>
				) : null}
				<DialogFooter>
					{state.status === "done" ? (
						<Button
							type="button"
							onClick={() => handleOpenChange(false)}
						>
							Done
						</Button>
					) : (
						<>
							<Button
								type="button"
								variant="outline"
								disabled={isRunning}
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								disabled={isRunning}
								onClick={() => void handleSync()}
							>
								{isRunning ? (
									<Spinner className="size-4" />
								) : (
									<RefreshCw aria-hidden="true" />
								)}
								{isRunning
									? "Syncing..."
									: state.status === "failed"
										? "Try Again"
										: "Sync"}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
