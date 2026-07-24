/**
 * Toast — adapter over the shared @semoss/ui toast (Sonner). Keeps this app's
 * `useToast()` API (toast/error/success/info/dismiss) and `<ToastProvider>` so
 * call sites and App don't change; under the hood it renders the shared Toaster.
 *
 *   const toast = useToast();
 *   toast.error('column "foo" not found');
 *   toast.success('Dashboard published');
 */

import { type ReactNode, useMemo } from "react";
import { toast as sonner, Toaster } from "@semoss/ui/next";

export type ToastType = "error" | "success" | "info";

interface ToastOptions {
	type?: ToastType;
	title?: string;
	duration?: number;
}

interface ToastApi {
	toast: (message: string, opts?: ToastOptions) => void;
	error: (message: string, title?: string) => void;
	success: (message: string, title?: string) => void;
	info: (message: string, title?: string) => void;
	dismiss: (id?: string | number) => void;
}

/** Mounts the shared Toaster once. Kept named ToastProvider for compatibility. */
export function ToastProvider({ children }: { children: ReactNode }) {
	return (
		<>
			{children}
			<Toaster position="bottom-right" richColors closeButton />
		</>
	);
}

// When a title is given it becomes the headline and the message the description;
// otherwise the message is the headline (matches the old behavior).
const emit = (
	fn: (
		msg: string,
		opts?: { description?: string; duration?: number },
	) => string | number,
	message: string,
	title?: string,
	duration?: number,
) => {
	if (title) fn(title, { description: message, duration });
	else fn(message, { duration });
};

export function useToast(): ToastApi {
	return useMemo<ToastApi>(
		() => ({
			toast: (message, opts = {}) => {
				const fn =
					opts.type === "error"
						? sonner.error
						: opts.type === "success"
							? sonner.success
							: sonner.info;
				emit(fn, message, opts.title, opts.duration);
			},
			error: (message, title) => emit(sonner.error, message, title),
			success: (message, title) => emit(sonner.success, message, title),
			info: (message, title) => emit(sonner.info, message, title),
			dismiss: (id) => sonner.dismiss(id),
		}),
		[],
	);
}
