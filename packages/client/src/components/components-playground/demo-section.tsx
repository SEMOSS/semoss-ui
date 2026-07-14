import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import { CodeBlock } from "./code-block";

interface DemoSectionProps {
	title?: string;
	description?: ReactNode;
	preview: ReactNode;
	code: string;
	/** Extra classes for the preview surface — e.g. a fixed height for list/panel components. */
	previewClassName?: string;
}

/** Reusable "Preview / Code" block every doc page's examples are built from. */
export const DemoSection = ({
	title,
	description,
	preview,
	code,
	previewClassName,
}: DemoSectionProps) => {
	return (
		<section className="flex flex-col gap-3">
			{title ? (
				<h3 className="font-semibold text-foreground text-lg">
					{title}
				</h3>
			) : null}
			{description ? (
				<p className="text-muted-foreground text-sm">{description}</p>
			) : null}
			<Tabs defaultValue="preview" className="gap-3">
				<TabsList className="w-fit">
					<TabsTrigger value="preview">Preview</TabsTrigger>
					<TabsTrigger value="code">Code</TabsTrigger>
				</TabsList>
				<TabsContent value="preview">
					<div
						className={`rounded-lg border border-border bg-card p-6 ${previewClassName ?? ""}`}
					>
						{preview}
					</div>
				</TabsContent>
				<TabsContent value="code">
					<CodeBlock code={code} />
				</TabsContent>
			</Tabs>
		</section>
	);
};
