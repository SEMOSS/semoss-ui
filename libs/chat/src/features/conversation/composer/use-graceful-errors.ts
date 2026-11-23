import { useCallback } from "react";
import { type UseTranslationOptions, useTranslation } from "@semoss/i18n";
import { useChatConfig } from "../../chat/config/chat-config.context";

/** What {@link useGracefulErrors} returns. */
interface GracefulErrors {
	/** Turns an error into the message to show the user. */
	getGracefulErrorMessage: (error: Error) => string;
}

/**
 * Custom hook for transforming error messages into user-friendly, localized messages.
 *
 * This hook matches error messages against configured patterns in the host's `gracefulErrors`
 * option and returns appropriate translated messages from the "chat" namespace.
 * If no pattern matches, it returns the original error message or a default error message.
 *
 * @param translationOptions - Optional translation options to customize i18n behavior
 * @returns An object containing the `getGracefulErrorMessage` function
 *
 * @example
 * ```tsx
 * const { getGracefulErrorMessage } = useGracefulErrors();
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const userMessage = getGracefulErrorMessage(error);
 *   toast.error(userMessage);
 * }
 * ```
 */
export const useGracefulErrors = (
	translationOptions?: UseTranslationOptions<undefined>,
): GracefulErrors => {
	const { t } = useTranslation("chat", translationOptions);
	const { gracefulErrors } = useChatConfig().options;

	/**
	 * Transforms an error into a user-friendly, localized message.
	 *
	 * Iterates through the host's gracefulErrors patterns and returns
	 * the first matching translated message from the "chat" namespace. If no pattern matches,
	 * returns the original error message. If the error has no message, returns the default
	 * error message ("gracefulErrors.errorDefault").
	 *
	 * @param error - The error object to transform
	 * @returns A user-friendly, localized error message string
	 */
	const getGracefulErrorMessage = useCallback(
		(error: Error): string => {
			const errorMessage = error?.message || "";
			if (!errorMessage) return t("gracefulErrors.errorDefault");
			// The first configured pattern found in the message wins.
			for (const gracefulError of gracefulErrors) {
				if (errorMessage.includes(gracefulError.pattern)) {
					if ("text" in gracefulError) {
						return gracefulError.text;
					} else {
						return t(`gracefulErrors.${gracefulError.errorKey}`);
					}
				}
			}
			return errorMessage;
		},
		[gracefulErrors, t],
	);

	return { getGracefulErrorMessage };
};
