import * as MuiIcons from "@mui/icons-material";

function findIcons() {
    const Icons = {} as typeof MuiIcons;
    Object.keys(MuiIcons).map((icon) => {
        if (icon.includes("Rounded") || icon.includes("Outlined")) {
            Icons[icon] = MuiIcons[icon];
        }
    });
    return Icons;
}

const Icons: typeof MuiIcons = findIcons();

export default Icons;
