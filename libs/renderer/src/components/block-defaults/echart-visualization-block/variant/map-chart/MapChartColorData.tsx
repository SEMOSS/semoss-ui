export const newColor = (data, color) => {
    if (data.option["_state"]["fields"]["colorDataType"] == "NUMBER") {
        const colour = color != "NaN" ? valueToHSL(color) : "#000000";
        return colour;
    }
    if (data.option["_state"]["fields"]["colorDataType"] == "STRING") {
        const colour = color != "NaN" ? stringToColor(color) : "000000";
        return colour;
    }

    function valueToHSL(value) {
        const hue = (parseInt(value, 10) * 37) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str?.length; i++) {
            hash = str?.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = "#";
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            color += ("00" + value.toString(16)).slice(-2);
        }
        return color;
    }
};
