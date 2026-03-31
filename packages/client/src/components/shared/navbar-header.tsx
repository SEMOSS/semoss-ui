import { Menu } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { Button } from "@semoss/ui/next";
import { usePage, useRootStore } from "@/hooks";

interface NavbarHeaderProps {
	/**
	 * Display custom branding
	 */
	logo?: React.ReactNode | null;
}
export const NavbarHeader = observer((props: NavbarHeaderProps) => {
	const { logo } = props;
	const { page } = usePage();
	const { configStore } = useRootStore();

	return !page.sidebar.pinned ? (
		<div className="relative z-0 flex min-w-0 max-w-full items-center gap-1 bg-transparent sm:gap-2">
			<Button
				variant="outline"
				size="icon-sm"
				className="h-8 w-8 shrink-0 rounded-md border border-border"
				onClick={() => page.openSidebar()}
				onMouseOver={() => page.openSidebar()}
				aria-label="Open sidebar"
			>
				<Menu className="size-4" />
			</Button>

			{!logo ? (
				<div className="flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-1 text-foreground sm:gap-2 sm:px-2">
					{configStore.theme.logo ? (
						<img
							alt="logo"
							src={configStore.theme.logo}
							className="h-4 w-auto sm:h-5"
						/>
					) : null}
					<span className="hidden truncate font-semibold text-sm sm:block">
						{configStore.theme.landingPageName ||
							configStore.theme.name}
					</span>
				</div>
			) : (
				logo
			)}
		</div>
	) : null;
});
