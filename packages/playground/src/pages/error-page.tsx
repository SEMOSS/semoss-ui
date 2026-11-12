import { Home, OctagonAlert } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	H1,
	P,
	SidebarTrigger,
	Spinner,
	useTheme,
} from "@semoss/ui/next";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";

interface ErrorPageProps {
	/** Fill the main area beside the navigation rather than the whole page. */
	isInnerComponent?: boolean;
	/** Offers Retry in place of going home or reloading. */
	onRetry?: () => void;
	/** Whether the retry is running; disables Retry. */
	isRetrying?: boolean;
}

export const ErrorPage = ({
	isInnerComponent = false,
	onRetry,
	isRetrying = false,
}: ErrorPageProps) => {
	const { t } = useTranslation("room");
	const navigate = useNavigate();
	const theme = usePlaygroundTheme();
	const { resolvedTheme } = useTheme();
	const src =
		resolvedTheme === "dark" ? theme.images.errorDark : theme.images.error;

	return (
		<div
			className={cn(
				"relative flex w-full items-center justify-center overflow-auto bg-background p-6",
				isInnerComponent ? "h-full" : "min-h-svh",
			)}
		>
			{src && (
				<img
					src={src}
					alt=""
					className="pointer-events-none absolute inset-0 h-full w-full object-cover"
				/>
			)}
			{isInnerComponent && (
				<div className="absolute start-4 top-4">
					<SidebarTrigger />
				</div>
			)}
			<div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center">
				<OctagonAlert
					className="size-10 text-destructive"
					aria-hidden="true"
				/>
				<H1 className="font-medium text-2xl">
					{t("studio.errorTitle")}
				</H1>
				<P className="text-base text-muted-foreground">
					{t("studio.errorDescription")}
				</P>
				<div className="flex flex-wrap justify-center gap-2">
					{onRetry ? (
						<Button
							type="button"
							disabled={isRetrying}
							onClick={onRetry}
						>
							{isRetrying ? <Spinner aria-hidden="true" /> : null}
							{t("studio.retry")}
						</Button>
					) : (
						<>
							<Button
								type="button"
								onClick={() => navigate("/")}
								variant="outline"
							>
								<Home aria-hidden="true" />
								{t("studio.backHome")}
							</Button>
							<Button
								type="button"
								onClick={() => window.location.reload()}
							>
								{t("studio.refresh")}
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
