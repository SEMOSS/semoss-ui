import { lazy, Suspense, useState } from "react";
// import { MonacoEditor } from "@semoss/shared/monaco";
import {
	Markdown,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";

interface MarkdownEditorProps {
	/** Value of the input */
	value: string;
	/** Callback that is triggered when the value changes */
	onChange?: (value: string) => void;
}

const MonacoEditor = lazy(() =>
	import("@semoss/shared/monaco").then((module) => module.MonacoEditor),
);

export const MarkdownEditor = (props: MarkdownEditorProps) => {
	const { value, onChange = () => null } = props;
	const [view, setView] = useState<"edit" | "view">("edit");

	return (
		<div className="w-full overflow-hidden rounded-lg border border-border bg-background">
			<Tabs
				value={view}
				onValueChange={(val) => setView(val as "edit" | "view")}
				className="w-full gap-0"
			>
				{/* ── Tab bar — label left, tabs right, all in one row ── */}
				<div className="flex items-center justify-between border-border border-b bg-muted/40 px-3 py-1.5">
					{/* Left: descriptive label with Markdown link */}
					<span className="text-muted-foreground text-sm">
						Add details as{" "}
						<a
							href="https://handbook.gitlab.com/docs/markdown-guide/"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-primary underline-offset-2 hover:underline"
						>
							Markdown
						</a>
					</span>

					{/* Right: Edit / View pill tabs */}
					<TabsList className="h-8 rounded-md bg-muted p-0.5">
						<TabsTrigger
							value="edit"
							data-testid="markdownEditor-Edit-toggle"
							className="h-7 rounded-sm px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
						>
							Edit
						</TabsTrigger>
						<TabsTrigger
							value="view"
							data-testid="markdownEditor-View-toggle"
							className="h-7 rounded-sm px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
						>
							View
						</TabsTrigger>
					</TabsList>
				</div>

				{/* ── Editor / Preview content area ── */}
				<div className="h-64 w-full overflow-hidden bg-background">
					<TabsContent value="edit" className="m-0 h-full p-0">
						<Suspense
							fallback={
								<div className="p-4 text-muted-foreground text-sm">
									Loading editor...
								</div>
							}
						>
							<MonacoEditor
								height="100%"
								width="100%"
								defaultValue={value}
								value={value}
								language="markdown"
								onChange={(newValue) =>
									onChange(newValue || "")
								}
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									lineNumbers: "on",
									scrollBeyondLastLine: false,
									wordWrap: "off",
								}}
							/>
						</Suspense>
					</TabsContent>

					<TabsContent
						value="view"
						className="m-0 h-full overflow-auto p-4"
					>
						<Markdown>{value}</Markdown>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};
