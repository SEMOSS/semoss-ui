import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	AppWindow,
	ArrowDown,
	ArrowUp,
	Bot,
	CalendarDays,
	GripVertical,
	Inbox,
	Mail,
	Maximize2,
	Minus,
	Plus,
	Settings2,
	X,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useRef } from "react";
import {
	Button,
	cn,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { DashboardWidget } from "./dashboard-layout";

interface DashboardCardProps {
	widget: DashboardWidget;
	columns: number;
	isEditing: boolean;
	children: ReactNode;
	onChange: (changes: Partial<DashboardWidget>) => void;
	onMove: (direction: -1 | 1) => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}

/** Stable keyed tiles retain embedded applications while their layout changes. */
export function DashboardCard({
	widget,
	columns,
	isEditing,
	children,
	onChange,
	onMove,
	canMoveUp,
	canMoveDown,
}: DashboardCardProps) {
	const sortable = useSortable({ id: widget.id, disabled: !isEditing });
	const resize = useRef<{
		x: number;
		y: number;
		width: number;
		height: number;
		columnSize: number;
	} | null>(null);
	const width =
		columns === 1
			? 1
			: Math.max(3, Math.round((widget.width * columns) / 12));
	const Icon = {
		day: CalendarDays,
		needs: Inbox,
		agents: Bot,
		email: Mail,
		app: AppWindow,
	}[widget.kind];
	// Runtime geometry is user-configured dashboard layout; all chrome uses SEMOSS tokens.
	const style: CSSProperties = {
		gridColumn: `span ${width}`,
		gridRow: `span ${widget.height}`,
		transform: CSS.Translate.toString(sortable.transform),
		transition: sortable.transition,
	};
	return (
		<section
			ref={sortable.setNodeRef}
			hidden={!widget.visible}
			style={style}
			aria-label={widget.title}
			className={cn(
				"relative min-h-0 min-w-0 pb-4",
				sortable.isDragging && "z-10 opacity-70",
				!widget.visible && "hidden",
			)}
		>
			<div
				className={cn(
					"flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-card",
					widget.kind === "needs" &&
						!isEditing &&
						"border-transparent bg-transparent",
					isEditing && "ring-1 ring-primary/30",
				)}
			>
				<div
					className={cn(
						"flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-border/60 border-b px-4 py-3",
						widget.kind === "needs" &&
							!isEditing &&
							"border-transparent px-0",
					)}
				>
					{isEditing && (
						<Button
							variant="ghost"
							size="icon-sm"
							className="cursor-grab touch-none"
							aria-label={`Drag ${widget.title}`}
							{...sortable.attributes}
							{...sortable.listeners}
						>
							<GripVertical aria-hidden="true" />
						</Button>
					)}
					{!isEditing && (
						<Icon
							aria-hidden="true"
							className="size-4 shrink-0 text-muted-foreground"
						/>
					)}
					<h2 className="min-w-0 flex-1 font-semibold text-sm tracking-tight">
						{widget.title}
					</h2>
					{isEditing && (
						<>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={`Configure ${widget.title}`}
									>
										<Settings2 aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-64 space-y-4"
									align="end"
								>
									<div className="space-y-2">
										<Label>Move</Label>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												disabled={!canMoveUp}
												onClick={() => onMove(-1)}
											>
												<ArrowUp aria-hidden="true" />
												Earlier
											</Button>
											<Button
												size="sm"
												variant="outline"
												disabled={!canMoveDown}
												onClick={() => onMove(1)}
											>
												<ArrowDown aria-hidden="true" />
												Later
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Width</Label>
										<div className="flex items-center gap-2">
											<Button
												size="icon-sm"
												variant="outline"
												aria-label={`Narrow ${widget.title}`}
												disabled={widget.width <= 3}
												onClick={() =>
													onChange({
														width: Math.max(
															3,
															widget.width - 1,
														),
													})
												}
											>
												<Minus aria-hidden="true" />
											</Button>
											<span className="flex-1 text-center text-sm">
												{widget.width} columns
											</span>
											<Button
												size="icon-sm"
												variant="outline"
												aria-label={`Widen ${widget.title}`}
												disabled={widget.width >= 12}
												onClick={() =>
													onChange({
														width: Math.min(
															12,
															widget.width + 1,
														),
													})
												}
											>
												<Plus aria-hidden="true" />
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<Label>Height</Label>
										<div className="flex items-center gap-2">
											<Button
												size="icon-sm"
												variant="outline"
												aria-label={`Shorten ${widget.title}`}
												disabled={widget.height <= 32}
												onClick={() =>
													onChange({
														height: Math.max(
															32,
															widget.height - 8,
														),
													})
												}
											>
												<Minus aria-hidden="true" />
											</Button>
											<span className="flex-1 text-center text-sm">
												{widget.height * 8}px
											</span>
											<Button
												size="icon-sm"
												variant="outline"
												aria-label={`Taller ${widget.title}`}
												disabled={widget.height >= 120}
												onClick={() =>
													onChange({
														height: Math.min(
															120,
															widget.height + 8,
														),
													})
												}
											>
												<Plus aria-hidden="true" />
											</Button>
										</div>
									</div>
									{widget.kind !== "app" && (
										<div className="space-y-2">
											<Label
												htmlFor={`${widget.id}-density`}
											>
												Density
											</Label>
											<Select
												value={widget.density}
												onValueChange={(value) =>
													onChange({
														density:
															value === "compact"
																? "compact"
																: "comfortable",
													})
												}
											>
												<SelectTrigger
													id={`${widget.id}-density`}
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="comfortable">
														Comfortable
													</SelectItem>
													<SelectItem value="compact">
														Compact
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
									{(widget.kind === "email" ||
										widget.kind === "needs") && (
										<div className="space-y-2">
											<Label
												htmlFor={`${widget.id}-filter`}
											>
												Show
											</Label>
											<Select
												value={widget.filter}
												onValueChange={(value) => {
													if (
														value === "all" ||
														value === "urgent" ||
														value === "latest" ||
														value === "vip" ||
														value === "unread"
													)
														onChange({
															filter: value,
														});
												}}
											>
												<SelectTrigger
													id={`${widget.id}-filter`}
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">
														All relevant
													</SelectItem>
													{widget.kind === "needs" ? (
														<>
															<SelectItem value="urgent">
																Urgent only
															</SelectItem>
															<SelectItem value="latest">
																Latest first
															</SelectItem>
														</>
													) : (
														<>
															<SelectItem value="vip">
																VIPs only
															</SelectItem>
															<SelectItem value="unread">
																Unread only
															</SelectItem>
														</>
													)}
												</SelectContent>
											</Select>
										</div>
									)}
								</PopoverContent>
							</Popover>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`Hide ${widget.title}`}
								onClick={() => onChange({ visible: false })}
							>
								<X aria-hidden="true" />
							</Button>
						</>
					)}
				</div>
				<div
					className={cn(
						"min-h-0 flex-1 overflow-y-auto p-4",
						widget.kind === "needs" && "p-0",
						widget.density === "compact" &&
							"[&_.dashboard-row]:space-y-2 [&_.dashboard-row]:py-2",
					)}
				>
					{children}
				</div>
				{isEditing && (
					<div className="flex h-7 shrink-0 justify-end border-t bg-muted/30">
						<Button
							variant="ghost"
							size="icon-sm"
							className="h-7 cursor-se-resize touch-none rounded-none"
							aria-label={`Resize ${widget.title}`}
							onPointerDown={(event) => {
								const tile =
									event.currentTarget.closest("section");
								if (!tile) return;
								event.currentTarget.setPointerCapture(
									event.pointerId,
								);
								resize.current = {
									x: event.clientX,
									y: event.clientY,
									width: widget.width,
									height: widget.height,
									columnSize:
										tile.getBoundingClientRect().width /
										width,
								};
							}}
							onPointerMove={(event) => {
								const start = resize.current;
								if (!start) return;
								onChange({
									width:
										columns === 1
											? widget.width
											: Math.max(
													3,
													Math.min(
														12,
														start.width +
															Math.round(
																((event.clientX -
																	start.x) /
																	start.columnSize) *
																	(12 /
																		columns),
															),
													),
												),
									height: Math.max(
										32,
										Math.min(
											120,
											start.height +
												Math.round(
													(event.clientY - start.y) /
														8,
												),
										),
									),
								});
							}}
							onPointerUp={() => {
								resize.current = null;
							}}
							onPointerCancel={() => {
								resize.current = null;
							}}
							onKeyDown={(event) => {
								if (
									event.key === "ArrowDown" ||
									event.key === "ArrowUp"
								) {
									event.preventDefault();
									onChange({
										height: Math.max(
											32,
											Math.min(
												120,
												widget.height +
													(event.key === "ArrowDown"
														? 8
														: -8),
											),
										),
									});
								} else if (
									event.key === "ArrowRight" ||
									event.key === "ArrowLeft"
								) {
									event.preventDefault();
									onChange({
										width: Math.max(
											3,
											Math.min(
												12,
												widget.width +
													(event.key === "ArrowRight"
														? 1
														: -1),
											),
										),
									});
								}
							}}
						>
							<Maximize2 aria-hidden="true" className="size-3" />
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
