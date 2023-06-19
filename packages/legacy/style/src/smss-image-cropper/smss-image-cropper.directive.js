import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

import './smss-image-cropper.scss';

export default angular
    .module('smss-style.image-cropper', [])
    .directive('smssImageCropper', smssImageCropper);

function smssImageCropper() {
    smssImageCropperLink.$inject = ['scope', 'el', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./smss-image-cropper.directive.html'),
        replace: true,
        scope: {
            file: '<',
            onCrop: '&',
            onDiscard: '&',
        },
        link: smssImageCropperLink,
        controller: smssImageCropperCtrl,
        controllerAs: 'smssImageCropper',
    };

    function smssImageCropperCtrl() {}

    function smssImageCropperLink(scope, el) {
        let cropper, img, preview;

        scope.smssImageCropper.crop = crop;
        scope.smssImageCropper.discard = discard;

        initialize();

        /**
         * Adds image cropper to view
         */
        function addImage(file) {
            img = createImage(file);

            preview.append(img);

            cropper = new Cropper(img, {
                aspectRatio: 1,
                guides: false,
            });
        }

        /**
         * Create img element for file
         *
         * @param {File|Blob} file
         * @returns {HTMLImageElement}
         */
        function createImage(file) {
            const img = document.createElement('img');

            img.src = URL.createObjectURL(file);
            img.alt = file.name;

            return img;
        }

        /**
         * Get cropped area and emit it as a canvas element
         */
        function crop() {
            const image = cropper.getCroppedCanvas({
                width: 128,
                height: 128,
            });

            scope.onCrop({ image });
        }

        /**
         * Remove cropper and image from UI
         */
        function discard() {
            cropper.destroy();

            preview.removeChild(img);

            scope.onDiscard();
        }

        /** Initialize */

        function initialize() {
            preview = el[0].querySelector('.smss-image-cropper__preview');

            scope.$watch('file', function (file) {
                if (cropper) {
                    cropper.destroy();

                    preview.removeChild(img);
                }

                addImage(file);
            });
        }
    }
}
