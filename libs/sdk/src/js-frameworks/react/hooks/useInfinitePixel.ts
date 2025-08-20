import { useEffect, useRef, useState } from "react";
import { type PixelConfig, type PixelState, usePixel } from "./usePixel";

interface PixelResult<D> extends Pick<PixelState<D>, "status" | "error"> {
    data: D | D[];
    update: (data: D[] | D | Partial<D>) => void;
    refresh: () => void;
	offset?: number;
	currLen?: number;
	collect?: () => void;
}

export function useInfinitePixel<D>(
	fun: string,
	pixel: string,
	config?: Partial<PixelConfig<D>>,
	insightId?: string,
): PixelResult<D> {
	const [currLen, setCurrLen] = useState(0);
	const [offset, setOffset] = useState(0);
	const [state, setState] = useState<D[]>([]);
	const pixelRef = useRef(pixel);
	
	const offsetPixel = pixelRef.current !== pixel ? '' : `${fun}(${pixel}, offset=[${offset || 0}]);`;
	
	const pixelConfig: Partial<PixelConfig<D | D[]>> = config
		? {
				...config,
				data: Array.isArray(config.data)
					? config.data
					: config.data !== undefined
						? config.data
						: [],
			}
		: {};

	const { refresh, update, data, status, error } = usePixel(
		offsetPixel,
		pixelConfig,
		insightId,
	);

	useEffect(() => {
		if (status === "SUCCESS") {
			const isArray = Array.isArray(data);
			if (isArray) {
				setCurrLen(data.length);
				setState((prev) => {
					return [...prev, ...data];
				});
			}
		}
	}, [data, status]);

	const collect = (offset?: number) => {
		if (!offset) {
			setState([]);
		}
		setOffset(offset || 0);
	};

	useEffect(() => {
		if(pixel !== pixelRef.current) {
			pixelRef.current = pixel;
			collect(0); 
		}
	}, [pixel, insightId, fun]);

	return {
		data: state as D,
		status,
		error,
		currLen,
		collect,
		refresh,
		update,
	};
}
