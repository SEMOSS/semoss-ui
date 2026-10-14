import { useEffect, useState } from "react";
import { loadLoginProviderLogo } from "@semoss/shared";

/**
 * Loads the logo of a login provider, by its key or label.
 *
 * @param provider - the provider, such as "ms" or "MICROSOFT", or null for none
 * @returns the logo's URL, or null while it loads or when there is none
 */
export const useLoginProviderLogo = (
	provider: string | null,
): string | null => {
	const [logo, setLogo] = useState<string | null>(null);

	useEffect(() => {
		if (!provider) {
			setLogo(null);
			return;
		}
		let isStale = false;
		loadLoginProviderLogo(provider)
			.then((url) => {
				if (!isStale) {
					setLogo(url);
				}
			})
			.catch(() => {
				if (!isStale) {
					setLogo(null);
				}
			});
		return () => {
			isStale = true;
		};
	}, [provider]);

	return logo;
};
