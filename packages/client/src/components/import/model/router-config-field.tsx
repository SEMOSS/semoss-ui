import { Plus, X } from "lucide-react";
import { useId } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import {
	createDefaultRouterConfigValue,
	createRouterEngineRef,
	createRouterRoute,
	type RouterConfigFormValue,
	type RouterEngineRefFormValue,
	type RouterRouteFormValue,
} from "./model-import.constants";

interface EngineOption {
	engine_id: string;
	engine_name: string;
}

/** Sentinel for clearing an optional engine select - Radix items cannot be "". */
const NONE_VALUE = "__none__";

const ROUTING_MODES: Array<{
	value: RouterConfigFormValue["mode"];
	label: string;
	description: string;
}> = [
	{
		value: "keyword",
		label: "Keyword",
		description:
			"The first route with a keyword found in the latest user message wins; otherwise the default route is used.",
	},
	{
		value: "llm",
		label: "LLM Classifier",
		description:
			"A classifier model picks the best route by name and falls back to keyword matching when classification fails.",
	},
	{
		value: "weighted",
		label: "Weighted Round-Robin",
		description:
			"Requests are split across routes in exact proportion to their weights.",
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
export const normalizeRouterConfigValue = (
	value: unknown,
): RouterConfigFormValue => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return createDefaultRouterConfigValue();
	}
	const v = value as Partial<RouterConfigFormValue>;
	const mode = v.mode === "llm" || v.mode === "weighted" ? v.mode : "keyword";
	return {
		mode,
		sticky: typeof v.sticky === "boolean" ? v.sticky : true,
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
	if (value.routes.some((route) => !route.engine_id)) {
		return "Every route needs a model engine.";
	}
	if (value.mode === "llm" && !value.classifier_engine) {
		return "LLM Classifier mode needs a classifier engine.";
	}
	if (
		value.mode === "weighted" &&
		!value.routes.some((route) => route.weight > 0)
	) {
		return "Weighted mode needs at least one route with a weight above zero.";
	}
	return true;
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
}: RouterConfigFieldProps) => {
	const baseId = useId();
	const config = normalizeRouterConfigValue(value);

	const engines = usePixel<EngineOption[]>(
		`MyEngines(engineTypes=["MODEL"]);`,
	);
	const engineOptions = engines.data ?? [];
	const enginesLoading = engines.status === "LOADING";

	const update = (partial: Partial<RouterConfigFormValue>) =>
		onChange({ ...config, ...partial });

	const updateRoute = (
		routeId: string,
		partial: Partial<RouterRouteFormValue>,
	) =>
		update({
			routes: config.routes.map((route) =>
				route.id === routeId ? { ...route, ...partial } : route,
			),
		});

	const modeInfo = ROUTING_MODES.find((mode) => mode.value === config.mode);

	const renderEngineSelect = (
		id: string,
		selected: string,
		onSelect: (engineId: string) => void,
		placeholder: string,
		allowNone: boolean,
	) => (
		<Select
			value={selected}
			onValueChange={(next) => onSelect(next === NONE_VALUE ? "" : next)}
			disabled={disabled || enginesLoading}
		>
			<SelectTrigger id={id} className="w-full">
				<SelectValue
					placeholder={
						enginesLoading
							? "Loading model engines..."
							: placeholder
					}
				/>
			</SelectTrigger>
			<SelectContent>
				{allowNone && <SelectItem value={NONE_VALUE}>None</SelectItem>}
				{engineOptions.map((engine) => (
					<SelectItem key={engine.engine_id} value={engine.engine_id}>
						{engine.engine_name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	return (
		<div className="space-y-4" data-testid={testId}>
			<Field>
				<FieldLabel htmlFor={`${baseId}-mode`}>Routing Mode</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(mode) =>
						update({ mode: mode as RouterConfigFormValue["mode"] })
					}
					disabled={disabled}
				>
					<SelectTrigger id={`${baseId}-mode`} className="w-full">
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
				{modeInfo && (
					<FieldDescription>{modeInfo.description}</FieldDescription>
				)}
			</Field>

			<div className="flex items-center gap-2">
				<Switch
					id={`${baseId}-sticky`}
					checked={config.sticky}
					onCheckedChange={(sticky) => update({ sticky })}
					disabled={disabled}
				/>
				<FieldLabel htmlFor={`${baseId}-sticky`}>
					Keep each conversation on the route that first served it
				</FieldLabel>
			</div>

			<Field>
				<FieldLabel htmlFor={`${baseId}-route-0-engine`}>
					Routes<span className="text-destructive">*</span>
				</FieldLabel>
				<div className="space-y-3">
					{config.routes.map((route, index) => (
						<div
							key={route.id}
							className="space-y-2 rounded-md border p-3"
						>
							<div className="flex items-center gap-2">
								<Input
									id={`${baseId}-route-${index}-name`}
									placeholder="Route name (e.g. code)"
									value={route.name}
									onChange={(event) =>
										updateRoute(route.id, {
											name: event.target.value,
										})
									}
									disabled={disabled}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="Remove route"
									onClick={() =>
										update({
											routes: config.routes.filter(
												(other) =>
													other.id !== route.id,
											),
										})
									}
									disabled={
										disabled || config.routes.length === 1
									}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							{renderEngineSelect(
								`${baseId}-route-${index}-engine`,
								route.engine_id,
								(engine_id) =>
									updateRoute(route.id, { engine_id }),
								"Select the model engine for this route",
								false,
							)}
							{config.mode !== "weighted" && (
								<Input
									id={`${baseId}-route-${index}-keywords`}
									placeholder="Keywords, comma separated (e.g. java, python, debug)"
									value={route.keywords}
									onChange={(event) =>
										updateRoute(route.id, {
											keywords: event.target.value,
										})
									}
									disabled={disabled}
								/>
							)}
							{config.mode === "weighted" && (
								<Input
									id={`${baseId}-route-${index}-weight`}
									inputMode="numeric"
									placeholder="Weight (e.g. 70)"
									value={
										route.weight > 0
											? String(route.weight)
											: ""
									}
									onChange={(event) =>
										updateRoute(route.id, {
											weight:
												Number.parseInt(
													event.target.value,
													10,
												) || 0,
										})
									}
									disabled={disabled}
								/>
							)}
						</div>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
					onClick={() =>
						update({
							routes: [...config.routes, createRouterRoute()],
						})
					}
					disabled={disabled}
				>
					<Plus className="h-4 w-4" />
					Add Route
				</Button>
			</Field>

			{config.mode === "llm" && (
				<Field>
					<FieldLabel htmlFor={`${baseId}-classifier`}>
						Classifier Engine
						<span className="text-destructive">*</span>
					</FieldLabel>
					{renderEngineSelect(
						`${baseId}-classifier`,
						config.classifier_engine,
						(classifier_engine) => update({ classifier_engine }),
						"Select the model that classifies each request",
						false,
					)}
					<FieldDescription>
						A small, fast model is recommended - it runs before
						routed requests to pick the route.
					</FieldDescription>
				</Field>
			)}

			<Field>
				<FieldLabel htmlFor={`${baseId}-default`}>
					Default Route Engine
				</FieldLabel>
				{renderEngineSelect(
					`${baseId}-default`,
					config.default_route,
					(default_route) => update({ default_route }),
					"Used when no route matches (defaults to the first route)",
					true,
				)}
			</Field>

			<Field>
				<FieldLabel htmlFor={`${baseId}-fallback-0`}>
					Failover Engines
				</FieldLabel>
				{config.fallbacks.length > 0 && (
					<div className="space-y-2">
						{config.fallbacks.map((fallback, index) => (
							<div
								key={fallback.id}
								className="flex items-center gap-2"
							>
								<div className="flex-1">
									{renderEngineSelect(
										`${baseId}-fallback-${index}`,
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
										"Select a fallback engine",
										false,
									)}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="Remove fallback engine"
									onClick={() =>
										update({
											fallbacks: config.fallbacks.filter(
												(other) =>
													other.id !== fallback.id,
											),
										})
									}
									disabled={disabled}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
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
					<Plus className="h-4 w-4" />
					Add Failover Engine
				</Button>
				<FieldDescription>
					Tried in order when the chosen route fails to serve a
					request.
				</FieldDescription>
			</Field>

			<Field>
				<FieldLabel htmlFor={`${baseId}-embeddings`}>
					Embeddings Engine
				</FieldLabel>
				{renderEngineSelect(
					`${baseId}-embeddings`,
					config.embeddings_engine,
					(embeddings_engine) => update({ embeddings_engine }),
					"Only needed if this router should serve embeddings",
					true,
				)}
			</Field>
		</div>
	);
};
