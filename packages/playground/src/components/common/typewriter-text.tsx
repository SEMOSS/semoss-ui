import { useEffect, useRef, useState } from "react";

export interface TypewriterTextProps {
	/** Text to render; reveals character-by-character whenever this value changes */
	text: string;
	className?: string;
	/** Delay in ms between each revealed character */
	speed?: number;
}

/**
 * Renders text that types itself out character-by-character whenever `text`
 * changes — but not on initial mount, so an already-set value just appears
 * normally. A change first deletes the current value back to empty, then
 * types the new one in, rather than jumping straight to empty. Useful for
 * values that get replaced in place, like a generated title swapped in for a
 * placeholder.
 */
export const TypewriterText = ({
	text,
	className,
	speed = 30,
}: TypewriterTextProps) => {
	const [displayed, setDisplayed] = useState(text);
	const previousText = useRef(text);
	// Mirrors `displayed` so the effect below can read the latest value
	// without depending on it (which would re-trigger on every tick).
	const displayedRef = useRef(text);

	useEffect(() => {
		if (text === previousText.current) {
			return;
		}
		previousText.current = text;

		let interval: ReturnType<typeof setInterval>;

		const startTyping = () => {
			let index = 0;
			interval = setInterval(() => {
				index += 1;
				const next = text.slice(0, index);
				setDisplayed(next);
				displayedRef.current = next;
				if (index >= text.length) {
					clearInterval(interval);
				}
			}, speed);
		};

		if (displayedRef.current.length === 0) {
			startTyping();
		} else {
			interval = setInterval(() => {
				const next = displayedRef.current.slice(0, -1);
				setDisplayed(next);
				displayedRef.current = next;
				if (next.length === 0) {
					clearInterval(interval);
					startTyping();
				}
			}, speed);
		}

		return () => clearInterval(interval);
	}, [text, speed]);

	const isTyping = displayed !== text;

	return (
		<span className={className}>
			{displayed}
			{isTyping && (
				<span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-current align-middle" />
			)}
		</span>
	);
};
