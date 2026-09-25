import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import { EmptyView } from "@/components/common/empty-view";

export function NotFoundPage({ title = "Page not found" }: { title?: string }) {
	return (
		<EmptyView
			title={title}
			action={
				<Button variant="outline" asChild>
					<Link to="/">
						<ArrowLeft />
						Back to Home
					</Link>
				</Button>
			}
		>
			Not Found.
		</EmptyView>
	);
}
