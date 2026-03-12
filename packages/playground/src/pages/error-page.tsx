import { Home, OctagonAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
import background from "@/assets/img/render-error-background.png";

export interface ErrorPageProps {
	isInnerComponent?: boolean;
}

/**
 * Page displayed when a FE rendering error occurs
 */
export const ErrorPage = ({ isInnerComponent = false }: ErrorPageProps) => {
	const navigate = useNavigate();

	const content = (
		<div className="max-w-md p-8 text-center">
			<div className="mb-6 flex justify-center">
				<OctagonAlert
					className="text-destructive"
					size={50}
					strokeWidth={1.5}
				/>
			</div>

			<h1 className="mb-2 whitespace-nowrap text-center font-semibold text-3xl text-foreground leading-normal">
				Something went wrong.
			</h1>

			<p className="mb-6 w-[396px] max-w-[400px] text-center font-normal text-lg text-muted-foreground leading-normal">
				An unexpected error occurred. Please try refreshing or returning
				to the home page.
			</p>

			<Button
				type="button"
				onClick={() => navigate("/")}
				size="lg"
				variant="outline"
			>
				<Home />
				Back to Home
			</Button>
		</div>
	);

	if (isInnerComponent) {
		return (
			<div className="relative h-full w-full overflow-hidden">
	<ResizablePanelGroup direction="horizontal">
					<ResizablePanel className="relative flex flex-col items-center justify-center overflow-auto p-2">
						<img
							src={background}
							alt="Background"
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
				src={background}
				alt="Background"
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div className="z-10">{content}</div>
		</div>
	);
};
