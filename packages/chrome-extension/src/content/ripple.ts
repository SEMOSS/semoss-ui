/**
 * Ripple effect for visual feedback when clicking elements
 */

export default function ripple(x: number, y: number) {
	const rippleElement = document.createElement("div");
	rippleElement.style.position = "fixed";
	rippleElement.style.left = `${x}px`;
	rippleElement.style.top = `${y}px`;
	rippleElement.style.width = "20px";
	rippleElement.style.height = "20px";
	rippleElement.style.borderRadius = "50%";
	rippleElement.style.backgroundColor = "rgba(59, 130, 246, 0.5)"; // Blue color
	rippleElement.style.transform = "translate(-50%, -50%)";
	rippleElement.style.pointerEvents = "none";
	rippleElement.style.zIndex = "999999";
	rippleElement.style.transition = "all 0.6s ease-out";

	document.body.appendChild(rippleElement);

	// Trigger animation
	requestAnimationFrame(() => {
		rippleElement.style.width = "100px";
		rippleElement.style.height = "100px";
		rippleElement.style.backgroundColor = "rgba(59, 130, 246, 0)";
	});

	// Remove after animation
	setTimeout(() => {
		rippleElement.remove();
	}, 600);
}
