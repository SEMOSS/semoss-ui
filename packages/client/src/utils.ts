import { Role } from '@/types';
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

export function formatPermission(permission: Role | ''): string {
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
}
