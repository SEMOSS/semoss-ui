import { Suspense, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import {
	Markdown,
	P,
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

export const MarkdownEditor = (props: MarkdownEditorProps) => {
	const { value, onChange = () => null } = props;
	const [view, setView] = useState<"edit" | "view">("edit");

	return (
		<div className="w-full">
			<P className="mb-2 font-semibold text-secondary-foreground text-sm">
				{"Add details as "}
				<a
					href="https://handbook.gitlab.com/docs/markdown-guide/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary underline hover:text-primary/80"
				>
					Markdown
				</a>
			</P>
			<Tabs
				value={view}
				onValueChange={(val) => setView(val as "edit" | "view")}
				className="w-full"
			>
				<TabsList className="w-full rounded-t-lg rounded-b-none">
					<TabsTrigger
						value="edit"
						data-testid="markdownEditor-Edit-toggle"
						className="flex-1"
					>
						Edit
					</TabsTrigger>
					<TabsTrigger
						value="view"
						data-testid="markdownEditor-View-toggle"
						className="flex-1"
					>
						View
					</TabsTrigger>
				</TabsList>
				<div className="h-64 w-full overflow-x-auto overflow-y-auto rounded-b-lg border border-border border-t-0 bg-background">
					<TabsContent value="edit" className="m-0 h-full p-0">
						<Suspense
							fallback={
								<div className="p-4 text-muted-foreground">
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
								onChange={(newValue) => {
									// Handle changes in the editor's content.
									onChange(newValue || "");
								}}
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
