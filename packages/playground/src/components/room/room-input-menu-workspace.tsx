import { CheckIcon, ComputerIcon, ExternalLinkIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
	useIsMobile,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { App, Workspace } from "@/types";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

interface RoomInputMenuWorkspaceProps {
	/**
	 * The currently selected workspace
	 */
	workspace: Pick<Workspace, "workspace_id" | "name"> | null;

	/**
	 * Callback when a workspace is selected
	 */
	onSelect: (
		workspace: Pick<Workspace, "workspace_id" | "name"> | null,
	) => void;
}

export const RoomInputMenuWorkspace: React.FC<RoomInputMenuWorkspaceProps> = ({
	workspace,
	onSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation("room");
	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const isMobile = useIsMobile();

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the workspaces with lazy loading
	 */
	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			isOpen
				? `META | MyProjects(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} type = "WORKSPACE", limit=[${limit}], offset=[${offset}])`
				: "",
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 15) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: 15,
		},
		[isOpen, debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore || !isOpen,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	const triggerLabel = workspace
		? workspace.name
		: t("menuWorkspace.selectAgent");

	const pickerContent = (
		<Command shouldFilter={false} className="w-full">
			<CommandInput
				placeholder={t("menuWorkspace.searchPlaceholder")}
				value={search}
				onValueChange={setSearch}
				autoFocus={!isMobile}
			/>
			<CommandList
				className="max-h-[200px]"
				ref={(ele) => setScroll(ele)}
			>
				{!getWorkspaces.isLoading && getWorkspaces.data.length === 0 ? (
					<CommandEmpty>{t("menuWorkspace.notFound")}</CommandEmpty>
				) : null}

				{getWorkspaces.data.length > 0 && (
					<CommandGroup>
						{getWorkspaces.data.map((w) => (
							<CommandItem
								key={w.project_id}
								value={w.project_id}
								onSelect={() => {
									onSelect({
										workspace_id: w.project_id,
										name:
											w.project_display_name ||
											w.project_name,
									});
									setIsOpen(false);
								}}
							>
								<ComputerIcon className="size-4" />
								<div className="w-full flex-1 truncate">
									{w.project_display_name || w.project_name}
								</div>
								{root.theme.showPlatformLinks !== false && (
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex flex-row items-center justify-center">
												<Button
													className="size-4"
													variant="link"
													size="icon-sm"
													onClick={(e) => {
														e.stopPropagation();
													}}
													asChild
												>
													<a
														target="_blank"
														href={`${PLATFORM_URL}/#/app/${w.project_id}`}
													>
														<ExternalLinkIcon />
													</a>
												</Button>
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Click to view agent details
										</TooltipContent>
									</Tooltip>
								)}
								<CheckIcon
									className={`ml-auto ${workspace?.workspace_id === w.project_id ? "opacity-100" : "opacity-0"}`}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{getWorkspaces.isLoading && (
					<div className="flex items-center justify-center py-4">
						<Spinner className="size-4" />
					</div>
				)}
			</CommandList>
		</Command>
	);

	if (isMobile) {
		return (
			<>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setIsOpen(true);
					}}
				>
					<ComputerIcon />
					<span className="flex-1">{triggerLabel}</span>
					{workspace ? (
						<div className="px-1">
							<CheckIcon />
						</div>
					) : null}
				</DropdownMenuItem>

				<Drawer open={isOpen} onOpenChange={setIsOpen}>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>
								{t("menuWorkspace.selectAgent")}
							</DrawerTitle>
						</DrawerHeader>
						<div className="px-4 pb-6">{pickerContent}</div>
					</DrawerContent>
				</Drawer>
			</>
		);
	}

	return (
		<DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuSubTrigger>
				<ComputerIcon />
				<span className="flex-1">{triggerLabel}</span>
				{workspace ? (
					<div className="px-1">
						<CheckIcon />
					</div>
				) : null}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-72 p-0">
				{pickerContent}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
