import { useEffect } from "react";

export function useThemeTitle (theme) {
    useEffect(() => {
        if (theme?.name) document.title = theme.name;
    }, [theme?.name]);
}