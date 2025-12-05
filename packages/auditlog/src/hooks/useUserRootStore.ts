import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { RootStore } from "@/stores";

export function useUserRootStore(insightId: string | undefined) {
	const [rootStore, setRootStore] = useState<RootStore | null>(null);

	useEffect(() => {
		if (insightId) {
			const store = new RootStore();
			if (!store.user.id) {
				runPixel(`GetUserInfo();`, insightId).then((response) => {
					const responseData = response.pixelReturn[0].output as {
						[key: string]: { [key: string]: string };
					};
					const user = {
						id: responseData?.NATIVE?.id,
						name: responseData?.NATIVE?.name,
						email: responseData?.NATIVE?.email,
						isAdmin: false, //termporary change
					};
					store.initializeUser(user);
					setRootStore(store);
				});
			}
		}
	}, [insightId]);

	return rootStore;
}
