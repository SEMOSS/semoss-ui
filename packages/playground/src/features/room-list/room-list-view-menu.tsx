import { ListFilterIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	RoomGroupBy,
	RoomListView,
	RoomSortBy,
	RoomSortDirection,
} from "./room-list";

/** Each sort the menu offers, as column and direction. */
const SORT_OPTIONS = [
	{ value: "dateUpdated:DESC", labelKey: "view.sort.recent" },
	{ value: "dateUpdated:ASC", labelKey: "view.sort.oldest" },
	{ value: "name:ASC", labelKey: "view.sort.nameAsc" },
	{ value: "name:DESC", labelKey: "view.sort.nameDesc" },
] as const satisfies readonly {
	value: `${RoomSortBy}:${RoomSortDirection}`;
	labelKey: string;
}[];

const GROUP_OPTIONS = [
	{ value: "date", labelKey: "view.group.date" },
	{ value: "agent", labelKey: "view.group.agent" },
] as const satisfies readonly { value: RoomGroupBy; labelKey: string }[];

/**
 * The muted icon button the room list's header actions share: quiet until
 * hovered, focused, or open.
 */
export const ROOM_LIST_ACTION_CLASS =
	"size-6 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&_svg]:size-3.5";

/** Props for {@link RoomListViewMenu}. */
export interface RoomListViewMenuProps {
	view: RoomListView;
	/** Whether the view differs from the default; marks the button. */
	isCustomized: boolean;
	onViewChange: (view: RoomListView) => void;
	className?: string;
}

/** The room list's Sort by and Group by menu, behind a muted icon button. */
export const RoomListViewMenu = ({
	view,
	isCustomized,
	onViewChange,
	className,
}: RoomListViewMenuProps) => {
	const { t } = useTranslation("sidebar");
	const label = t("view.button");
	const sortValue = `${view.sortBy}:${view.sortDir}`;

	const handleSortChange = (value: string) => {
		const option = SORT_OPTIONS.find((sort) => sort.value === value);
		if (!option) {
			return;
		}
		const [sortBy, sortDir] = option.value.split(":") as [
			RoomSortBy,
			RoomSortDirection,
		];
		onViewChange({ ...view, sortBy, sortDir });
	};

	const handleGroupChange = (value: string) => {
		const option = GROUP_OPTIONS.find((group) => group.value === value);
		if (option) {
			onViewChange({ ...view, groupBy: option.value });
		}
	};

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={
								isCustomized
									? `${label} (${t("view.customized")})`
									: label
							}
							className={cn(
								"relative",
								ROOM_LIST_ACTION_CLASS,
								className,
							)}
						>
							<ListFilterIcon />
							{isCustomized ? (
								<span
									aria-hidden="true"
									className="absolute end-0.5 top-0.5 size-1.5 rounded-full bg-primary"
								/>
							) : null}
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent side="bottom">{label}</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuLabel className="text-muted-foreground text-xs">
					{t("view.sortBy")}
				</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={sortValue}
					onValueChange={handleSortChange}
				>
					{SORT_OPTIONS.map((option) => (
						<DropdownMenuRadioItem
							key={option.value}
							value={option.value}
						>
							{t(option.labelKey)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="text-muted-foreground text-xs">
					{t("view.groupBy")}
				</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={view.groupBy}
					onValueChange={handleGroupChange}
				>
					{GROUP_OPTIONS.map((option) => (
						<DropdownMenuRadioItem
							key={option.value}
							value={option.value}
						>
							{t(option.labelKey)}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
