'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const Action_1 = __importDefault(require('./lib/Action')); // ======= ADDRESSES ACTIONS =======
class AddressesActions {
  createByronWalletAddress = new Action_1.default();
  resetErrors = new Action_1.default();
}
exports.default = AddressesActions;
//# sourceMappingURL=addresses-actions.js.map
