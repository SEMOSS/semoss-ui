import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Muted } from "@semoss/ui/next";
import ErrorSvg from "@/assets/img/Error.svg";
import { useNavigate } from "@/hooks/useNavigate";

/**
 * Component to be rendered in the ErrorBoundary on the NavigatorLayout
 * Displays when there is an error that prevents the FE from loading and redirects back to the homepage
 */
export const ErrorPage = () => {
	const [countdown, setCountdown] = useState(10);
	const timer = useRef<NodeJS.Timer>();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const isOnHomepage = pathname === "" || pathname === "/";

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (!isOnHomepage) {
			timer.current = setInterval(() => {
				setCountdown((countdown) => countdown - 1);
			}, 1000);
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - navigate is stable
	useEffect(() => {
		if (countdown < 1) {
			clearInterval(timer.current);
			navigate("/");
		}
	}, [countdown]);

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
			<img src={ErrorSvg} className="h-[25%] max-h-[200px]" alt="Error" />
			<h2 className="font-semibold text-xl">Something went wrong!</h2>
			<Muted>
				We&apos;re working hard to fix it. If the issue persists, please
				reach out and let us know.
			</Muted>
			{!isOnHomepage && (
				<Muted>
					Taking you back to the home page in {countdown} second
					{countdown === 1 ? "" : "s"}...
				</Muted>
			)}
		</div>
	);
};
