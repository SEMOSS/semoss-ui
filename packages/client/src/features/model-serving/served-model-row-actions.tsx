import {
	Boxes,
	Copy,
	EllipsisVertical,
	Info,
	Link2,
	Play,
	RotateCcw,
	ScrollText,
	Square,
	SquarePlus,
	Trash2,
} from "lucide-react";
import type { ReactElement } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ServedModel } from "@/api/model-serving";
import type { ServedModelChange } from "./use-served-model-actions";

/** What a row asks the page to do */
export type ServedModelRowAction =
	| "start"
	| "stop"
	| "remove"
	| "details"
	| "logs"
	| "engine"
	| "link-engine"
	| "engines"
	| "copy-endpoint";

export interface ServedModelRowActionsProps {
	model: ServedModel;
	/** The change under way for this model, if any */
	busy: ServedModelChange | undefined;
	onAction: (action: ServedModelRowAction, model: ServedModel) => void;
}

/** The words of a change under way */
const BUSY_LABELS: Record<ServedModelChange, string> = {
	start: "Starting...",
	replace: "Starting...",
	stop: "Stopping...",
	remove: "Removing...",
};

/**
 * A served model's actions: the change its state calls for (Start, Restart or
 * Stop) as a button, and the rest in a menu.
 */
export function ServedModelRowActions({
	model,
	busy,
	onAction,
}: ServedModelRowActionsProps): ReactElement {
	const { state, servedModel } = model;
	const isBusy = busy !== undefined;
	const canStart = state === "STOPPED" || state === "FAILED";
	const canStop =
		state === "READY" ||
		state === "STARTING" ||
		state === "WAITING_FOR_GPU";
	const isLeaving = state === "STOPPING" || state === "REMOVING";

	return (
		<div className="flex items-center justify-end gap-1">
			{isBusy ? (
				<Button size="sm" variant="outline" disabled>
					<Spinner className="size-4" />
					{BUSY_LABELS[busy]}
				</Button>
			) : canStart ? (
				<Button
					size="sm"
					variant="outline"
					onClick={() => onAction("start", model)}
					aria-label={`${state === "FAILED" ? "Restart" : "Start"} ${servedModel}`}
				>
					{state === "FAILED" ? (
						<RotateCcw className="size-4" aria-hidden />
					) : (
						<Play className="size-4" aria-hidden />
					)}
					{state === "FAILED" ? "Restart" : "Start"}
				</Button>
			) : canStop ? (
				<Button
					size="sm"
					variant="outline"
					onClick={() => onAction("stop", model)}
					aria-label={`Stop ${servedModel}`}
				>
					<Square className="size-4" aria-hidden />
					Stop
				</Button>
			) : isLeaving ? (
				<Button size="sm" variant="outline" disabled>
					<Spinner className="size-4" />
					{state === "STOPPING" ? "Stopping..." : "Removing..."}
				</Button>
			) : null}
			{/* the items open dialogs and sheets; a menu that is not modal leaves
			    locking the page to them, so the page is not left unclickable */}
			<DropdownMenu modal={false}>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon-sm"
								variant="ghost"
								aria-label={`More actions for ${servedModel}`}
							>
								<EllipsisVertical
									className="size-4"
									aria-hidden
								/>
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>More actions</TooltipContent>
				</Tooltip>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onSelect={() => onAction("details", model)}
					>
						<Info className="size-4" aria-hidden />
						Details
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onAction("logs", model)}>
						<ScrollText className="size-4" aria-hidden />
						Logs
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => onAction("engines", model)}
					>
						<Boxes className="size-4" aria-hidden />
						Engines
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={!model.endpoint}
						onSelect={() => onAction("copy-endpoint", model)}
					>
						<Copy className="size-4" aria-hidden />
						Copy Endpoint
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => onAction("engine", model)}
					>
						<SquarePlus className="size-4" aria-hidden />
						Create SEMOSS Engine...
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => onAction("link-engine", model)}
					>
						<Link2 className="size-4" aria-hidden />
						Link an Engine...
					</DropdownMenuItem>
					{state === "FAILED" ? (
						<DropdownMenuItem
							disabled={isBusy}
							onSelect={() => onAction("stop", model)}
						>
							<Square className="size-4" aria-hidden />
							Stop
						</DropdownMenuItem>
					) : null}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						disabled={
							!model.managed || isBusy || state === "REMOVING"
						}
						onSelect={() => onAction("remove", model)}
					>
						<Trash2 className="size-4" aria-hidden />
						{model.managed
							? "Remove..."
							: "Remove (defined outside SEMOSS)"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
