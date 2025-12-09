import { AlertCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	ResizablePanel,
	ResizablePanelGroup,
	SidebarTrigger,
} from "@semoss/ui/next";
import background from "@/assets/img/background.png";

/**
 * Page displayed when a FE rendering error occurs
 */
export const ErrorPage = ({
	isInnerComponent,
}: {
	isInnerComponent?: boolean;
}) => {
	const navigate = useNavigate();

	const content = (
		<div className="max-w-md p-8 text-center">
			<div className="mb-6 flex justify-center">
				<AlertCircle
					className="text-yellow-500"
					size={80}
					strokeWidth={1.5}
				/>
			</div>

			<h1 className="mb-4 whitespace-nowrap font-bold text-4xl text-gray-800">
				Something went wrong
			</h1>

			<p className="mb-8 text-gray-600 text-lg">
				An unexpected error occurred. Try returning to the home page.
			</p>

			<button
				type="button"
				onClick={() => navigate("/")}
				className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
			>
				<Home size={20} />
				Back to Home
			</button>
		</div>
	);

	if (isInnerComponent) {
		return (
			<div className="relative h-full w-full overflow-hidden">
				<div className="absolute top-2 left-2 z-10 flex h-12.5 items-center px-4">
					<SidebarTrigger />
				</div>
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
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
			{content}
		</div>
	);
};
