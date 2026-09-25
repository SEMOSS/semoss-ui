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

/** Keeps the mockup's content and inspector together at every viewport. */
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
	return (
		<div className="flex min-h-0 min-w-0 flex-1">
			<div className="my-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 sm:my-3 sm:mr-2 sm:ml-1">
				{aside && (
					<div className="flex justify-end border-b px-4 py-2 xl:hidden">
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline" size="sm">
									<PanelRight aria-hidden="true" />
									{asideTitle}
								</Button>
							</SheetTrigger>
							<SheetContent className="w-full overflow-y-auto sm:max-w-sm">
								<SheetHeader>
									<SheetTitle>{asideTitle}</SheetTitle>
								</SheetHeader>
								<div className="space-y-3 px-4 pb-6">
									{aside}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				)}
				<div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
					{children}
				</div>
			</div>
			{aside && (
				<aside
					aria-label={asideTitle}
					className="hidden w-80 shrink-0 space-y-3 overflow-y-auto py-4 pr-4 pl-2 xl:block"
				>
					{aside}
				</aside>
			)}
		</div>
	);
}
