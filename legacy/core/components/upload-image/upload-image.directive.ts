import angular from 'angular';

import './upload-image.scss';

export default angular
    .module('app.upload-image.directive', [])
    .directive('uploadImage', uploadImageDirective);

uploadImageDirective.$inject = [];

interface FileLikeBlob extends Blob {
    name: string;
    lastModified: Date;
    lastModifiedDate: number;
}

function uploadImageDirective() {
    return {
        restrict: 'E',
        scope: {},
        controller: uploadImageCtrl,
        controllerAs: 'uploadImage',
        bindToController: {
            image: '=',
        },
        template: require('./upload-image.directive.html'),
        link: uploadImageLink,
        replace: true,
    };

    function uploadImageCtrl() {}

    function uploadImageLink(scope) {
        scope.uploadImage.images = {
            options: [],
        };

        scope.uploadImage.imageDeleted = false;
        scope.uploadImage.showUploadOverlay = false;
        scope.uploadImage.file = null;
        scope.uploadImage.originalUrl = null;

        scope.uploadImage.addImage = addImage;
        scope.uploadImage.removeFile = removeFile;
        scope.uploadImage.removeImage = removeImage;
        scope.uploadImage.save = save;
        scope.uploadImage.selectImage = selectImage;
        scope.uploadImage.setFile = setFile;
        scope.uploadImage.closeImageUpload = closeImageUpload;

        /**
         * Make a blob look more file like
         *
         * @param {Blob} blob
         * @return {Blob}
         */
        function createFileLikeBlob(blob): FileLikeBlob {
            blob.name = scope.uploadImage.file.name;
            blob.lastModified = Date.now();
            blob.lastModifiedDate = new Date();

            return blob;
        }

        /**
         * Adds cropped image to the UI
         *
         * @param {HTMLCanvasElement} image
         */
        function addImage(image: HTMLCanvasElement): void {
            image.toBlob((blob) => {
                setOption(0, {
                    url: URL.createObjectURL(blob),
                    file: createFileLikeBlob(blob),
                });

                scope.uploadImage.allowDelete = true;
                scope.uploadImage.imageDeleted = false;

                selectImage(scope.uploadImage.images.options[0]);

                removeFile();
            }, scope.uploadImage.file.type);
        }

        /**
         * Remove current uploaded file
         */
        function removeFile(): void {
            scope.uploadImage.file = null;
        }

        /**
         * Remove an uploaded image
         *
         * @param {number} i image index
         */
        function removeImage(): void {
            setOption(0, {
                url: scope.uploadImage.originalUrl,
            });

            selectImage(scope.uploadImage.images.options[0]);

            scope.uploadImage.allowDelete = false;
            scope.uploadImage.imageDeleted = true;
        }

        /**
         * Set image on workspace-save to selected image
         */
        function save(): void {
            scope.uploadImage.image.url = scope.uploadImage.images.selected.url;
            scope.uploadImage.image.file =
                scope.uploadImage.images.selected.file;

            if (scope.uploadImage.imageDeleted) {
                scope.uploadImage.image['deleted'] = true; // add deleted boolean for the check when saving in parent controller
            }

            scope.uploadImage.closeImageUpload();
        }

        /**
         * Set reference to currently uploaded file
         *
         * @param {File} file
         */
        function setFile(file: File): void {
            scope.uploadImage.file = file;
        }

        /**
         * Set option at specified options' index
         *
         * @param {number} index
         * @param {*} option
         */
        function setOption(index: number, option: any): void {
            scope.uploadImage.images.options[index] = option;
        }

        /**
         * Set selected image object
         *
         * @param {*} image
         */
        function selectImage(image): void {
            scope.uploadImage.images.selected = image;
        }

        /**
         * @name closeImageUpload
         * @desc check if the databasename is valid
         * @returns {void}
         */
        function closeImageUpload(): void {
            scope.uploadImage.showUploadOverlay = false;
        }

        /**
         * Initialize directive
         */
        function initialize(): void {
            scope.$watch('uploadImage.image.url', function () {
                // wait until image url has been initialized
                if (!scope.uploadImage.originalUrl) {
                    scope.uploadImage.originalUrl = scope.uploadImage.image.url;
                    // check to see if there's an image to delete

                    scope.uploadImage.allowDelete =
                        scope.uploadImage.image.url.indexOf('blob:') > -1; // 1. if url contains 'blob:'
                    // || (scope.uploadImage.image.url.indexOf('download?rdbmsId=') > -1); // 2. if url contains 'rdbmsId'

                    // set the option
                    const option: any = {
                        url: scope.uploadImage.image.url,
                    };

                    setOption(0, option);
                    selectImage(scope.uploadImage.images.options[0]);
                }
            });
        }

        initialize();
    }
}
