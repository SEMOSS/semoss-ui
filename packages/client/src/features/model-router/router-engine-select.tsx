import {
	FieldDescription,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

export interface RouterEngineOption {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_subtype?: string;
	tag?: string | string[];
}

interface RouterEngineSelectProps {
	/** Associates the owning field's label with this picker. */
	id: string;
	value: string;
	onChange: (value: string) => void;
	engines: RouterEngineOption[];
	role?: "destination" | "decision" | "classifier" | "embeddings";
	disabled?: boolean;
	isLoading?: boolean;
	allowNone?: boolean;
}

/** Filters decision classifiers by subtype and keeps non-chat engines out of destinations. */
export const RouterEngineSelect = ({
	id,
	value,
	onChange,
	engines,
	role = "destination",
	disabled,
	isLoading,
	allowNone,
}: RouterEngineSelectProps) => {
	const options = engines.filter((engine) => {
		const isDecision = engine.engine_subtype?.toUpperCase() === "TYPESAFE";
		const tags = Array.isArray(engine.tag)
			? engine.tag
			: typeof engine.tag === "string"
				? [engine.tag]
				: [];
		if (role === "decision") return isDecision;
		if (isDecision) return false;
		if (role === "classifier" && engine.engine_subtype === "MODEL_ROUTER")
			return false;
		if (role === "embeddings")
			return (
				tags.length === 0 ||
				tags.some((tag) => tag.includes("embedding"))
			);
		return tags.length === 0 || tags.includes("text-generation");
	});
	const unavailable =
		!!value && !options.some((engine) => engine.engine_id === value);
	const selected = engines.find((engine) => engine.engine_id === value);
	const descriptionId = `${id}-availability`;
	return (
		<>
			<Select
				value={value || "__none__"}
				onValueChange={(next) =>
					onChange(next === "__none__" ? "" : next)
				}
				disabled={disabled || isLoading}
			>
				<SelectTrigger
					id={id}
					aria-describedby={descriptionId}
					className="w-full min-w-0 bg-background text-foreground [&>span]:truncate"
				>
					<SelectValue placeholder="Select a model" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="__none__" disabled={!allowNone}>
						{isLoading
							? "Loading models..."
							: allowNone
								? role === "embeddings"
									? "None — embeddings disabled"
									: "None — use the first route"
								: "Select a model"}
					</SelectItem>
					{unavailable && (
						<SelectItem value={value} disabled>
							{selected?.engine_display_name ||
								selected?.engine_name ||
								value}{" "}
							(unavailable for this role)
						</SelectItem>
					)}
					{options.map((engine) => (
						<SelectItem
							key={engine.engine_id}
							value={engine.engine_id}
						>
							{engine.engine_display_name || engine.engine_name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldDescription
				id={descriptionId}
				className={unavailable ? "text-warning" : undefined}
			>
				{unavailable
					? "Choose a compatible model you can access before saving."
					: !isLoading && options.length === 0
						? role === "decision"
							? "No TypeSafe models available. Add a Jev or Laya model to the catalog first."
							: "No compatible models available."
						: role === "decision"
							? "Only models with the TYPESAFE subtype are listed."
							: null}
			</FieldDescription>
		</>
	);
};
