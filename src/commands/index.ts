export * from './start';
export * from './sources/select';

export type CallbackQueryAction = 'select-sources' | 'list-sources';

export interface CallbackQueryData {
    action: CallbackQueryAction
    target?: string
}
