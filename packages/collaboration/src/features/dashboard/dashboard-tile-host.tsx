import { type ReactNode, type RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** React owns the tile contents; the grid owns stable hosts for state-preserving DOM moves. */
export function DashboardTileHost({
	id,
	grid,
	children,
}: {
	id: string;
	grid: RefObject<HTMLDivElement | null>;
	children: ReactNode;
}) {
	const [host] = useState(() => {
		const element = document.createElement("div");
		element.className = "contents";
		element.dataset.widgetId = id;
		return element;
	});
	useEffect(() => {
		const container = grid.current;
		container?.appendChild(host);
		return () => host.remove();
	}, [grid, host]);
	return createPortal(children, host);
}
