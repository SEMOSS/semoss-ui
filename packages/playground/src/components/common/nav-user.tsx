"use client";

import { EllipsisVerticalIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import { toInitials } from "@/utility";

export function NavUser() {
	const { isMobile } = useSidebar();
	const { actions } = useInsight();
	const { chat } = useChat();

	const navigate = useNavigate();

	const userName = chat.user.name;

	return (
		<SidebarMenu className="gap-2 group-data-[collapsible=icon]:p-2">
			<SidebarMenuItem>
				<DropdownMenu>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						asChild
					>
						<DropdownMenuTrigger className="flex w-full items-center gap-2">
							<Avatar className="h-8 w-8 flex-shrink-0 rounded-lg grayscale">
								<AvatarImage src={""} alt={userName} />
								<AvatarFallback className="rounded-lg">
									{toInitials(userName)}
								</AvatarFallback>
							</Avatar>
							<div className="flex min-w-0 flex-1 items-center">
								<span className="truncate font-medium text-sm">
									{userName}
								</span>
							</div>
							<EllipsisVerticalIcon className="ml-auto size-4 flex-shrink-0" />
						</DropdownMenuTrigger>
					</SidebarMenuButton>

					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuItem
							onClick={async () => {
								await actions.logout();

								navigate("/login");
							}}
						>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
