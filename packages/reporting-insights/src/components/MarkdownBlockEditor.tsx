import Editor from "@monaco-editor/react";
import { Eye, FileText } from "lucide-react";
import { MarkdownVisualization } from "@/components/visualizations/MarkdownVisualization";
import type { VisualizationConfig } from "@/types/dashboard";

interface Viz {
	config?: VisualizationConfig;
}

interface Props {
	viz: Viz;
	onUpdate: (updates: { config?: VisualizationConfig }) => void;
}

export function MarkdownBlockEditor({ viz, onUpdate }: Props) {
	const markdownContent = viz.config?.markdownContent ?? "";

	return (
		<div className="flex h-full overflow-hidden">
			<div className="flex min-w-0 flex-1 flex-col border-stone-200 border-r">
				<div className="flex shrink-0 items-center gap-2 border-stone-100 border-b bg-stone-50 px-3 py-2">
					<FileText className="h-3.5 w-3.5 text-stone-400" />
					<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
						Markdown Editor
					</span>
				</div>
				<div className="min-h-0 flex-1">
					<Editor
						height="100%"
						language="markdown"
						theme="vs-light"
						value={markdownContent}
						onChange={(value) =>
							onUpdate({
								config: {
									...viz.config,
									markdownContent: value ?? "",
								},
							})
						}
						options={{
							minimap: { enabled: false },
							fontSize: 12,
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							wordWrap: "on",
							automaticLayout: true,
							tabSize: 2,
						}}
					/>
				</div>
			</div>

			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex shrink-0 items-center gap-2 border-stone-100 border-b bg-stone-50 px-3 py-2">
					<Eye className="h-3.5 w-3.5 text-stone-400" />
					<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
						Preview
					</span>
				</div>
				<div className="min-h-0 flex-1 bg-white">
					<MarkdownVisualization config={viz.config} />
				</div>
			</div>
		</div>
	);
}
