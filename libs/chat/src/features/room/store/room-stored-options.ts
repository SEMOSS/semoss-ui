import { getI18n } from "@semoss/i18n";
import { getPlaygroundRoomOptions, updateRoomOptions } from "@semoss/sdk";
import { stringifyJsonWithSortedKeys } from "@semoss/utility/json";
import type { MCPConfig } from "../../../types";
import type { RoomRequestOptions } from "./room-requests";
import type { RoomOptions } from "./room-snapshot";

/**
 * The MCPs the backend stores for a room. The room's own toolbox, which is
 * read from the room folder, is reported but not stored.
 *
 * @param mcp - The room's MCPs.
 * @returns The ones the backend keeps.
 */
const getStoredMcp = (mcp: MCPConfig[] = []): MCPConfig[] =>
	mcp.filter((item) => !item?.fromRoom);

/**
 * A comparable key for room options as the backend stores them, so a save
 * that would change nothing can be skipped. The agent is compared by id: its
 * name is only shown, and is read from the agent on every load.
 *
 * @param options - The room's options.
 * @returns The options as sorted JSON, without the MCPs it does not store.
 */
const getStoredOptionsKey = (options: {
	mcp?: MCPConfig[];
	workspace?: { workspace_id: string };
}): string =>
	stringifyJsonWithSortedKeys({
		...options,
		mcp: getStoredMcp(options.mcp),
		workspace: options.workspace
			? { workspace_id: options.workspace.workspace_id }
			: undefined,
	});

/** What the room's options persistence needs from its room. */
export interface RoomStoredOptionsDependencies {
	/** The room's id. */
	getRoomId: () => string;
	/** The id of the model the room chats with, saved with its options. */
	getModelId: () => string;
	/** Runs a backend request in the room's insight (`RoomStore.runRoomRequest`). */
	runRequest: <T>(
		request: (insightId: string) => Promise<T>,
		options?: RoomRequestOptions,
	) => Promise<T>;
	/** Takes options into the room, locally. */
	setOptions: (options: Partial<RoomOptions>) => void;
}

/**
 * Keeps the room's options in step with the backend: remembers what the
 * backend holds, as of the last read or save, so a save that would change
 * nothing is skipped.
 */
export class RoomStoredOptions {
	/** What persistence reads from and writes to its room. */
	private readonly deps: RoomStoredOptionsDependencies;

	/** Key of the options the backend holds, or null when it is not known. */
	private storedKey: string | null = null;

	/**
	 * @param deps - What persistence needs from its room.
	 */
	constructor(deps: RoomStoredOptionsDependencies) {
		this.deps = deps;
	}

	/**
	 * Remember the options a load read, or forget them when it read none.
	 *
	 * @param options - The options the backend holds.
	 */
	remember = (options: Partial<RoomOptions> | undefined | null): void => {
		this.storedKey = options ? getStoredOptionsKey(options) : null;
	};

	/**
	 * Read the room's options from the backend, quietly, and take them. A
	 * failed read is logged, never thrown, so the chat isn't disrupted.
	 */
	sync = async (): Promise<void> => {
		try {
			const { options } = await this.deps.runRequest(
				(insightId) =>
					getPlaygroundRoomOptions<RoomOptions>(
						insightId,
						this.deps.getRoomId(),
					),
				{ showLoading: false, setErrorOnFail: false },
			);
			if (!options) {
				return;
			}
			this.deps.setOptions(options);
			this.remember(options);
		} catch (e) {
			console.warn("Failed to sync room options:", e);
		}
	};

	/**
	 * Save the room's options (UpdateRoomOptions) and take them locally. Skips
	 * the save when the backend already holds these options, and leaves the
	 * room's loading state alone, since it runs ahead of the turn that uses them.
	 *
	 * @param options - The full set of new options.
	 * @throws Error when the backend refuses the save.
	 */
	save = async (options: RoomOptions): Promise<void> => {
		try {
			const optionsToSave = {
				...options,
				modelId: this.deps.getModelId(),
				mcp: getStoredMcp(options.mcp),
			};
			const optionsKey = getStoredOptionsKey(optionsToSave);
			if (optionsKey !== this.storedKey) {
				await this.deps.runRequest(
					(insightId) =>
						updateRoomOptions(insightId, this.deps.getRoomId(), [
							optionsToSave,
						]),
					{ showLoading: false },
				);
				this.storedKey = optionsKey;
			}
			this.deps.setOptions(options);
		} catch (e) {
			throw new Error(
				(e as Error).message ||
					getI18n()?.t("room:errors.updateOptionsFailed"),
			);
		}
	};
}
