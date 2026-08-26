import { useEffect, useRef } from "react";
import type { WorkbenchCommand } from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/**
 * Register a list of commands with the nearest workbench for the lifetime of
 * the calling component (a panel or a domain workbench).
 *
 * The list may be an inline array literal: registration only refreshes when
 * the commands' ids, categories, labels, or descriptions actually change — not
 * on every render — and executed handlers always run the latest closures, so
 * callers never have to think about effect dependencies.
 *
 * @name useWorkbenchCommands
 * @param commands - Commands to expose in this workbench's palette.
 */
export const useWorkbenchCommands = (commands: WorkbenchCommand[]): void => {
	const registerCommand = useWorkbench(
		(state) => state.command.actions.registerCommand,
	);

	// the latest list, so an executed handler never runs a stale closure
	const commandsRef = useRef(commands);
	commandsRef.current = commands;

	// the registered surface — what the palette shows. Re-register only when
	// it changes, not when an inline array literal gets a new identity.
	const signature = JSON.stringify(
		commands.map((command) => [
			command.id,
			command.category ?? "",
			command.label,
			command.description ?? "",
		]),
	);

	const registered = useRef<{
		signature: string;
		cleanup: () => void;
	} | null>(null);

	useEffect(() => {
		if (registered.current?.signature === signature) {
			return;
		}
		registered.current?.cleanup();
		registered.current = {
			signature,
			cleanup: registerCommand(
				commandsRef.current.map((command) => ({
					...command,
					handler: (get) => {
						commandsRef.current
							.find((candidate) => candidate.id === command.id)
							?.handler(get);
					},
				})),
			),
		};
	}, [registerCommand, signature]);

	// drop the registration when the caller unmounts
	useEffect(
		() => () => {
			registered.current?.cleanup();
			registered.current = null;
		},
		[],
	);
};
