import { ChevronDown, CircleCheck, Plus, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Field,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import {
	type RouterEngineOption,
	type RouterEngineRole,
	RouterEngineSelect,
} from "@/features/model-router/router-engine-select";
import { RouterRouteCard } from "@/features/model-router/router-route-card";
import {
	createDefaultRouterConfigValue,
	createRouterEngineRef,
	createRouterRoute,
	type RouterConfigFormValue,
	type RouterEngineRefFormValue,
	type RouterRouteFormValue,
} from "./model-import.constants";

const ROUTING_MODES: Array<{
	value: RouterConfigFormValue["mode"];
	label: string;
	description: string;
}> = [
	{
		value: "typesafe",
		label: "Decision classifier",
		description:
			"A decision model chooses an intent from your route descriptions. A destination LLM generates the answer.",
	},
	{
		value: "llm",
		label: "LLM classifier",
		description:
			"A chat model reads your route descriptions and selects the destination.",
	},
	{
		value: "keyword",
		label: "Keyword matching",
		description:
			"The first route with a matching whole-word keyword wins. If none match, use the default model.",
	},
	{
		value: "weighted",
		label: "Weighted distribution",
		description:
			"Distribute traffic across models using percentages that add up to 100.",
	},
];

const normalizeRoute = (route: unknown): RouterRouteFormValue => {
	const base = createRouterRoute();
	if (!route || typeof route !== "object") {
		return base;
	}
	const r = route as Partial<RouterRouteFormValue>;
	return {
		id: typeof r.id === "string" && r.id ? r.id : base.id,
		name: typeof r.name === "string" ? r.name : "",
		engine_id: typeof r.engine_id === "string" ? r.engine_id : "",
		keywords: typeof r.keywords === "string" ? r.keywords : "",
		weight:
			typeof r.weight === "number" && Number.isFinite(r.weight)
				? r.weight
				: 0,
		description: typeof r.description === "string" ? r.description : "",
	};
};

const normalizeEngineRef = (ref: unknown): RouterEngineRefFormValue => {
	const base = createRouterEngineRef();
	if (!ref || typeof ref !== "object") {
		return base;
	}
	const r = ref as Partial<RouterEngineRefFormValue>;
	return {
		id: typeof r.id === "string" && r.id ? r.id : base.id,
		engine_id: typeof r.engine_id === "string" ? r.engine_id : "",
	};
};

/** Coerce whatever the form state holds into a well-formed editor value. */
const normalizeRouterConfigValue = (value: unknown): RouterConfigFormValue => {
	if (!isRecord(value)) {
		return createDefaultRouterConfigValue();
	}
	const v = value as Partial<RouterConfigFormValue>;
	const mode =
		v.mode === "llm" || v.mode === "typesafe" || v.mode === "weighted"
			? v.mode
			: "keyword";
	return {
		mode,
		sticky: typeof v.sticky === "boolean" ? v.sticky : false,
		default_route:
			typeof v.default_route === "string" ? v.default_route : "",
		classifier_engine:
			typeof v.classifier_engine === "string" ? v.classifier_engine : "",
		embeddings_engine:
			typeof v.embeddings_engine === "string" ? v.embeddings_engine : "",
		fallbacks: Array.isArray(v.fallbacks)
			? v.fallbacks.map(normalizeEngineRef)
			: [],
		routes:
			Array.isArray(v.routes) && v.routes.length > 0
				? v.routes.map(normalizeRoute)
				: [createRouterRoute()],
	};
};

/** true when the config is submittable, otherwise the message to surface. */
export const validateRouterConfig = (raw: unknown): true | string => {
	const value = normalizeRouterConfigValue(raw);
	if (value.routes.length === 0) {
		return "Add at least one route.";
	}
	if (value.fallbacks.some((fallback) => !fallback.engine_id))
		return "Choose a model for every failover entry, or remove the empty entry.";
	if (value.routes.some((route) => !route.engine_id)) {
		return "Every route needs a model engine.";
	}
	if (
		(value.mode === "llm" || value.mode === "typesafe") &&
		!value.classifier_engine
	) {
		return "Choose the classifier that selects a route.";
	}
	if (
		(value.mode === "llm" || value.mode === "typesafe") &&
		value.routes.some((route) => !route.description.trim())
	) {
		return "Describe when to use every route.";
	}
	const names = value.routes.map((route, index) =>
		(route.name.trim() || `route_${index}`).toLowerCase(),
	);
	if (new Set(names).size !== names.length)
		return "Each route must have a unique name.";
	if (value.mode === "typesafe" && value.routes.length < 2)
		return "Decision classification needs at least two routes.";
	if (
		value.mode === "weighted" &&
		value.routes.some(
			(route) =>
				!Number.isInteger(route.weight) ||
				route.weight < 0 ||
				route.weight > 100,
		)
	)
		return "Use whole-number percentages between 0 and 100.";
	if (value.mode === "weighted") {
		const total = sumRouteWeights(value.routes);
		if (total !== 100) {
			return `Weighted mode splits traffic by percentage - the route percentages must add up to 100 (currently ${total}).`;
		}
	}
	return true;
};

/** Total of the positive route weights - the backend ignores weights <= 0. */
const sumRouteWeights = (routes: RouterRouteFormValue[]): number =>
	routes.reduce((total, route) => total + Math.max(0, route.weight), 0);

/** Parse stored router.json content (string or object) into an editor value. */
export const routerConfigFromJson = (raw: unknown): RouterConfigFormValue => {
	let parsed: unknown = raw;
	if (typeof raw === "string") {
		try {
			parsed = JSON.parse(raw);
		} catch {
			parsed = null;
		}
	}
	if (!isRecord(parsed)) {
		return createDefaultRouterConfigValue();
	}
	const cfg = parsed as Record<string, unknown>;
	const routes = Array.isArray(cfg.routes)
		? cfg.routes.map((route) => {
				const base = createRouterRoute();
				if (!route || typeof route !== "object") {
					return base;
				}
				const r = route as Record<string, unknown>;
				return {
					...base,
					name: typeof r.name === "string" ? r.name : "",
					engine_id:
						typeof r.engine_id === "string" ? r.engine_id : "",
					keywords: Array.isArray(r.keywords)
						? r.keywords
								.filter(
									(keyword) => typeof keyword === "string",
								)
								.join(", ")
						: "",
					weight:
						typeof r.weight === "number" &&
						Number.isFinite(r.weight)
							? r.weight
							: 0,
					description:
						typeof r.description === "string" ? r.description : "",
				};
			})
		: [];
	return {
		mode:
			cfg.mode === "llm" ||
			cfg.mode === "typesafe" ||
			cfg.mode === "weighted"
				? cfg.mode
				: "keyword",
		sticky: typeof cfg.sticky === "boolean" ? cfg.sticky : false,
		default_route:
			typeof cfg.default_route === "string" ? cfg.default_route : "",
		classifier_engine:
			typeof cfg.classifier_engine === "string"
				? cfg.classifier_engine
				: "",
		embeddings_engine:
			typeof cfg.embeddings_engine === "string"
				? cfg.embeddings_engine
				: "",
		fallbacks: Array.isArray(cfg.fallbacks)
			? cfg.fallbacks
					.filter(
						(engineId) =>
							typeof engineId === "string" && engineId !== "",
					)
					.map((engineId) => ({
						...createRouterEngineRef(),
						engine_id: engineId as string,
					}))
			: [],
		routes: routes.length > 0 ? routes : [createRouterRoute()],
	};
};

/** Serialize the editor value to the minified router.json contract. */
export const routerConfigToJson = (raw: unknown): string => {
	const value = normalizeRouterConfigValue(raw);
	const config: Record<string, unknown> = {
		mode: value.mode,
		sticky: value.sticky,
		routes: value.routes.map((route, index) => {
			const keywords = route.keywords
				.split(",")
				.map((keyword) => keyword.trim().toLowerCase())
				.filter(Boolean);
			const entry: Record<string, unknown> = {
				name: route.name.trim() || `route_${index}`,
				engine_id: route.engine_id,
			};
			const description = route.description.trim();
			if (description) {
				entry.description = description;
			}
			if (keywords.length > 0) {
				entry.keywords = keywords;
			}
			if (route.weight > 0) {
				entry.weight = route.weight;
			}
			return entry;
		}),
	};
	if (value.default_route) {
		config.default_route = value.default_route;
	}
	if (value.classifier_engine) {
		config.classifier_engine = value.classifier_engine;
	}
	if (value.embeddings_engine) {
		config.embeddings_engine = value.embeddings_engine;
	}
	const fallbacks = value.fallbacks
		.map((ref) => ref.engine_id)
		.filter(Boolean);
	if (fallbacks.length > 0) {
		config.fallbacks = fallbacks;
	}
	return JSON.stringify(config);
};

export interface RouterConfigFieldProps {
	value: unknown;
	onChange: (next: RouterConfigFormValue) => void;
	disabled?: boolean;
	testId?: string;
	/**
	 * Engine id to leave out of the engine dropdowns - the settings page
	 * passes the router's own id, since a router cannot route to itself.
	 */
	excludeEngineId?: string;
}

/**
 * Structured editor for the Model Router configuration - modes, routes with
 * engine pickers, classifier/default/embeddings engines and fallbacks - so
 * users never have to hand-write the router JSON.
 */
export const RouterConfigField = ({
	value,
	onChange,
	disabled,
	testId,
	excludeEngineId,
}: RouterConfigFieldProps) => {
	const baseId = useId();
	const config = normalizeRouterConfigValue(value);
	const engines = usePixel<RouterEngineOption[]>(
		`MyEngines(engineTypes=["MODEL"], metaKeys=["tag"]);`,
	);
	const engineOptions = Array.isArray(engines.data)
		? engines.data.filter(
				(engine) =>
					typeof engine.engine_id === "string" &&
					engine.engine_id !== excludeEngineId,
			)
		: [];
	const isLoading =
		engines.status === "INITIAL" || engines.status === "LOADING";
	const isClassification =
		config.mode === "llm" || config.mode === "typesafe";
	const update = (partial: Partial<RouterConfigFormValue>) =>
		onChange({ ...config, ...partial });
	const updateRoute = (id: string, partial: Partial<RouterRouteFormValue>) =>
		update({
			routes: config.routes.map((route) =>
				route.id === id ? { ...route, ...partial } : route,
			),
		});
	// the route whose name gets focus once a removed route's card is gone
	const [focusRouteId, setFocusRouteId] = useState<string | null>(null);

	useEffect(() => {
		if (!focusRouteId) {
			return;
		}
		document.getElementById(`${baseId}-${focusRouteId}-name`)?.focus();
		setFocusRouteId(null);
	}, [focusRouteId, baseId]);

	/**
	 * Swaps a route with its neighbor above or below.
	 *
	 * @param index - The route's place.
	 * @param offset - -1 to move it up, 1 to move it down.
	 */
	const moveRoute = (index: number, offset: -1 | 1) => {
		const target = index + offset;
		if (target < 0 || target >= config.routes.length) {
			return;
		}
		const routes = [...config.routes];
		[routes[index], routes[target]] = [routes[target], routes[index]];
		update({ routes });
	};

	/**
	 * Removes a route and moves focus to the route that takes its place, or
	 * to the one before it when it was the last.
	 *
	 * @param index - The route's place.
	 */
	const removeRoute = (index: number) => {
		const routes = config.routes.filter((_, other) => other !== index);
		update({ routes });
		const next = routes[Math.min(index, routes.length - 1)];
		if (next) {
			setFocusRouteId(next.id);
		}
	};
	const weightTotal = sumRouteWeights(config.routes);
	const selectedClassifier = engineOptions.find(
		(engine) => engine.engine_id === config.classifier_engine,
	);
	const changeMode = (mode: string) => {
		if (!ROUTING_MODES.some((option) => option.value === mode)) return;
		const nextMode = mode as RouterConfigFormValue["mode"];
		const classifierChanged =
			nextMode === "typesafe"
				? selectedClassifier?.engine_subtype !== "TYPESAFE"
				: nextMode === "llm"
					? selectedClassifier?.engine_subtype === "TYPESAFE"
					: false;
		update({
			mode: nextMode,
			...(classifierChanged ? { classifier_engine: "" } : {}),
			...(nextMode === "weighted" && weightTotal === 0
				? {
						routes: config.routes.map((route, index) => ({
							...route,
							weight: index === 0 ? 100 : 0,
						})),
					}
				: {}),
		});
	};
	const engineSelect = (
		id: string,
		selected: string,
		onSelect: (next: string) => void,
		role: RouterEngineRole = "destination",
		allowNone = false,
	) => (
		<RouterEngineSelect
			id={id}
			value={selected}
			onChange={onSelect}
			engines={engineOptions}
			role={role}
			allowNone={allowNone}
			disabled={disabled || engines.status === "ERROR"}
			isLoading={isLoading}
		/>
	);
	return (
		<div className="flex min-w-0 flex-col gap-6" data-testid={testId}>
			<P className="text-base text-muted-foreground">
				Choose how to select a model, then map each route to the model
				that will answer. Playground shows the destination and routing
				details with every response.
			</P>
			{engines.status === "ERROR" && (
				<Alert variant="destructive">
					<AlertDescription>
						Models could not be loaded. Your configuration has been
						kept.{" "}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => engines.refresh()}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			)}
			<FieldSet>
				<FieldLegend>Routing method</FieldLegend>
				<Field>
					<FieldLabel htmlFor={`${baseId}-mode`}>
						How should requests be routed?
					</FieldLabel>
					<Select
						value={config.mode}
						onValueChange={changeMode}
						disabled={disabled}
					>
						<SelectTrigger
							className="bg-background text-foreground"
							id={`${baseId}-mode`}
							aria-describedby={`${baseId}-mode-help`}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROUTING_MODES.map((mode) => (
								<SelectItem key={mode.value} value={mode.value}>
									{mode.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FieldDescription id={`${baseId}-mode-help`}>
						{
							ROUTING_MODES.find(
								(mode) => mode.value === config.mode,
							)?.description
						}
					</FieldDescription>
				</Field>
				{isClassification && (
					<Field>
						<FieldLabel htmlFor={`${baseId}-classifier`}>
							{config.mode === "typesafe"
								? "Decision classifier"
								: "Classifier model"}{" "}
							(required)
						</FieldLabel>
						{engineSelect(
							`${baseId}-classifier`,
							config.classifier_engine,
							(classifier_engine) =>
								update({ classifier_engine }),
							config.mode === "typesafe"
								? "decision"
								: "classifier",
						)}
						<FieldDescription>
							The classifier chooses an intent. It does not
							generate the chat answer.
						</FieldDescription>
					</Field>
				)}
				<Field>
					<div className="flex items-start gap-3">
						<Switch
							id={`${baseId}-sticky`}
							checked={config.sticky}
							onCheckedChange={(sticky) => update({ sticky })}
							disabled={disabled}
							aria-describedby={`${baseId}-sticky-help`}
						/>
						<FieldLabel htmlFor={`${baseId}-sticky`}>
							Keep the first model for the conversation
						</FieldLabel>
					</div>
					<FieldDescription id={`${baseId}-sticky-help`}>
						{config.sticky
							? "Later requests reuse the first successful destination. The classifier is skipped after the first selection."
							: "Select a route for every request. Use this to check different intents in the same Playground conversation."}
					</FieldDescription>
				</Field>
			</FieldSet>
			<FieldSet>
				<FieldLegend>Routes</FieldLegend>
				<FieldDescription>
					{isClassification
						? "Give each intent a distinct description and a destination LLM. Decision classifiers need at least two choices."
						: config.mode === "keyword"
							? "Routes are checked in order. Use specific, comma-separated keywords."
							: "Each destination receives its share of traffic. With conversation pinning enabled, percentages apply to new conversations."}
				</FieldDescription>
				<div className="flex flex-col gap-4">
					{config.routes.map((route, index) => (
						<RouterRouteCard
							key={route.id}
							route={route}
							index={index}
							routeCount={config.routes.length}
							mode={config.mode}
							idPrefix={`${baseId}-${route.id}`}
							engines={engineOptions}
							isLoadingEngines={isLoading}
							isEngineSelectDisabled={engines.status === "ERROR"}
							disabled={disabled}
							onChange={(partial) =>
								updateRoute(route.id, partial)
							}
							onMove={(offset) => moveRoute(index, offset)}
							onRemove={() => removeRoute(index)}
						/>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit bg-background text-foreground"
					onClick={() =>
						update({
							routes: [...config.routes, createRouterRoute()],
						})
					}
					disabled={disabled}
				>
					<Plus aria-hidden="true" className="size-4" />
					Add route
				</Button>
				{config.mode === "weighted" && (
					<P
						className={cn(
							"flex items-center gap-2 text-base",
							weightTotal === 100
								? "text-muted-foreground"
								: "text-warning",
						)}
					>
						{weightTotal === 100 ? (
							<CircleCheck
								aria-hidden="true"
								className="size-4 shrink-0 text-success"
							/>
						) : (
							<TriangleAlert
								aria-hidden="true"
								className="size-4 shrink-0"
							/>
						)}
						Total {weightTotal}%:{" "}
						{weightTotal === 100
							? "ready to save"
							: "must add up to 100%"}
					</P>
				)}
			</FieldSet>
			<FieldSet>
				<FieldLegend>Default and failover</FieldLegend>
				<Field>
					<FieldLabel htmlFor={`${baseId}-default`}>
						Default model
					</FieldLabel>
					{engineSelect(
						`${baseId}-default`,
						config.default_route,
						(default_route) => update({ default_route }),
						"destination",
						true,
					)}
					<FieldDescription>
						Used when no keywords match, including after
						classification fails. Without a default, use the first
						route.
					</FieldDescription>
				</Field>
				{config.fallbacks.map((fallback, index) => (
					<Field key={fallback.id}>
						<FieldLabel htmlFor={`${baseId}-${fallback.id}`}>
							Failover model {index + 1}
						</FieldLabel>
						<div className="flex min-w-0 items-start gap-2">
							<div className="min-w-0 flex-1">
								{engineSelect(
									`${baseId}-${fallback.id}`,
									fallback.engine_id,
									(engine_id) =>
										update({
											fallbacks: config.fallbacks.map(
												(other) =>
													other.id === fallback.id
														? {
																...other,
																engine_id,
															}
														: other,
											),
										}),
								)}
							</div>
							<Button
								type="button"
								variant="ghost"
								className="bg-transparent text-foreground"
								size="icon"
								aria-label={`Remove failover model ${index + 1}`}
								disabled={disabled}
								onClick={() =>
									update({
										fallbacks: config.fallbacks.filter(
											(other) => other.id !== fallback.id,
										),
									})
								}
							>
								<X aria-hidden="true" className="size-4" />
							</Button>
						</div>
					</Field>
				))}
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit bg-background text-foreground"
					onClick={() =>
						update({
							fallbacks: [
								...config.fallbacks,
								createRouterEngineRef(),
							],
						})
					}
					disabled={disabled}
				>
					<Plus aria-hidden="true" className="size-4" />
					Add failover model
				</Button>
				<FieldDescription>
					Try these in order when the selected destination cannot
					serve a request, then try the default model. Playground
					identifies the model that actually succeeded.
				</FieldDescription>
			</FieldSet>
			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						className="w-fit bg-background text-foreground"
					>
						<ChevronDown aria-hidden="true" className="size-4" />
						Advanced options
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-4">
					<Field>
						<FieldLabel htmlFor={`${baseId}-embeddings`}>
							Embeddings model (optional)
						</FieldLabel>
						{engineSelect(
							`${baseId}-embeddings`,
							config.embeddings_engine,
							(embeddings_engine) =>
								update({ embeddings_engine }),
							"embeddings",
							true,
						)}
						<FieldDescription>
							Only needed when the router is also used for
							embeddings. Leave empty for chat-only routing.
						</FieldDescription>
					</Field>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
