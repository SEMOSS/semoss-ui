import { XIcon } from "lucide-react";
import type { ProjectDependency } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import { CATEGORY_META } from "./project-engines-panel.constants";

interface EngineCategoryCardProps {
	/** Engine category the card shows */
	category: string;
	/** Selected engines of this category */
	engines: ProjectDependency[];
	/** Whether the user can manage/remove engines */
	canEdit: boolean;
	/** Opens the manage dialog for this category */
	onManage: () => void;
	/** Removes one engine from the project's dependencies */
	onRemove: (engine: ProjectDependency) => void;
	/** Disables the remove buttons while a removal is saving */
	isRemoving: boolean;
}

/**
 * One engine category card: icon tile, title and description, a Manage
 * action, and the selected engines as removable chips (or an italic
 * empty-state line).
 *
 * @name EngineCategoryCard
 * @param category - Engine category the card shows.
 * @param engines - Selected engines of this category.
 * @param canEdit - Whether the user can manage/remove engines.
 * @param onManage - Opens the manage dialog for this category.
 * @param onRemove - Removes one engine from the project's dependencies.
 * @param isRemoving - Disables the remove buttons while a removal is saving.
 * @return The category card.
 */
export const EngineCategoryCard = ({
	category,
	engines,
	canEdit,
	onManage,
	onRemove,
	isRemoving,
}: EngineCategoryCardProps) => {
	const meta = CATEGORY_META[category];
	const Icon = meta.icon;

	return (
		<section className="rounded-xl border border-border bg-card p-3 shadow-xs">
			<div className="flex items-center gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
					<Icon className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">{meta.label}</p>
					<p className="text-muted-foreground text-xs">
						{meta.blurb}
					</p>
				</div>
				{canEdit ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManage}
					>
						Manage
					</Button>
				) : null}
			</div>

			<div className="mt-3">
				{engines.length === 0 ? (
					<p className="text-muted-foreground text-sm italic">
						{meta.empty}
					</p>
				) : (
					<ul className="flex flex-wrap gap-1.5">
						{engines.map((engine) => (
							<li
								key={engine.engine_id}
								className="flex items-center gap-1.5 rounded-full border border-border bg-background py-1 ps-1.5 pe-2 text-xs"
								title={engine.engine_name}
							>
								<span className="flex size-4 shrink-0 items-center justify-center">
									<EngineSubtypeIcon
										engineType={engine.engine_type}
										engineSubtype={engine.engine_subtype}
										alt={engine.engine_name}
										className="size-full object-contain"
									/>
								</span>
								<span className="max-w-40 truncate">
									{engine.engine_name}
								</span>
								{canEdit ? (
									<button
										type="button"
										disabled={isRemoving}
										aria-label={`Remove ${engine.engine_name}`}
										className="shrink-0 text-muted-foreground hover:text-foreground"
										onClick={() => onRemove(engine)}
									>
										<XIcon className="size-3" />
									</button>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
};
