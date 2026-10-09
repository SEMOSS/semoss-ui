import { Search } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Button } from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";

interface CollaborationHeaderProps {
	/** The shell owns the mobile navigation drawer lifecycle. */
	children: ReactNode;
	/** Room controls render here while retaining their conversation context. */
	roomControlsRef: Ref<HTMLDivElement>;
}

/** Persistent workspace controls remain available above every page and pane. */
export function CollaborationHeader({
	children,
	roomControlsRef,
}: CollaborationHeaderProps) {
	const { setIsSearchOpen, searchReturnFocus } = useDashboard();
	return (
		<header className="flex h-14 shrink-0 items-center gap-1 px-2 sm:gap-2 sm:px-4">
			{children}
			<Button
				type="button"
				variant="outline"
				aria-label="Search your workspace"
				className="size-11 shrink-0 gap-2 px-0 font-normal text-muted-foreground shadow-none sm:h-9 pointer-coarse:sm:min-h-11 sm:w-48 sm:justify-start sm:px-4 lg:w-64"
				onClick={(event) => {
					searchReturnFocus.current = event.currentTarget;
					setIsSearchOpen(true);
				}}
			>
				<Search aria-hidden="true" className="shrink-0" />
				<span className="hidden sm:inline">Search</span>
			</Button>
			<div
				ref={roomControlsRef}
				className="flex min-w-0 flex-1 items-center gap-1 empty:hidden sm:gap-2"
			/>
			<div className="ml-auto min-w-0 shrink-0 pl-1">
				<CollaborationProfileMenu />
			</div>
		</header>
	);
}
