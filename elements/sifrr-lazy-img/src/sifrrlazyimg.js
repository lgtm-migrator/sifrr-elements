import SifrrDom from '@sifrr/dom';

function moveAttr(el, attr) {
  if (!el.dataset[attr]) return;
  el.setAttribute(attr, el.dataset[attr]);
  el.removeAttribute(`data-${attr}`);
}

function loadPicture(img) {
  SifrrLazyImg.observer.unobserve(img);
  moveAttr(img, 'src');
  return true;
}

//Sifrr Lazy Loading Picture
class SifrrLazyImg extends Sifrr.Dom.Element.extends(HTMLImageElement) {
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

SifrrLazyImg.rootMargin = '0px 0px 200px 0px';

SifrrDom.register(SifrrLazyImg, { extends: 'img' });

export default SifrrLazyImg;
