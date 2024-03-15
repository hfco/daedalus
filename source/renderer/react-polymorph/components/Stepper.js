// @ts-nocheck
const __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (const p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError(
          `Class extends value ${String(b)} is not a constructor or null`
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
const __rest =
  (this && this.__rest) ||
  function (s, e) {
    const t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
exports.__esModule = true;
exports.Stepper = void 0;
const react_1 = require('react');
// internal utility functions
const withTheme_1 = require('./HOC/withTheme');
const themes_1 = require('../utils/themes');
// import constants
const _1 = require('.');

const StepperBase = /** @class */ (function (_super) {
  __extends(StepperBase, _super);
  function StepperBase(props) {
    const _this = _super.call(this, props) || this;
    const { context } = props;
    const { themeId } = props;
    const { theme } = props;
    const { themeOverrides } = props;
    _this.state = {
      composedTheme: (0, themes_1.composeTheme)(
        (0, themes_1.addThemeId)(theme || context.theme, themeId),
        (0, themes_1.addThemeId)(themeOverrides, themeId),
        context.ROOT_THEME_API
      ),
    };
    return _this;
  }
  StepperBase.prototype.componentDidUpdate = function (prevProps) {
    if (prevProps !== this.props) {
      (0, themes_1.didThemePropsChange)(
        prevProps,
        this.props,
        this.setState.bind(this)
      );
    }
  };
  StepperBase.prototype.render = function () {
    // destructuring props ensures only the "...rest" get passed down
    const _a = this.props;
    const { skin } = _a;
    const { context } = _a;
    const rest = __rest(_a, ['skin', 'context']);
    const StepperSkin = skin || context.skins[this.props.themeId];
    return <StepperSkin theme={this.state.composedTheme} {...rest} />;
  };
  // define static properties
  StepperBase.displayName = 'Stepper';
  StepperBase.defaultProps = {
    context: (0, withTheme_1.createEmptyContext)(),
    theme: null,
    themeId: _1.IDENTIFIERS.STEPPER,
    themeOverrides: {},
  };
  return StepperBase;
})(react_1.Component);
exports.Stepper = (0, withTheme_1.withTheme)(StepperBase);
