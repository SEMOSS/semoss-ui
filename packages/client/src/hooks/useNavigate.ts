import { useCallback, useEffect } from "react";
import {
	createPath,
	type NavigateFunction,
	type NavigateOptions,
	resolvePath,
	type To,
	useLocation,
	useNavigate as useReactRouterNavigate,
	useResolvedPath,
} from "react-router-dom";

const MODIFIER_NAVIGATION_WINDOW_MS = 700;

let hasBoundModifierListeners = false;
let lastModifierClickAt = 0;

const isInteractiveClickTarget = (target: EventTarget | null): boolean => {
	if (!(target instanceof Element)) {
		return false;
	}

	return Boolean(
		target.closest(
			`button, [role="button"], a, [data-semoss-nav-click="true"]`,
		),
	);
};

const bindModifierListeners = () => {
	if (hasBoundModifierListeners || typeof window === "undefined") {
		return;
	}

	const onPotentialNavigationClick = (event: MouseEvent) => {
		if (!(event.ctrlKey || event.metaKey || event.button === 1)) {
			return;
		}

		if (!isInteractiveClickTarget(event.target)) {
			return;
		}

		lastModifierClickAt = Date.now();
	};

	window.addEventListener("click", onPotentialNavigationClick, true);
	window.addEventListener("auxclick", onPotentialNavigationClick, true);
	hasBoundModifierListeners = true;
};

const shouldOpenInNewTab = (): boolean => {
	if (typeof window === "undefined") {
		return false;
	}

	const ageMs = Date.now() - lastModifierClickAt;
	if (ageMs < 0 || ageMs > MODIFIER_NAVIGATION_WINDOW_MS) {
		return false;
	}

	lastModifierClickAt = 0;
	return true;
};

const isAbsoluteUrl = (value: string): boolean => {
	return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
};

const ensureTrailingSlash = (value: string) => {
	return value.endsWith("/") ? value : `${value}/`;
};

const openRouteInNewTab = (
	to: To,
	pathname: string,
	routePathname: string,
	options?: NavigateOptions,
) => {
	if (typeof window === "undefined") {
		return;
	}

	if (typeof to === "string") {
		if (to.startsWith("#") || isAbsoluteUrl(to)) {
			window.open(to, "_blank", "noopener,noreferrer");
			return;
		}
	}

	const basePathname =
		options?.relative === "path" ? pathname : routePathname;
	const resolvedPath = resolvePath(to, ensureTrailingSlash(basePathname));
	const path = createPath(resolvedPath);
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const baseUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
	window.open(
		`${baseUrl}#${normalizedPath}`,
		"_blank",
		"noopener,noreferrer",
	);
};

/**
 * Wrapper over react-router's useNavigate that preserves native modified-click
 * behavior (Ctrl/Cmd and middle click) when navigation is triggered from buttons.
 */
export const useNavigate = (): NavigateFunction => {
	const location = useLocation();
	const routePath = useResolvedPath(".");
	const navigate = useReactRouterNavigate();

	useEffect(() => {
		bindModifierListeners();
	}, []);

	return useCallback<NavigateFunction>(
		(to: To | number, options?: NavigateOptions) => {
			if (typeof to !== "number" && shouldOpenInNewTab()) {
				openRouteInNewTab(
					to,
					location.pathname,
					routePath.pathname,
					options,
				);
				return;
			}

			navigate(to, options);
		},
		[location.pathname, navigate, routePath.pathname],
	);
};
