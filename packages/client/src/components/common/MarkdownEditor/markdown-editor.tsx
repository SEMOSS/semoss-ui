import { Suspense, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import {
	cn,
	Markdown,
	ScrollArea,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useTheme,
} from "@semoss/ui/next";

interface MarkdownEditorProps
	extends Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange"> {
	/** Value of the input */
	value: string;
	/** Callback that is triggered when the value changes */
	onChange: (value: string) => void;
}

export const MarkdownEditor = ({
	value,
	onChange,
	className,
	...otherProps
}: MarkdownEditorProps) => {
	const { resolvedTheme } = useTheme();

	const [view, setView] = useState<"edit" | "view">("edit");

	return (
		<div
			className={cn(
				"flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
				className,
			)}
			{...otherProps}
		>
			<Tabs
				value={view}
				onValueChange={(val) => setView(val as "edit" | "view")}
				className="flex h-full w-full flex-col gap-0 overflow-hidden"
			>
				<div className="flex w-full shrink-0 flex-row items-center gap-2 border-border border-b bg-muted p-4">
					<div className="flex-1 truncate text-sm leading-none">
						Enter as Markdown
					</div>
					<TabsList>
						<TabsTrigger
							value="edit"
							data-testid="markdownEditor-Edit-toggle"
						>
							Edit
						</TabsTrigger>
						<TabsTrigger
							value="view"
							data-testid="markdownEditor-View-toggle"
						>
							View
						</TabsTrigger>
					</TabsList>
				</div>

				{/* ── Editor / Preview content area ── */}
				<TabsContent value="edit" className="w-full">
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
							value={value}
							language="markdown"
							theme={
								resolvedTheme === "dark"
									? "vs-dark"
									: "vs-light"
							}
							onChange={(newValue) => onChange(newValue || "")}
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
					className="min-h-0 w-full overflow-hidden"
				>
					<ScrollArea
						scrollOrientation={"both"}
						className="h-full w-full flex-1 px-6 py-4"
					>
						<Markdown>{value}</Markdown>
					</ScrollArea>
				</TabsContent>
			</Tabs>
		</div>
	);
};
