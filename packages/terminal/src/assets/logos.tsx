import { Terminal as TerminalIcon } from "lucide-react";
import pythonLogo from "@semoss/shared/assets/img/PYTHON.svg";
import rLogo from "@semoss/shared/assets/img/R-logo.svg";
import type { ConsoleContext } from "../types";

const PixelIcon = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		aria-hidden="true"
	>
		<polyline points="16 18 22 12 16 6" />
		<polyline points="8 6 2 12 8 18" />
	</svg>
);

export const CopyIcon = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		aria-hidden="true"
	>
		<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</svg>
);

interface LogoProps {
	/** Which logo to render. */
	name: ConsoleContext | "pixel" | "r" | "py" | "shell";
	/** Tailwind class to size/color it. Defaults to `h-4 w-4`. */
	className?: string;
}

/**
 * Persona logos used by the REPL + file editor toolbars. R + Python pull the
 * canonical SVGs out of `@semoss/shared/assets/img` (no copies live here);
 * Pixel + Shell use inline / lucide vector icons so we stay all-SVG.
 */
export const Logo = ({ name, className = "h-4 w-4" }: LogoProps) => {
	const key = name.toLowerCase();
	if (key === "pixel") return <PixelIcon className={className} />;
	if (key === "r") return <img src={rLogo} alt="R" className={className} />;
	if (key === "python" || key === "py")
		return <img src={pythonLogo} alt="Python" className={className} />;
	if (key === "shell") return <TerminalIcon className={className} />;
	return null;
};
