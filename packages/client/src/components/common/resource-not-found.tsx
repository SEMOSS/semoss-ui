import { Link } from "react-router-dom";
import { Button, Muted } from "@semoss/ui/next";
import ErrorSvg from "@/assets/img/Error.svg";

interface ResourceNotFoundProps {
	path: string;
}

export const ResourceNotFound = ({ path }: ResourceNotFoundProps) => {
	return (
		<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
			<img src={ErrorSvg} className="h-[25%] max-h-[200px]" alt="Error" />
			<h2 className="font-semibold text-xl">
				This resource was not found
			</h2>
			<Muted>
				The item you are looking for may have been removed or you may
				not have access to it.
			</Muted>
			<Link to={path} className="text-inherit">
				<Button variant="link">Go Back</Button>
			</Link>
		</div>
	);
};
