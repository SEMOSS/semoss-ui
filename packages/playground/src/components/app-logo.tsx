import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { H4 } from "@semoss/ui/next";
import { useRoot } from "@/hooks";

export const AppLogo = observer(() => {
	const [appNameLogo, setAppNameLogo] = useState<string | null>(null);
	const [logo, setLogo] = useState<string | null>(null);

	const { root } = useRoot();

	useEffect(() => {
		const loadLogo = async () => {
			if (root.theme?.playground?.images?.logo) {
				const base64data = btoa(
					unescape(
						encodeURIComponent(root.theme.playground.images.logo),
					),
				);
				setLogo(base64data);
			} else if (root.theme.images.logo) {
				try {
					const res = await fetch(root.theme.images.logo);
					const svg = await res.text();
					const base64data = btoa(
						unescape(encodeURIComponent(String(svg))),
					);
					setLogo(base64data);
				} catch (err) {
					console.error("Failed to load logo:", err);
					setLogo(null);
				}
			}
		};

		loadLogo();
	}, [root.theme.images.logo, root.theme?.playground?.images?.logo]);

	useEffect(() => {
		if (root.theme.images.appName) {
			const base64data = btoa(
				unescape(encodeURIComponent(root.theme.images.appName)),
			);

			setAppNameLogo(base64data);
		}
	}, [root.theme.images.appName]);

	return (
		<div className="flex h-full w-full flex-row items-center gap-2 transition-all duration-200 ease-in-out">
			{logo ? (
				<img
					className="flex h-8 flex-row items-center"
					alt="logo"
					src={`data:image/svg+xml;base64,${logo}`}
				/>
			) : null}
			{appNameLogo ? (
				<img
					className="flex h-8 w-full flex-row items-center transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden"
					alt="logo"
					src={`data:image/svg+xml;base64,${appNameLogo}`}
				/>
			) : (
				<H4>{root.theme.name}</H4>
			)}
		</div>
	);
});
