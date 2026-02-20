import { useNavigate } from "react-router-dom";
import { Button } from "@semoss/ui";

interface ErrorPageProps {
	isInnerComponent?: boolean;
}

/**
 * ErrorPage - Display an error message
 */
export const ErrorPage = ({ isInnerComponent = false }: ErrorPageProps) => {
	const navigate = useNavigate();

	if (isInnerComponent) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="space-y-4 text-center">
					<h1 className="font-bold text-4xl">Oops!</h1>
					<p className="text-muted-foreground">
						Something went wrong on this page
					</p>
					<Button onClick={() => navigate("/")}>Go Home</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh items-center justify-center">
			<div className="space-y-4 text-center">
				<h1 className="font-bold text-4xl">Oops!</h1>
				<p className="text-muted-foreground">
					Something went wrong loading the application
				</p>
				<Button onClick={() => window.location.reload()}>
					Reload Page
				</Button>
			</div>
		</div>
	);
};
