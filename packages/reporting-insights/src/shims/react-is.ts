/**
 * Minimal react-is shim for React 19.
 * React 19 inlined these helpers; recharts still imports them via the
 * standalone package. Vite aliases this file to "react-is" so no extra
 * npm package is needed.
 */
import React from "react";

const ELEMENT = Symbol.for("react.element");
const PORTAL = Symbol.for("react.portal");
const FRAGMENT = Symbol.for("react.fragment");
const STRICT = Symbol.for("react.strict_mode");
const PROFILER = Symbol.for("react.profiler");
const PROVIDER = Symbol.for("react.provider");
const CONTEXT = Symbol.for("react.context");
const FORWARD = Symbol.for("react.forward_ref");
const SUSPENSE = Symbol.for("react.suspense");
const MEMO = Symbol.for("react.memo");
const LAZY = Symbol.for("react.lazy");

function typeOf(obj: unknown): symbol | undefined {
	if (typeof obj === "object" && obj !== null) {
		const t = (obj as any).$$typeof;
		if (t === ELEMENT) return (obj as any).type;
		if (t === PORTAL) return PORTAL;
	}
	return undefined;
}

export { typeOf };
export const isFragment = (o: unknown) => typeOf(o) === FRAGMENT;
export const isElement = (o: unknown) =>
	typeof o === "object" && o !== null && (o as any).$$typeof === ELEMENT;
export const isPortal = (o: unknown) => typeOf(o) === PORTAL;
export const isStrictMode = (o: unknown) => typeOf(o) === STRICT;
export const isProfiler = (o: unknown) => typeOf(o) === PROFILER;
export const isContextProvider = (o: unknown) => typeOf(o) === PROVIDER;
export const isContextConsumer = (o: unknown) => typeOf(o) === CONTEXT;
export const isForwardRef = (o: unknown) => typeOf(o) === FORWARD;
export const isSuspense = (o: unknown) => typeOf(o) === SUSPENSE;
export const isMemo = (o: unknown) => typeOf(o) === MEMO;
export const isLazy = (o: unknown) => typeOf(o) === LAZY;
export const isValidElementType = (t: unknown) =>
	typeof t === "string" ||
	typeof t === "function" ||
	t === React.Fragment ||
	t === React.StrictMode ||
	t === React.Profiler ||
	t === React.Suspense ||
	(typeof t === "object" &&
		t !== null &&
		((t as any).$$typeof === MEMO ||
			(t as any).$$typeof === LAZY ||
			(t as any).$$typeof === FORWARD));

export const Fragment = React.Fragment;
export const StrictMode = React.StrictMode;
export const Profiler = React.Profiler;
export const Suspense = React.Suspense;

export const AsyncMode = Symbol.for("react.async_mode");
export const ConcurrentMode = Symbol.for("react.concurrent_mode");
export const ContextConsumer = CONTEXT;
export const ContextProvider = PROVIDER;
export const Element = ELEMENT;
export const ForwardRef = FORWARD;
export const Lazy = LAZY;
export const Memo = MEMO;
export const Portal = PORTAL;
export const Profiler_ = PROFILER;
export const StrictMode_ = STRICT;
export const Suspense_ = SUSPENSE;

export default {
	typeOf,
	isFragment,
	isElement,
	isPortal,
	isStrictMode,
	isProfiler,
	isContextProvider,
	isContextConsumer,
	isForwardRef,
	isSuspense,
	isMemo,
	isLazy,
	isValidElementType,
	Fragment,
	StrictMode,
	Profiler,
	Suspense,
	AsyncMode: AsyncMode,
	ConcurrentMode: ConcurrentMode,
	ContextConsumer,
	ContextProvider,
	Element,
	ForwardRef,
	Lazy,
	Memo,
	Portal,
};
