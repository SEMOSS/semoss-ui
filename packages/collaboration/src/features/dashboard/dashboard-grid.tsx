import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "./dashboard.context";
import { DashboardCard } from "./dashboard-card";
import { type DashboardWidget, moveWidget } from "./dashboard-layout";
import { DashboardTileHost } from "./dashboard-tile-host";
import { DashboardWidgetContent } from "./dashboard-widget-content";
import { moveDashboardTiles } from "./move-dashboard-tiles";

/** Container width, rather than the viewport, accounts for an expanded sidebar. */
export function DashboardGrid() {
	const { layout } = useDashboard();
	const widgets = layout.isEditing
		? layout.draft.widgets
		: layout.preferences.widgets;
	const visible = widgets.filter((widget) => widget.visible);
	const ref = useRef<HTMLDivElement>(null);
	const [columns, setColumns] = useState(12);
	useEffect(() => {
		if (ref.current)
			moveDashboardTiles(
				ref.current,
				widgets.map((widget) => widget.id),
			);
	}, [widgets]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	useEffect(() => {
		if (!ref.current || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry)
				setColumns(
					entry.contentRect.width >= 960
						? 12
						: entry.contentRect.width >= 640
							? 6
							: 1,
				);
		});
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);
	function update(id: string, changes: Partial<DashboardWidget>): void {
		layout.setWidgets(
			widgets.map((widget) =>
				widget.id === id ? { ...widget, ...changes } : widget,
			),
		);
	}
	return (
		<>
			{layout.isEditing &&
				widgets.some((widget) => widget.kind === "app") &&
				typeof Element.prototype.moveBefore !== "function" && (
					<p className="mb-3 text-muted-foreground text-sm">
						This browser reloads embedded apps when you move them.
						Save any work inside your apps before rearranging.
					</p>
				)}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={({ active, over }) => {
					if (over)
						layout.setWidgets(
							moveWidget(
								widgets,
								String(active.id),
								String(over.id),
							),
						);
				}}
			>
				<SortableContext
					items={visible.map((widget) => widget.id)}
					strategy={rectSortingStrategy}
				>
					{/* Column count is measured runtime geometry; tile spans come from validated user preferences. */}
					<div
						ref={ref}
						className="grid auto-rows-2 gap-x-4"
						style={{
							gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
						}}
					>
						{widgets.map((widget) => (
							<DashboardTileHost
								key={widget.id}
								id={widget.id}
								grid={ref}
							>
								<DashboardCard
									widget={widget}
									columns={columns}
									isEditing={layout.isEditing}
									onChange={(changes) =>
										update(widget.id, changes)
									}
									canMoveUp={
										visible.findIndex(
											(entry) => entry.id === widget.id,
										) > 0
									}
									canMoveDown={
										visible.findIndex(
											(entry) => entry.id === widget.id,
										) <
										visible.length - 1
									}
									onMove={(direction) => {
										const other =
											visible[
												visible.findIndex(
													(entry) =>
														entry.id === widget.id,
												) + direction
											];
										if (other)
											layout.setWidgets(
												moveWidget(
													widgets,
													widget.id,
													other.id,
												),
											);
									}}
								>
									<DashboardWidgetContent widget={widget} />
								</DashboardCard>
							</DashboardTileHost>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</>
	);
}
