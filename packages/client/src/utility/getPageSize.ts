// export function getPageSizeBasedOnScreen(isFullWidth: boolean = false): number {
//   const height = window.innerHeight;
//   const width = (window.innerWidth / 2);

//   // Calculate the "middle" of the screen
//   const startFromMiddle = height / 2;
//   const divider = isFullWidth ? 1 : 2; // Adjust based on full width or not

//   // If width is large, we consider desktop view, else mobile/tablet
//   if (width > 1200) {
//     return Math.floor(((startFromMiddle / 100) * 10) / divider);
//   } else if (width > 768) {
//     return Math.floor(((startFromMiddle / 100) * 5) / divider);
//   } else {
//     return Math.floor(((startFromMiddle / 100) * 3) / divider);
//   }
// }

export function getPageSizeBasedOnScreen({
	isFullWidth = false,
	rowHeight = 180,
	rowWidth = 300,
}): number {
	// Get current viewport dimensions
	const height = window.innerHeight / 2; // Use half height for calculations
	const width = isFullWidth ? window.innerWidth : window.innerWidth / 1.5;

	// Calculate how many items fit per row and per column
	const columns = isFullWidth ? 1 : Math.max(1, Math.floor(width / rowWidth));
	const rows = Math.max(1, Math.floor(height / rowHeight));

	// Total items that fit in the viewport
	const pageSize = columns * rows;

	return Math.max(5, pageSize);
}
