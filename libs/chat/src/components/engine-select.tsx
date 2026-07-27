import { EngineSelect as EngineSelectPrimitive } from "@semoss/shared";
import { cn } from "@semoss/ui";
import type { Engine } from "../types";

export interface EngineSelectProps {
	/** Display name of the selected engine. */
	name: string;
	/** engine_id of the selected engine. */
	value: string;
	onChange: (engine: Engine) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Thin wrapper around EngineSelectPrimitive (ported from @semoss/shared's real
 * EngineSelect — playground uses this exact component, not a chat-specific
 * one — see docs/chat-components/PLAN.md's @semoss/shared decoupling batch) —
 * pre-configured with the same MyEngines filters playground's own
 * ChatStore/RoomStore always use for chat (engineTypes=["MODEL"],
 * metaFilters=[{tag:"text-generation"}]) so callers don't need to know those
 * pixel-level filter values.
 *
 * Default className matches playground's own compact trigger sizing
 * (`room-input.tsx`'s usage: `h-8 gap-0.5 px-2 py-1 text-xs`) so this
 * looks like playground's model picker out of the box — override via
 * `className` (merged with `cn`, so callers can still adjust) rather than
 * inheriting the bare component's default (larger) button size.
 *
 * Not wired into ChatInput directly — pass it as ChatInput's
 * `trailingActions` (or place it anywhere) and use useChat()'s
 * `setEngineId` in `onChange`. Composable, not baked in.
 */
export function EngineSelect({
	name,
	value,
	onChange,
	disabled,
	className,
}: EngineSelectProps) {
	return (
		<EngineSelectPrimitive
			name={name}
			value={value}
			onChange={onChange}
			disabled={disabled}
			className={cn("h-8 gap-0.5 px-2 py-1 text-xs", className)}
			engineTypes={["MODEL"]}
			metaFilters={[{ tag: "text-generation" }]}
		/>
	);
}
