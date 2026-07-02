import { Check, Copy, RotateCcw } from "lucide-react";
import type React from "react";
import { Suspense, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import { Button, cn, P, useTheme } from "@semoss/ui/next";
import { QueryActions } from "./query-actions";

interface SQLQueryEditorProps {
	query: string;
	setQuery: (query: string) => void;
	clearQuery: () => void;
	handleEditorMount: (editor, monaco) => void;
	executeQuery: () => void;
	previewLoading: boolean;
	onUserQueryInput?: (query: string) => void;
	runDisabled?: boolean;
}

export const SQLQueryEditor: React.FC<SQLQueryEditorProps> = ({
	query,
	setQuery,
	clearQuery,
	handleEditorMount,
	executeQuery,
	previewLoading,
	onUserQueryInput,
	runDisabled = false,
}) => {
	const [copied, setCopied] = useState(false);
	const { resolvedTheme } = useTheme();

	const handleCopyQuery = async () => {
		if (query && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(query);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch (err) {
				console.error("Failed to copy query:", err);
			}
		}
	};

	return (
		<div
			className="flex h-full flex-col overflow-hidden"
			data-testid="sql-query-editor"
		>
			{/* Header */}
			<div className="flex flex-shrink-0 items-center justify-between border-border/50 border-b bg-gradient-to-r from-accent/50 via-accent/40 to-accent/30 px-4 py-2.5">
				<h3
					className="font-semibold text-foreground text-sm"
					data-testid="query-editor-title"
				>
					Enter Query
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearQuery}
					className="h-8 gap-1.5 font-medium text-primary text-xs hover:bg-primary/10 hover:text-primary"
					data-testid="query-reset-btn"
				>
					<RotateCcw className="size-3.5" />
					Reset
				</Button>
			</div>

			{/* Editor Container */}
			<div className="group/query-editor relative m-2 flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-muted/30 shadow-lg transition-all duration-300 hover:border-primary/60 hover:shadow-xl">
				{/* Copy Button */}
				{query && (
					<div className="pointer-events-none absolute top-3 right-3 z-10 opacity-0 transition-opacity group-focus-within/query-editor:pointer-events-auto group-focus-within/query-editor:opacity-100 group-hover/query-editor:pointer-events-auto group-hover/query-editor:opacity-100">
						<Button
							variant="secondary"
							size="icon"
							onClick={handleCopyQuery}
							title={copied ? "Copied!" : "Copy query"}
							className={cn(
								"size-8 bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105",
							)}
							data-testid="query-copy-btn"
						>
							{copied ? (
								<Check className="size-4" />
							) : (
								<Copy className="size-4" />
							)}
						</Button>
					</div>
				)}

				{/* Monaco Editor */}
				<div className="relative h-full min-h-[200px] overflow-hidden bg-gradient-to-br from-card to-muted/50">
					<Suspense
						fallback={
							<div className="flex h-full items-center justify-center p-4">
								<div className="flex items-center gap-2">
									<div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									<P className="text-muted-foreground text-sm">
										Loading editor...
									</P>
								</div>
							</div>
						}
					>
						<MonacoEditor
							value={query}
							defaultValue=""
							language="sql"
							theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
							options={{
								fixedOverflowWidgets: true,
								scrollbar: {
									horizontal: "hidden",
									horizontalScrollbarSize: 0,
									alwaysConsumeMouseWheel: false,
								},
								readOnly: false,
								minimap: { enabled: false },
								automaticLayout: true,
								scrollBeyondLastLine: false,
								lineHeight: 20,
								fontSize: 14,
								overviewRulerBorder: false,
								lineNumbers: "on",
								glyphMargin: false,
								folding: false,
								lineNumbersMinChars: 3,
								wordWrap: "on",
								wrappingStrategy: "advanced",
								tabSize: 4,
								quickSuggestions: true,
								suggestOnTriggerCharacters: true,
								wordBasedSuggestions: false,
								colorDecorators: true,
								padding: { top: 12, bottom: 12 },
								renderLineHighlight: "all",
								cursorBlinking: "smooth",
								smoothScrolling: true,
							}}
							onChange={(value) => {
								const nextQuery = value || "";
								setQuery(nextQuery);
								onUserQueryInput?.(nextQuery);
							}}
							onMount={handleEditorMount}
						/>
					</Suspense>
				</div>
			</div>

			{/* Query Actions */}
			<div className="flex-shrink-0">
				<QueryActions
					clearQuery={clearQuery}
					executeQuery={executeQuery}
					previewLoading={previewLoading}
					query={query}
					runDisabled={runDisabled}
				/>
			</div>
		</div>
	);
};
