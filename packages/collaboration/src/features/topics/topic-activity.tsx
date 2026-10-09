import { ChevronRight, History } from "lucide-react";
import { Link } from "react-router";
import { Button, H2, P } from "@semoss/ui/next";

/** Reserve the reference's activity rail without presenting invented history. */
export function TopicActivity({ onContext }: { onContext: () => void }) {
	return (
		<aside
			aria-label="Topic activity"
			className="min-w-0 space-y-6 border-border border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6"
		>
			<H2 className="font-medium text-xl">Topic activity</H2>
			<div className="space-y-3">
				<History
					aria-hidden="true"
					className="size-5 text-muted-foreground"
				/>
				<P className="font-medium text-base">
					Activity history is not available yet.
				</P>
				<P className="text-base text-muted-foreground leading-relaxed">
					Your tasks and context are available now. A timeline of
					topic changes and undo actions will appear here when
					supported.
				</P>
			</div>
			<div className="space-y-1 border-border border-t pt-3">
				<Button
					variant="ghost"
					className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 text-left font-normal"
					onClick={onContext}
				>
					Current understanding
					<ChevronRight aria-hidden="true" />
				</Button>
				<Button
					asChild
					variant="ghost"
					className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 text-left font-normal"
				>
					<Link to="/settings/rules">
						Sources &amp; filtering
						<ChevronRight aria-hidden="true" />
					</Link>
				</Button>
			</div>
		</aside>
	);
}
