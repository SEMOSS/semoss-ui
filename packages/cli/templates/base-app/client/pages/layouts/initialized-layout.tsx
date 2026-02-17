import { Outlet } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@/components/spinner";
/**
 * Renders a loading wheel if SEMOSS is not initialized.
 *
 * @component
 */
export const InitializedLayout = () => {
	const { isInitialized } = useInsight();

	return (
		<div className="flex h-screen flex-col">
			{isInitialized ? (
				// If initialized, set up padding and scroll
				<main className="h-full overflow-auto">
					{/* Outlet is a react router component; it allows the router to choose the child based on the route */}
					<Outlet />
				</main>
			) : (
				// Otherwise, show a centered loading wheel
				<div className="flex h-screen w-screen items-center justify-center">
					<Spinner />
				</div>
			)}
		</div>
	);
};
