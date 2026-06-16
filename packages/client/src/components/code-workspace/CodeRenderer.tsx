import { Env } from "@semoss/sdk/react";

interface CodeRendererProps {
	/** Id of the app to render */
	appId: string;
}

/**
 * Render an app based on an id
 */
export const CodeRenderer = (props: CodeRendererProps) => {
	const { appId } = props;

	// return the app
	return (
		<iframe
			className="h-full w-full flex-1 border-none"
			src={`${Env.MODULE}/public_home/${appId}/portals/`}
			data-test={`iframe--${appId}`}
			title={`App ${appId}`}
		/>
	);
};
