/**
 * @deprecated — The Record model has been promoted to Core.ts.
 * This file is kept for backwards-compatibility only; update all imports to:
 *   import { Record, IRecord, IRecordDocument } from './Core'
 * or use the barrel:
 *   import { Record } from './index'
 */
export { Record, IRecord, IRecordDocument } from "./Core";
export type { IAttachment, ISubjectDocument, IRecordTransferHistoryDocument } from "./Core";
