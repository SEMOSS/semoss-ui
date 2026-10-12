/** Keep DOM, visual, and keyboard order identical while preserving live iframe state. */
export function moveDashboardTiles(
	container: HTMLElement,
	ids: string[],
): void {
	const hosts = new Map(
		[...container.children].map((child) => [
			child instanceof HTMLElement ? child.dataset.widgetId : undefined,
			child,
		]),
	);
	for (let index = 0; index < ids.length; index++) {
		const child = hosts.get(ids[index]);
		const before = container.children.item(index);
		if (!child || child === before) continue;
		// Legacy engines retain keyed DOM nodes, but reload iframe documents (surfaced in Customize).
		if (typeof container.moveBefore === "function")
			container.moveBefore(child, before);
		else container.insertBefore(child, before);
	}
}
