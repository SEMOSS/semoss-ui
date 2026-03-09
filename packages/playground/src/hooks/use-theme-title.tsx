import { useEffect } from "react";

export function useThemeTitle (theme) {
    useEffect(() => {
        if (theme?.tab?.title) document.title = theme.tab.title;
    }, [theme?.tab?.title]);
}