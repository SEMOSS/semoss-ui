import Logo from '@/assets/logo.svg';

export const ENDPOINT = process.env.ENDPOINT;
export const MODULE = process.env.MODULE;
export const THEME_TITLE = process.env.THEME_TITLE;

export const THEME = {
    name: THEME_TITLE || 'SEMOSS',
    logo: Logo,
};
