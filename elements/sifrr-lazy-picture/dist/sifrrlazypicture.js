/*! SifrrLazyPicture v0.0.4 - sifrr project | MIT licensed | https://github.com/sifrr/sifrr-elements */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@sifrr/dom')) :
  typeof define === 'function' && define.amd ? define(['@sifrr/dom'], factory) :
  (global = global || self, global.SifrrLazyPicture = factory(global.Sifrr.Dom));
}(this, function (SifrrDom) { 'use strict';

  SifrrDom = SifrrDom && SifrrDom.hasOwnProperty('default') ? SifrrDom['default'] : SifrrDom;

  function moveAttr(el, attr) {
    if (!el.dataset[attr]) return;
    el.setAttribute(attr, el.dataset[attr]);
    el.removeAttribute("data-".concat(attr));
  }
  function loadPicture(pic) {
    SifrrLazyPicture.observer.unobserve(pic);
    pic.$$('source', false).forEach(s => {
      moveAttr(s, 'srcset');
    });
    const img = pic.$('img', false);
    moveAttr(img, 'src');
    moveAttr(img, 'srcset');
    return true;
  }
  class SifrrLazyPicture extends Sifrr.Dom.Element.extends(HTMLPictureElement) {
    static useShadowRoot() {
      return true;
    }
    static get observer() {
      this._observer = this._observer || new IntersectionObserver(this.onVisible, {
        rootMargin: this.rootMargin
      });
      return this._observer;
    }
    static onVisible(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadPicture(entry.target);
          this.unobserve(entry.target);
        }
      });
    }
    onConnect() {
      this.reload();
    }
    reload() {
      this.constructor.observer.observe(this);
    }
    onDisconnect() {
      this.constructor.observer.unobserve(this);
    }
  }
  SifrrLazyPicture.rootMargin = '0px 0px 200px 0px';
  SifrrDom.register(SifrrLazyPicture, {
    extends: 'picture'
  });

  return SifrrLazyPicture;

}));
/*! (c) @aadityataparia */
//# sourceMappingURL=sifrrlazypicture.js.map
