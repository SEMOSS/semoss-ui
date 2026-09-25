import { useLayoutEffect, useRef } from "react";

/** Supplies the hidden label expected by cmdk's command container. */
export function AccessibleCommandLabel() {
	const anchorRef = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		const commandLabel = anchorRef.current
			?.closest('[data-slot="command"]')
			?.querySelector("[cmdk-label]");
		if (commandLabel) commandLabel.textContent = "Search routes and rooms";
	}, []);

	return <span ref={anchorRef} aria-hidden="true" className="sr-only" />;
}
