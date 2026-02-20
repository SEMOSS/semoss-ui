import type { Edge, Node } from "@xyflow/react";
import { ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface ExampleTemplate {
	id: string;
	title: string;
	description: string;
	difficulty: "Beginner" | "Intermediate" | "Advanced";
	nodes: Node[];
	edges: Edge[];
	jsonLogic: unknown;
}

const EXAMPLE_TEMPLATES: ExampleTemplate[] = [
	{
		id: "simple-comparison",
		title: "Simple Comparison",
		description:
			"Check if a value equals something. Perfect for getting started!",
		difficulty: "Beginner",
		jsonLogic: {
			if: [
				{ "==": [{ var: "status" }, "active"] },
				"Approved",
				"Rejected",
			],
		},
		nodes: [
			{
				id: "op1",
				type: "operator",
				position: { x: 250, y: 100 },
				data: { label: "==" },
			},
			{
				id: "val1",
				type: "value",
				position: { x: 100, y: 50 },
				data: { label: "status" },
			},
			{
				id: "val2",
				type: "value",
				position: { x: 100, y: 150 },
				data: { label: '"active"' },
			},
			{
				id: "result1",
				type: "result",
				position: { x: 450, y: 80 },
				data: { label: '"Approved"' },
			},
			{
				id: "result2",
				type: "result",
				position: { x: 450, y: 140 },
				data: { label: '"Rejected"' },
			},
		],
		edges: [
			{ id: "e1", source: "op1", target: "val1" },
			{ id: "e2", source: "op1", target: "val2" },
			{ id: "e3", source: "op1", target: "result1", label: "true" },
			{ id: "e4", source: "op1", target: "result2", label: "else" },
		],
	},
	{
		id: "age-check",
		title: "Age Verification",
		description:
			"Check if someone is old enough using greater-than comparison.",
		difficulty: "Beginner",
		jsonLogic: { if: [{ ">=": [{ var: "age" }, 18] }, "Adult", "Minor"] },
		nodes: [
			{
				id: "op1",
				type: "operator",
				position: { x: 250, y: 100 },
				data: { label: ">=" },
			},
			{
				id: "val1",
				type: "value",
				position: { x: 100, y: 50 },
				data: { label: "age" },
			},
			{
				id: "val2",
				type: "value",
				position: { x: 100, y: 150 },
				data: { label: "18" },
			},
			{
				id: "result1",
				type: "result",
				position: { x: 450, y: 80 },
				data: { label: '"Adult"' },
			},
			{
				id: "result2",
				type: "result",
				position: { x: 450, y: 140 },
				data: { label: '"Minor"' },
			},
		],
		edges: [
			{ id: "e1", source: "op1", target: "val1" },
			{ id: "e2", source: "op1", target: "val2" },
			{ id: "e3", source: "op1", target: "result1", label: "true" },
			{ id: "e4", source: "op1", target: "result2", label: "else" },
		],
	},
	{
		id: "multiple-conditions",
		title: "Multiple Conditions with AND",
		description: "Combine multiple checks - all must be true.",
		difficulty: "Intermediate",
		jsonLogic: {
			if: [
				{
					and: [
						{ ">=": [{ var: "age" }, 18] },
						{ "==": [{ var: "country" }, "US"] },
					],
				},
				"Eligible",
				"Not Eligible",
			],
		},
		nodes: [
			{
				id: "and1",
				type: "operator",
				position: { x: 400, y: 120 },
				data: { label: "AND" },
			},
			{
				id: "op1",
				type: "operator",
				position: { x: 200, y: 50 },
				data: { label: ">=" },
			},
			{
				id: "op2",
				type: "operator",
				position: { x: 200, y: 180 },
				data: { label: "==" },
			},
			{
				id: "val1",
				type: "value",
				position: { x: 50, y: 20 },
				data: { label: "age" },
			},
			{
				id: "val2",
				type: "value",
				position: { x: 50, y: 80 },
				data: { label: "18" },
			},
			{
				id: "val3",
				type: "value",
				position: { x: 50, y: 150 },
				data: { label: "country" },
			},
			{
				id: "val4",
				type: "value",
				position: { x: 50, y: 210 },
				data: { label: '"US"' },
			},
			{
				id: "result1",
				type: "result",
				position: { x: 600, y: 100 },
				data: { label: '"Eligible"' },
			},
			{
				id: "result2",
				type: "result",
				position: { x: 600, y: 160 },
				data: { label: '"Not Eligible"' },
			},
		],
		edges: [
			{ id: "e1", source: "op1", target: "val1" },
			{ id: "e2", source: "op1", target: "val2" },
			{ id: "e3", source: "op2", target: "val3" },
			{ id: "e4", source: "op2", target: "val4" },
			{ id: "e5", source: "and1", target: "op1" },
			{ id: "e6", source: "and1", target: "op2" },
			{ id: "e7", source: "and1", target: "result1", label: "true" },
			{ id: "e8", source: "and1", target: "result2", label: "else" },
		],
	},
	{
		id: "or-conditions",
		title: "Either/Or Conditions with OR",
		description:
			"Check if any condition is true - great for multiple valid options.",
		difficulty: "Intermediate",
		jsonLogic: {
			if: [
				{
					or: [
						{ "==": [{ var: "role" }, "admin"] },
						{ "==": [{ var: "role" }, "manager"] },
					],
				},
				"Access Granted",
				"Access Denied",
			],
		},
		nodes: [
			{
				id: "or1",
				type: "operator",
				position: { x: 400, y: 120 },
				data: { label: "OR" },
			},
			{
				id: "op1",
				type: "operator",
				position: { x: 200, y: 50 },
				data: { label: "==" },
			},
			{
				id: "op2",
				type: "operator",
				position: { x: 200, y: 180 },
				data: { label: "==" },
			},
			{
				id: "val1",
				type: "value",
				position: { x: 50, y: 20 },
				data: { label: "role" },
			},
			{
				id: "val2",
				type: "value",
				position: { x: 50, y: 80 },
				data: { label: '"admin"' },
			},
			{
				id: "val3",
				type: "value",
				position: { x: 50, y: 150 },
				data: { label: "role" },
			},
			{
				id: "val4",
				type: "value",
				position: { x: 50, y: 210 },
				data: { label: '"manager"' },
			},
			{
				id: "result1",
				type: "result",
				position: { x: 600, y: 100 },
				data: { label: '"Access Granted"' },
			},
			{
				id: "result2",
				type: "result",
				position: { x: 600, y: 160 },
				data: { label: '"Access Denied"' },
			},
		],
		edges: [
			{ id: "e1", source: "op1", target: "val1" },
			{ id: "e2", source: "op1", target: "val2" },
			{ id: "e3", source: "op2", target: "val3" },
			{ id: "e4", source: "op2", target: "val4" },
			{ id: "e5", source: "or1", target: "op1" },
			{ id: "e6", source: "or1", target: "op2" },
			{ id: "e7", source: "or1", target: "result1", label: "true" },
			{ id: "e8", source: "or1", target: "result2", label: "else" },
		],
	},
];

interface ExampleTemplatesProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onLoadTemplate: (nodes: Node[], edges: Edge[]) => void;
}

export function ExampleTemplates({
	open,
	onOpenChange,
	onLoadTemplate,
}: ExampleTemplatesProps) {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
		null,
	);

	const handleLoadTemplate = (template: ExampleTemplate) => {
		// Add onUpdate callback to nodes
		const nodesWithCallbacks = template.nodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onUpdate: () => {}, // Will be replaced by parent component
			},
		}));
		onLoadTemplate(nodesWithCallbacks, template.edges);
		onOpenChange(false);
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "Beginner":
				return "bg-green-100 text-green-800";
			case "Intermediate":
				return "bg-yellow-100 text-yellow-800";
			case "Advanced":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-purple-600" />
						<DialogTitle>Example Templates</DialogTitle>
					</div>
					<DialogDescription>
						Start with a pre-built example to learn how to create
						rules. Click any template to load it into the canvas.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					{EXAMPLE_TEMPLATES.map((template) => (
						<button
							type="button"
							key={template.id}
							className={`w-full cursor-pointer rounded-lg border p-4 text-left transition-all hover:border-purple-400 hover:shadow-md ${
								selectedTemplate === template.id
									? "border-purple-500 bg-purple-50"
									: ""
							}`}
							onClick={() => setSelectedTemplate(template.id)}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="mb-2 flex items-center gap-3">
										<h3 className="font-semibold text-lg">
											{template.title}
										</h3>
										<span
											className={`rounded px-2 py-1 font-medium text-xs ${getDifficultyColor(template.difficulty)}`}
										>
											{template.difficulty}
										</span>
									</div>
									<p className="mb-3 text-muted-foreground text-sm">
										{template.description}
									</p>
									<div className="flex items-center gap-4 text-muted-foreground text-xs">
										<span>
											{template.nodes.length} nodes
										</span>
										<span>•</span>
										<span>
											{template.edges.length} connections
										</span>
									</div>
								</div>
								<Button
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										handleLoadTemplate(template);
									}}
									className="shrink-0"
								>
									Load Template
									<ChevronRight className="ml-1 h-4 w-4" />
								</Button>
							</div>

							{/* Preview of JSON Logic */}
							{selectedTemplate === template.id && (
								<div className="mt-4 border-t pt-4">
									<p className="mb-2 font-medium text-muted-foreground text-xs">
										JSON Logic Output:
									</p>
									<pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
										{JSON.stringify(
											template.jsonLogic,
											null,
											2,
										)}
									</pre>
								</div>
							)}
						</button>
					))}
				</div>

				<div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<p className="text-blue-900 text-sm">
						<strong>💡 Tip:</strong> After loading a template, try
						modifying the values, adding more conditions, or
						changing operators to see how it affects the JSON
						output. Click "Show JSON" to see your changes in
						real-time!
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
