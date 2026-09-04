import type { WorkbenchCommand, WorkbenchSlice } from "../workbench.types";

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
}

/** The command slice: fields plus its `actions` contribution. */
export interface WorkbenchCommandSliceState
	extends WorkbenchCommandSliceFields {
	actions: WorkbenchCommandActions;
}

/**
 * Creates the flat command registry for one workbench.
 *
 * @name createWorkbenchCommandSlice
 * @return Zustand state creator for the workbench command slice.
 */
export const createWorkbenchCommandSlice =
	(id: string): WorkbenchSlice<WorkbenchCommandSliceState> =>
	(set, get) => {
		const cacheKey = `smss-workbench--commands--${id}--0`;

		let recentCommands: string[] = [];
		try {
			const item = localStorage.getItem(cacheKey);
			if (item) {
				recentCommands = JSON.parse(item);
			}
		} catch {
			// noop
		}

		return {
			isCommandOpen: false,
			commands: {},
			recentCommands: recentCommands,
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

					registeredCommand.handler(get);

					// record it, with the latest command first
					const recentCommands = [
						commandId,
						...get().command.recentCommands.filter(
							(recentCommandId) => recentCommandId !== commandId,
						),
					].slice(0, 10);
					set((root) => ({
						command: { ...root.command, recentCommands },
					}));

					try {
						localStorage.setItem(
							cacheKey,
							JSON.stringify(recentCommands),
						);
					} catch (e) {
						console.error(e);
					}
				},
			},
		};
	};
