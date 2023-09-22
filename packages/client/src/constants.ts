import Logo from '@/assets/logo.svg';

export const THEME_TITLE = process.env.THEME_TITLE;

export const THEME = {
    name: THEME_TITLE || 'SEMOSS',
    logo: Logo,
};
