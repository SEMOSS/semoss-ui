import { type ImgHTMLAttributes, useEffect, useState } from "react";
import { getEngineSubtypeIcon } from "./icon-utils";

interface EngineSubtypeIconProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
	engineType: string;
	engineSubtype?: string;
}

export const EngineSubtypeIcon = ({
	engineType,
	engineSubtype,
	alt = "",
	...imgProps
}: EngineSubtypeIconProps) => {
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		getEngineSubtypeIcon(engineType, engineSubtype).then((url) => {
			if (!cancelled) setSrc(url);
		});
		return () => {
			cancelled = true;
		};
	}, [engineType, engineSubtype]);

	if (!src) {
		// Reserve layout space while the lazy chunk resolves so consumers don't shift.
		return (
			<span
				aria-hidden
				className={imgProps.className}
				style={imgProps.style}
			/>
		);
	}

	return <img src={src} alt={alt} {...imgProps} />;
};
