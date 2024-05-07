export const splitAtPeriod = (str, side = 'left') => {
    const indexOfPeriod = str.indexOf('.');
    if (indexOfPeriod === -1) {
        return str; // No period found, return the entire string
    }

    if (side === 'left') {
        return str.substring(0, indexOfPeriod);
    } else if (side === 'right') {
        return str.substring(indexOfPeriod + 1);
    } else {
        throw new Error("Invalid side argument. Choose 'left' or 'right'");
    }
};

export const lowercase = (str) => {
    if (str.length === 0 || str.length === 1) {
        return str.toLowerCase();
    }
    // Identify word boundaries using regular expression
    const regex = /\b\w+\b/g;
    const match = regex.exec(str);
    if (!match) {
        return str;
    }
    const word = match[0].toLowerCase();
    return str.replace(regex, word);
};

export const capitalizeFirstLetter = (str) => {
    return str.replace(/\w{1}/, (match) => match.toUpperCase());
};
