import { useMemo } from "react";
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Separator,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { generateFormAppFiles } from "../form-builder.helpers";
import type { FormBuilderState } from "../form-builder.types";

interface FormBuilderPreviewStepProps {
	state: FormBuilderState;
}

export const FormBuilderPreviewStep = ({
	state,
}: FormBuilderPreviewStepProps) => {
	const files = useMemo(() => generateFormAppFiles(state), [state]);

	const summary = state.tables.map((t) => ({
		table: t.table,
		operations: t.operations,
		fieldCount: t.columns.length,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preview & Create</CardTitle>
				<CardDescription>
					Review your configuration before generating the app. Click
					&quot;Create App&quot; when ready.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{/* Summary */}
				<div className="flex flex-col gap-3">
					<h3 className="font-semibold text-sm">App Summary</h3>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<span className="text-muted-foreground">Name</span>
						<span className="font-medium">{state.appName}</span>
						<span className="text-muted-foreground">Database</span>
						<span className="font-medium">
							{state.databaseName}
						</span>
						{state.appDescription && (
							<>
								<span className="text-muted-foreground">
									Description
								</span>
								<span>{state.appDescription}</span>
							</>
						)}
					</div>
				</div>

				<Separator />

				{/* Table details */}
				<div className="flex flex-col gap-3">
					<h3 className="font-semibold text-sm">Tables & Actions</h3>
					{summary.map((t) => (
						<div
							key={t.table}
							className="flex items-center justify-between rounded-md border px-3 py-2"
						>
							<div className="flex flex-col">
								<span className="font-medium text-sm">
									{t.table}
								</span>
								<span className="text-muted-foreground text-xs">
									{t.fieldCount} columns
								</span>
							</div>
							<div className="flex gap-1">
								{t.operations.map((op) => (
									<Badge key={op} variant="secondary">
										{op.toUpperCase()}
									</Badge>
								))}
							</div>
						</div>
					))}
				</div>

				<Separator />

				{/* Generated files preview */}
				<div className="flex flex-col gap-3">
					<h3 className="font-semibold text-sm">
						Generated Files ({files.length})
					</h3>
					<Tabs defaultValue={files[0]?.path || ""}>
						<TabsList className="flex-wrap">
							{files.map((f) => (
								<TabsTrigger key={f.path} value={f.path}>
									{f.path}
								</TabsTrigger>
							))}
						</TabsList>
						{files.map((f) => (
							<TabsContent key={f.path} value={f.path}>
								<pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 font-mono text-xs">
									{f.content}
								</pre>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</CardContent>
		</Card>
	);
};
