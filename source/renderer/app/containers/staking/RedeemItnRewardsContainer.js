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
const Step1ConfigurationContainer_1 = __importDefault(
  require('./dialogs/redeem-itn-rewards/Step1ConfigurationContainer')
);
const Step2ConfirmationContainer_1 = __importDefault(
  require('./dialogs/redeem-itn-rewards/Step2ConfirmationContainer')
);
const Step3ResultContainer_1 = __importDefault(
  require('./dialogs/redeem-itn-rewards/Step3ResultContainer')
);
const NoWalletsContainer_1 = __importDefault(
  require('./dialogs/redeem-itn-rewards/NoWalletsContainer')
);
const RedemptionUnavailableContainer_1 = __importDefault(
  require('./dialogs/redeem-itn-rewards/RedemptionUnavailableContainer')
);
const LoadingOverlay_1 = __importDefault(
  require('../../components/staking/redeem-itn-rewards/LoadingOverlay')
);
const stakingConfig_1 = require('../../config/stakingConfig');
let RedeemItnRewardsContainer = class RedeemItnRewardsContainer extends react_1.Component {
  static defaultProps = {
    actions: null,
    stores: null,
  };
  get containers() {
    return {
      configuration: Step1ConfigurationContainer_1.default,
      confirmation: Step2ConfirmationContainer_1.default,
      result: Step3ResultContainer_1.default,
    };
  }
  componentDidMount() {
    const { app } = this.props.stores;
    const { closeNewsFeed } = this.props.actions.app;
    if (app.newsFeedIsOpen) {
      closeNewsFeed.trigger();
    }
  }
  render() {
    const { stores, actions } = this.props;
    const { allWallets } = stores.wallets;
    const {
      redeemStep,
      isSubmittingReedem,
      isCalculatingReedemFees,
    } = stores.staking;
    const { isSynced } = stores.networkStatus;
    const { onRedeemStart, closeRedeemDialog } = actions.staking;
    if (!redeemStep) return null;
    if (
      !isSynced &&
      redeemStep === stakingConfig_1.REDEEM_ITN_REWARDS_STEPS.CONFIGURATION
    )
      return react_1.default.createElement(
        RedemptionUnavailableContainer_1.default,
        { onClose: closeRedeemDialog.trigger }
      );
    if (!allWallets.length)
      return react_1.default.createElement(NoWalletsContainer_1.default, {
        onClose: closeRedeemDialog.trigger,
      });
    const CurrentContainer = this.containers[redeemStep];
    return react_1.default.createElement(
      react_1.default.Fragment,
      null,
      (isSubmittingReedem || isCalculatingReedemFees) &&
        react_1.default.createElement(LoadingOverlay_1.default, null),
      react_1.default.createElement(CurrentContainer, {
        onBack: onRedeemStart.trigger,
        onClose: closeRedeemDialog.trigger,
      })
    );
  }
};
RedeemItnRewardsContainer = __decorate(
  [(0, mobx_react_1.inject)('stores', 'actions'), mobx_react_1.observer],
  RedeemItnRewardsContainer
);
exports.default = RedeemItnRewardsContainer;
//# sourceMappingURL=RedeemItnRewardsContainer.js.map
