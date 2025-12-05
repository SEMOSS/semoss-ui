import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
import { Skeleton } from "@semoss/ui/next";

export const AppView: React.FC = () => {
	// get the appId to navigate
	const { appId } = useParams();

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	/**
	 * Process iframe on load
	 */
	const handleOnLoad = () => {
		setIsLoading(false);
	};

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{isLoading && <Skeleton className="h-full w-full" />}
			{!!appId && (
				<iframe
					className="h-full w-full border-none"
					title={`Project ${appId}`}
					ref={iframeRef}
					src={`${Env.MODULE}/public_home/${appId}/portals/`}
					onLoad={() => handleOnLoad()}
				/>
			)}
		</div>
	);
};
