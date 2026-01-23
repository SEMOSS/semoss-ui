import { BookTemplate, Search } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
} from "@semoss/ui/next";

interface Template {
	id: string;
	name: string;
	description: string;
	category: string;
	tags: string[];
	content: string;
}

interface TemplateLibraryProps {
	onSelect: (template: string) => void;
}

const TEMPLATES: Template[] = [
	{
		id: "1",
		name: "Data Analysis",
		description: "Analyze datasets with specific metrics",
		category: "Data Analysis",
		tags: ["analysis", "data", "statistics"],
		content:
			"You are a data analyst. Analyze the provided dataset focusing on:\n1. Key trends and patterns\n2. Statistical insights (mean, median, outliers)\n3. Correlations between variables\n4. Actionable recommendations\n\nFormat your response as:\n- Executive summary\n- Detailed analysis with bullet points\n- Visual representation suggestions",
	},
	{
		id: "2",
		name: "Code Generation",
		description: "Generate clean, documented code",
		category: "Code Generation",
		tags: ["code", "programming", "development"],
		content:
			"You are an expert software engineer. Write clean, well-documented code to:\n\n[Specify your requirements here]\n\nRequirements:\n1. Include comments explaining the logic\n2. Handle edge cases\n3. Follow best practices\n4. Provide usage examples",
	},
	{
		id: "3",
		name: "Summarization",
		description: "Create concise summaries",
		category: "Summarization",
		tags: ["summary", "brief", "concise"],
		content:
			"You are a professional summarizer. Create a concise summary of the following content:\n\n[Paste content here]\n\nProvide:\n1. A 2-3 sentence overview\n2. Key points in bullet format\n3. Main takeaways",
	},
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
	onSelect,
}) => {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] =
		useState<string>("All Templates");

	const categories = [
		"All Templates",
		...Array.from(new Set(TEMPLATES.map((t) => t.category))),
	];

	const filteredTemplates = TEMPLATES.filter((template) => {
		const matchesSearch =
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.description
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			template.tags.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase()),
			);

		const matchesCategory =
			selectedCategory === "All Templates" ||
			template.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	const handleSelectTemplate = (template: Template) => {
		onSelect(template.content);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					data-testid="template-library-trigger"
				>
					<BookTemplate className="h-4 w-4" />
				</Button>
			</DialogTrigger>

			<DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 p-0">
				<DialogHeader className="border-border border-b px-6 py-4">
					<DialogTitle className="text-foreground">
						Prompt Template Library
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Choose from pre-optimized prompt templates for common
						tasks
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 space-y-4 overflow-y-auto p-4">
					{/* Search */}
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						<Input
							placeholder="Search templates..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="bg-background pl-9 text-foreground"
						/>
					</div>

					{/* Category Tabs */}
					<div className="flex flex-wrap gap-2 border-border border-b pb-2">
						{categories.map((category) => (
							<Button
								key={category}
								variant={
									selectedCategory === category
										? "default"
										: "ghost"
								}
								size="sm"
								onClick={() => setSelectedCategory(category)}
								className="text-xs"
								type="button"
							>
								{category}
							</Button>
						))}
					</div>

					{/* Templates Grid */}
					<div className="grid max-h-[450px] gap-3 overflow-y-auto pr-2">
						{filteredTemplates.length > 0 ? (
							filteredTemplates.map((template) => (
								// biome-ignore lint/a11y/useSemanticElements: <explanation>
								<div
									key={template.id}
									className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
									onClick={() =>
										handleSelectTemplate(template)
									}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" ||
											e.key === " "
										) {
											handleSelectTemplate(template);
										}
									}}
								>
									<div className="space-y-2">
										<div className="flex items-start justify-between">
											<h3 className="font-semibold text-foreground text-sm">
												{template.name}
											</h3>
											<Badge
												variant="secondary"
												className="bg-secondary text-secondary-foreground text-xs"
											>
												{template.category}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">
											{template.description}
										</p>
										<div className="flex flex-wrap gap-1">
											{template.tags.map((tag) => (
												<Badge
													key={tag}
													variant="outline"
													className="border-border px-2 py-0 text-xs"
												>
													{tag}
												</Badge>
											))}
										</div>
									</div>
								</div>
							))
						) : (
							<p className="py-8 text-center text-muted-foreground text-sm">
								No templates found matching your search
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
