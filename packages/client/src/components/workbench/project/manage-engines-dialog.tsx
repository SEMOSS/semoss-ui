import { CheckIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import type { Engine, ProjectDependency } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	CATEGORY_META,
	toDependencyPayload,
} from "./project-engines-panel.constants";

/** Rows fetched per search in the manage dialog. */
const MANAGE_FETCH_LIMIT = 50;

interface ManageEnginesDialogProps {
	/** Engine category being managed */
	category: string;
	/** Project whose dependencies are edited */
	appId: string;
	/** The project's current dependencies (all kinds) */
	dependencies: ProjectDependency[];
	/** Called on close; true when a save succeeded */
	onClose: (saved: boolean) => void;
}

/**
 * Category-scoped engine picker: searches the user's engines of one category,
 * toggles selections, and saves the project's dependency list with every
 * other category (and project-kind dependency) preserved. The backend
 * refreshes the agent's engine context from the saved list.
 *
 * @name ManageEnginesDialog
 * @param category - Engine category being managed.
 * @param appId - Project whose dependencies are edited.
 * @param dependencies - The project's current dependencies.
 * @param onClose - Called on close; true when a save succeeded.
 * @return The manage dialog.
 */
export const ManageEnginesDialog = ({
	category,
	appId,
	dependencies,
	onClose,
}: ManageEnginesDialogProps) => {
	const { run: runPixel } = useSessionInsight();
	const meta = CATEGORY_META[category];

	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<ProjectDependency[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() =>
			new Set(
				dependencies
					.filter(
						(dependency) =>
							(dependency.engine_type ?? "").toUpperCase() ===
							category,
					)
					.map((dependency) => dependency.engine_id),
			),
	);

	// Debounced category-scoped engine search.
	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		const timer = window.setTimeout(async () => {
			try {
				const trimmed = search.trim();
				const filterClause = trimmed
					? `filterWord=${JSON.stringify(trimmed)}, `
					: "";
				const response = await runPixel<[Engine[]]>(
					`MyEngines(${filterClause}engineTypes=${JSON.stringify([category])}, limit=[${MANAGE_FETCH_LIMIT}], offset=[0]);`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(""));
				}
				if (cancelled) return;
				setOptions(
					response.pixelReturn[0].output.map((engine) => ({
						engine_id: engine.engine_id,
						engine_name:
							engine.engine_display_name || engine.engine_name,
						engine_type: engine.engine_type,
						engine_subtype: engine.engine_subtype,
					})),
				);
			} catch (error) {
				if (!cancelled) {
					toast.error(
						getErrorMessage(error, "Failed to load engines"),
					);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [category, runPixel, search]);

	const toggleEngine = (engineId: string) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(engineId)) {
				next.delete(engineId);
			} else {
				next.add(engineId);
			}
			return next;
		});
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Everything that is not this category is preserved verbatim.
			const others = dependencies.filter(
				(dependency) =>
					(dependency.engine_type ?? "").toUpperCase() !== category,
			);
			const payload = [
				...others.map(toDependencyPayload),
				...[...selectedIds].map((id) => ({ id, type: category })),
			];
			const response = await runPixel<string[]>(
				`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(payload)})`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success(`${meta.label} updated`);
			onClose(true);
		} catch (error) {
			toast.error(getErrorMessage(error, "Failed to update engines"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose(false)}>
			<DialogContent className="flex max-h-[70vh] flex-col sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Manage {meta.label.toLowerCase()}
					</DialogTitle>
					<DialogDescription>{meta.blurb}.</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={`Search ${meta.label.toLowerCase()}…`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>

				<div className="min-h-40 flex-1 overflow-y-auto rounded-md border border-border">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : options.length === 0 ? (
						<p className="p-4 text-center text-muted-foreground text-sm">
							No {meta.label.toLowerCase()} found.
						</p>
					) : (
						<ul className="flex flex-col p-1">
							{options.map((option) => {
								const selected = selectedIds.has(
									option.engine_id,
								);
								return (
									<li key={option.engine_id}>
										<button
											type="button"
											className={cn(
												"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
												selected && "bg-accent/50",
											)}
											onClick={() =>
												toggleEngine(option.engine_id)
											}
										>
											<span className="flex size-5 shrink-0 items-center justify-center">
												<EngineSubtypeIcon
													engineType={
														option.engine_type
													}
													engineSubtype={
														option.engine_subtype
													}
													alt={option.engine_name}
													className="size-full object-contain"
												/>
											</span>
											<span className="min-w-0 flex-1 truncate">
												{option.engine_name}
											</span>
											{selected ? (
												<CheckIcon className="size-4 shrink-0 text-primary" />
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<DialogFooter className="items-center">
					<span className="me-auto text-muted-foreground text-xs">
						{selectedIds.size} selected
					</span>
					<Button
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isSaving}
						onClick={() => void handleSave()}
					>
						{isSaving ? <Spinner className="size-4" /> : null}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
