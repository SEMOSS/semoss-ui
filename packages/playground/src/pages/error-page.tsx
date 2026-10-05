import { Home, OctagonAlert } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, SidebarTrigger, useTheme } from "@semoss/ui/next";
import { RootContext } from "@/contexts/root-context";

export interface ErrorPageProps {
	isInnerComponent?: boolean;
}

export const ErrorPage = ({ isInnerComponent = false }: ErrorPageProps) => {
	const { t } = useTranslation("room");
	const navigate = useNavigate();
	// Initialization failures and the root route boundary render outside RootLayout.
	const context = useContext(RootContext);
	const { resolvedTheme } = useTheme();
	const src =
		resolvedTheme === "dark"
			? context?.root.theme.images.errorDark
			: context?.root.theme.images.error;
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
				<h1 className="font-semibold text-2xl">
					{t("studio.errorTitle")}
				</h1>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{t("studio.errorDescription")}
				</p>
				<Button onClick={() => navigate("/")} variant="outline">
					<Home />
					{t("studio.backHome")}
				</Button>
			</div>
		</div>
	);
};
