import {
	type ReactNode,
	useContext,
	useId,
	useLayoutEffect,
	useRef,
} from "react";
import type { SlashCommandEntry } from "./slash-command-entry";
import { SlashCommandRegistryContext } from "./slash-command-registry.context";

/** Props for {@link SlashCommand}. */
export interface SlashCommandProps {
	/** Stable key, and what Tab completes the query to, such as `attach`. */
	name: string;
	/** The command's name, as it is shown and matched. */
	label: string;
	/** What the command does. */
	description?: string;
	/** The group the menu lists the command under. */
	group: SlashCommandEntry["group"];
	/** Other words the command is found by, such as its old names. */
	keywords?: string[];
	/** The command's icon, sized by the menu. */
	icon: ReactNode;
	/** Runs the command once it is picked. */
	onSelect: () => void;
	/** Locks the command while the model responds or the latest response has tool calls. */
	isLockedWhileBusy?: boolean;
}

/**
 * One command of the composer's "/" menu. It draws nothing: it adds itself to
 * the menu while it is mounted, in the order it is placed, so a host's
 * `ChatConfig.components.SlashCommands` lists commands as JSX. A command that
 * cannot run returns null instead of rendering this.
 */
export const SlashCommand = (props: SlashCommandProps) => {
	const registry = useContext(SlashCommandRegistryContext);
	const key = useId();
	const markerRef = useRef<HTMLSpanElement>(null);
	// the icon and the action change on every render; the menu reads the
	// latest when it draws or runs the command, without registering again
	const latest = useRef(props);
	useLayoutEffect(() => {
		latest.current = props;
	});
	const { name, label, description, group, isLockedWhileBusy } = props;
	const keywords = props.keywords?.join("\n");

	useLayoutEffect(() => {
		const marker = markerRef.current;
		if (!registry || !marker) {
			return;
		}
		const entry: SlashCommandEntry = {
			id: name,
			label,
			description,
			group,
			keywords: keywords?.split("\n"),
			isLockedWhileBusy,
			get icon() {
				return latest.current.icon;
			},
			onExecute: () => latest.current.onSelect(),
		};
		registry.set((current) => new Map(current).set(key, { entry, marker }));
		return () =>
			registry.set((current) => {
				const next = new Map(current);
				next.delete(key);
				return next;
			});
	}, [
		registry,
		key,
		name,
		label,
		description,
		group,
		keywords,
		isLockedWhileBusy,
	]);

	return <span ref={markerRef} hidden />;
};
