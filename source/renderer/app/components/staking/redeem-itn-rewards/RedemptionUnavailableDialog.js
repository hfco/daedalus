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
const react_intl_1 = require('react-intl');
const bignumber_js_1 = __importDefault(require('bignumber.js'));
const global_messages_1 = __importDefault(
  require('../../../i18n/global-messages')
);
const DialogCloseButton_1 = __importDefault(
  require('../../widgets/DialogCloseButton')
);
const Dialog_1 = __importDefault(require('../../widgets/Dialog'));
const LoadingSpinner_1 = __importDefault(
  require('../../widgets/LoadingSpinner')
);
const RedemptionUnavailableDialog_scss_1 = __importDefault(
  require('./RedemptionUnavailableDialog.scss')
);
// @ts-ignore ts-migrate(2307) FIXME: Cannot find module '../../../assets/images/close-c... Remove this comment to see the full error message
const close_cross_thin_inline_svg_1 = __importDefault(
  require('../../../assets/images/close-cross-thin.inline.svg')
);
const messages = (0, react_intl_1.defineMessages)({
  title: {
    id: 'staking.redeemItnRewards.redemptionUnavailable.title',
    defaultMessage: '!!!Redeem Incentivized Testnet rewards',
    description:
      'Title for Redeem Incentivized Testnet - redemptionUnavailable',
  },
  closeButtonLabel: {
    id: 'staking.redeemItnRewards.redemptionUnavailable.closeButton.label',
    defaultMessage: '!!!Close',
    description:
      'closeButtonLabel for Redeem Incentivized Testnet - redemptionUnavailable',
  },
});
let RedemptionUnavailableDialog = class RedemptionUnavailableDialog extends react_1.Component {
  static contextTypes = {
    intl: react_intl_1.intlShape.isRequired,
  };
  render() {
    const { intl } = this.context;
    const { onClose, syncPercentage } = this.props;
    const closeButton = react_1.default.createElement(
      DialogCloseButton_1.default,
      {
        icon: close_cross_thin_inline_svg_1.default,
        className: RedemptionUnavailableDialog_scss_1.default.closeButton,
        onClose: onClose,
      }
    );
    return react_1.default.createElement(
      Dialog_1.default,
      {
        title: intl.formatMessage(messages.title),
        actions: [
          {
            className: 'primary',
            primary: true,
            label: intl.formatMessage(messages.closeButtonLabel),
            onClick: onClose,
          },
        ],
        closeButton: closeButton,
        onClose: onClose,
        closeOnOverlayClick: false,
        fullSize: true,
      },
      react_1.default.createElement(
        'div',
        { className: RedemptionUnavailableDialog_scss_1.default.component },
        react_1.default.createElement(LoadingSpinner_1.default, { big: true }),
        react_1.default.createElement(
          'div',
          { className: RedemptionUnavailableDialog_scss_1.default.description },
          react_1.default.createElement(react_intl_1.FormattedHTMLMessage, {
            ...global_messages_1.default.featureUnavailableWhileSyncing,
            values: {
              syncPercentage: new bignumber_js_1.default(
                syncPercentage
              ).toFormat(2),
            },
          })
        )
      )
    );
  }
};
RedemptionUnavailableDialog = __decorate(
  [mobx_react_1.observer],
  RedemptionUnavailableDialog
);
exports.default = RedemptionUnavailableDialog;
//# sourceMappingURL=RedemptionUnavailableDialog.js.map
