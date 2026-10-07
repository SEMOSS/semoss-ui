import {
	ArrowDownWideNarrow,
	ChevronsDownUp,
	ChevronsUpDown,
} from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { WorkbenchChromeButton } from "@semoss/workbench";
import type { EmailOrder } from "./email-order";
import { PaneSearch } from "./pane-search";
import type { PaneSearch as PaneSearchState } from "./use-pane-search";

/** Search, chronology, and bulk disclosure share one compact, wrapping row. */
export function WorkEmailToolbar({
	search,
	label,
	order,
	onOrderChange,
	emailCount,
	draftCount,
	onExpandedChange,
}: {
	search: PaneSearchState;
	label: string;
	order: EmailOrder;
	onOrderChange: (order: EmailOrder) => void;
	emailCount: number;
	draftCount: number;
	onExpandedChange: (isExpanded: boolean) => void;
}) {
	const orderLabel = order === "oldest" ? "Oldest first" : "Newest first";
	return (
		<PaneSearch search={search} label={label}>
			<div className="ms-auto flex shrink-0 items-center gap-1">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="pointer-coarse:min-h-11 text-muted-foreground"
							aria-label={`Sort emails: ${orderLabel}`}
						>
							<ArrowDownWideNarrow aria-hidden="true" />
							{orderLabel}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel className="font-normal text-muted-foreground">
							{emailCount} {emailCount === 1 ? "email" : "emails"}
							{draftCount > 0 &&
								` \u00b7 ${draftCount} ${draftCount === 1 ? "draft" : "drafts"}`}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuRadioGroup
							aria-label="Email order"
							value={order}
							onValueChange={(value) => {
								if (value === "oldest" || value === "newest")
									onOrderChange(value);
							}}
						>
							<DropdownMenuRadioItem
								value="oldest"
								className="min-h-8 pointer-coarse:min-h-11"
							>
								Oldest first
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem
								value="newest"
								className="min-h-8 pointer-coarse:min-h-11"
							>
								Newest first
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<WorkbenchChromeButton
					icon={ChevronsUpDown}
					label="Expand all"
					className="pointer-coarse:size-11"
					onClick={() => onExpandedChange(true)}
				/>
				<WorkbenchChromeButton
					icon={ChevronsDownUp}
					label="Collapse all"
					className="pointer-coarse:size-11"
					onClick={() => onExpandedChange(false)}
				/>
			</div>
		</PaneSearch>
	);
}
