import { useEffect, useRef, useState } from "react";

export function useInfiniteScroll({
	limit = 10,
	scrollElementId = null,
	collect = () => {
		return;
	},
	length = 0,
}: {
	limit?: number;
	scrollElementId?: string;
	collect?: (offset: number) => void;
	length?: number;
}) {
	const [canCollect, setCanCollect] = useState(true);
	const [offset, setOffset] = useState(0);

	const scrollElRef = useRef(null);
	const scrollTimeoutRef = useRef(null);
	const previousScrollRef = useRef(0);
	let currentScroll;

	const offsetRef = useRef(0);
	const canCollectRef = useRef(true);
	canCollectRef.current = canCollect;

	const reset = () => {
		offsetRef.current = 0;
		setOffset(0);
	};

	const checkHasReached = (len: number) => {
		if (len < limit) {
			setCanCollect(false);
		} else {
			if (!canCollectRef.current) {
				setCanCollect(true);
			}
		}
	};

	const scrollAll = () => {
		currentScroll =
			scrollElRef.current.scrollTop + scrollElRef.current.offsetHeight;
		if (
			currentScroll > scrollElRef.current.scrollHeight * 0.75 &&
			currentScroll > previousScrollRef.current
		) {
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}

			scrollTimeoutRef.current = setTimeout(() => {
				if (!canCollectRef.current) {
					return;
				}
				const nextOffset = offsetRef.current + limit;
				setOffset(nextOffset);
				offsetRef.current = nextOffset;
				collect(nextOffset);
			}, 500);
		}

		previousScrollRef.current = currentScroll;
	};

	useEffect(() => {
		reset();
	}, [limit]);

	useEffect(() => {
		scrollElRef.current = document.querySelector(
			scrollElementId || "#home__content",
		);

		if (!scrollElRef.current) {
			return;
		}

		scrollElRef.current?.addEventListener("scroll", scrollAll);
		return () => {
			scrollElRef.current?.removeEventListener("scroll", scrollAll);
		};
	}, [scrollElementId]);

	useEffect(() => {
		if (length > 0) {
			checkHasReached(length);
		}
	}, [length]);

	return {
		offset,
		checkHasReached,
		reset,
	};
}

export default useInfiniteScroll;
