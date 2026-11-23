import { Lock, PencilLine, XIcon } from "lucide-react";
import type { CatalogDependencyRow, Engine } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import { Button, Muted } from "@semoss/ui/next";
import {
	CATEGORY_META,
	getDependencyDisplayName,
	getDependencyKey,
	getDependencyRoleLabel,
} from "./catalog-dependency";

/** An automatic engine's chip: muted, since only its configuration changes it. */
export const AUTOMATIC_CHIP_CLASS =
	"flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 ps-1.5 pe-2 text-xs";

interface EngineCategoryCardProps {
	/** Engine category the card shows */
	category: Engine["engine_type"];
	/** Engines of this category the owner depends on, automatic and manual */
	engines: CatalogDependencyRow[];
	/** Whether the user can manage/remove engines */
	canEdit: boolean;
	/** Opens the manage dialog for this category */
	onManage: () => void;
	/** Removes one manual engine from the owner's dependencies */
	onRemove: (engine: CatalogDependencyRow) => void;
	/** Disables the remove buttons while a removal is saving */
	isRemoving: boolean;
}

/**
 * One engine category card: icon tile, title and description, a Manage
 * action, and the engines as chips (or a muted empty-state line). An
 * automatic chip has a lock and its role, and cannot be removed; a manual one
 * has a pencil and the name a Code app reads it by, and can be.
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
					<Icon className="size-5" aria-hidden="true" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm">{meta.label}</p>
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
					<Muted>{meta.empty}</Muted>
				) : (
					<ul className="flex flex-wrap gap-1.5">
						{engines.map((engine) => {
							const name = getDependencyDisplayName(engine);
							const roleLabel = getDependencyRoleLabel(
								engine.role,
							);
							return (
								<li
									key={getDependencyKey(engine)}
									className={
										engine.is_automatic
											? AUTOMATIC_CHIP_CLASS
											: "flex items-center gap-1.5 rounded-full border border-border border-dashed bg-background py-1 ps-1.5 pe-2 text-xs"
									}
								>
									<span className="flex size-4 shrink-0 items-center justify-center">
										<EngineSubtypeIcon
											engineType={engine.catalog_type}
											engineSubtype={
												engine.catalog_subtype
											}
											className="size-full object-contain"
										/>
									</span>
									<span className="max-w-40 truncate">
										{name}
									</span>
									{engine.is_automatic ? (
										<span className="flex shrink-0 items-center gap-1 text-muted-foreground">
											<Lock
												className="size-3"
												aria-hidden="true"
											/>
											<span className="sr-only">
												Automatic,{" "}
											</span>
											{roleLabel}
										</span>
									) : (
										<span className="flex min-w-0 items-center gap-1 text-muted-foreground">
											<PencilLine
												className="size-3 shrink-0"
												aria-hidden="true"
											/>
											<span className="sr-only">
												Manual,{" "}
											</span>
											{engine.dependency_name ? (
												<code className="max-w-32 truncate font-mono">
													{engine.dependency_name}
												</code>
											) : (
												"No name"
											)}
										</span>
									)}
									{engine.is_automatic ? null : canEdit ? (
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											disabled={isRemoving}
											aria-label={`Remove ${name}`}
											className="-my-1 -me-1.5 size-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
											onClick={() => onRemove(engine)}
										>
											<XIcon
												className="size-3"
												aria-hidden="true"
											/>
										</Button>
									) : null}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</section>
	);
};
