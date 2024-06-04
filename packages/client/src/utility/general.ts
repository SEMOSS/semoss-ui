import { Role } from '@/types';
import { ENGINE_IMAGES } from '@/pages/import';
import BRAIN from '@/assets/img/BRAIN.png';

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

/*
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
 * "this_is_a_string" --> "This is a string"
 */
export const removeUnderscores = (str: string) => {
    let i;
    const frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};

export const formatPermission = (permission: Role | ''): string => {
    const errorString = 'No permission found';

    if (!permission) {
        return errorString;
    }

    switch (permission) {
        case 'OWNER':
            return 'Author';
        case 'EDIT' || 'EDITOR':
            return 'Editor';
        case 'READ_ONLY' || 'VIEWER':
            return 'Read-Only';
        case 'DISCOVERABLE':
            return 'Discoverable';
        default:
            return errorString;
    }
};

/**
 * @name getEngineImage
 * @params appType & appSubType
 * @returns image link for associated engine
 */
export const getEngineImage = (appType: string, appSubType: string) => {
    const obj = ENGINE_IMAGES[appType]?.find((ele) => ele.name == appSubType);

    if (!obj) {
        console.warn('No image found:', appType, appSubType);
        return BRAIN;
    }

    return obj.icon;
};

/**
 * @desc Copies string to clipboard
 */
export const copyTextToClipboard = (text: string, notificationService) => {
    try {
        navigator.clipboard.writeText(text);

        notificationService.add({
            color: 'success',
            message: 'Succesfully copied to clipboard',
        });
    } catch (e) {
        notificationService.add({
            color: 'error',
            message: e.message,
        });
    }
};
