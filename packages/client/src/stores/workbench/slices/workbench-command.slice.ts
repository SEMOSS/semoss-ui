import type { WorkbenchCommand, WorkbenchSlice } from "../workbench.types";

/** Command registry fields owned by each workbench instance. */
interface WorkbenchCommandSliceFields {
	/** Whether the command palette is open for this workbench instance. */
	isCommandOpen: boolean;

	/** Commands registered by all workbench components. */
	commands: Record<string, WorkbenchCommand>;
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
	 * Execute a command that isn't in the registry — a layout-derived palette
	 * entry — handing its handler the live store getter.
	 */
	runCommand: (command: WorkbenchCommand) => void;
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
	(): WorkbenchSlice<WorkbenchCommandSliceState> => (set, get) => ({
		isCommandOpen: false,
		commands: {},
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
					get().command.actions.unregisterCommand(commandList);
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
			},
			runCommand: (command) => {
				command.handler(get);
			},
		},
	});
