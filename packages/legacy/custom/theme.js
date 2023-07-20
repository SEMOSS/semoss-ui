// TODO: Convert to TS module
// CUSTOMIZATION is a Partial of the THEME
// import THEME from '../core/services/settings/Theme';

// interface CUSTOMIZATION {
//     theme: Partial<THEME['theme']>;
// }
// export const CUSTOMIZATION = {
//     theme: {
//         name: 'SEMOSS',
//     },
// };

module.exports = {
    CUSTOMIZATION: {
        theme: {},
        page: {
            title: 'SEMOSS',
            favicon: './core/resources/img/favicon.png',
        },
    },
};
