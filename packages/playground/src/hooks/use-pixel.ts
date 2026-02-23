import { useCallback, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";

interface PixelState<D> {
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	data: D | undefined;
	error?: Error;
}
export interface PixelConfig<D> {
	data: D | undefined;
	onSuccess: (data: D) => void;
	onError: (data: D | undefined, error: Error) => void;
	onFinal: () => void;
}
interface usePixel<D> extends PixelState<D> {
	refresh: () => void;
	update: (data: D) => void;
}
export function usePixel<D>(
	pixel: string,
	config?: Partial<PixelConfig<D>>,
): usePixel<D> {
	const { actions } = useInsight();

	const options: PixelConfig<D> = useMemo(
		() => ({
			data: undefined,
			onSuccess: () => null,
			onError: () => null,
			onFinal: () => null,
			...config,
		}),
		[config],
	);

	const [count, setCount] = useState(0);
	const [state, setState] = useState<PixelState<D>>(() => ({
		status: "INITIAL",
		data: options.data,
	}));

	const refresh = useCallback(() => {
		setCount((c) => c + 1);
	}, []);

	const update = useCallback((data: D) => {
		setState((s) => ({
			...s,
			data,
		}));
	}, []);

	useEffect(() => {
		if (!pixel) {
			setState({
				status: "INITIAL",
				data: options.data,
			});
			return;
		}
		let isCancelled = false;
		setState({
			status: "LOADING",
			data: options.data,
		});
		actions
			.run<[D]>(pixel)
			.then((response) => {
				if (isCancelled) return;
				const { output, operationType } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1) {
					throw new Error(output as string);
				}
				setState({
					status: "SUCCESS",
					data: output as D,
				});
				options.onSuccess(output as D);
			})
			.catch((error) => {
				if (isCancelled) return;
				const err = error as Error;
				setState({
					status: "ERROR",
					data: options.data,
					error: err,
				});
				options.onError(options.data, err);
			})
			.finally(() => {
				if (!isCancelled) options.onFinal();
			});
		return () => {
			isCancelled = true;
		};
	}, [pixel, count]);

	return {
		...state,
		refresh,
		update,
	};
}