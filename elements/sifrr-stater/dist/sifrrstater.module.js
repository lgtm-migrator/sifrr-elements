/*! SifrrStater v0.0.5 - sifrr project | MIT licensed | https://github.com/sifrr/sifrr-elements */
import SifrrDom from '@sifrr/dom';
import SifrrStorage from '@sifrr/storage';

var css = ":host {\n  /* CSS for tabs container */\n  display: block;\n  line-height: 24px;\n  width: 100%;\n  position: relative;\n  overflow-x: auto;\n  box-sizing: border-box; }\n\nslot {\n  display: block; }\n\nslot::slotted(*) {\n  float: left;\n  text-align: center;\n  padding: 8px;\n  opacity: 0.8;\n  cursor: pointer; }\n\nslot::slotted(*.active) {\n  opacity: 1; }\n\nslot::slotted(*:hover) {\n  opacity: 1; }\n\n/* CSS for line under active tab heading */\n.underline {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  height: 3px;\n  background: white; }\n";

const template = SifrrDom.template`<style media="screen">
  ${css}
  slot::slotted(*) {
    \${this.options ? this.options.style : ''}
  }
</style>
<slot>
</slot>
<div class="underline"></div>`;
function removeExceptOne(elements, name, index) {
  for (let j = 0, l = elements.length; j < l; j++) {
    j === index || elements[j] === index ? elements[j].classList.add(name) : elements[j].classList.remove(name);
  }
}
class SifrrTabHeader extends SifrrDom.Element {
  static get template() {
    return template;
  }
  static observedAttrs() {
    return ['options'];
  }
  onConnect() {
    this._connected = true;
    this.$('slot').addEventListener('slotchange', this.refresh.bind(this, {}));
    this.refresh();
  }
  onAttributeChange(n, _, v) {
    if (n === 'options') {
      this._attrOptions = JSON.parse(v || '{}');
      if (this._connected) this.refresh();
    }
  }
  refresh(options = {}) {
    this.options = Object.assign({
      content: this,
      slot: this.$('slot'),
      showUnderline: true,
      line: this.$('.underline'),
      container: null
    }, this.options, options, this._attrOptions);
    this.options.menus = this.options.slot.assignedNodes().filter(n => n.nodeType === 1);
    if (!this.options.menus || this.options.menus.length < 1) return;
    this.setProps();
    this.active = this.active || 0;
  }
  setProps() {
    if (!this.options.showUnderline) this.options.line.style.display = 'none';
    this.setMenuProps();
    if (this.options.container) {
      const c = this.options.container;
      c.onScrollPercent = this.setScrollPercent.bind(this);
      SifrrDom.Event.addListener('update', c, () => this.active = c.active);
    }
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
      elem._click = () => {
        if (this.options.container) this.options.container.active = i;
        else this.active = i;
      };
    });
    const last = this.options.menuProps[this.options.menus.length - 1];
    this.options.totalMenuWidth = last.left + last.width;
    this.options.slot.style.width = last.left + last.width + 1 * this.options.menuProps.length + 'px';
    const active = this.options.menuProps[this.active];
    this.options.line.style.left = active.left + 'px';
    this.options.line.style.width = active.width + 'px';
    this.setScrollPercent(0);
  }
  setScrollPercent(total) {
    const per = total % 1, t = Math.floor(total);
    const left = this.options.menuProps[t].left * (1 - per) + (this.options.menuProps[t + 1] || {
      left: 0
    }).left * per;
    const width = this.options.menuProps[t].width * (1 - per) + (this.options.menuProps[t + 1] || {
      width: 0
    }).width * per;
    this.options.line.style.left = left + 'px';
    this.options.line.style.width = width + 'px';
    this.scrollLeft = left + (width - this.clientWidth) / 2;
    if (per === 0) {
      this._active = t;
      this.update();
    }
  }
  get active() {
    return this._active || 0;
  }
  set active(i) {
    this._active = i;
    this.setScrollPercent(i);
    this.update();
  }
  onUpdate() {
    if (!this.options) return;
    removeExceptOne(this.options.menus, 'active', this.active);
  }
}
SifrrDom.register(SifrrTabHeader);

var css$1 = ":host {\n  box-sizing: border-box;\n  width: 100%;\n  display: block;\n  position: relative;\n  overflow-x: auto;\n  margin: 0; }\n\n.tabs {\n  min-height: 1px;\n  display: block; }\n\n.tabs::slotted(*) {\n  float: left;\n  max-height: 100%;\n  height: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  vertical-align: top;\n  padding: 8px;\n  box-sizing: border-box; }\n";

/*! sifrr-animate v0.0.3 - sifrr project | MIT licensed | https://github.com/sifrr/sifrr-animate */
const beziers = {};
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
      x1, y1, x2, y2,
      A: (x1, x2) => 1.0 - 3.0 * x2 + 3.0 * x1,
      B: (x1, x2) => 3.0 * x2 - 6.0 * x1,
      C: (x1) => 3.0 * x1,
      CalcBezier: (t, x1, x2) => ((this.A(x1, x2) * t + this.B(x1, x2)) * t + this.C(x1)) * t,
      GetSlope: (t, x1, x2) => 3.0 * this.A(x1, x2) * t * t + 2.0 * this.B(x1, x2) * t + this.C(x1)
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
      if (slope == 0) return t;
      let x = this.CalcBezier(t, this.x1, this.x2) - xx;
      t -= x / slope;
    }
    return t;
  }
}
var bezier = Bezier;
var types = {
  linear: [0, 0, 1, 1],
  ease: [.25, .1, .25, 1],
  easeIn: [.42, 0, 1, 1],
  easeOut: [0, 0, .58, 1],
  easeInOut: [.42, 0, .58, 1],
  spring: [.3642, 0, .6358, 1]
};
var wait = t => new Promise(res => setTimeout(res, t));
const digitRgx = /((?:[+\-*/]=)?-?\d+\.?\d*)/;
const frames = new Set();
function runFrames(currentTime) {
  frames.forEach(f => f(currentTime));
  window.requestAnimationFrame(runFrames);
}
window.requestAnimationFrame(runFrames);
function animateOne({
  target,
  prop,
  from,
  to,
  time = 300,
  type = 'spring',
  onUpdate,
  round = false,
  delay = 0
}) {
  const toSplit = to.toString().split(digitRgx), l = toSplit.length, raw = [], fromNums = [], diffs = [];
  const fromSplit = (from || target[prop] || '').toString().split(digitRgx);
  const onUp = typeof onUpdate === 'function';
  for (let i = 0; i < l; i++) {
    const fn = Number(fromSplit[i]) || 0;
    let tn = Number(toSplit[i]);
    if (toSplit[i][1] === '=') {
      tn = Number(toSplit[i].slice(2));
      switch (toSplit[i][0]) {
      case '+':
        tn = fn + tn;
        break;
      case '-':
        tn = fn - tn;
        break;
      case '*':
        tn = fn * tn;
        break;
      case '/':
        tn = fn / tn;
        break;
      }
    }
    if (isNaN(tn) || !toSplit[i]) raw.push(toSplit[i]);
    else {
      fromNums.push(fn);
      diffs.push(tn - fn);
    }
  }
  const rawObj = { raw };
  return wait(delay).then(() => new Promise((resolve, reject) => {
    if (types[type]) type = types[type];
    if (Array.isArray(type)) type = new bezier(type);
    else if (typeof type !== 'function') return reject(Error('type should be one of ' + Object.keys(types).toString() + ' or Bezier Array or Function, given ' + type));
    let startTime;
    const frame = function(currentTime) {
      startTime = startTime || currentTime - 17;
      const percent = (currentTime - startTime) / time, bper = type(percent >= 1 ? 1 : percent);
      const next = diffs.map((d, i) => {
        const n = bper * d + fromNums[i];
        return round ? Math.round(n) : n;
      });
      const val = String.raw(rawObj, ...next);
      try {
        target[prop] = Number(val) || val;
        if (onUp) onUpdate(target, prop, target[prop]);
        if (percent >= 1) resolve(frames.delete(frame));
      } catch(e) {
        frames.delete(frame);
        reject(e);
      }
    };
    frames.add(frame);
  }));
}
var animateone = animateOne;
function animate({
  targets,
  target,
  to,
  time,
  type,
  onUpdate,
  round,
  delay
}) {
  targets = targets ? Array.from(targets) : [target];
  function iterate(tg, props, d, ntime) {
    const promises = [];
    for (let prop in props) {
      let from, final;
      if (Array.isArray(props[prop])) [from, final] = props[prop];
      else final = props[prop];
      if (typeof props[prop] === 'object' && !Array.isArray(props[prop])) {
        promises.push(iterate(tg[prop], props[prop], d, ntime));
      } else {
        promises.push(animateone({
          target: tg,
          prop,
          to: final,
          time: ntime,
          type,
          from,
          onUpdate,
          round,
          delay: d
        }));
      }
    }
    return Promise.all(promises);
  }
  let numTo = to, numDelay = delay, numTime = time;
  return Promise.all(targets.map((target, i) => {
    if (typeof to === 'function') numTo = to.call(target, i);
    if (typeof delay === 'function') numDelay = delay.call(target, i);
    if (typeof time === 'function') numTime = time.call(target, i);
    return iterate(target, numTo, numDelay, numTime);
  }));
}
animate.types = types;
animate.wait = wait;
animate.animate = animate;
animate.keyframes = (arrOpts) => {
  let promise = Promise.resolve(true);
  arrOpts.forEach(opts => {
    if (Array.isArray(opts)) promise = promise.then(() => Promise.all(opts.map(animate)));
    promise = promise.then(() => animate(opts));
  });
  return promise;
};
animate.loop = (fxn) => fxn().then(() => animate.loop(fxn));
var animate_1 = animate;
/*! (c) @aadityataparia */

const template$1 = SifrrDom.template`<style media="screen">
  ${css$1}
</style>
<style media="screen">
  .tabs {
    width: \${this.totalWidth + 'px'};
  }
  .tabs::slotted(*) {
    width: \${this.tabWidth + 'px'};
  }
</style>
<slot class="tabs">
</slot>`;
function removeExceptOne$1(elements, name, index) {
  for (let j = 0, l = elements.length; j < l; j++) {
    j === index || elements[j] === index ? elements[j].classList.add(name) : elements[j].classList.remove(name);
  }
}
class SifrrTabContainer extends SifrrDom.Element {
  static get template() {
    return template$1;
  }
  static observedAttrs() {
    return ['options'];
  }
  onConnect() {
    this._connected = true;
    this.refresh();
    window.addEventListener('resize', () => requestAnimationFrame(this.refresh.bind(this)));
    this.options.slot.addEventListener('slotchange', this.refresh.bind(this, {}));
    this.setScrollEvent();
  }
  onAttributeChange(n, _, v) {
    if (n === 'options') {
      this._attrOptions = JSON.parse(v || '{}');
      if (this._connected) this.refresh();
    }
  }
  refresh(options = {}) {
    this.options = Object.assign({
      content: this,
      slot: this.$('slot'),
      num: 1,
      animation: 'spring',
      animationTime: 300,
      scrollBreakpoint: 0.3,
      loop: false
    }, this.options, options, this._attrOptions);
    this.options.tabs = this.options.slot.assignedNodes().filter(n => n.nodeType === 1);
    if (!this.options.tabs || this.options.tabs.length < 1) return;
    this.tabWidth = this.clientWidth / this.options.num;
    this.totalWidth = this.tabWidth * this.options.tabs.length;
    this.active = typeof this._active === 'number' ? this._active : 0;
  }
  setScrollEvent() {
    let me = this,
      isScrolling,
      scrollPos;
    this.options.content.addEventListener('scroll', onScroll);
    function onScroll() {
      scrollPos = me.active;
      const total = me.options.content.scrollLeft / me.tabWidth;
      const t = Math.round(total);
      me.onScrollPercent(total);
      clearTimeout(isScrolling);
      isScrolling = setTimeout(function() {
        if (total - scrollPos < -me.options.scrollBreakpoint) {
          me.active = Math.min(t, scrollPos - 1);
        } else if (total - scrollPos > +me.options.scrollBreakpoint) {
          me.active = Math.max(t, scrollPos + 1);
        } else {
          me.active = scrollPos;
        }
      }, 100);
    }
  }
  onScrollPercent() {}
  get active() {
    return this._active;
  }
  set active(i) {
    this._active = this.getTabNumber(i);
    this.update();
  }
  beforeUpdate() {
    if (!this.options) return;
    const i = this._active;
    animate_1({
      target: this.options.content,
      to: {
        scrollLeft: i * this.tabWidth
      },
      time: this.options.animationTime,
      type: this.options.animation === 'none' ? () => 1 : this.options.animation
    });
    removeExceptOne$1(this.options.tabs, 'active', i);
  }
  next() {
    this.active += 1;
  }
  hasNext() {
    if (this.active === this.options.tabs.length - this.options.num) return false;
    return true;
  }
  prev() {
    this.active -= 1;
  }
  hasPrev() {
    return this.active === 0 ? false : true;
  }
  getTabNumber(i) {
    const l = this.options.tabs.length;
    if (l < 1) return 0;
    const num = this.options.num;
    i = i < 0 ? i + l : i % l;
    if (i + num - 1 >= l) {
      i = this.options.loop ? i % l : l - num;
    }
    return i;
  }
}
SifrrDom.register(SifrrTabContainer);

var css$2 = ":host {\n  position: fixed;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  height: 100%;\n  max-width: 100%;\n  width: 320px;\n  z-index: 1000;\n  background-color: rgba(0, 0, 0, 0.8);\n  transform: translate3d(100%, 0, 0);\n  transition: all 0.2s ease; }\n\n:host(.show) {\n  transform: translate3d(0, 0, 0); }\n\n* {\n  box-sizing: border-box; }\n\n#showHide {\n  position: fixed;\n  left: -30px;\n  top: 0;\n  bottom: 0;\n  width: 30px;\n  height: 30px;\n  margin-top: 5px;\n  background-color: blue;\n  z-index: 2; }\n\n.stateContainer {\n  padding-left: 10px;\n  margin-left: 10px;\n  border-left: 1px solid white;\n  position: relative; }\n\n.stateContainer.off {\n  opacity: 0.5; }\n\n.stateContainer .dotC {\n  position: absolute;\n  top: 0;\n  left: -10px;\n  width: 20px;\n  height: 100%;\n  cursor: pointer; }\n\n.stateContainer .dotC .dot {\n  position: absolute;\n  top: 50%;\n  left: 10px;\n  width: 10px;\n  height: 10px;\n  transform: translate3d(-50%, -50%, 0);\n  background-color: white;\n  border-radius: 50%; }\n\n.stateContainer .delete {\n  position: absolute;\n  top: 0;\n  right: 0;\n  padding: 4px;\n  background-color: rgba(0, 0, 0, 0.7);\n  color: white;\n  cursor: pointer; }\n\n.state {\n  white-space: pre-wrap;\n  max-height: 90px;\n  overflow: hidden;\n  background-color: rgba(255, 255, 255, 0.97);\n  padding: 5px;\n  margin-bottom: 5px;\n  position: relative;\n  cursor: pointer; }\n\n.state:hover::after {\n  content: '\\\\\\/';\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  background-color: rgba(0, 0, 0, 0.7);\n  text-align: center;\n  color: white; }\n\n.state.open {\n  max-height: none; }\n\n.state.open:hover::after {\n  content: '\\/\\\\'; }\n\n.key {\n  color: red; }\n\n.string {\n  color: green; }\n\n.number, .null, .boolean {\n  color: blue; }\n\nfooter {\n  position: absolute;\n  bottom: 0; }\n\ninput {\n  margin: 3px;\n  width: calc(100% - 6px);\n  padding: 3px; }\n\n.btn3 {\n  margin: 3px;\n  width: calc(33% - 8px);\n  padding: 3px;\n  background: white; }\n";

const template$2 = SifrrDom.template`<style>
  ${css$2}
</style>
<div id="showHide" _click=\${this.showHide}></div>
<sifrr-tab-header style='background: blue; color: white' data-sifrr-html="true">
  \${ this.headingHtml() }
</sifrr-tab-header>
<sifrr-tab-container style='height: calc(100vh - 132px)' data-sifrr-html="true">
  \${ this.stateHtml() }
</sifrr-tab-container>
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
    return template$2;
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
    return this.state.queries.map((q) => `<span>${q}</span>`).join('');
  }
  stateHtml() {
    let me = this;
    return this.state.states.map((s, i) =>
      `<div data-target="${i}">
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
