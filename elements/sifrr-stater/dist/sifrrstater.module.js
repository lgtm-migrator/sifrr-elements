/*! SifrrStater v0.0.4 - sifrr project | MIT licensed | https://github.com/sifrr/sifrr-elements */
import SifrrDom from '@sifrr/dom';
import SifrrStorage from '@sifrr/storage';

var css = ":host {\n  /* CSS for tabs container */\n  line-height: 24px;\n  overflow: hidden;\n  width: 100%;\n  display: block;\n  position: relative; }\n\n.headings {\n  /* CSS for heading bar */\n  width: 100%;\n  overflow-y: hidden;\n  overflow-x: auto;\n  position: relative;\n  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2); }\n\n.headings ul {\n  padding: 0 0 3px;\n  margin: 0;\n  font-size: 0; }\n\n/* CSS for heading text li */\n.headings *::slotted(*) {\n  font-size: 16px;\n  display: inline-block;\n  text-align: center;\n  padding: 8px;\n  text-decoration: none;\n  list-style: none;\n  color: white;\n  border-bottom: 2px solid transparent;\n  opacity: 0.9;\n  cursor: pointer;\n  box-sizing: border-box; }\n\n.headings *::slotted(*.active) {\n  opacity: 1; }\n\n.headings *::slotted(*:hover) {\n  opacity: 1; }\n\n/* CSS for line under active tab heading */\n.headings .underline {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  height: 3px;\n  background: white; }\n\n/* Arrows css */\n.arrow {\n  position: absolute;\n  z-index: 5;\n  top: 0;\n  bottom: 0; }\n\n.arrow > * {\n  position: absolute;\n  width: 8px;\n  height: 8px;\n  margin: -6px 5px;\n  top: 50%;\n  border: solid white;\n  border-width: 0 3px 3px 0;\n  display: inline-block;\n  padding: 3px;\n  filter: drop-shadow(-1px -1px 3px #000); }\n\n.arrow.l {\n  left: 0;\n  cursor: w-resize; }\n\n.arrow.l > * {\n  left: 0;\n  transform: rotate(135deg); }\n\n.arrow.r {\n  right: 0;\n  cursor: e-resize; }\n\n.arrow.r > * {\n  right: 0;\n  transform: rotate(-45deg); }\n\n/* Tab container css */\n.content {\n  width: 100%;\n  height: 100%;\n  overflow-x: auto;\n  overflow-y: hidden;\n  margin: 0;\n  line-height: normal;\n  box-sizing: border-box; }\n\n.content .tabs {\n  min-height: 1px; }\n\n/* Tab element css */\n.content *::slotted([slot=\"tab\"]) {\n  float: left;\n  max-height: 100%;\n  height: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  vertical-align: top;\n  padding: 8px;\n  box-sizing: border-box; }\n";

const types = {
    linear: [0, 0, 1, 1],
    ease: [.25, .1, .25, 1],
    easeIn: [.42, 0, 1, 1],
    easeOut: [0, 0, .58, 1],
    easeInOut: [.42, 0, .58, 1]
  },
  beziers = {},
  digitRgx = /(\d+)/;
class Bezier {
  constructor(args){
    const key = args.join('_');
    if (!beziers[key]) {
      this.setProps(...args);
      beziers[key] = this.final.bind(this);
    }
    return beziers[key];
  }
  setProps(x1, y1, x2, y2) {
    let props = {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      A: (aA1, aA2) => 1.0 - 3.0 * aA2 + 3.0 * aA1,
      B: (aA1, aA2) => 3.0 * aA2 - 6.0 * aA1,
      C: (aA1) => 3.0 * aA1,
      CalcBezier: (aT, aA1, aA2) => ((this.A(aA1, aA2)*aT + this.B(aA1, aA2))*aT + this.C(aA1))*aT,
      GetSlope: (aT, aA1, aA2) => 3.0 * this.A(aA1, aA2)*aT*aT + 2.0 * this.B(aA1, aA2) * aT + this.C(aA1)
    };
    Object.assign(this, props);
  }
  final(x) {
    if (this.x1 == this.y1 && this.x2 == this.y2) return x;
    return this.CalcBezier(this.GetTForX(x), this.y1, this.y2);
  }
  GetTForX(xx) {
    let t = xx;
    for (let i = 0; i < 4; ++i) {
      let slope = this.GetSlope(t, this.x1, this.x2);
      if (slope == 0.0) return t;
      let x = this.CalcBezier(t, this.x1, this.x2) - xx;
      t -= x / slope;
    }
    return t;
  }
}
function animateOne({
  target,
  prop,
  from,
  to,
  time = 300,
  type = 'ease',
  onUpdate,
  round = false
} = {}) {
  const toSplit = to.toString().split(digitRgx), l = toSplit.length, raw = [], fromNums = [], diffs = [];
  const fromSplit = (from || target[prop] || '').toString().split(digitRgx);
  const onUp = typeof onUpdate === 'function';
  for (let i = 0; i < l; i++) {
    const n = Number(toSplit[i]);
    if (isNaN(n) || !toSplit[i]) raw.push(toSplit[i]);
    else {
      fromNums.push(Number(fromSplit[i]));
      diffs.push(n - (Number(fromSplit[i]) || 0));
    }
  }
  type = typeof type === 'function' ? type : new Bezier(types[type] || type);
  return new Promise(res => {
    let startTime;
    function frame(currentTime) {
      startTime = startTime || currentTime;
      const percent = (currentTime - startTime) / time, bper = type(percent);
      if (percent >= 1) {
        target[prop] = to;
        return res();
      }
      const next = diffs.map((d, i) => {
        if (round) return Math.round(bper * d + (fromNums[i] || 0));
        return bper * d + (fromNums[i] || 0);
      });
      const val = String.raw({ raw }, ...next);
      target[prop] = Number(val) || val;
      if (onUp) onUpdate(target, prop, val);
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  });
}
function animate({
  targets,
  target,
  to,
  time,
  type,
  onUpdate,
  round
} = {}) {
  targets = targets ? Array.from(targets) : [target];
  function iterate(target, props) {
    const promises = [];
    for (let prop in props) {
      let from, final;
      if (Array.isArray(props[prop])) [from, final] = props[prop];
      else final = props[prop];
      if (typeof props[prop] === 'object' && !Array.isArray(props[prop])) {
        promises.push(iterate(target[prop], props[prop]));
      } else {
        promises.push(animateOne({
          target,
          prop,
          to: final,
          time,
          type,
          from,
          onUpdate,
          round
        }));
      }
    }
    return Promise.all(promises);
  }
  return Promise.all(targets.map(target => iterate(target, to)));
}
animate.types = types;
function wait(time = 0) {
  return new Promise(res => setTimeout(res, time));
}
const Sifrr = window.Sifrr || ( window.Sifrr = {} );
Sifrr.animate = animate;
Sifrr.wait = wait;

const template = SifrrDom.template`<style media="screen">
  ${css}
</style>
<style>
  .tabs {
    height: \${this.options ? this.options.tabHeight : 'auto'};
    width: \${this.totalWidth + 'px'};
  }
  .headings {
    display: \${this.headingDisplay};
    background: \${this.options ? this.options.background : 'transparent'};
  }
  .content *::slotted([slot="tab"]) {
    width: \${this.tabWidth + 'px'};
    margin: 0 \${this.options ? this.options.arrowMargin + 'px' : 0};
  }
  .arrow {
    width: \${this.options ? this.options.arrowWidth : '20px'};
  }
</style>
<div class="headings">
  <ul>
    <slot name="heading">
    </slot>
  </ul>
  <div class="underline"></div>
</div>
<div class="content">
  <div class="arrow l" _click=\${this.prev}>
    <span></span>
  </div>
  <div class="arrow r" _click=\${this.next}>
    <span></span>
  </div>
  <div class="tabs">
    <slot name="tab">
    </slot>
  </div>
</div>`;
function removeExceptOne(elements, name, index) {
  if (elements instanceof HTMLElement) elements = elements.children;
  for (let j = 0; j < elements.length; j++) {
    j !== index && elements[j] !== index ? elements[j].classList.remove(name) : elements[j].classList.add(name);
  }
}
class SifrrTabs extends SifrrDom.Element {
  static get template() {
    return template;
  }
  static observedAttrs() {
    return ['options'];
  }
  onConnect() {
    this._connected = true;
    this.refresh();
    this.setWindowResizeEvent();
    this.setSlotChangeEvent();
    this.setScrollEvent();
  }
  onAttributeChange(n, _, v) {
    if (n === 'options') {
      this._attrOptions = JSON.parse(v || '{}');
      if (this._connected) this.refresh();
    }
  }
  refresh() {
    this.options = Object.assign({
      menu: this.$('.headings ul'),
      content: this.$('.content'),
      tabcontainer: this.$('.tabs'),
      menus: this.$('slot[name=heading]').assignedNodes(),
      tabs: this.$('slot[name=tab]').assignedNodes(),
      la: this.$('.arrow.l'),
      ra: this.$('.arrow.r'),
      line: this.$('.underline'),
      num: 1,
      showArrows: false,
      arrowMargin: 0,
      arrowWidth: '20px',
      showMenu: true,
      step: 1,
      tabHeight: 'auto',
      showUnderline: true,
      loop: false,
      animation: 'ease',
      animationTime: 300,
      scrollBreakpoint: 0.2,
      background: '#714cfe'
    }, this._attrOptions);
    if (!this.options.tabs || this.options.tabs.length < 1) return;
    this.usableWidth = this.clientWidth;
    this.totalWidth = this.usableWidth / this.options.num * this.options.tabs.length;
    this.usableWidth -= 2 * this.options.arrowMargin;
    this.tabWidth = this.usableWidth / this.options.num;
    this.setProps();
    this.update();
    this.active = this.active || 0;
  }
  setProps() {
    if (!this.options.showArrows) {
      this.options.la.style.display = 'none';
      this.options.ra.style.display = 'none';
    } else {
      this.options.la.style.display = 'block';
      this.options.ra.style.display = 'block';
      Array.from(this.options.tabs).forEach(e => e.style.margin = `0 ${this.margin}px`);
    }
    if (!this.options.showUnderline) this.options.line.style.display = 'none';
    if (this.options.showMenu) {
      this.headingDisplay = 'block';
      this.options.line.style.width = this.options.menus[0].offsetWidth + 'px';
      this.setMenuProps();
    } else this.headingDisplay = 'none';
  }
  setMenuProps() {
    let left = 0;
    this.options.menuProps = [];
    Array.from(this.options.menus).forEach((elem, i) => {
      this.options.menuProps[i] = {
        width: elem.offsetWidth,
        left: left
      };
      left += elem.offsetWidth;
      elem._click = () => this.active = i;
    });
    const last = this.options.menuProps[this.options.menus.length - 1];
    this.options.menu.style.width = last.left + last.width + 5 * this.options.menus.length + 'px';
    const active = this.options.menuProps[this.active];
    this.options.line.style.left = active.left + 'px';
    this.options.line.style.width = active.width + 'px';
  }
  setScrollEvent() {
    let me = this,
      isScrolling,
      scrollPos;
    this.options.content.onscroll = () => requestAnimationFrame(onScroll);
    function onScroll() {
      scrollPos = me.active;
      const total = me.options.content.scrollLeft / me.tabWidth;
      const per = total % 1;
      const t = Math.floor(total);
      if (me.options.showMenu) {
        const left = me.options.menuProps[t].left * (1 - per) + (me.options.menuProps[t + 1] || {
          left: 0
        }).left * per;
        const width = me.options.menuProps[t].width * (1 - per) + (me.options.menuProps[t + 1] || {
          width: 0
        }).width * per;
        me.options.line.style.left = left + 'px';
        me.options.line.style.width = width + 'px';
        me.options.menu.parentElement.scrollLeft = left + (width - me.tabWidth) / 2;
      }
      clearTimeout(isScrolling);
      isScrolling = setTimeout(function() {
        if (total - scrollPos < -me.options.scrollBreakpoint) {
          me.active = t;
        } else if (total - scrollPos > +me.options.scrollBreakpoint) {
          me.active = t + 1;
        } else {
          me.active = scrollPos;
        }
      }, 66);
    }
  }
  setWindowResizeEvent() {
    window.addEventListener('resize', () => requestAnimationFrame(this.refresh.bind(this)));
  }
  setSlotChangeEvent() {
    const me = this;
    const fxn = () => {
      me.options.menus = me.$$('slot')[0].assignedNodes();
      me.options.tabs = me.$$('slot')[1].assignedNodes();
      me.refresh();
    };
    this.$$('slot')[0].addEventListener('slotchange', fxn);
    this.$$('slot')[1].addEventListener('slotchange', fxn);
  }
  get active() {
    return this.state ? this.state.active : 0;
  }
  set active(i) {
    this.state = {
      active: i
    };
  }
  beforeUpdate() {
    if (!this.options) return;
    let i = this.state.active;
    i = this.getTabNumber(i);
    if (!isNaN(i) && i !== this.state.active) return this.active = i;
    animate({
      target: this.options.content,
      to: {
        scrollLeft: i * (this.tabWidth + 2 * this.options.arrowMargin)
      },
      time: this.options.animationTime,
      type: this.options.animation === 'none' ? () => 1 : this.options.animation
    });
    removeExceptOne(this.options.tabs, 'active', i);
    removeExceptOne(this.options.tabs, 'prev', this.getTabNumber(i - 1));
    removeExceptOne(this.options.tabs, 'next', this.getTabNumber(i + 1));
    removeExceptOne(this.options.menus, 'active', i);
    removeExceptOne(this.options.menus, 'prev', this.getTabNumber(i - 1));
    removeExceptOne(this.options.menus, 'next', this.getTabNumber(i + 1));
    if (this.options.showArrows) {
      this.options.la.style.display = this.hasPrev() || this.options.loop ? 'block' : 'none';
      this.options.ra.style.display = this.hasNext() || this.options.loop ? 'block' : 'none';
    }
  }
  next() {
    this.active = this.state.active + this.options.step;
  }
  hasNext() {
    if (this.active === this.options.tabs.length - this.options.num) return false;
    return true;
  }
  prev() {
    this.active = this.state.active - this.options.step;
  }
  hasPrev() {
    if (this.active === 0) return false;
    return true;
  }
  getTabNumber(i) {
    const l = this.options.tabs.length;
    const num = this.options.num;
    i = i < 0 ? i + l : i % l;
    if (i + num - 1 >= l) {
      i = this.options.loop ? 0 : l - num;
    }
    return i;
  }
}
SifrrTabs.defaultState = { active: 0 };
SifrrDom.register(SifrrTabs);

var css$1 = ":host {\n  position: fixed;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  height: 100%;\n  max-width: 100%;\n  width: 320px;\n  z-index: 1000;\n  background-color: rgba(0, 0, 0, 0.8);\n  transform: translate3d(100%, 0, 0);\n  transition: all 0.2s ease; }\n\n:host(.show) {\n  transform: translate3d(0, 0, 0); }\n\n* {\n  box-sizing: border-box; }\n\n#showHide {\n  position: fixed;\n  left: -30px;\n  top: 0;\n  bottom: 0;\n  width: 30px;\n  height: 30px;\n  margin-top: 5px;\n  background-color: blue;\n  z-index: 2; }\n\n.stateContainer {\n  padding-left: 10px;\n  margin-left: 10px;\n  border-left: 1px solid white;\n  position: relative; }\n\n.stateContainer.off {\n  opacity: 0.5; }\n\n.stateContainer .dotC {\n  position: absolute;\n  top: 0;\n  left: -10px;\n  width: 20px;\n  height: 100%;\n  cursor: pointer; }\n\n.stateContainer .dotC .dot {\n  position: absolute;\n  top: 50%;\n  left: 10px;\n  width: 10px;\n  height: 10px;\n  transform: translate3d(-50%, -50%, 0);\n  background-color: white;\n  border-radius: 50%; }\n\n.stateContainer .delete {\n  position: absolute;\n  top: 0;\n  right: 0;\n  padding: 4px;\n  background-color: rgba(0, 0, 0, 0.7);\n  color: white;\n  cursor: pointer; }\n\n.state {\n  white-space: pre-wrap;\n  max-height: 90px;\n  overflow: hidden;\n  background-color: rgba(255, 255, 255, 0.97);\n  padding: 5px;\n  margin-bottom: 5px;\n  position: relative;\n  cursor: pointer; }\n\n.state:hover::after {\n  content: '\\\\\\/';\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  background-color: rgba(0, 0, 0, 0.7);\n  text-align: center;\n  color: white; }\n\n.state.open {\n  max-height: none; }\n\n.state.open:hover::after {\n  content: '\\/\\\\'; }\n\n.key {\n  color: red; }\n\n.string {\n  color: green; }\n\n.number, .null, .boolean {\n  color: blue; }\n\nfooter {\n  position: absolute;\n  bottom: 0; }\n\ninput {\n  margin: 3px;\n  width: calc(100% - 6px);\n  padding: 3px; }\n\n.btn3 {\n  margin: 3px;\n  width: calc(33% - 8px);\n  padding: 3px;\n  background: white; }\n";

const template$1 = SifrrDom.template`<style>
  ${css$1}
</style>
<div id="showHide" _click=\${this.showHide}></div>
<sifrr-tabs options='{"tabHeight": "calc(100vh - 132px)"}' data-sifrr-html="true">
  \${ this.headingHtml() }
  \${ this.stateHtml() }
</sifrr-tabs>
<footer>
  <input _keyup=\${this.addTargetOnEnter} id="addTargetInput" type="text" name="addTargetInput" value="" placeholder="Enter css selector query of target">
  <button _click=\${this.addTarget} class="btn3" type="button" name="addTargetButton">Add Taget</button>
  <button _click=\${this.commitAll} class="btn3" type="button" name="commitAll">Commit All</button>
  <button _click=\${this.resetAllToFirstState} class="btn3" type="button" name="resetAll">Reset All</button>
  <button _click=\${this.saveData} class="btn3" type="button" name="saveData">Save Data</button>
  <button _click=\${this.loadData} class="btn3" type="button" name="loadData">Load Data</button>
  <button _click=\${this.clearAll} class="btn3" type="button" name="clearAll">Remove All</button>
</footer>`;
SifrrDom.Event.add('click');
SifrrDom.Event.add('keyup');
class SifrrStater extends SifrrDom.Element {
  static get template() {
    return template$1;
  }
  onConnect() {
    let me = this;
    this.storage = new SifrrStorage({
      name: 'sifrr-stater' + window.location.href
    });
    SifrrDom.Event.addListener('click', '.state', function(e, el) {
      el.classList.contains('open') ? el.classList.remove('open') : el.classList.add('open');
    });
    SifrrDom.Event.addListener('click', '.dotC', function(e, target, el) {
      me.toState(parseInt(el.dataset.target), parseInt(el.dataset.stateIndex));
    });
    SifrrDom.Event.addListener('click', '.delete', function(e, el) {
      me.deleteState(parseInt(el.dataset.target), parseInt(el.dataset.stateIndex));
    });
    SifrrDom.Event.addListener('click', '.commit', function(e, el) {
      const i = parseInt(el.parentNode.dataset.target);
      me.commit(i);
    });
    SifrrDom.Event.addListener('click', '.reset', function(e, el) {
      const i = parseInt(el.parentNode.dataset.target);
      me.resetToFirstState(i);
    });
    SifrrDom.Event.addListener('click', '.remove', function(e, el) {
      const i = parseInt(el.parentNode.dataset.target);
      me.removeTarget(i);
    });
  }
  showHide() {
    this.classList.contains('show') ? this.classList.remove('show') : this.classList.add('show');
  }
  addTargetOnEnter(event) {
    if (event.key === 'Enter') {
      this.addTarget();
    }
  }
  headingHtml() {
    return this.state.queries.map((q) => `<li slot="heading">${q}</li>`).join('');
  }
  stateHtml() {
    let me = this;
    return this.state.states.map((s, i) =>
      `<div data-target="${i}" slot="tab">
      <button class="btn3 commit" type="button" name="commit">Commit</button>
      <button class="btn3 reset" type="button" name="reset">Reset</button>
      <button class="btn3 remove" type="button" name="remove">Remove</button>
      ${s.map((jsn, j) => `<div class="stateContainer ${j <= me.state.activeStates[i] ? 'on' : 'off'}">
                           <div class="dotC" data-target="${i}" data-state-index="${j}"><div class="dot"></div></div>
                           <div class="state">${SifrrStater.prettyJSON(jsn)}</div>
                           <div class="delete" data-target="${i}" data-state-index="${j}">X</div>
                           </div>`).join('')}</div>`
    ).join('');
  }
  addTarget(query) {
    if (typeof query !== 'string') query = this.$('#addTargetInput').value;
    let target = window.document.querySelector(query);
    if (!target.isSifrr) {
      window.console.log('Invalid Sifrr Element.', target);
      return false;
    }
    if (!target.state) {
      window.console.log('Sifrr Element has no state.', target);
      return false;
    }
    const old = target.onStateChange, me = this;
    target.onStateChange = function() {
      me.addState(this, this.state);
      old.call(this);
    };
    let index = this.state.targets.indexOf(target);
    if (index > -1) return;
    this.state.targets.push(target);
    this.state.queries.push(query);
    index = this.state.targets.indexOf(target);
    this.state.states[index] = [JSON.parse(JSON.stringify(target.state))];
    this.state.activeStates[index] = 0;
    this.update();
  }
  removeTarget(el) {
    const {
      index
    } = this.getTarget(el);
    if (index > -1) {
      this.state.targets.splice(index, 1);
      this.state.queries.splice(index, 1);
      this.state.states.splice(index, 1);
      this.state.activeStates.splice(index, 1);
      this.update();
    }
  }
  addState(el, state) {
    const {
      index
    } = this.getTarget(el);
    if (index > -1) {
      const active = this.state.activeStates[index];
      const newState = JSON.stringify(state);
      if (newState !== JSON.stringify(this.state.states[index][active])) {
        this.state.states[index].splice(active + 1, 0, JSON.parse(newState));
        this.state.activeStates[index] = active + 1;
        this.update();
      }
    }
  }
  deleteState(el, stateN) {
    const {
      index
    } = this.getTarget(el);
    this.state.states[index].splice(stateN, 1);
    if (stateN < this.state.activeStates[index]) {
      this.state.activeStates[index] -= 1;
    } else if (stateN == this.state.activeStates[index]) {
      this.state.activeStates[index] -= 1;
      this.toState(index, this.state.activeStates[index]);
    }
    this.update();
  }
  commit(el) {
    const {
      index
    } = this.getTarget(el);
    const last_state = this.state.states[index][this.state.states[index].length - 1];
    this.state.states[index] = [last_state];
    this.state.activeStates[index] = 0;
    this.update();
  }
  commitAll() {
    const me = this;
    this.state.targets.forEach(t => me.commit(t));
    this.update();
  }
  toState(el, n) {
    const {
      index,
      target
    } = this.getTarget(el);
    this.state.activeStates[index] = n;
    target.state = this.state.states[index][n];
    this.update();
  }
  resetToFirstState(el) {
    const {
      index,
      target
    } = this.getTarget(el);
    this.toState(target, 0, false);
    this.state.states[index] = [this.state.states[index][0]];
    this.update();
  }
  resetAllToFirstState() {
    const me = this;
    this.state.targets.forEach(t => me.resetToFirstState(t));
    this.update();
  }
  clear(target) {
    const {
      index
    } = this.getTarget(target);
    this.state.activeStates[index] = -1;
    this.state.states[index] = [];
    this.update();
  }
  clearAll() {
    const me = this;
    this.state.targets.forEach(t => me.clear(t));
    this.update();
  }
  saveData() {
    const me = this;
    this.storage.clear().then(() => {
      me.state.queries.forEach((q, i) => {
        const data = {
          active: me.state.activeStates[i],
          states: me.state.states[i]
        };
        me.storage.set(q, data);
      });
    });
  }
  loadData() {
    const me = this;
    this.storage.all().then((data) => {
      let i = 0;
      for (let q in data) {
        me.addTarget(q);
        me.clear(i);
        data[q].states.forEach(s => me.addState(i, s));
        me.toState(i, data[q].active);
        i++;
      }
    });
  }
  getTarget(target) {
    let index;
    if (Number.isInteger(target)) {
      index = target;
      target = this.state.targets[index];
    } else {
      index = this.state.targets.indexOf(target);
    }
    return {
      index: index,
      target: target
    };
  }
  static prettyJSON(json) {
    json = JSON.stringify(json, null, 4);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function(match) {
      let cls = 'number';
      if (/:$/.test(match)) {
        cls = 'key';
        return '<span class="' + cls + '">' + match + '</span>';
      } else if (/^"/.test(match)) {
        cls = 'string';
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }
}
SifrrStater.defaultState = {
  targets: [],
  states: [],
  queries: [],
  activeStates: []
};
SifrrDom.register(SifrrStater);

export default SifrrStater;
/*! (c) @aadityataparia */
//# sourceMappingURL=sifrrstater.module.js.map
