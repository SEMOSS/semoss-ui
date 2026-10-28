import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	linkServedModelEngine,
	listServedModelEngines,
	type ServedModelEngineLink,
	type ServedModelEngineList,
	unlinkServedModelEngine,
} from "@/api/model-serving";
import { usePolledRead } from "./use-polled-read";

/** A served model's engines */
export interface ServedModelEngineGroup {
	/** Linked to it, so they say when it is stopped */
	linked: ServedModelEngineLink[];
	/** Calling it without the link, such as engines made by hand */
	unlinked: ServedModelEngineLink[];
}

const NO_ENGINES: ServedModelEngineGroup = { linked: [], unlinked: [] };

/** The engines linked to a served model, and those that call it without the link. */
export function groupEngines(
	list: ServedModelEngineList | null,
	servedModel: string,
): ServedModelEngineGroup {
	if (!list) {
		return NO_ENGINES;
	}
	return {
		linked: list.engines.filter(
			(engine) =>
				engine.servedModel === servedModel &&
				(engine.namespace === null ||
					list.namespace === null ||
					engine.namespace === list.namespace),
		),
		unlinked: list.engines.filter(
			(engine) =>
				engine.servedModel === null &&
				engine.calls.includes(servedModel),
		),
	};
}

/** A served model that is gone from the cluster while engines are still linked to it */
export interface MissingServedModel {
	servedModel: string;
	/** The engines linked to its name, which cannot answer until it is back */
	engines: ServedModelEngineLink[];
}

/**
 * The served models that engines are linked to but the cluster does not have,
 * such as one whose InferenceService was deleted with kubectl. Their engines
 * answer again once a model of that name is back, so the page offers to define
 * it again. Nothing is missing while either list is still unread.
 */
export function findMissingModels(
	list: ServedModelEngineList | null,
	existingNames: readonly string[] | null,
): MissingServedModel[] {
	if (!list || !existingNames) {
		return [];
	}
	const missing = new Map<string, ServedModelEngineLink[]>();
	for (const engine of list.engines) {
		const name = engine.servedModel;
		const isThisNamespace =
			engine.namespace === null ||
			list.namespace === null ||
			engine.namespace === list.namespace;
		if (name && isThisNamespace && !existingNames.includes(name)) {
			missing.set(name, [...(missing.get(name) ?? []), engine]);
		}
	}
	return [...missing.entries()]
		.map(([servedModel, engines]) => ({ servedModel, engines }))
		.sort((one, other) => one.servedModel.localeCompare(other.servedModel));
}

/** Where an engine's settings are */
export const engineSettingsPath = (engineId: string): string =>
	`/settings/model/${encodeURIComponent(engineId)}`;

/** What `useServedModelEngines` gives the page */
export interface ServedModelEnginesResult {
	/** The engines; null until they are first read */
	list: ServedModelEngineList | null;
	error: string | null;
	isLoading: boolean;
	refresh: () => void;
	/** The engines being linked or unlinked, by id */
	busy: ReadonlySet<string>;
	/** Link an engine to a served model; rejects with the reason it was refused. */
	link: (servedModel: string, engine: ServedModelEngineLink) => Promise<void>;
	/** Unlink an engine, saying how it went in a toast. */
	unlink: (engine: ServedModelEngineLink) => Promise<void>;
}

/** The engines change only when someone changes them, so they are read on request */
const readOnRequest = (): null => null;

/**
 * The model engines of the served models, read once and again after each
 * change, with the actions that link and unlink them.
 */
export function useServedModelEngines(): ServedModelEnginesResult {
	const { value, error, isLoading, refresh } = usePolledRead(
		listServedModelEngines,
		readOnRequest,
	);
	const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());

	/** Run one change to an engine, marking it busy, and read the engines again after. */
	const track = async (
		engineId: string,
		change: () => Promise<void>,
	): Promise<void> => {
		setBusy((previous) => new Set(previous).add(engineId));
		try {
			await change();
		} finally {
			setBusy((previous) => {
				const next = new Set(previous);
				next.delete(engineId);
				return next;
			});
			refresh();
		}
	};

	const link = (
		servedModel: string,
		engine: ServedModelEngineLink,
	): Promise<void> =>
		track(engine.engineId, async () => {
			const result = await linkServedModelEngine(
				servedModel,
				engine.engineId,
			);
			toast.success(
				result.changed
					? `Linked ${engine.engineName} to ${servedModel}.`
					: `${engine.engineName} was already linked to ${servedModel}.`,
			);
		});

	const unlink = (engine: ServedModelEngineLink): Promise<void> =>
		track(engine.engineId, async () => {
			try {
				const result = await unlinkServedModelEngine(engine.engineId);
				toast.success(
					result.changed
						? `Unlinked ${engine.engineName} from ${result.unlinkedFrom ?? engine.servedModel}.`
						: `${engine.engineName} was not linked.`,
				);
			} catch (cause: unknown) {
				toast.error(
					getErrorMessage(
						cause,
						`${engine.engineName} could not be unlinked.`,
					),
				);
			}
		});

	return { list: value, error, isLoading, refresh, busy, link, unlink };
}
