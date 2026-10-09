import { Search } from "lucide-react";
import type { CSSProperties, ReactNode, Ref } from "react";
import { Button, cn } from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";

interface CollaborationHeaderProps {
	/** The shell owns the mobile navigation drawer lifecycle. */
	children: ReactNode;
	/** Room controls render here while retaining their conversation context. */
	roomControlsRef: Ref<HTMLDivElement>;
	/** Measured conversation width when the desktop workbench fills the shell. */
	conversationWidth?: number;
}

/** Persistent workspace controls remain available above every page and pane. */
export function CollaborationHeader({
	children,
	roomControlsRef,
	conversationWidth,
}: CollaborationHeaderProps) {
	const { setIsSearchOpen, searchReturnFocus } = useDashboard();
	return (
		<header
			className={cn(
				"@container/workspace-header h-14 shrink-0",
				conversationWidth !== undefined &&
					"md:absolute md:inset-s-0 md:top-0 md:z-10 md:w-(--conversation-width)",
			)}
			style={
				conversationWidth === undefined
					? undefined
					: ({
							"--conversation-width": `${conversationWidth}px`,
						} as CSSProperties)
			}
		>
			<div className="flex h-full min-w-0 items-center @2xl/workspace-header:gap-2 gap-1 @2xl/workspace-header:px-4 px-2">
				{children}
				<Button
					type="button"
					variant="outline"
					aria-label="Search your workspace"
					className="size-11 @2xl/workspace-header:h-9 pointer-coarse:@2xl/workspace-header:min-h-11 @2xl/workspace-header:w-48 @4xl/workspace-header:w-64 shrink-0 @2xl/workspace-header:justify-start gap-2 @2xl/workspace-header:px-4 px-0 font-normal text-muted-foreground shadow-none"
					onClick={(event) => {
						searchReturnFocus.current = event.currentTarget;
						setIsSearchOpen(true);
					}}
				>
					<Search aria-hidden="true" className="shrink-0" />
					<span className="@2xl/workspace-header:inline hidden">
						Search
					</span>
				</Button>
				<div
					ref={roomControlsRef}
					className="flex min-w-0 flex-1 items-center @2xl/workspace-header:gap-2 gap-1 empty:hidden"
				/>
			</div>
		</header>
	);
}
