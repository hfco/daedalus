'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.useActions = void 0;
const mobx_react_1 = require('mobx-react');
const react_1 = __importDefault(require('react'));
function useActions() {
  return react_1.default.useContext(mobx_react_1.MobXProviderContext).actions;
}
exports.useActions = useActions;
//# sourceMappingURL=useActions.js.map
