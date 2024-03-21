'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.messages = void 0;
const react_intl_1 = require('react-intl');
exports.messages = (0, react_intl_1.defineMessages)({
  title: {
    id: 'analytics.form.title',
    defaultMessage: '!!!Anonymous data collection',
    description: 'Analytics form title',
  },
  description: {
    id: 'analytics.form.description',
    defaultMessage:
      '!!!All data is anonymous and is used only for product development purposes.',
    description: 'Analytics data collection description',
  },
  dataCollectionSwitchButton: {
    id: 'analytics.form.dataCollectionSwitchText',
    defaultMessage: '!!!Allow anonymous data collection',
    description: 'Data collection agreement switch button label',
  },
  allowButton: {
    id: 'analytics.form.allowButton',
    defaultMessage: '!!!Allow',
    description: 'Analytics data collection allow button text',
  },
  disallowButton: {
    id: 'analytics.form.disallowButton',
    defaultMessage: '!!!Skip',
    description: 'Analytics data collection skip button text',
  },
  privacyPolicyLink: {
    id: 'analytics.form.privacyPolicyLink',
    defaultMessage: '!!!Daedalus Privacy Policy',
    description: 'Daedalus Privacy Policy link text',
  },
  analyticsSectionPrivacyPolicy: {
    id: 'analytics.form.analyticsSectionPrivacyPolicy',
    defaultMessage:
      '!!!Read more about our privacy practices in the {privacyPolicyLink}.',
    description:
      'Analytics data collection description, under collapsible details',
  },
});
//# sourceMappingURL=AnalyticsConsentForm.messages.js.map
