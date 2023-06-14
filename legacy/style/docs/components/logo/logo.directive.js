export default angular
    .module('docs.logo', [])
    .directive('logoSection', logoDirective);
import './logo.scss';

function logoDirective() {
    logoLink.$inject = ['scope'];
    return {
        restrict: 'E',
        template: require('./logo.directive.html'),
        link: logoLink,
    };
    function logoLink(scope) {
        scope.logos = [
            {
                title: 'Dark Logo Full',
                desc: 'This is the primary logo. Use this logo on light backgrounds.',
                image: 'docs/resources/logos/semoss_logo_dark.svg',
                download: [
                    {
                        type: 'png',
                        link: 'docs/resources/logos/semoss_logo_dark.png',
                    },
                    {
                        type: 'svg',
                        link: 'docs/resources/logos/semoss_logo_dark.svg',
                    },
                ],
            },
            {
                title: 'Light Logo Full',
                desc: 'This is the primary logo. Use this logo on dark backgrounds.',
                image: 'docs/resources/logos/semoss_logo_light.svg',
                download: [
                    {
                        type: 'png',
                        link: 'docs/resources/logos/semoss_logo_light.png',
                    },
                    {
                        type: 'svg',
                        link: 'docs/resources/logos/semoss_logo_light.svg',
                    },
                ],
            },
            {
                title: 'Teal Logo Icon',
                desc: 'This is the secondary logo, and it should be used on light backgrounds. You should only use this if you are limited on space or when the SEMOSS brand has already been established.',
                image: 'docs/resources/logos/semoss_mark_teal.svg',
                download: [
                    {
                        type: 'png',
                        link: 'docs/resources/logos/semoss_mark_teal.png',
                    },
                    {
                        type: 'svg',
                        link: 'docs/resources/logos/semoss_mark_teal.svg',
                    },
                ],
            },
            {
                title: 'White Logo Icon',
                desc: 'This is the secondary logo, and it should be used on dark backgrounds. You should only use this if you are limited on space or when the SEMOSS brand has already been established.',
                image: 'docs/resources/logos/semoss_mark_white.svg',
                download: [
                    {
                        type: 'png',
                        link: 'docs/resources/logos/semoss_mark_white.png',
                    },
                    {
                        type: 'svg',
                        link: 'docs/resources/logos/semoss_mark_white.svg',
                    },
                ],
            },
        ];
    }
}
