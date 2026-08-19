import { PencilIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProjectDependency } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Muted,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { EditProjectDependenciesDialog } from "@/components/project";
import { useProject } from "@/hooks";

/** Engine categories always shown, in display order. */
const PRIMARY_CATEGORIES = ["MODEL", "DATABASE", "VECTOR", "STORAGE"] as const;

/** Engine categories shown only when the project depends on one. */
const EXTRA_CATEGORIES = ["FUNCTION", "GUARDRAIL"] as const;

/** Section headings per engine category. */
const CATEGORY_LABELS: Record<string, string> = {
	MODEL: "Models",
	DATABASE: "Databases",
	VECTOR: "Vector stores",
	STORAGE: "Storage",
	FUNCTION: "Functions",
	GUARDRAIL: "Guardrails",
};

interface EngineSectionProps {
	/** Engine category the section lists */
	category: string;
	/** The project's dependencies of this category */
	engines: ProjectDependency[];
}

/**
 * One engine category section: a heading with the connection count and a row
 * per engine (subtype icon, name, subtype). Shows an empty hint when nothing
 * of this category is connected.
 *
 * @name EngineSection
 * @param category - Engine category the section lists.
 * @param engines - The project's dependencies of this category.
 * @return The category section.
 */
const EngineSection = ({ category, engines }: EngineSectionProps) => (
	<section className="flex flex-col gap-1.5">
		<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
			{CATEGORY_LABELS[category] ?? category}
			<span className="ms-1.5 font-normal">{engines.length}</span>
		</h3>
		{engines.length === 0 ? (
			<p className="text-muted-foreground/70 text-xs">None connected.</p>
		) : (
			<ul className="flex flex-col gap-1">
				{engines.map((engine) => (
					<li
						key={engine.engine_id}
						className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
					>
						<span className="flex size-6 shrink-0 items-center justify-center">
							<EngineSubtypeIcon
								engineType={engine.engine_type}
								engineSubtype={engine.engine_subtype}
								alt={engine.engine_name}
								className="size-full object-contain"
							/>
						</span>
						<span className="min-w-0 flex-1 truncate text-sm">
							{engine.engine_name}
						</span>
						{engine.engine_subtype ? (
							<span className="shrink-0 text-muted-foreground text-xs">
								{engine.engine_subtype}
							</span>
						) : null}
					</li>
				))}
			</ul>
		)}
	</section>
);

/**
 * The "Available engines" workbench panel: the project's engine dependencies
 * grouped by category — the engines the agent (and the app) can reach from
 * this workbench. Editing opens the shared project-dependencies dialog and
 * refreshes the project context on save; the backend regenerates the agent's
 * engine context from the dependency list on every save.
 *
 * @name ProjectEnginesPanel
 * @return The available-engines panel.
 */
export const ProjectEnginesPanel = () => {
	const { project, dependencies, permission, refresh } = useProject();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const canEdit = permission === "OWNER" || permission === "EDIT";

	const buckets = useMemo(() => {
		const next = new Map<string, ProjectDependency[]>();
		for (const category of [...PRIMARY_CATEGORIES, ...EXTRA_CATEGORIES]) {
			next.set(category, []);
		}
		for (const dependency of dependencies) {
			const type = (dependency.engine_type ?? "").toUpperCase();
			next.get(type)?.push(dependency);
		}
		return next;
	}, [dependencies]);

	const categories: string[] = [
		...PRIMARY_CATEGORIES,
		...EXTRA_CATEGORIES.filter(
			(category) => (buckets.get(category) ?? []).length > 0,
		),
	];

	return (
		<div className="flex h-full min-h-0 w-full flex-col bg-background">
			<header className="flex h-11 shrink-0 items-center gap-2 border-border border-b px-3">
				<h2 className="min-w-0 flex-1 truncate font-medium text-sm">
					Available engines
				</h2>
				{canEdit ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Edit available engines"
								onClick={() => setIsEditOpen(true)}
							>
								<PencilIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Edit available engines</TooltipContent>
					</Tooltip>
				) : null}
			</header>

			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-4 p-3">
					<Muted className="text-xs">
						Engines this project depends on. The agent can use these
						when building and running the app.
					</Muted>
					{categories.map((category) => (
						<EngineSection
							key={category}
							category={category}
							engines={buckets.get(category) ?? []}
						/>
					))}
				</div>
			</ScrollArea>

			<EditProjectDependenciesDialog
				dependencies={dependencies}
				open={isEditOpen}
				onClose={(success) => {
					if (success) refresh();
					setIsEditOpen(false);
				}}
				appId={project.project_id}
			/>
		</div>
	);
};
