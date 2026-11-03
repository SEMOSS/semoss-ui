import { type Engine, EngineSelect, EngineSubtypeIcon } from "@semoss/shared";
import { FieldDescription } from "@semoss/ui/next";

/** A model the router can use, as MyEngines lists it. */
export interface RouterEngineOption {
	/** The model's engine id. */
	engine_id: string;
	/** The model's name. */
	engine_name: string;
	/** The name the model is shown by, when it has one. */
	engine_display_name?: string;
	/** The model's subtype, such as OPEN_AI or TYPESAFE, which picks its logo. */
	engine_subtype?: string;
	/** The model's tags, such as text-generation or embeddings. */
	tag?: string | string[];
}

/**
 * What a model does in the router: answer a route (destination), choose a
 * route by decision (decision) or by chat (classifier), or embed text
 * (embeddings). It decides which models a picker offers.
 */
export type RouterEngineRole =
	| "destination"
	| "decision"
	| "classifier"
	| "embeddings";

/** Props for {@link RouterEngineSelect}. */
export interface RouterEngineSelectProps {
	/** Associates the owning field's label with this picker. */
	id: string;
	/** The chosen model's engine id, or empty for none. */
	value: string;
	/** Called with the chosen model's engine id, or an empty string for none. */
	onChange: (value: string) => void;
	/** Every model the user can use; the role picks the ones offered. */
	engines: RouterEngineOption[];
	/** What the model does in the router. Defaults to destination. */
	role?: RouterEngineRole;
	/** Whether the picker is locked. */
	disabled?: boolean;
	/** Whether the models are still being read. */
	isLoading?: boolean;
	/** Whether the picker offers no model, which the router reads as its own default. */
	allowNone?: boolean;
}

/**
 * Reads a model as an engine of the shared picker.
 *
 * @param engine - The model.
 * @returns The model as a MODEL engine.
 */
const toEngine = (engine: RouterEngineOption): Engine => ({
	engine_id: engine.engine_id,
	engine_name: engine.engine_name,
	engine_display_name: engine.engine_display_name,
	engine_type: "MODEL",
	engine_subtype: engine.engine_subtype,
});

/**
 * Reads a model's tags as a list.
 *
 * @param engine - The model.
 * @returns Its tags, none when it has no tag.
 */
const getTags = (engine: RouterEngineOption): string[] => {
	if (Array.isArray(engine.tag)) {
		return engine.tag;
	}
	return typeof engine.tag === "string" ? [engine.tag] : [];
};

/**
 * Whether a model can play a role in the router. Only TYPESAFE models decide;
 * they never answer, classify by chat, or embed. A router cannot classify for
 * another router, and an untagged model is offered for any other role.
 *
 * @param engine - The model.
 * @param role - What the model would do in the router.
 * @returns Whether the picker offers the model.
 */
const isEngineForRole = (
	engine: RouterEngineOption,
	role: RouterEngineRole,
): boolean => {
	const isDecision = engine.engine_subtype?.toUpperCase() === "TYPESAFE";
	if (role === "decision") return isDecision;
	if (isDecision) return false;
	if (role === "classifier" && engine.engine_subtype === "MODEL_ROUTER")
		return false;
	const tags = getTags(engine);
	if (role === "embeddings")
		return (
			tags.length === 0 || tags.some((tag) => tag.includes("embedding"))
		);
	return tags.length === 0 || tags.includes("text-generation");
};

/**
 * A searchable model picker for the Model Router: the shared EngineSelect
 * over the models that can play the role, each with its logo, its name and
 * its id. A chosen model that cannot play the role is kept, marked
 * unavailable, with a warning under the picker.
 */
export const RouterEngineSelect = ({
	id,
	value,
	onChange,
	engines,
	role = "destination",
	disabled = false,
	isLoading = false,
	allowNone = false,
}: RouterEngineSelectProps) => {
	const descriptionId = `${id}-availability`;
	const offered = engines.filter((engine) => isEngineForRole(engine, role));
	const selected = engines.find((engine) => engine.engine_id === value);
	const isUnavailable =
		!!value && !offered.some((engine) => engine.engine_id === value);
	const noneLabel =
		role === "embeddings" ? "No embeddings model" : "Use the first route";

	let name = "Select a model";
	if (isLoading) {
		name = "Loading models...";
	} else if (selected) {
		name = selected.engine_display_name || selected.engine_name;
	} else if (value) {
		name = value;
	} else if (allowNone) {
		name = noneLabel;
	}

	let description: string | null = null;
	if (isUnavailable) {
		description = "Choose a compatible model you can access before saving.";
	} else if (!isLoading && offered.length === 0) {
		description =
			role === "decision"
				? "No TypeSafe models available. Add a Jev or Laya model to the catalog first."
				: "No compatible models available.";
	} else if (role === "decision") {
		description = "Only models with the TYPESAFE subtype are listed.";
	}

	return (
		<>
			<EngineSelect
				id={id}
				className="bg-background"
				name={name}
				value={value}
				onChange={(engine) => onChange(engine.engine_id)}
				engines={offered.map(toEngine)}
				noneOption={
					allowNone
						? { label: noneLabel, onSelect: () => onChange("") }
						: undefined
				}
				unavailable={
					isUnavailable
						? {
								engine: selected
									? toEngine(selected)
									: {
											engine_id: value,
											engine_name: value,
											engine_type: "MODEL",
										},
								note: "Unavailable for this role",
							}
						: undefined
				}
				showEngineId
				triggerIcon={
					selected ? (
						<EngineSubtypeIcon
							engineType="MODEL"
							engineSubtype={selected.engine_subtype}
							alt=""
							className="size-5 shrink-0 object-contain"
						/>
					) : undefined
				}
				popoverContentProps={{ align: "start" }}
				disabled={disabled || isLoading}
				aria-describedby={description ? descriptionId : undefined}
			/>
			{description && (
				<FieldDescription
					id={descriptionId}
					className={isUnavailable ? "text-warning" : undefined}
				>
					{description}
				</FieldDescription>
			)}
		</>
	);
};
