import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Muted } from "@semoss/ui/next";
import { ErrorState } from "@/components/common/error-state";
import { useNavigate } from "@/hooks/useNavigate";

/**
 * Component to be rendered in the ErrorBoundary on the NavigatorLayout
 * Displays when there is an error that prevents the FE from loading and redirects back to the homepage
 */
export const ErrorPage = () => {
	const [countdown, setCountdown] = useState(10);
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const isOnHomepage = pathname === "" || pathname === "/";

	// count down while away from the home page; the timer stops on unmount
	useEffect(() => {
		if (isOnHomepage) {
			return;
		}

		const timer = setInterval(() => {
			setCountdown((countdown) => countdown - 1);
		}, 1000);
		return () => clearInterval(timer);
	}, [isOnHomepage]);

	useEffect(() => {
		if (countdown < 1) {
			navigate("/");
		}
	}, [countdown, navigate]);

	return (
		<ErrorState
			title="Something went wrong!"
			description="We're working hard to fix it. If the issue persists, please reach out and let us know."
		>
			{!isOnHomepage && (
				<Muted>
					Taking you back to the home page in {countdown} second
					{countdown === 1 ? "" : "s"}...
				</Muted>
			)}
		</ErrorState>
	);
};
