import { useCallback, useEffect, useRef, useState } from "react";
import type { FileSource } from "@semoss/shared";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";

/** A mounted file's read, shaped like `usePixel`'s. */
export interface MountFileRead {
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	/** The file as text, or as base64 for a panel that reads bytes. */
	data: string;
	error?: Error;
	/** Read the file again. Its identity is stable. */
	refresh: () => void;
}

interface UseMountFileOptions {
	/** The mount's source; null when the mount is not here. */
	source: FileSource | null;
	/** The file, as the source has it. */
	path: string;
	/** Hand the bytes over as base64 rather than text. */
	base64: boolean;
	/** False waits at `INITIAL` without reading anything. */
	enabled: boolean;
	/** The error when the mount is not here. */
	missingMessage: string;
	/** Called after every successful read. */
	onLoad: () => void;
}

/** The state a read keeps. */
interface ReadState {
	status: MountFileRead["status"];
	data: string;
	error?: Error;
}

const INITIAL_STATE: ReadState = { status: "INITIAL", data: "" };

/**
 * Read a file from a host's mount for a file panel, in the encoding the panel
 * declared. A read that lands after a newer one started is dropped.
 *
 * @param options - The source, the file, and the encoding.
 * @returns The read.
 */
export const useMountFile = ({
	source,
	path,
	base64,
	enabled,
	missingMessage,
	onLoad,
}: UseMountFileOptions): MountFileRead => {
	const [state, setState] = useState<ReadState>(INITIAL_STATE);
	const [count, setCount] = useState(0);
	const onLoadRef = useRef(onLoad);
	onLoadRef.current = onLoad;

	// biome-ignore lint/correctness/useExhaustiveDependencies(count): a bump reads again
	useEffect(() => {
		if (!enabled) {
			setState(INITIAL_STATE);
			return;
		}

		if (!source) {
			setState({
				status: "ERROR",
				data: "",
				error: new Error(missingMessage),
			});
			return;
		}

		let isCancelled = false;
		setState({ status: "LOADING", data: "" });
		source.read(path).then(
			(bytes) => {
				if (isCancelled) {
					return;
				}
				setState({
					status: "SUCCESS",
					data: base64
						? encodeBytesToBase64(bytes)
						: new TextDecoder().decode(bytes),
				});
				onLoadRef.current();
			},
			(error: unknown) => {
				if (!isCancelled) {
					setState({
						status: "ERROR",
						data: "",
						error:
							error instanceof Error
								? error
								: new Error(String(error)),
					});
				}
			},
		);

		return () => {
			isCancelled = true;
		};
	}, [base64, count, enabled, missingMessage, path, source]);

	const refresh = useCallback(() => {
		setCount((previous) => previous + 1);
	}, []);

	return { ...state, refresh: refresh };
};
