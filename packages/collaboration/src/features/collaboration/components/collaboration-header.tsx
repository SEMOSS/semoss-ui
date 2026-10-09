import { Search } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Button } from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";

interface CollaborationHeaderProps {
	/** The shell owns the mobile navigation drawer lifecycle. */
	children: ReactNode;
	/** Room controls render here while retaining their conversation context. */
	roomControlsRef: Ref<HTMLDivElement>;
	/** Measures the space reserved above chat as compact controls wrap. */
	headerRef: Ref<HTMLElement>;
}

/** Persistent workspace controls remain available above every page and pane. */
export function CollaborationHeader({
	children,
	roomControlsRef,
	headerRef,
}: CollaborationHeaderProps) {
	const { setIsSearchOpen, searchReturnFocus } = useDashboard();
	return (
		<header
			ref={headerRef}
			className="flex min-h-14 shrink-0 flex-wrap items-center @lg/collaboration-header:gap-2 gap-1 @lg/collaboration-header:px-4 px-2 py-1.5"
		>
			{children}
			<Button
				type="button"
				variant="outline"
				aria-label="Search your workspace"
				className="size-11 @lg/collaboration-header:h-9 pointer-coarse:min-h-11 @3xl/collaboration-header:w-64 @lg/collaboration-header:w-48 shrink-0 @lg/collaboration-header:justify-start gap-2 @lg/collaboration-header:px-4 px-0 font-normal text-muted-foreground shadow-none"
				onClick={(event) => {
					searchReturnFocus.current = event.currentTarget;
					setIsSearchOpen(true);
				}}
			>
				<Search aria-hidden="true" className="shrink-0" />
				<span className="@lg/collaboration-header:inline hidden">
					Search
				</span>
			</Button>
			<div
				ref={roomControlsRef}
				className="flex min-w-0 flex-1 @xs/collaboration-header:basis-0 basis-full items-center @lg/collaboration-header:gap-2 gap-1 empty:hidden"
			/>
		</header>
	);
}
