/**
 * @desc splits a string at the period
 * Used in the UI Builder and notebook
 */
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

/**
 * @desc lowercases the whole string
 */
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

/**
 * @desc capitalizes every word that is spaced
 * "hello world" --> "Hello World"
 */
export const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/**
 * @desc splits word on _ and Uppercases first word
 * "this-is-a-string" --> "This is a string"
 */
export const formatName = (str: string) => {
    let i;
    const frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};
