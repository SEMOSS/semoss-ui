import { Home, OctagonAlert } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router";
import {
	Button,
	H1,
	P,
	ResizablePanel,
	ResizablePanelGroup,
	SidebarTrigger,
	useTheme,
} from "@semoss/ui/next";
import background from "@/assets/img/render-error-background.png";
import backgroundDark from "@/assets/img/render-error-background-darkmode.jpg";
import { RootContext } from "@/contexts/root-context";

export interface ErrorPageProps {
	isInnerComponent?: boolean;
}

/**
 * Page displayed when a FE rendering error occurs
 */
export const ErrorPage = ({ isInnerComponent = false }: ErrorPageProps) => {
	const navigate = useNavigate();
	// Startup and root-route errors render before RootLayout can provide a store.
	const rootContext = useContext(RootContext);
	const { resolvedTheme } = useTheme();

	const src =
		resolvedTheme === "dark"
			? rootContext?.root.theme.images.errorDark || backgroundDark
			: rootContext?.root.theme.images.error || background;

	const content = (
		<div className="max-w-md p-8 text-center">
			<div className="mb-6 flex justify-center">
				<OctagonAlert
					aria-hidden="true"
					className="text-destructive"
					size={48}
					strokeWidth={1.5}
				/>
			</div>

			<H1 className="mb-2">Something went wrong.</H1>

			<P className="mb-6 text-muted-foreground">
				An unexpected error occurred. Please try refreshing or returning
				to the home page.
			</P>

			<div className="flex flex-wrap justify-center gap-2">
				<Button
					type="button"
					onClick={() => window.location.reload()}
					size="lg"
				>
					Refresh
				</Button>
				<Button
					type="button"
					onClick={() => navigate("/")}
					size="lg"
					variant="outline"
				>
					<Home aria-hidden="true" />
					Back to Home
				</Button>
			</div>
		</div>
	);

	if (isInnerComponent) {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<div className="absolute start-2 top-2 z-10 flex h-12.5 items-center px-4">
					<SidebarTrigger />
				</div>
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel className="relative flex flex-col items-center justify-center overflow-auto p-2">
						<img
							src={src}
							alt=""
							className="absolute inset-0 h-full w-full object-cover"
						/>
						<div className="z-10">{content}</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
			<img
				src={src}
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div className="z-10">{content}</div>
		</div>
	);
};
