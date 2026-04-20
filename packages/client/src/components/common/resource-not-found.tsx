import { useNavigate } from "react-router-dom";
import { Button } from "@semoss/ui/next";

interface ResourceNotFoundProps {
	catalogPath: string;
	catalogLabel?: string;
}

export const ResourceNotFound = ({
	catalogPath,
	catalogLabel = "Catalog",
}: ResourceNotFoundProps) => {
	const navigate = useNavigate();

	return (
		<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
			<p className="font-bold text-6xl text-muted-foreground">404</p>
			<h2 className="font-semibold text-xl">
				This resource does not exist
			</h2>
			<p className="text-muted-foreground text-sm">
				The item you are looking for may have been removed or you may
				not have access to it.
			</p>
			<Button onClick={() => navigate(catalogPath)}>
				Go Back to {catalogLabel}
			</Button>
		</div>
	);
};
