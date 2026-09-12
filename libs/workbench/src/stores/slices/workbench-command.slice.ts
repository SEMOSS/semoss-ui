import type { WorkbenchCommand, WorkbenchSlice } from "../../types";

/** Command registry fields owned by each workbench instance. */
interface WorkbenchCommandSliceFields {
	/** Whether the command palette is open for this workbench instance. */
	isCommandOpen: boolean;

	/** Commands registered by all workbench components. */
	commands: Record<string, WorkbenchCommand>;

	/** Recent commands */
	recentCommands: string[];
}

/** Command actions exposed under the store's `actions` namespace. */
interface WorkbenchCommandActions {
	/** Set whether the command palette is open for this workbench instance. */
	setCommandOpen: (isOpen: boolean) => void;

	/** Add or replace one or more command registrations and return its cleanup callback. */
	registerCommand: (
		commands: WorkbenchCommand | WorkbenchCommand[],
	) => () => void;

	/** Remove one or more command registrations. */
	unregisterCommand: (
		commands: WorkbenchCommand | WorkbenchCommand[],
	) => void;

	/** Execute a registered command by id. */
	executeCommand: (commandId: string) => void;

	/**
	 * Restore the recents a host had cached.
	 *
	 * Recents ride in the layout snapshot rather than in a second cache entry
	 * of their own, so `loadSnapshot` hands them over here. Ignores anything
	 * that is not a list of ids: the value comes from storage a user can edit.
	 */
	loadRecentCommands: (recentCommands: string[]) => void;
}

/** The command slice: fields plus its `actions` contribution. */
export interface WorkbenchCommandSliceState
	extends WorkbenchCommandSliceFields {
	actions: WorkbenchCommandActions;
}

/**
 * Creates the flat command registry for one workbench.
 *
 * Recents start empty and are restored by `loadSnapshot`: they travel in the
 * host's layout snapshot, so this slice keeps no storage of its own.
 *
 * @name createWorkbenchCommandSlice
 * @return Zustand state creator for the workbench command slice.
 */
export const createWorkbenchCommandSlice =
	(): WorkbenchSlice<WorkbenchCommandSliceState> => (set, get) => {
		return {
			isCommandOpen: false,
			commands: {},
			recentCommands: [],
			actions: {
				setCommandOpen: (isOpen) => {
					set((root) => ({
						command: { ...root.command, isCommandOpen: isOpen },
					}));
				},
				registerCommand: (command) => {
					const commandList = Array.isArray(command)
						? command
						: [command];

					set((root) => {
						const updated = {
							...root.command.commands,
						};

						// replace all the commands based on ID, so that the latest registration takes precedence
						for (const command of commandList) {
							if (Object.hasOwn(updated, command.id)) {
								console.warn(
									`Command ${command.id} already exists in the workbench command registry. It will be replaced.`,
								);
							}

							updated[command.id] = command;
						}

						return {
							command: { ...root.command, commands: updated },
						};
					});

					return () =>
						set((root) => {
							const updated = {
								...root.command.commands,
							};

							for (const registeredCommand of commandList) {
								if (
									updated[registeredCommand.id] ===
									registeredCommand
								) {
									delete updated[registeredCommand.id];
								}
							}

							return {
								command: { ...root.command, commands: updated },
							};
						});
				},
				unregisterCommand: (command) => {
					const commandList = Array.isArray(command)
						? command
						: [command];

					set((root) => {
						const updated = {
							...root.command.commands,
						};

						// remove all the commands that were registered by this call
						for (const command of commandList) {
							delete updated[command.id];
						}

						return {
							command: { ...root.command, commands: updated },
						};
					});
				},
				executeCommand: (commandId) => {
					const registeredCommand = get().command.commands[commandId];
					if (!registeredCommand) {
						console.warn(
							`Command ${commandId} is not registered in the workbench command registry.`,
						);
						return;
					}
					if (registeredCommand.visible === false) {
						return;
					}

					registeredCommand.handler(get);

					// record it, with the latest command first
					const recentCommands = [
						commandId,
						...get().command.recentCommands.filter(
							(recentCommandId) => recentCommandId !== commandId,
						),
					].slice(0, 10);
					// Recents ride in the layout snapshot but change through a
					// plain `set` rather than the layout's commit path, so a
					// host persisting on change picks this up with the next
					// arrangement change; one persisting on unmount gets it
					// either way.
					set((root) => ({
						command: { ...root.command, recentCommands },
					}));
				},
				loadRecentCommands: (recentCommands) => {
					if (
						!Array.isArray(recentCommands) ||
						recentCommands.some((id) => typeof id !== "string")
					) {
						return;
					}
					set((root) => ({
						command: { ...root.command, recentCommands },
					}));
				},
			},
		};
	};
