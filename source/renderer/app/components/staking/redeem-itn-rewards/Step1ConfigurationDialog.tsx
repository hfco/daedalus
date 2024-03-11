import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { get } from 'lodash';
import vjf from 'mobx-react-form/lib/validators/VJF';
import { Checkbox } from 'react-polymorph/lib/components/Checkbox';
import { CheckboxSkin } from 'react-polymorph/lib/skins/simple/CheckboxSkin';
import { Link } from 'react-polymorph/lib/components/Link';
import { LinkSkin } from 'react-polymorph/lib/skins/simple/LinkSkin';
import {
  defineMessages,
  FormattedHTMLMessage,
  FormattedMessage,
  intlShape,
} from 'react-intl';
import { BigNumber } from 'bignumber.js';
import Wallet from '../../../domains/Wallet';
import { validateMnemonics } from '../../../utils/validations';
import DialogCloseButton from '../../widgets/DialogCloseButton';
import WalletsDropdown from '../../widgets/forms/WalletsDropdown';
import Dialog from '../../widgets/Dialog';
import styles from './Step1ConfigurationDialog.scss';
import ReactToolboxMobxForm from '../../../utils/ReactToolboxMobxForm';
import LocalizableError from '../../../i18n/LocalizableError';
import { ITN_WALLET_RECOVERY_PHRASE_WORD_COUNT } from '../../../config/cryptoConfig';
import { FORM_VALIDATION_DEBOUNCE_WAIT } from '../../../config/timingConfig';
import { MIN_REWARDS_REDEMPTION_RECEIVER_BALANCE } from '../../../config/stakingConfig';
// @ts-ignore ts-migrate(2307) FIXME: Cannot find module '../../../assets/images/close-c... Remove this comment to see the full error message
import closeCrossThin from '../../../assets/images/close-cross-thin.inline.svg';
import { MnemonicInput } from '../../wallet/mnemonic-input';

const messages = defineMessages({
  title: {
    id: 'staking.redeemItnRewards.step1.title',
    defaultMessage: '!!!Redeem Incentivized Testnet rewards',
    description: 'Title for Redeem Incentivized Testnet - Step 1',
  },
  description1: {
    id: 'staking.redeemItnRewards.step1.description1',
    defaultMessage:
      '!!!If you participated in the { itnLink } and earned rewards by running a stake pool or delegating your stake, you can use this feature to redeem your rewards as ada on the Cardano mainnet.',
    description: 'description for Redeem Incentivized Testnet - Step 1',
  },
  description2: {
    id: 'staking.redeemItnRewards.step1.description2',
    defaultMessage:
      '!!!You will need the <b>wallet recovery phrase for the Incentivized Testnet wallet</b> used to earn rewards and an existing mainnet wallet in Daedalus to which the rewards will be transferred. This wallet will also be used to pay any applicable transaction fees.',
    description: 'description for Redeem Incentivized Testnet - Step 1',
  },
  descriptionItnLinkLabel: {
    id: 'staking.redeemItnRewards.step1.descriptionItnLinkLabel',
    defaultMessage: '!!!Incentivized Testnet',
    description:
      'descriptionItnLinkLabel for Redeem Incentivized Testnet - Step 1',
  },
  descriptionItnLinkUrl: {
    id: 'staking.redeemItnRewards.step1.descriptionItnLinkUrl',
    defaultMessage: '!!!https://staking.cardano.org/',
    description:
      'descriptionItnLinkUrl for Redeem Incentivized Testnet - Step 1',
  },
  recoveryPhraseLabel: {
    id: 'staking.redeemItnRewards.step1.recoveryPhraseLabel',
    defaultMessage: '!!!Wallet recovery phrase:',
    description: 'recoveryPhraseLabel for Redeem Incentivized Testnet - Step 1',
  },
  walletsDropdownLabel: {
    id: 'staking.redeemItnRewards.step1.walletsDropdownLabel',
    defaultMessage: '!!!Redeem rewards to:',
    description:
      'walletsDropdownLabel for Redeem Incentivized Testnet - Step 1',
  },
  checkbox1Label: {
    id: 'staking.redeemItnRewards.step1.checkbox1Label',
    defaultMessage:
      '!!!I understand that redeeming rewards from the Incentivized Testnet requires paying transaction fees.',
    description: 'checkbox1Label for Redeem Incentivized Testnet - Step 1',
  },
  checkbox2Label: {
    id: 'staking.redeemItnRewards.step1.checkbox2Label',
    defaultMessage:
      '!!!I understand that fees will be paid from the wallet I am redeeming my rewards to.',
    description: 'checkbox2Label for Redeem Incentivized Testnet - Step 1',
  },
  continueButtonLabel: {
    id: 'staking.redeemItnRewards.step1.continueButton.label',
    defaultMessage: '!!!Continue',
    description: 'continueButtonLabel for Redeem Incentivized Testnet - Step 1',
  },
  learnMoreLinkLabel: {
    id: 'staking.redeemItnRewards.step1.learnMoreLink.label',
    defaultMessage: '!!!Learn More',
    description: 'learnMoreLinkLabel for Redeem Incentivized Testnet - Step 1',
  },
  learnMoreLinkUrl: {
    id: 'staking.redeemItnRewards.step1.learnMoreLink.url',
    defaultMessage:
      '!!!https://iohk.zendesk.com/hc/en-us/articles/900001656586',
    description: 'learnMoreLinkUrl for Redeem Incentivized Testnet - Step 1',
  },
  recoveryPhraseInputHint: {
    id: 'staking.redeemItnRewards.step1.recoveryPhraseInputHint',
    defaultMessage: '!!!Enter recovery phrase',
    description:
      'Hint "Enter recovery phrase" for the recovery phrase input on the wallet restore dialog.',
  },
  selectWalletInputPlaceholder: {
    id: 'staking.redeemItnRewards.step1.selectWalletInputPlaceholder',
    defaultMessage: '!!!Select Wallet',
    description:
      'Placeholder "Select Wallet" for select input on the delegation setup "choose wallet" step dialog.',
  },
  noResults: {
    id: 'staking.redeemItnRewards.step1.noResults',
    defaultMessage: '!!!No results',
    description:
      '"No results" message for the recovery phrase input search results.',
  },
  invalidRecoveryPhrase: {
    id: 'staking.redeemItnRewards.step1.invalidRecoveryPhrase',
    defaultMessage: '!!!Invalid recovery phrase',
    description:
      'Error message shown when invalid recovery phrase was entered.',
  },
});
type Props = {
  error?: LocalizableError | null | undefined;
  isCalculatingReedemFees: boolean;
  mnemonicValidator: (...args: Array<any>) => any;
  onClose: (...args: Array<any>) => any;
  onContinue: (...args: Array<any>) => any;
  onSelectWallet: (...args: Array<any>) => any;
  openExternalLink: (...args: Array<any>) => any;
  wallet: Wallet | null | undefined;
  suggestedMnemonics: Array<string>;
  recoveryPhrase?: Array<string> | null | undefined;
  wallets: Array<Wallet>;
};

type State = {
  wasRecoveryPhraseValidAtLeastOnce: boolean;
};

interface FormFields {
  checkboxAcceptance1: string;
  checkboxAcceptance2: string;
  walletsDropdown: string;
  recoveryPhrase: string;
}

@observer
class Step1ConfigurationDialog extends Component<Props, State> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };
  static defaultProps = {
    error: null,
    recoveryPhrase: [],
  };

  state = {
    wasRecoveryPhraseValidAtLeastOnce: false,
  };

  form = new ReactToolboxMobxForm<FormFields>(
    {
      fields: {
        recoveryPhrase: {
          value: [...(this.props.recoveryPhrase || [])],
          label: this.context.intl.formatMessage(messages.recoveryPhraseLabel),
          validators: ({ field }) =>
            validateMnemonics({
              requiredWords: ITN_WALLET_RECOVERY_PHRASE_WORD_COUNT,
              providedWords: field.value,
              validator: (providedWords) => [
                this.props.mnemonicValidator(
                  providedWords.join(' '),
                  providedWords.length
                ),
                this.context.intl.formatMessage(messages.invalidRecoveryPhrase),
              ],
            }),
          hooks: {
            onChange: (field) => {
              if (
                this.state.wasRecoveryPhraseValidAtLeastOnce === false &&
                field.isValid
              ) {
                this.setState({ wasRecoveryPhraseValidAtLeastOnce: true });
              }
            },
          },
        },
        walletsDropdown: {
          type: 'select',
          label: this.context.intl.formatMessage(messages.walletsDropdownLabel),
        },
        checkboxAcceptance1: {
          type: 'checkbox',
          label: this.context.intl.formatMessage(messages.checkbox1Label),
        },
        checkboxAcceptance2: {
          type: 'checkbox',
          label: this.context.intl.formatMessage(messages.checkbox2Label),
        },
      },
    },
    {
      plugins: {
        vjf: vjf(),
      },
      options: {
        validateOnChange: true,
        showErrorsOnChange: false,
        validationDebounceWait: FORM_VALIDATION_DEBOUNCE_WAIT,
      },
    }
  );
  submit = () => {
    this.form.submit({
      onSuccess: () => this.props.onContinue(),
    });
  };

  get canSubmit() {
    const { isCalculatingReedemFees, wallet, error } = this.props;
    const { form } = this;
    const { checked: checkboxAcceptance1isChecked } = form.$(
      'checkboxAcceptance1'
    );
    const { checked: checkboxAcceptance2isChecked } = form.$(
      'checkboxAcceptance2'
    );
    return (
      !isCalculatingReedemFees &&
      wallet &&
      !error &&
      checkboxAcceptance1isChecked &&
      checkboxAcceptance2isChecked &&
      form.isValid
    );
  }

  render() {
    const { intl } = this.context;
    const { form } = this;
    const {
      isCalculatingReedemFees,
      onClose,
      onContinue,
      onSelectWallet,
      wallet,
      suggestedMnemonics,
      openExternalLink,
      wallets,
      error,
    } = this.props;
    const calculatedMinRewardsReceiverBalance = new BigNumber(
      MIN_REWARDS_REDEMPTION_RECEIVER_BALANCE
    );
    let errorMessage;
    if (
      !isCalculatingReedemFees &&
      error &&
      // @ts-ignore ts-migrate(2339) FIXME: Property 'id' does not exist on type 'LocalizableE... Remove this comment to see the full error message
      error.id === 'staking.redeemItnRewards.step1.errorRestoringWallet'
    )
      errorMessage = (
        <p className={styles.error}>{intl.formatMessage(error)}</p>
      );
    if (
      !isCalculatingReedemFees &&
      error &&
      // @ts-ignore ts-migrate(2339) FIXME: Property 'id' does not exist on type 'LocalizableE... Remove this comment to see the full error message
      error.id === 'staking.redeemItnRewards.step1.errorMessage'
    )
      errorMessage = (
        <p className={styles.errorMessage}>
          <FormattedHTMLMessage
            {...error}
            values={{
              calculatedMinRewardsReceiverBalance,
            }}
          />
        </p>
      );
    const recoveryPhraseField = form.$('recoveryPhrase');
    const walletsDropdownField = form.$('walletsDropdown');
    const checkboxAcceptance1Field = form.$('checkboxAcceptance1');
    const checkboxAcceptance2Field = form.$('checkboxAcceptance2');
    const walletId = get(wallet, 'id', null);
    const walletsDropdownDisabled = !(
      recoveryPhraseField.isValid ||
      this.state.wasRecoveryPhraseValidAtLeastOnce
    );

    const actions = {
      direction: 'column',
      items: [
        {
          className: 'primary',
          disabled: !this.canSubmit,
          primary: true,
          label: intl.formatMessage(messages.continueButtonLabel),
          onClick: this.submit,
        },
        {
          onClick: (event: MouseEvent) =>
            openExternalLink(
              intl.formatMessage(messages.learnMoreLinkUrl, event)
            ),
          label: intl.formatMessage(messages.learnMoreLinkLabel),
          isLink: true,
        },
      ],
    };
    const itnLink = (
      <Link
        className={styles.itnLink}
        onClick={(event: MouseEvent) =>
          openExternalLink(
            intl.formatMessage(messages.descriptionItnLinkUrl, event)
          )
        }
        label={intl.formatMessage(messages.descriptionItnLinkLabel)}
        skin={LinkSkin}
      />
    );
    const closeButton = (
      <DialogCloseButton
        icon={closeCrossThin}
        className={styles.closeButton}
        onClose={onClose}
      />
    );
    const { ...mnemonicInputProps } = recoveryPhraseField.bind();

    return (
      <Dialog
        title={intl.formatMessage(messages.title)}
        // @ts-ignore ts-migrate(2769) FIXME: No overload matches this call.
        actions={actions}
        onContinue={onContinue}
        onClose={onClose}
        closeButton={closeButton}
        closeOnOverlayClick={false}
        fullSize
      >
        <div className={styles.component}>
          <p className={styles.description}>
            <FormattedMessage
              {...messages.description1}
              values={{
                itnLink,
              }}
            />{' '}
            <FormattedHTMLMessage {...messages.description2} />
          </p>
          <div className={styles.recoveryPhrase}>
            <MnemonicInput
              {...mnemonicInputProps}
              label={intl.formatMessage(messages.recoveryPhraseInputHint)}
              availableWords={suggestedMnemonics}
              wordCount={ITN_WALLET_RECOVERY_PHRASE_WORD_COUNT}
              error={recoveryPhraseField.error}
              reset={form.resetting}
            />
          </div>
          <div className={styles.walletsDropdownWrapper}>
            <WalletsDropdown
              {...walletsDropdownField.bind()}
              numberOfStakePools={4}
              wallets={wallets}
              onChange={(id) => onSelectWallet(id, recoveryPhraseField.value)}
              placeholder={intl.formatMessage(
                messages.selectWalletInputPlaceholder
              )}
              value={walletId}
              getStakePoolById={() => {}}
              errorPosition="bottom"
              disabled={walletsDropdownDisabled}
            />
          </div>
          <Checkbox
            {...checkboxAcceptance1Field.bind()}
            className={styles.checkbox}
            skin={CheckboxSkin}
            error={checkboxAcceptance1Field.error}
          />
          <Checkbox
            {...checkboxAcceptance2Field.bind()}
            className={styles.checkbox}
            skin={CheckboxSkin}
            error={checkboxAcceptance2Field.error}
          />
          {errorMessage}
        </div>
      </Dialog>
    );
  }
}

export default Step1ConfigurationDialog;
