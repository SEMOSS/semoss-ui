import { type Change, diffWords } from "diff";
import type React from "react";

interface DiffViewerProps {
	original: string;
	optimized: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
	original,
	optimized,
}) => {
	const differences = diffWords(original, optimized);

	const renderDiff = (changes: Change[], showAdded: boolean) => {
		return changes.map((part, idx) => {
			if (part.removed && !showAdded) {
				return (
					<span
						key={idx}
						className="rounded bg-red-100 px-0.5 text-red-800 line-through"
					>
						{part.value}
					</span>
				);
			}

			if (part.added && showAdded) {
				return (
					<span
						key={idx}
						className="rounded bg-green-100 px-0.5 font-medium text-green-800"
					>
						{part.value}
					</span>
				);
			}

			if (!part.added && !part.removed) {
				return <span key={idx}>{part.value}</span>;
			}

			return null;
		});
	};

	return (
		<div
			className="grid grid-cols-2 gap-6"
			data-testid="prompt-diff-viewer"
		>
			{/* Original */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="font-semibold text-sm">Original</h4>
					<div className="text-muted-foreground text-xs">
						{original.split(" ").length} words
					</div>
				</div>
				<div className="min-h-[200px] rounded-lg border border-border bg-muted/30 p-4">
					<p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
						{renderDiff(differences, false)}
					</p>
				</div>
			</div>

			{/* Optimized */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="font-semibold text-sm">Optimized</h4>
					<div className="text-muted-foreground text-xs">
						{optimized.split(" ").length} words
					</div>
				</div>
				<div className="min-h-[200px] rounded-lg border border-green-200 bg-muted/30 p-4">
					<p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
						{renderDiff(differences, true)}
					</p>
				</div>
			</div>
		</div>
	);
};
