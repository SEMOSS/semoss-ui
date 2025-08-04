import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { runPixel } from "@semoss/sdk/react";
import { Backdrop, Notification, Typography } from "@semoss/ui";
import { DefaultBlocks } from "./components/block-defaults";
import { Blocks, RendererEngine } from "./components/blocks";
import { DefaultCells } from "./components/cell-defaults";
import {
	MigrationManager,
	SerializedState,
	STATE_VERSION,
	StateStore,
} from "./store/state";

export interface RendererV2Props {
	/** App to render */
	appId?: string;

	/** Insight to tie all pixels that are ran to */
	insightId?: string;

	/** State to render */
	state?: SerializedState;

	/**
	 * Do we want to see load screen. Ex: preview on tooltip
	 */
	preview?: boolean;
}

/**
 * Render a block app with Tailwind CSS styling
 */
export const RendererV2 = observer((props: RendererV2Props) => {
	const { appId, insightId, state, preview } = props;

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [stateStore, setStateStore] = useState<StateStore | null>();
	const queryStringParams = new URLSearchParams(useLocation().search);

	const [homePage, setHomePage] = useState("");

	const URLroute = window.location.href;

	// Replace variable values with query params
	const params = {};
	queryStringParams.forEach((value, key) => {
		params[key] = value;
	});

	useEffect(() => {
		console.log(URLroute);
		// start the loading
		setIsLoading(true);

		// initialize a new insight
		let pixel = "";
		if (appId) {
			pixel = `GetAppBlocksJson ( project=["${appId}"]);`;
		} else if (state) {
			pixel = `true`;
		} else {
			console.error("Missing appId or state");
		}

		// ignore if there is not pixel
		if (!pixel) {
			return;
		}

		// load the app
		runPixel<[SerializedState]>(pixel, insightId ? insightId : "new")
			.then(async ({ pixelReturn, errors, insightId }) => {
				if (errors.length) {
					throw new Error(errors.join(""));
				}

				// set the state
				let s: SerializedState;
				if (appId) {
					s = pixelReturn[0].output;
				} else if (state) {
					s = state;
				} else {
					return;
				}

				// ignore if there is state
				if (!s) {
					return;
				}

				// run migration if not up to date
				if (s.version !== STATE_VERSION) {
					const migration = new MigrationManager();
					s = await migration.run(s);
				}

				const activePage = getCurrentPageId(s);
				setHomePage(activePage);

				// create a new state store
				const store = new StateStore({
					mode: "interactive",
					insightId: insightId,
					state: s,
					cellRegistry: DefaultCells,
					initialParams: params,
				});

				// set it
				setStateStore(store);
			})
			.catch((e) => {
				console.log(e);
			})
			.finally(() => {
				// close the loading screen
				setIsLoading(false);
			});
	}, [state, appId, insightId, URLroute]);

	if (!stateStore || (isLoading && !preview)) {
		if (!preview) {
			return (
				<div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
					<div className="flex flex-col items-center justify-center space-y-4">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
						<p className="text-sm text-gray-600">Loading...</p>
					</div>
				</div>
			);
		} else {
			return (
				<div className="p-4">
					<h6 className="text-lg font-semibold text-gray-900">Fetching Preview...</h6>
				</div>
			);
		}
	}

	return (
		<Notification>
			<Blocks state={stateStore} registry={DefaultBlocks}>
				<RendererEngine id={homePage} />
			</Blocks>
		</Notification>
	);
});

const getCurrentPageId = (state: SerializedState) => {
	const URLroute = window.location.href;
	const match = URLroute.match(/([^/]+)$/);
	const currentBlockRoute = match ? match[1] : "";

	console.log("urlroute", URLroute);
	console.log("currentBlockRoute", currentBlockRoute);

	let activePageID = "";
	const blocks = state?.blocks;

	if (!blocks) {
		return;
	}
	Object?.entries(blocks).forEach(([_, block]) => {
		if (block?.widget === "page") {
			if (currentBlockRoute === block?.data.route) {
				activePageID = block?.id;
			}
		}
	});
	if (activePageID === "") {
		activePageID = "page-1";
	}
	return activePageID;
}; 