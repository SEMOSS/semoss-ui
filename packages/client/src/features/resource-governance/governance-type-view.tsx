import { ArrowLeft } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, cn, useDebouncedValue } from "@semoss/ui/next";
import { GovernanceResourceDetails } from "./governance-resource-details";
import { GovernanceResourceList } from "./governance-resource-list";
import { GOVERNANCE_NOUNS, type GovernanceType } from "./governance-types";
import {
	type GovernanceSort,
	useGovernanceResources,
} from "./use-governance-resources";

/** Both panels show from this width; below it the list and details take turns. */
const BOTH_PANELS_QUERY = "(min-width: 1024px)";

/**
 * The list beside the details, from the width both panels show at. The page
 * scrolls, so the details have all its height once the header scrolls away.
 */
export const GOVERNANCE_COLUMNS_CLASS =
	"flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(300px,380px)_1fr] lg:items-start";

/**
 * A panel as tall as the page below the navbar that stays in view while the
 * page scrolls, as the list does beside a long resource.
 */
export const GOVERNANCE_PANEL_CLASS =
	"lg:sticky lg:top-4 lg:h-[calc(100dvh-5.5rem)]";

/**
 * Where a type's list, or one of its resources, is.
 *
 * @param type - The project or engine type.
 * @param id - The resource, or none for the list.
 * @return The path under Settings.
 */
export const getGovernancePath = (type: string, id?: string): string =>
	id
		? `/settings/resources/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
		: `/settings/resources/${encodeURIComponent(type)}`;

export interface GovernanceTypeViewProps {
	/** The type chosen in the dropdown */
	entry: GovernanceType;
	/** The type dropdown, shown at the top of the list */
	typeSelect: ReactNode;
	/** The resource open, from the address */
	resourceId?: string;
}

/**
 * One type's resources beside the one open, as Member Settings shows members:
 * on a wide screen the first opens on its own, and on a narrow one the list
 * and the resource take turns. Opening another resource is a move to its
 * address, so changes staged for this one are saved or discarded first.
 */
export const GovernanceTypeView = ({
	entry,
	typeSelect,
	resourceId,
}: GovernanceTypeViewProps) => {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const appliedSearch = useDebouncedValue(search.trim(), 300);
	const [sort, setSort] = useState<GovernanceSort>("NAME");
	const list = useGovernanceResources(entry, appliedSearch, sort);
	const [isBothPanels, setIsBothPanels] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia(BOTH_PANELS_QUERY).matches,
	);
	useEffect(() => {
		const query = window.matchMedia(BOTH_PANELS_QUERY);
		const handleChange = () => setIsBothPanels(query.matches);
		handleChange();
		query.addEventListener("change", handleChange);
		return () => query.removeEventListener("change", handleChange);
	}, []);

	const [firstResource] = list.resources;
	useEffect(() => {
		if (isBothPanels && !resourceId && firstResource) {
			navigate(getGovernancePath(entry.type, firstResource.id), {
				replace: true,
			});
		}
	}, [isBothPanels, resourceId, firstResource, entry.type, navigate]);

	const selected = list.resources.find(
		(resource) => resource.id === resourceId,
	);

	const handleDeleted = (ids: string[]) => {
		list.reload();
		if (resourceId && ids.includes(resourceId)) {
			navigate(getGovernancePath(entry.type), { replace: true });
		}
	};

	return (
		<div className={GOVERNANCE_COLUMNS_CLASS}>
			<div
				className={cn(
					"h-[70vh] min-h-0",
					resourceId ? "hidden lg:block" : "block",
					GOVERNANCE_PANEL_CLASS,
				)}
			>
				<GovernanceResourceList
					entry={entry}
					typeSelect={typeSelect}
					list={list}
					search={search}
					appliedSearch={appliedSearch}
					onSearchChange={setSearch}
					sort={sort}
					onSortChange={setSort}
					selectedId={resourceId}
					onSelect={(resource) =>
						navigate(getGovernancePath(entry.type, resource.id))
					}
					onDeleted={handleDeleted}
				/>
			</div>
			<div
				className={cn(
					"flex-col gap-2 lg:min-h-[calc(100dvh-5.5rem)]",
					resourceId ? "flex" : "hidden lg:flex",
				)}
			>
				{resourceId ? (
					<>
						<Button
							variant="ghost"
							size="sm"
							className="w-fit lg:hidden"
							onClick={() =>
								navigate(getGovernancePath(entry.type))
							}
						>
							<ArrowLeft className="size-4" aria-hidden />
							Back to the list
						</Button>
						<div className="flex flex-1 flex-col">
							<GovernanceResourceDetails
								key={resourceId}
								entry={entry}
								resourceId={resourceId}
								resource={selected}
								onDeleted={() => handleDeleted([resourceId])}
							/>
						</div>
					</>
				) : (
					<Card className="flex flex-1 items-center justify-center border border-border/60 p-3 text-center text-muted-foreground text-sm">
						Select one of the {GOVERNANCE_NOUNS[entry.kind].plural}{" "}
						to see everything about it
					</Card>
				)}
			</div>
		</div>
	);
};
