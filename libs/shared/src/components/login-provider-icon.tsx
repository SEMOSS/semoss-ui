import { useEffect, useState } from "react";
import { loadLoginProviderLogo } from "../constants/login-provider-icons.constants";

const FALLBACK_PROVIDER = "generic";

interface LoginProviderIconProps {
	provider: string;
	className?: string;
}

export const LoginProviderIcon = ({
	provider,
	className,
}: LoginProviderIconProps) => {
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			const url = await loadLoginProviderLogo(provider);
			if (cancelled) return;

			if (url) {
				setSrc(url);
				return;
			}

			const fallback = await loadLoginProviderLogo(FALLBACK_PROVIDER);
			if (!cancelled) setSrc(fallback);
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [provider]);

	if (!src) {
		return <span aria-hidden className={className} />;
	}

	return (
		<img
			src={src}
			alt=""
			aria-hidden="true"
			className={className}
			loading="lazy"
			decoding="async"
		/>
	);
};
