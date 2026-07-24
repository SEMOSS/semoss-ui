import type { VisualizationConfig } from "@/types/dashboard";

interface Props {
	config?: VisualizationConfig;
}

/**
 * Renders the stored HTML content inside a sandboxed iframe.
 * Used both in the dashboard view and in the portal published output.
 */
export function HtmlBlockVisualization({ config }: Props) {
	const html = config?.htmlContent ?? "";

	if (!html) {
		return (
			<div className="flex h-full items-center justify-center text-slate-400">
				<div className="px-6 text-center">
					<svg
						className="mx-auto mb-3 h-10 w-10 opacity-30"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
						/>
					</svg>
					<p className="font-medium text-slate-500 text-sm">
						No HTML content
					</p>
					<p className="mt-1 text-xs">
						Edit this block to add HTML or use the AI generator
					</p>
				</div>
			</div>
		);
	}

	return (
		<iframe
			srcDoc={html}
			sandbox="allow-scripts"
			className="h-full w-full border-0"
			title="HTML Block Preview"
		/>
	);
}
