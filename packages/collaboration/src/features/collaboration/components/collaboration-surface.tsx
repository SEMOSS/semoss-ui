import { PanelRight } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@semoss/ui/next";
import { useCollaborationSidebar } from "./use-collaboration-sidebar";

/** Keeps the main content and contextual inspector together at every viewport. */
export function CollaborationSurface({
	children,
	aside,
	asideTitle = "Details",
}: {
	/** Primary page content. */
	children: ReactNode;
	/** Contextual information and actions. */
	aside?: ReactNode;
	/** Accessible name of the compact inspector. */
	asideTitle?: string;
}) {
	const sidebar = useCollaborationSidebar(Boolean(aside), asideTitle);
	return (
		<div className="flex min-h-0 min-w-0 flex-1 gap-2">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-xl md:border md:border-border md:shadow-sm">
				{aside && (
					<div className="flex justify-end border-b px-4 py-2 xl:hidden">
						<Sheet
							open={sidebar.isOpen}
							onOpenChange={sidebar.onOpenChange}
						>
							<SheetTrigger asChild>
								<Button
									ref={sidebar.triggerRef}
									variant="outline"
									size="sm"
								>
									<PanelRight aria-hidden="true" />
									{asideTitle}
								</Button>
							</SheetTrigger>
							<SheetContent
								className="w-full overflow-y-auto sm:max-w-sm"
								aria-describedby={undefined}
								onCloseAutoFocus={sidebar.onCloseAutoFocus}
							>
								<SheetHeader>
									<SheetTitle>{asideTitle}</SheetTitle>
								</SheetHeader>
								<div className="space-y-2 px-4 pb-6">
									{aside}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				)}
				{/* relative keeps sr-only labels inside the scroller, so they scroll with their rows */}
				<div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
			{aside && (
				<aside
					ref={sidebar.desktopRef}
					tabIndex={-1}
					aria-label={asideTitle}
					className="relative hidden w-80 shrink-0 space-y-2 overflow-y-auto rounded-xl focus-visible:outline-2 focus-visible:outline-ring xl:block"
				>
					{aside}
				</aside>
			)}
		</div>
	);
}
