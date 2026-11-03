import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	ButtonGroup,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	RouterConfigFormValue,
	RouterRouteFormValue,
} from "@/components/import/model/model-import.constants";
import {
	type RouterEngineOption,
	RouterEngineSelect,
} from "./router-engine-select";

/** Props for {@link RouterRouteCard}. */
export interface RouterRouteCardProps {
	/** The route shown. */
	route: RouterRouteFormValue;
	/** The route's place in the list, from 0; routes are tried in this order. */
	index: number;
	/** How many routes the router has, which decides whether this one can move down or be removed. */
	routeCount: number;
	/** The router's routing method, which decides the fields the route has. */
	mode: RouterConfigFormValue["mode"];
	/** Prefix for the ids of the route's fields, unique to the editor. */
	idPrefix: string;
	/** The models the user can use, offered as the route's destination. */
	engines: RouterEngineOption[];
	/** Whether the models are still being read. */
	isLoadingEngines: boolean;
	/** Whether the destination picker is locked, as it is when the models could not be read. */
	isEngineSelectDisabled: boolean;
	/** Whether the route is locked, as it is while the router saves or for a viewer who cannot edit. */
	disabled?: boolean;
	/** Called with the route's fields that changed. */
	onChange: (partial: Partial<RouterRouteFormValue>) => void;
	/** Called when the route is moved one place up (-1) or down (1). */
	onMove: (offset: -1 | 1) => void;
	/** Called when the route is removed. */
	onRemove: () => void;
}

/**
 * One route of the Model Router: a header with its place, its name, its share
 * of traffic in weighted mode, and buttons that move it and remove it, over
 * its name and destination model and the fields its routing method uses. A
 * move that leaves its button disabled, at the top or the bottom, moves focus
 * to the other move button.
 */
export const RouterRouteCard = ({
	route,
	index,
	routeCount,
	mode,
	idPrefix,
	engines,
	isLoadingEngines,
	isEngineSelectDisabled,
	disabled = false,
	onChange,
	onMove,
	onRemove,
}: RouterRouteCardProps) => {
	const moveUpRef = useRef<HTMLButtonElement>(null);
	const moveDownRef = useRef<HTMLButtonElement>(null);
	// the move button to focus once a move left the pressed one disabled
	const [focusAfterMove, setFocusAfterMove] = useState<"up" | "down" | null>(
		null,
	);
	const number = index + 1;
	const name = route.name.trim();
	const isFirst = index === 0;
	const isLast = index === routeCount - 1;
	const isClassification = mode === "llm" || mode === "typesafe";
	const titleId = `${idPrefix}-title`;

	useEffect(() => {
		if (!focusAfterMove) {
			return;
		}
		(focusAfterMove === "up" ? moveUpRef : moveDownRef).current?.focus();
		setFocusAfterMove(null);
	}, [focusAfterMove]);

	const handleMove = (offset: -1 | 1) => {
		onMove(offset);
		if (offset === -1 && index === 1) {
			setFocusAfterMove("down");
		} else if (offset === 1 && index === routeCount - 2) {
			setFocusAfterMove("up");
		}
	};

	return (
		<fieldset
			aria-labelledby={titleId}
			className="flex min-w-0 flex-col rounded-lg border border-border bg-card"
		>
			<div className="flex min-w-0 items-center gap-3 border-border border-b px-4 py-2">
				<span
					aria-hidden
					className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs"
				>
					{number}
				</span>
				<span
					id={titleId}
					className="min-w-0 flex-1 truncate font-medium text-sm"
				>
					{name ? (
						<>
							<span className="sr-only">Route {number}: </span>
							{name}
						</>
					) : (
						`Route ${number}`
					)}
				</span>
				{mode === "weighted" && (
					<Badge variant="secondary" className="shrink-0">
						{route.weight}% of traffic
					</Badge>
				)}
				<ButtonGroup aria-label={`Order of route ${number}`}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								ref={moveUpRef}
								type="button"
								variant="outline"
								size="icon-sm"
								aria-label={`Move route ${number} up`}
								disabled={disabled || isFirst}
								onClick={() => handleMove(-1)}
							>
								<ArrowUp aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Move up</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								ref={moveDownRef}
								type="button"
								variant="outline"
								size="icon-sm"
								aria-label={`Move route ${number} down`}
								disabled={disabled || isLast}
								onClick={() => handleMove(1)}
							>
								<ArrowDown aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Move down</TooltipContent>
					</Tooltip>
				</ButtonGroup>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Remove route ${number}`}
							disabled={disabled || routeCount === 1}
							onClick={onRemove}
						>
							<Trash2 aria-hidden />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Remove route</TooltipContent>
				</Tooltip>
			</div>
			<div className="flex min-w-0 flex-col gap-4 p-4">
				<div className="grid min-w-0 gap-4 md:grid-cols-2">
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-name`}>
							Intent / route name
						</FieldLabel>
						<Input
							className="text-foreground"
							id={`${idPrefix}-name`}
							value={route.name}
							placeholder="e.g. coding"
							onChange={(event) =>
								onChange({ name: event.target.value })
							}
							disabled={disabled}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-engine`}>
							Destination model (required)
						</FieldLabel>
						<RouterEngineSelect
							id={`${idPrefix}-engine`}
							value={route.engine_id}
							onChange={(engine_id) => onChange({ engine_id })}
							engines={engines}
							disabled={disabled || isEngineSelectDisabled}
							isLoading={isLoadingEngines}
						/>
					</Field>
				</div>
				{isClassification && (
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-description`}>
							When should this route be used? (required)
						</FieldLabel>
						<Textarea
							className="text-foreground"
							id={`${idPrefix}-description`}
							value={route.description}
							placeholder="Requests to write, debug, or explain source code."
							rows={3}
							onChange={(event) =>
								onChange({ description: event.target.value })
							}
							disabled={disabled}
						/>
					</Field>
				)}
				{mode === "weighted" ? (
					<Field className="md:max-w-xs">
						<FieldLabel htmlFor={`${idPrefix}-weight`}>
							Traffic percentage
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								className="text-foreground"
								id={`${idPrefix}-weight`}
								type="number"
								min={0}
								max={100}
								step={1}
								value={route.weight}
								onChange={(event) =>
									onChange({
										weight: Number(event.target.value),
									})
								}
								disabled={disabled}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>%</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</Field>
				) : (
					<Field>
						<FieldLabel htmlFor={`${idPrefix}-keywords`}>
							{isClassification
								? "Fallback keywords (optional)"
								: "Keywords"}
						</FieldLabel>
						<Input
							className="text-foreground"
							id={`${idPrefix}-keywords`}
							value={route.keywords}
							placeholder="code, python, debug"
							onChange={(event) =>
								onChange({ keywords: event.target.value })
							}
							disabled={disabled}
						/>
						<FieldDescription>
							{isClassification
								? "Matched when classification fails. Separate keywords with commas."
								: "Matched as whole words in the latest message. Separate keywords with commas."}
						</FieldDescription>
					</Field>
				)}
			</div>
		</fieldset>
	);
};
