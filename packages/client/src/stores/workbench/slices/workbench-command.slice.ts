import type { WorkbenchCommand, WorkbenchSlice } from "../workbench.types";

/** Commands and panel definitions registered with the workbench. */
export interface WorkbenchCommandSliceState {
	/** Whether the command palette is open for this workbench instance. */
	isCommandOpen: boolean;

	/** Set whether the command palette is open for this workbench instance. */
	setCommandOpen: (isOpen: boolean) => void;

	/** Commands registered by all workbench components. */
	commands: Record<string, WorkbenchCommand>;

	/** Add or replace one or more command registrations and return its cleanup callback. */
	registerCommand: (
		commands: WorkbenchCommand | WorkbenchCommand[],
	) => () => void;

	/** Remove one or more command registrations. */
	unregisterCommand: (
		commands: WorkbenchCommand | WorkbenchCommand[],
	) => void;

	/** Execute a commands. */
	executeCommand: (commandId: string) => void;
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
		setCommandOpen: (isOpen) => {
			set({ isCommandOpen: isOpen });
		},
		commands: {},
		registerCommand: (command) => {
			const commandList = Array.isArray(command) ? command : [command];

			set((state) => {
				const updated = {
					...state.commands,
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
					commands: updated,
				};
			});

			return () => get().unregisterCommand(commandList);
		},
		unregisterCommand: (command) => {
			const commandList = Array.isArray(command) ? command : [command];

			set((state) => {
				const updated = {
					...state.commands,
				};

				// remove all the commands that were registered by this call
				for (const command of commandList) {
					delete updated[command.id];
				}

				return {
					commands: updated,
				};
			});
		},
		executeCommand: (commandId) => {
			const registeredCommand = get().commands[commandId];
			if (!registeredCommand) {
				console.warn(
					`Command ${commandId} is not registered in the workbench command registry.`,
				);
				return;
			}

			registeredCommand.handler(get);
		},
	});
