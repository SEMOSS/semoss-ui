import { CheckIcon } from "lucide-react";
import { EngineSubtypeIcon } from "../engine-subtype-icon";

/** Props for {@link EngineOption}. */
export interface EngineOptionProps {
	/** The engine's id, shown under its name with {@link showEngineId}. */
	engineId: string;
	/** The name the engine is shown by: its display name, else its name. */
	name: string;
	/** The engine's catalog type, such as MODEL, which picks its logo with its subtype. */
	engineType: string;
	/** The engine's catalog subtype, such as OPEN_AI, which picks its logo. */
	engineSubtype?: string;
	/** What the engine is for, shown under its name when its id is not. */
	description?: string;
	/** Shows the engine's id under its name instead of its description. */
	showEngineId?: boolean;
	/** Shows the engine's logo before its name. Defaults to true. */
	showEngineIcon?: boolean;
	/** Whether this is the chosen engine, marked with a check at the end. */
	isSelected?: boolean;
}

/**
 * One engine in a picker's list: its logo, its name and, under the name, its
 * id or its description, with a check at the end when it is the one chosen.
 * It fills a row such as a `CommandItem`, which lays its parts out in a line.
 */
export const EngineOption = ({
	engineId,
	name,
	engineType,
	engineSubtype,
	description,
	showEngineId = false,
	showEngineIcon = true,
	isSelected = false,
}: EngineOptionProps) => (
	<>
		{showEngineIcon && (
			<EngineSubtypeIcon
				engineType={engineType}
				engineSubtype={engineSubtype}
				alt={`${name} icon`}
				className="me-2 size-6 shrink-0 object-contain"
			/>
		)}
		<div className="flex flex-1 flex-col truncate">
			<span className="truncate">{name}</span>
			{showEngineId ? (
				<span
					title={engineId}
					className="truncate text-muted-foreground text-xs"
				>
					id: {engineId}
				</span>
			) : (
				description && (
					<span
						title={description}
						className="truncate text-muted-foreground text-xs"
					>
						{description}
					</span>
				)
			)}
		</div>
		{/* Right-aligned check marks the selected engine without shifting the row's left content */}
		{isSelected && (
			<CheckIcon
				strokeWidth={3}
				className="ms-2 size-4 shrink-0 text-primary"
			/>
		)}
	</>
);
