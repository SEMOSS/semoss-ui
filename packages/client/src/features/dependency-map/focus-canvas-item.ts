/**
 * Moves focus back to an item or a link on a React Flow canvas, such as after
 * the panel it opened closes. Does nothing when it is not drawn, for example
 * outside the viewport.
 *
 * @param id - The node's or edge's id.
 * @returns Whether something took focus.
 */
export const focusCanvasItem = (id: string): boolean => {
	if (!id) {
		return false;
	}
	const selector = `[data-id="${CSS.escape(id)}"]`;
	const item = document.querySelector<HTMLElement>(
		`.react-flow__node${selector}, .react-flow__edge${selector}`,
	);
	item?.focus();
	return item !== null;
};
