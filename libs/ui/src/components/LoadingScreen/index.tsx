import { LoadingScreen, LoadingScreenProps } from "./LoadingScreen";
import {
    LoadingScreenTrigger,
    LoadingScreenTriggerProps,
} from "./LoadingScreenTrigger";
import { useLoadingScreen } from "./useLoadingScreen";

const LoadingScreenNameSpace = Object.assign(LoadingScreen, {
    Trigger: LoadingScreenTrigger,
});

export type { LoadingScreenProps, LoadingScreenTriggerProps };
export { LoadingScreenNameSpace as LoadingScreen, useLoadingScreen };
