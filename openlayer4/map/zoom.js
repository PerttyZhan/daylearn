import ol from './ol'
var Zoom = function (opts) {
  if (opts) {
      this.map = opts.map || undefined;
  }
}
Zoom.prototype.init = function () {
  if (this.map && this.map instanceof ol.Map) {
      var view = this.map.getView();
      if (view) {
          this.maxZoom = view.getMaxZoom() || 17;
          this.minZoom = view.getMinZoom() || 0;
      }
  }
}
Zoom.prototype.zoomOut= function() {
  if (this.map && this.map instanceof ol.Map) {
      const zoom = this.map.getView().getZoom();
      if (zoom < this.maxZoom) {
          this.map.getView().setZoom(zoom + 1);
      }
  }
},
Zoom.prototype.zoomIn= function() {
  if (this.map && this.map instanceof ol.Map) {
      var zoom = this.map.getView().getZoom();
      if (zoom > this.minZoom) {
          this.map.getView().setZoom(zoom - 1);
      }
  }
},
Zoom.prototype.disableZoomControl= function() {
  if (this.map && this.map instanceof ol.Map) {
      const controls = this.map.getControls();
      for (var i = 0; i < controls.length; i++) {
          var control = controls[i];
          if (control instanceof ol.control.Zoom) {
              this.map.removeControl(control);
          }
      }
  }
}
export default Zoom