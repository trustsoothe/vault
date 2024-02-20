import type { BaseErrors, BaseRequestWithSession } from "./common";
import {
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
} from "../../constants/communication";
import { SessionIdNotPresented } from "../../errors/communication";

export type ExternalIsSessionValidReq = BaseRequestWithSession<
  typeof IS_SESSION_VALID_REQUEST
>;

export type IsSessionValidRequestErrors =
  | typeof SessionIdNotPresented
  | BaseErrors
  | null;

export interface ExternalIsSessionValidRes {
  type: typeof IS_SESSION_VALID_RESPONSE;
  data: {
    isValid: boolean;
  } | null;
  error: IsSessionValidRequestErrors;
}
