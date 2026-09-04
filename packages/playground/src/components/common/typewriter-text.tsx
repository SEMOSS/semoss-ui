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
 * normally. Useful for values that get replaced in place, like a generated
 * title swapped in for a placeholder.
 */
export const TypewriterText = ({
	text,
	className,
	speed = 30,
}: TypewriterTextProps) => {
	const [displayed, setDisplayed] = useState(text);
	const previousText = useRef(text);

	useEffect(() => {
		if (text === previousText.current) {
			return;
		}
		previousText.current = text;

		setDisplayed("");

		let index = 0;
		const interval = setInterval(() => {
			index += 1;
			setDisplayed(text.slice(0, index));
			if (index >= text.length) {
				clearInterval(interval);
			}
		}, speed);

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
