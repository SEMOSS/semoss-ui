import angular from 'angular';

import './change-image.scss';

export default angular
    .module('app.change-image.directive', [])
    .directive('changeImage', changeImageDirective);

changeImageDirective.$inject = [
    '$location',
    'monolithService',
    'semossCoreService',
];

interface FileLikeBlob extends Blob {
    name: string;
    lastModified: Date;
    lastModifiedDate: number;
}

function changeImageDirective($location, monolithService, semossCoreService) {
    return {
        restrict: 'E',
        require: ['^workspaceSave'],
        scope: {},
        controller: changeImageCtrl,
        controllerAs: 'changeImage',
        bindToController: {},
        template: require('./change-image.directive.html'),
        link: changeImageLink,
        replace: true,
    };

    function changeImageCtrl() {}

    function changeImageLink(scope, el, attrs, ctrl) {
        scope.workspaceSaveCtrl = ctrl[0];

        scope.changeImage.appId = scope.workspaceSaveCtrl.question.app.value;
        scope.changeImage.insightId =
            scope.workspaceSaveCtrl.insightCtrl.insightID;

        scope.changeImage.exist = {
            appId: scope.workspaceSaveCtrl.name.appId,
            insightId: scope.workspaceSaveCtrl.name.insightId,
        };

        scope.changeImage.images = {
            options: [],
        };

        scope.changeImage.imageDeleted = false;
        scope.changeImage.file = null;
        // check to see if there's an image to delete
        scope.changeImage.allowDelete =
            scope.workspaceSaveCtrl.question.image.url.indexOf('blob:') > -1 || // 1. if url contains 'blob:'
            scope.workspaceSaveCtrl.question.image.url.indexOf(
                'download?rdbmsId='
            ) > -1; // 2. if url contains 'rdbmsId'

        scope.changeImage.addImage = addImage;
        scope.changeImage.hide = hide;
        scope.changeImage.removeFile = removeFile;
        scope.changeImage.removeImage = removeImage;
        scope.changeImage.save = save;
        scope.changeImage.selectImage = selectImage;
        scope.changeImage.setFile = setFile;

        /**
         * Make a blob look more file like
         *
         * @param {Blob} blob
         * @return {Blob}
         */
        function createFileLikeBlob(blob): FileLikeBlob {
            blob.name = scope.changeImage.file.name;
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

                scope.changeImage.allowDelete = true;
                scope.changeImage.imageDeleted = false;

                selectImage(scope.changeImage.images.options[0]);

                removeFile();
            }, scope.changeImage.file.type);
        }

        /**
         * Hide change image modal
         */
        function hide(): void {
            scope.workspaceSaveCtrl.show.changeImage = false;
        }

        /**
         * Remove current uploaded file
         */
        function removeFile(): void {
            scope.changeImage.file = null;
        }

        /**
         * Remove an uploaded image
         *
         * @param {number} i image index
         */
        function removeImage(): void {
            setOption(0, {
                url: semossCoreService.app.generateInsightImageURL(
                    scope.changeImage.appId
                ),
            });

            selectImage(scope.changeImage.images.options[0]);

            scope.changeImage.allowDelete = false;
            scope.changeImage.imageDeleted = true;
        }

        /**
         * Set image on workspace-save to selected image
         */
        function save(): void {
            scope.workspaceSaveCtrl.question.image =
                scope.changeImage.images.selected;

            if (scope.changeImage.imageDeleted) {
                scope.workspaceSaveCtrl.deleteImage = true;
            }

            hide();
        }

        /**
         * Set reference to currently uploaded file
         *
         * @param {File} file
         */
        function setFile(file: File): void {
            scope.changeImage.file = file;
        }

        /**
         * Set option at specified options' index
         *
         * @param {number} index
         * @param {*} option
         */
        function setOption(index: number, option: any): void {
            scope.changeImage.images.options[index] = option;
        }

        /**
         * Set selected image object
         *
         * @param {*} image
         */
        function selectImage(image): void {
            scope.changeImage.images.selected = image;
        }

        /**
         * Initialize directive
         */
        function initialize(): void {
            const option: any = {
                url: scope.workspaceSaveCtrl.question.image.url,
            };

            // if (scope.changeImage.exist.appId && scope.changeImage.exist.insightId) {
            //     option.url = semossCoreService.app.generateInsightImageURL(scope.changeImage.exist.appId, scope.changeImage.exist.insightId);
            // } else {
            //     option.url = semossCoreService.app.generateInsightImageURL(scope.changeImage.appId);
            // }

            setOption(0, option);

            selectImage(scope.changeImage.images.options[0]);
        }

        initialize();
    }
}
