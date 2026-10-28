import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	getServingCapacity,
	removeServedModel,
	type ServedModel,
	type ServingCapacity,
	startServedModel,
	stopServedModel,
} from "@/api/model-serving";

/** A change an admin makes to a served model from the page */
export type ServedModelChange = "start" | "replace" | "stop" | "remove";

/** A change that waits for the admin to confirm it */
export interface ServedModelConfirmation {
	change: "replace" | "stop" | "remove";
	model: ServedModel;
	/** For a replace, the models it stops first */
	blocking: string[];
}

/** What `useServedModelActions` gives the page */
export interface ServedModelActions {
	/** The change under way for each model, by name */
	busy: Readonly<Record<string, ServedModelChange>>;
	/** The change last asked about; it stays while its dialog closes */
	confirmation: ServedModelConfirmation | null;
	/** Whether the change is waiting for a confirmation */
	isAsking: boolean;
	/** Start a model now, or ask first when starting it stops others. */
	start: (model: ServedModel) => Promise<void>;
	/** Ask to stop or remove a model. */
	ask: (change: "stop" | "remove", model: ServedModel) => void;
	/** Make the confirmed change; rejects with the reason, leaving it to confirm again. */
	confirm: () => Promise<void>;
	/** Drop the confirmation. */
	dismiss: () => void;
}

/** The models a start with replace would stop to make room, when it can. */
function replaceBlocking(
	capacity: ServingCapacity | null,
	servedModel: string,
): string[] | null {
	const fit = capacity?.models.find(
		(model) => model.servedModel === servedModel,
	);
	return fit?.canStart === false &&
		fit.canReplace === true &&
		fit.blocking &&
		fit.blocking.length > 0
		? fit.blocking
		: null;
}

const NAME_LIST = new Intl.ListFormat("en", { type: "conjunction" });

/** The list of names in words: "a", "a and b", "a, b, and c". */
export function joinNames(names: readonly string[]): string {
	return NAME_LIST.format(names);
}

/**
 * Start, stop and remove served models, asking first for the changes that
 * interrupt someone, and calling `onChanged` after each one so the page reads
 * the models again.
 */
export function useServedModelActions(
	capacity: ServingCapacity | null,
	onChanged: () => void,
): ServedModelActions {
	const [busy, setBusy] = useState<Record<string, ServedModelChange>>({});
	// the change last asked about stays while its dialog closes, so the
	// dialog's words do not change during the animation
	const [confirmation, setConfirmation] =
		useState<ServedModelConfirmation | null>(null);
	const [isAsking, setIsAsking] = useState(false);

	const askFor = (next: ServedModelConfirmation): void => {
		setConfirmation(next);
		setIsAsking(true);
	};

	/** Make one change, with its toast; rejects when it fails. */
	const run = async (
		change: ServedModelChange,
		model: ServedModel,
	): Promise<void> => {
		const name = model.servedModel;
		setBusy((previous) => ({ ...previous, [name]: change }));
		try {
			if (change === "start" || change === "replace") {
				const result = await startServedModel(
					name,
					change === "replace",
				);
				toast.success(
					result.replaced.length > 0
						? `Stopped ${joinNames(result.replaced)}; starting ${name}.`
						: result.changed
							? `Starting ${name}.`
							: `${name} is already starting or ready.`,
				);
				for (const warning of result.warnings) {
					toast.warning(warning);
				}
			} else if (change === "stop") {
				const result = await stopServedModel(name);
				toast.success(
					result.changed
						? `Stopping ${name}.`
						: `${name} is already stopped.`,
				);
			} else {
				const result = await removeServedModel(name);
				toast.success(
					result.removed ? `Removed ${name}.` : `Removing ${name}.`,
				);
			}
		} finally {
			setBusy((previous) => {
				const { [name]: _done, ...rest } = previous;
				return rest;
			});
			onChanged();
		}
	};

	const start = async (model: ServedModel): Promise<void> => {
		const blocking = replaceBlocking(capacity, model.servedModel);
		if (blocking) {
			askFor({ change: "replace", model, blocking });
			return;
		}
		try {
			await run("start", model);
		} catch (cause: unknown) {
			// the capacity may have changed since the page read it; when the
			// model now fits only in place of others, ask to replace them
			const latest = await getServingCapacity().catch(() => null);
			const latestBlocking = replaceBlocking(latest, model.servedModel);
			if (latestBlocking) {
				askFor({ change: "replace", model, blocking: latestBlocking });
				return;
			}
			toast.error(
				getErrorMessage(cause, `${model.servedModel} did not start.`),
			);
		}
	};

	const ask = (change: "stop" | "remove", model: ServedModel): void => {
		askFor({ change, model, blocking: [] });
	};

	const confirm = async (): Promise<void> => {
		if (!confirmation || !isAsking) {
			return;
		}
		await run(confirmation.change, confirmation.model);
		setIsAsking(false);
	};

	return {
		busy,
		confirmation,
		isAsking,
		start,
		ask,
		confirm,
		dismiss: () => setIsAsking(false),
	};
}
