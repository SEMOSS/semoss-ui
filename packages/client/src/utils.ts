/**
 * @name formatName
 * @param name
 * @returns formatted name
 */
export const formatName = (name: string) => {
    let i;
    const frags = name.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};
