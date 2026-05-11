export const getContextMenuPosition = (
	clientX: number = 0,
	clientY: number = 0,
) => {
	const dialogData = document.querySelectorAll(
		'[data-slot="dialog-content"]',
	);
	const dialogContentLength = dialogData.length;
	let mouseX = 0,
		mouseY = 0,
		scrollTop = 0,
		scrollLeft = 0,
		finalMouseX = 0,
		finalMouseY = 0;
	if (dialogData && dialogContentLength > 0) {
		scrollTop =
			dialogData[dialogContentLength - 1 ? dialogContentLength - 1 : 0]
				.scrollTop;
		scrollLeft =
			dialogData[dialogContentLength - 1 ? dialogContentLength - 1 : 0]
				.scrollLeft;
		const clientRect =
			dialogData[
				dialogContentLength - 1 ? dialogContentLength - 1 : 0
			].getBoundingClientRect();
		mouseX = clientRect.left;
		mouseY = clientRect.top;
	}
	finalMouseX = clientX - mouseX + scrollLeft;
	finalMouseY =
		scrollTop === 0 ? clientY - mouseY : clientY + (scrollTop - mouseY);
	return { finalMouseX, finalMouseY };
};
