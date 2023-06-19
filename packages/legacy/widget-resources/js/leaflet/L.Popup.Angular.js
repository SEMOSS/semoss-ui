 'use strict';

 L.Popup.Angular = L.Popup.extend({
     onAdd: function(map) {

         L.DivOverlay.prototype.onAdd.call(this, map);
         var that = this;

         angular.element(document).ready(function() {
             that._compile();

             clearTimeout(that._removeTimeout);
             that.getPane().appendChild(that._container);
             that.update();

             if (map._fadeAnimated) {
                 L.DomUtil.setOpacity(that._container, 1);
             }

             map.fire('popupopen', {
                 popup: that
             });

             if (that._source) {
                 that._source.fire('popupopen', {
                     popup: that
                 }, true);
                 if (!(that._source instanceof L.Path)) {
                     that._source.on('preclick', L.DomEvent.stopPropagation);
                 }
             }
         });
     },
     _compile: function() {
         var that = this;
         var $injector = angular.element(document).injector();

         if (!$injector) {
             $injector = angular.element(document.querySelectorAll('[ng-app]')).injector();
         }

         if (!$injector) {
             throw "L.Popup.Angular can't find your Angular app";
         }

         var $rootScope = $injector.get('$rootScope'),
             $compile = $injector.get('$compile'),
             $controller = $injector.get('$controller');

         this._scope = $rootScope.$new(true);
         this._element = angular.element(this._contentNode);
         this._element.html(this.options.template);

         this._$content = {
             _callbacks: [],
             on: function(callback) {
                 that._$content._callbacks.push(callback);
             }
         };

         if (this.options.controller) {
             var controller = $controller(this.options.controller, {
                 '$scope': this._scope,
                 '$map': this._map,
                 '$options': this.options,
                 '$content': this._$content
             });

             if (this.options.controllerAs) {
                 this._scope[this.options.controllerAs] = controller;
             }

             this._element.data('$ngControllerController', controller);
             this._element.children().data('$ngControllerController', controller);
         }

         $compile(this._element)(this._scope);
         this._scope.$apply();
     },
     update: function() {
         if (!this._map) {
             return;
         }

         var that = this;

         this._container.style.visibility = 'hidden';

         if (this._scope) {
             this._$content._callbacks.map(function(callback) {
                 callback(that._content);
             });

             if (this.options.controllerAs) {
                 this._scope[this.options.controllerAs].$content = this._content;
             } else {
                 this._scope.$content = this._content;
             }

             this._scope.$apply();
             this._scope.$evalAsync(function() {
                 that.fire('contentupdate');
                 that._updateLayout();
                 that._updatePosition();

                 that._container.style.visibility = '';

                 that._adjustPan();
             });
         }
     },
     onRemove: function(map) {
         if (this._scope) {
             this._scope.$destroy();
         }
         if (this._$content) {
             this._$content._callbacks = [];
         }

         L.Popup.prototype.onRemove.call(this, map);
     }
 });

 L.popup.angular = function(options) {
     return new L.Popup.Angular(options);
 };