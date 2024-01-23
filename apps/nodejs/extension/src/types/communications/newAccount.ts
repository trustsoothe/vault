import type { SupportedProtocols } from "@poktscan/keyring";
import type { BaseData, BaseResponse } from "./common";
import {
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_NEW_ACCOUNT_RESPONSE,
} from "../../constants/communication";

export interface AnswerNewAccountReq {
  type: typeof ANSWER_NEW_ACCOUNT_REQUEST;
  data: {
    rejected?: boolean;
    accountData: {
      name: string;
      protocol: SupportedProtocols;
    } | null;
  };
}

type AnswerNewAccountResponseData = BaseData & {
  address: string;
  accountId: string;
};

export type AnswerNewAccountRes = BaseResponse<
  typeof ANSWER_NEW_ACCOUNT_RESPONSE,
  AnswerNewAccountResponseData
>;
