import SifrrDom from '@sifrr/dom';
import style from './style.scss';
import html from './template.html';
import '../../sifrr-code-editor/src/sifrrcodeeditor';

const template = SifrrDom.template`<style media="screen">
  ${style}
</style>
<style>
\${this.state.style}
</style>
${html}`;

SifrrDom.Event.add('click');

const defaultShowcase = {
  id: 1,
  name: 'Placeholder Element',
  element: 'sifrr-placeholder',
  elementUrl: '',
  isjs: true,
  variantName: '',
  variants: [
    {
      variantId: 1,
      variantName: 'variant',
      style: `#element > * {
  display: block;
  background-color: white;
  margin: auto;
}`,
      code: '<sifrr-placeholder>\n</sifrr-placeholder>',
      elState: 'return {\n\n}'
    }
  ]
};

class SifrrSingleShowcase extends SifrrDom.Element {
  static get template() {
    return template;
  }

  static observedAttrs() {
    return ['url'];
  }

  onConnect() {
    this.switchVariant();
    SifrrDom.Event.addListener('click', '.variant', (e, el) => {
      if (el.matches('.variant')) this.switchVariant(el.dataset.variantId);
      if (el.matches('.variant span')) this.deleteVariant(el.parentNode.dataset.variantId);
    });
  }

  beforeUpdate() {
    this.saveVariant();
    if (!this.state.elemnt) return;
    if (this._element !== this.state.element || this._js !== this.state.isjs || this._url !== this.state.elementUrl) {
      SifrrDom.load(this.state.element, {
        js: this.state.isjs == 'true',
        url: this.state.elementUrl ? this.state.elementUrl : undefined
      }).then(() => this.$('#error').innerText = '').catch(e => this.$('#error').innerText = e.message);
      this._js = this.state.isjs;
      this._element = this.state.element;
      this._url = this.state.elementUrl;
    }
  }

  onUpdate() {
    let state;
    try {
      state = new Function(this.$('#elState').value).call(this.element());
    } catch (e) { window.console.warn(e); }
    if (state && this.element() && this.element().isSifrr && this.element().state !== state) {
      this.element().state = state;
    }
  }

  onAttributeChange(name, _, value) {
    if (name === 'url') this.url = value;
  }

  createNewVariant() {
    const id = Math.max(...this.state.variants.map(s => s.variantId), 0) + 1;
    const cid = this.state.variants.findIndex(v => v.variantId == this.state.variantId) + 1 || 1;
    this.state.variants.splice(cid, 0, Object.assign({}, {
      variantId: id,
      variantName: this.state.variantName,
      style: this.state.style || '',
      code: this.state.code || '',
      elState: this.state.elState || ''
    }));
    this.switchVariant(id);
  }

  deleteVariant(id) {
    this.state.variants.forEach((s, i) => {
      if (s.variantId == id) {
        this.state.variants.splice(i, 1);
        if (this.state.variantId == id) this.switchVariant((this.state.variants[i] || {}).variantId);
        else this.update();
      }
    });
  }

  saveVariant() {
    if (!this.state.variants) this.state.variants = [];
    const id = this.state.variantId;
    this.state.variants.forEach(s => {
      if (s.variantId == id) {
        Object.assign(s, {
          variantName: this.state.variantName,
          style: this.state.style,
          code: this.state.code,
          elState: this.state.elState
        });
      }
    });
  }

  switchVariant(id) {
    Object.assign(this.state, this.variant(id));
    this.update();
  }

  updateHtml(e, el) {
    const html = `<${el.value}></${el.value}>`;
    this.state = { code: html, element: el.value };
  }

  element() {
    return this.$('#element').firstElementChild;
  }

  variant(id) {
    return this.state.variants.find(s => s.variantId == id) || this.state.variants[this.state.variants.length - 1];
  }
}

SifrrSingleShowcase.defaultState = defaultShowcase;

SifrrDom.register(SifrrSingleShowcase);

export default SifrrSingleShowcase;
