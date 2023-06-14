import { LoadingScreen, LoadingScreenProps } from './LoadingScreen';
import {
    LoadingScreenTrigger,
    LoadingScreenTriggerProps,
} from './LoadingScreenTrigger';

const LoadingScreenNameSpace = Object.assign(LoadingScreen, {
    Trigger: LoadingScreenTrigger,
});

export type { LoadingScreenProps, LoadingScreenTriggerProps };
export { LoadingScreenNameSpace as LoadingScreen };
