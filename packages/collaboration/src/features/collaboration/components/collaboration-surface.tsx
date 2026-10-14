import { PanelRight } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button,
	Card,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@semoss/ui/next";
import { CollaborationPage } from "./collaboration-page";
import { useCollaborationSidebar } from "./use-collaboration-sidebar";

/** Keeps the main content and contextual inspector together at every viewport. */
export function CollaborationSurface({
	children,
	header,
	aside,
	asideTitle = "Details",
}: {
	/** Primary page content. */
	children: ReactNode;
	/** Page identity and actions above the main content and its supporting context. */
	header?: ReactNode;
	/** Contextual information and actions. */
	aside?: ReactNode;
	/** Accessible name of the compact inspector. */
	asideTitle?: string;
}) {
	const sidebar = useCollaborationSidebar(Boolean(aside), asideTitle);
	return (
		<CollaborationPage>
			{header}
			<div className="flex min-w-0 items-start gap-4">
				<div className="min-w-0 flex-1">
					{aside && (
						<div className="mb-4 flex justify-end xl:hidden">
							<Sheet
								open={sidebar.isOpen}
								onOpenChange={sidebar.onOpenChange}
							>
								<SheetTrigger asChild>
									<Button
										ref={sidebar.triggerRef}
										variant="outline"
										size="sm"
										className="pointer-coarse:min-h-11"
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
									<div className="space-y-4 px-4 pb-6">
										{aside}
									</div>
								</SheetContent>
							</Sheet>
						</div>
					)}
					{/* Keep row labels positioned within their content as the page scrolls. */}
					<Card className="relative min-w-0 gap-0 overflow-hidden p-0 shadow-none">
						{children}
					</Card>
				</div>
				{aside && (
					<aside
						ref={sidebar.desktopRef}
						tabIndex={-1}
						aria-label={asideTitle}
						className="relative hidden w-80 shrink-0 space-y-4 rounded-xl focus-visible:outline-2 focus-visible:outline-ring xl:block 2xl:w-96"
					>
						{aside}
					</aside>
				)}
			</div>
		</CollaborationPage>
	);
}
