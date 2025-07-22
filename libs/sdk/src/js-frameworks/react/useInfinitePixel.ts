import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { runPixel } from "../../api";
// import { useNotification } from "@hooks";

interface PixelState<D> {
    status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
    data?: D | D[] | [];
    error?: Error;
    collect?: () => void;
    currLen?: number;
}

export interface PixelConfig<D> {
    data?: D | D[] | [];
    silent?: boolean;
}

interface UseInfinitePixelResult<D> extends PixelState<D> {
    refresh: () => void;
    update: (data: D) => void;
    offset?: number;
}

export function useInfinitePixel<D>(
    funcName: string,
    argStr: string,
    config?: Partial<PixelConfig<D>>,
    insightId?: string,
): UseInfinitePixelResult<D> {
    // const notification = useNotification();

    const options = useMemo<PixelConfig<D>>(
        () => ({
            data: [],
            silent: false,
            ...config,
        }),
        [config],
    );

    const [count, setCount] = useState(0);
    const [currLen, setCurrLen] = useState(0);
    const [state, setState] = useState<PixelState<D>>(() => {
        const s: PixelState<D> = {
            status: "INITIAL",
        };

        if (options.data !== undefined) {
            s.data = options.data;
        }

        return s;
    });

    const isCancelledRef = useRef(false);

    const refresh = useCallback(() => {
        setCount((count) => count + 1);
    }, []);

    const update = useCallback((data: D) => {
        setState((prev) => ({
            ...prev,
            data,
        }));
    }, []);

    const collect = (offset?: number) => {
        if (!argStr) {
            setState({
                status: "INITIAL",
                data: [],
            });
            return;
        }

        isCancelledRef.current = false;
        setState((prev) => ({
            data: offset ? prev.data : [],
            status: "LOADING",
        }));

        runPixel(`${funcName}(${argStr}, offset=[${offset || 0}]);`, insightId)
            .then((response) => {
                if (isCancelledRef.current) return;
                const { output, operationType } = response.pixelReturn[0];
                if (operationType.includes("ERROR")) {
                    throw new Error(output as string);
                }
                setCurrLen(Array.isArray(output) ? output.length : 0);
                if (isCancelledRef.current) return;
                setState((prev) => ({
                    status: "SUCCESS",
                    data:
                        offset && Array.isArray(prev.data)
                            ? [
                                  ...prev.data,
                                  ...(Array.isArray(output) ? output : []),
                              ]
                            : (output as D),
                }));
            })
            .catch((error) => {
                setCurrLen(0);
                if (isCancelledRef.current) return;
                if (!options.silent) {
                    // notification.add({
                    //     color: "error",
                    //     message: error.message,
                    // });
                    window.alert(error.message);
                } else {
                    console.log(error.message);
                }
                setState({
                    status: "ERROR",
                    error,
                    data: [],
                });
            });
    };

    useEffect(() => {
        if (count > 0) {
            collect();
        }
    }, [count]);

    useEffect(() => {
        collect();
        return () => {
            isCancelledRef.current = true;
        };
    }, [argStr, insightId, funcName]);

    return {
        ...state,
        currLen,
        collect,
        refresh,
        update,
    };
}
