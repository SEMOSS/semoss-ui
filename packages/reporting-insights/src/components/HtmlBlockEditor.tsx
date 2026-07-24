/**
 * HtmlBlockEditor — Monaco editor + AI generate panel + live preview.
 * Used in both the main app (NewDashboardPage Step 1) and the portal EditMode.
 *
 * Accepts a `runPixel` function instead of calling useInsight() directly so it
 * works in both the main app (InsightProvider context) and the published portal
 * (direct fetch API — no InsightProvider available).
 */
import Editor from "@monaco-editor/react";
import { Code2, Eye, Loader2, Sparkles } from "lucide-react";
import React from "react";
import { Select } from "@/components/ui";
import type { VisualizationConfig } from "@/types/dashboard";

interface Viz {
	config?: VisualizationConfig;
}

export interface HtmlBlockEditorProps {
	viz: Viz;
	onUpdate: (updates: { config?: VisualizationConfig }) => void;
	/** Runs a pixel and returns the raw output value (callers normalise the SDK shape). */
	runPixel: (pixel: string) => Promise<any>;
}

export function HtmlBlockEditor({
	viz,
	onUpdate,
	runPixel,
}: HtmlBlockEditorProps) {
	const [models, setModels] = React.useState<
		Array<{
			app_id: string;
			engine_name?: string;
			engine_display_name?: string;
		}>
	>([]);
	const [generating, setGenerating] = React.useState(false);
	const [localPrompt, setLocalPrompt] = React.useState(
		viz.config?.llmPrompt ?? "",
	);
	const [localModel, setLocalModel] = React.useState("");

	React.useEffect(() => {
		void (async () => {
			try {
				const output = await runPixel(
					`MyEngines(engineTypes=['MODEL']);`,
				);
				setModels((output as any[]) ?? []);
			} catch (err) {
				console.error("Failed to load LLM models:", err);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleGenerate = async () => {
		if (!localModel || !localPrompt.trim()) return;
		setGenerating(true);
		try {
			const escaped = localPrompt
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"')
				.replace(/\n/g, "\\n");
			const pixel = `LLM(engine=["${localModel}"], command=["${escaped}"], context=["You are an expert HTML/CSS developer. Generate clean, complete, self-contained HTML with inline CSS. Return ONLY the HTML code — no markdown, no code fences, no explanation."])`;
			const output = await runPixel(pixel);
			let html =
				(output as { response: string })?.response ??
				String(output ?? "");
			html = html
				.replace(/^```html?\s*/i, "")
				.replace(/\s*```\s*$/, "")
				.trim();
			onUpdate({
				config: {
					...viz.config,
					htmlContent: html,
					llmPrompt: localPrompt,
					llmModel: localModel,
				},
			});
		} catch (err) {
			console.error("LLM generation failed:", err);
			alert("Generation failed — see console for details.");
		} finally {
			setGenerating(false);
		}
	};

	const htmlContent = viz.config?.htmlContent ?? "";

	return (
		<div className="flex h-full overflow-hidden">
			{/* ── Left: Monaco editor + AI Generate panel ── */}
			<div className="flex min-w-0 flex-1 flex-col border-stone-200 border-r">
				{/* Editor header */}
				<div className="flex flex-shrink-0 items-center gap-2 border-stone-100 border-b bg-stone-50 px-3 py-2">
					<Code2 className="h-3.5 w-3.5 text-stone-400" />
					<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
						HTML Editor
					</span>
				</div>

				{/* Monaco */}
				<div className="min-h-0 flex-1">
					<Editor
						height="100%"
						language="html"
						theme="vs-light"
						value={htmlContent}
						onChange={(value) =>
							onUpdate({
								config: {
									...viz.config,
									htmlContent: value ?? "",
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

				{/* AI Generate panel */}
				<div className="flex-shrink-0 space-y-2 border-stone-200 border-t bg-stone-50 p-3">
					<div className="flex items-center gap-1.5">
						<Sparkles className="h-3 w-3 text-purple-500" />
						<span className="font-semibold text-[10px] text-stone-500 uppercase tracking-widest">
							AI Generate
						</span>
					</div>
					<textarea
						value={localPrompt}
						onChange={(e) => setLocalPrompt(e.target.value)}
						rows={3}
						className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs placeholder:text-stone-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
						placeholder="Describe what to generate — e.g. 'A responsive card with a gradient header and KPI number'"
					/>
					<div className="flex items-center gap-2">
						<Select
							value={localModel}
							onChange={(e) => {
								setLocalModel(e.target.value);
								onUpdate({
									config: {
										...viz.config,
										llmModel: e.target.value,
									},
								});
							}}
							className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
						>
							<option value="">Select model…</option>
							{models.map((m) => (
								<option key={m.app_id} value={m.app_id}>
									{m.engine_display_name ??
										m.engine_name ??
										m.app_id}
								</option>
							))}
						</Select>
						<button
							onClick={() => void handleGenerate()}
							disabled={
								generating || !localModel || !localPrompt.trim()
							}
							className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 font-semibold text-white text-xs shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{generating ? (
								<>
									<Loader2 className="h-3 w-3 animate-spin" />
									Generating…
								</>
							) : (
								<>
									<Sparkles className="h-3 w-3" />
									Generate
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* ── Right: Live preview ── */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex flex-shrink-0 items-center gap-2 border-stone-100 border-b bg-stone-50 px-3 py-2">
					<Eye className="h-3.5 w-3.5 text-stone-400" />
					<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
						Preview
					</span>
				</div>
				<div className="min-h-0 flex-1 bg-white">
					{htmlContent ? (
						<iframe
							srcDoc={htmlContent}
							sandbox="allow-scripts"
							className="h-full w-full border-0"
							title="HTML Preview"
						/>
					) : (
						<div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-400">
							<div>
								<Code2 className="mx-auto mb-2 h-8 w-8 opacity-20" />
								<p className="font-medium text-stone-500">
									No content yet
								</p>
								<p className="mt-1 text-stone-400 text-xs">
									Write HTML in the editor or use AI Generate
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
