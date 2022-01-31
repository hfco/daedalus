import { EnumMap } from '../types/enumTypes';
import type {
  RestoreWalletStep,
  WalletKind,
  WalletDaedalusKind,
  WalletYoroiKind,
  WalletHardwareKind,
  WalletByronKind,
  ImportWalletStep,
} from '../types/walletRestoreTypes';

const { isMainnet } = global.environment;
export const RESTORE_WALLET_STEPS: Array<RestoreWalletStep> = [
  'type',
  'mnemonics',
  'configuration',
  'success',
];

export const IMPORT_WALLET_STEPS: EnumMap<string, ImportWalletStep> = {
  WALLET_IMPORT_FILE: 'WalletImportFile',
  WALLET_SELECT_IMPORT: 'WalletSelectImport',
};

export const WALLET_KINDS: EnumMap<string, WalletKind> = {
  DAEDALUS: 'Daedalus',
  YOROI: 'Yoroi', // HARDWARE: 'Hardware',
};

export const WALLET_DAEDALUS_KINDS: EnumMap<
  string,
  WalletDaedalusKind
> = isMainnet
  ? {
      BYRON_12_WORD: '12WordByron',
      SHELLEY_24_WORD: '24WordShelley',
      BYRON_27_WORD: '27WordPaper',
    }
  : {
      BYRON_12_WORD: '12WordByron',
      SHELLEY_15_WORD: '15WordShelley',
      SHELLEY_24_WORD: '24WordShelley',
      BYRON_27_WORD: '27WordPaper',
    };

export const WALLET_YOROI_KINDS: EnumMap<string, WalletYoroiKind> = {
  BYRON_15_WORD: '15WordByron',
  SHELLEY_15_WORD: '15WordShelley',
};

export const WALLET_HARDWARE_KINDS: EnumMap<string, WalletHardwareKind> = {
  LEDGER: 'Ledger',
  TREZOR: 'Trezor',
};

export const WALLET_DAEDALUS_WORD_COUNT: EnumMap<WalletDaedalusKind, number> = {
  [WALLET_DAEDALUS_KINDS.BYRON_12_WORD]: 12,
  [WALLET_DAEDALUS_KINDS.SHELLEY_15_WORD]: 15,
  [WALLET_DAEDALUS_KINDS.SHELLEY_24_WORD]: 24,
  [WALLET_DAEDALUS_KINDS.BYRON_27_WORD]: 27,
};

export const WALLET_YOROI_WORD_COUNT: EnumMap<WalletYoroiKind, number> = {
  [WALLET_YOROI_KINDS.BYRON_15_WORD]: 15,
  [WALLET_YOROI_KINDS.SHELLEY_15_WORD]: 15,
};
// @ts-ignore ts-migrate(2739) FIXME: Type '{ [x: number]: number[]; }' is missing the f... Remove this comment to see the full error message
export const WALLET_HARDWARE_WORD_COUNT: Record<
  WalletHardwareKind,
  Array<number>
> = {
  [WALLET_HARDWARE_KINDS.LEDGER]: [12, 18, 24],
  [WALLET_HARDWARE_KINDS.TREZOR]: [12, 18, 24],
};

export const WALLET_BYRON_KINDS: EnumMap<string, WalletByronKind> = {
  ICARUS: 'icarus',
  LEDGER: 'ledger',
  RANDOM: 'random',
  TREZOR: 'trezor',
};
