import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Env, runPixel } from "@semoss/sdk/react";
import { Spinner, Toaster } from "@semoss/ui/next";
import { DefaultBlocks } from "./components/block-defaults";
import { Blocks, RendererEngine } from "./components/blocks";
import { DefaultCells } from "./components/cell-defaults";
import {
	MigrationManager,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "./store/state";

// TODO: Add component library notification component

export interface RendererProps {
	/** App to render */
	appId?: string;

	/** Insight to tie all pixels that are ran to */
	insightId?: string;

	/** State to render */
	state?: SerializedState;

	/**
	 * TODO: REMOVE
	 * Do we want to see load screen. Ex: preview on tooltip
	 * */
	preview?: boolean;
}

/**
 * Render a block app
 */
export const Renderer = observer((props: RendererProps) => {
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

				// process Env.Tool parameters and add to the state
				// TODO: Dispatch?
				if (Env.TOOL) {
					for (const parameter in Env.TOOL.parameters) {
						const value = Env.TOOL.parameters[parameter];

						// check if the variable exists
						const variable = s.variables[parameter];
						if (variable) {
							// retrieve the "to" value
							const toValue = variable.to;
							if (variable.type === "block") {
								// Look into blocks section
								if (s.blocks[toValue]) {
									s.blocks[toValue].data.value = value;
								}
							} else if (
								variable.type === "cell" ||
								variable.type === "query"
							) {
							} else {
								variable.value = value;
							}
						}
					}
				}

				// create a new state store
				const store = new StateStore({
					mode: "interactive",
					insightId: insightId,
					state: s,
					cellRegistry: DefaultCells,
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
				<div
					className="relative flex h-full w-full items-center justify-center"
					style={{
						background: "rgba(255, 255, 255, 0.5)",
						zIndex: 1501,
					}}
				>
					<Spinner className="size-6" />
				</div>
			);
		} else {
			return <h6>Fetching Preview...</h6>;
		}
	}

	return (
		<>
			<Toaster />
			<Blocks state={stateStore} registry={DefaultBlocks}>
				<RendererEngine id={homePage} />
			</Blocks>
		</>
	);
});

const getCurrentPageId = (state: SerializedState) => {
	const URLroute = window.location.href;
	const match = URLroute.match(/([^/]+)$/);
	const currentBlockRoute = match ? match[1] : "";

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
