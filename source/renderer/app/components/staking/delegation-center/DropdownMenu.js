'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const react_1 = __importStar(require('react'));
const mobx_react_1 = require('mobx-react');
const Dropdown_1 = require('@react-polymorph/components/Dropdown');
const DropdownMenu_scss_1 = __importDefault(require('./DropdownMenu.scss'));
let DropdownMenu = class DropdownMenu extends react_1.Component {
  optionRenderer = (option) =>
    react_1.default.createElement(
      'span',
      { className: option.className },
      option.label
    );
  selectionRenderer = () =>
    react_1.default.createElement(
      'div',
      { className: DropdownMenu_scss_1.default.dropdownToggle },
      this.props.label
    );
  render() {
    const { menuItems, onMenuItemClick } = this.props;
    return react_1.default.createElement(
      'div',
      { className: DropdownMenu_scss_1.default.component },
      react_1.default.createElement(Dropdown_1.Dropdown, {
        label: this.selectionRenderer(),
        onItemSelected: onMenuItemClick,
        optionRenderer: this.optionRenderer,
        items: menuItems,
        activeItem: menuItems[0],
        clickToOpen: true,
        noArrow: true,
      })
    );
  }
};
DropdownMenu = __decorate([mobx_react_1.observer], DropdownMenu);
exports.default = DropdownMenu;
//# sourceMappingURL=DropdownMenu.js.map
