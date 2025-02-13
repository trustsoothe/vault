import React, { useEffect, useRef } from "react";
import { PocketNetworkTransactionTypes } from "@soothe/vault";
import { UnstakeUnjailNodeSummaryFromForm } from "./UnstakeUnjailNode/Summary";
import AppToBackground from "../../controllers/communication/AppToBackground";
import StakeNodeForm, { RewardDelegatorsForm } from "./StakeNode/Form";
import { UnstakeAppSummaryFromForm } from "./UnstakeApp/SummaryForm";
import { TransferAppSummaryFromForm } from "./TransferApp/Summary";
import { DaoTransferSummaryFromForm } from "./DaoTransfer/Summary";
import { ChangeParamSummaryFromForm } from "./ChangeParam/Summary";
import { StakeNodeSummaryFromForm } from "./StakeNode/Summary";
import UnstakeUnjailNodeForm from "./UnstakeUnjailNode/Form";
import { StakeAppSummaryFromForm } from "./StakeApp/Summary";
import { UpgradeSummaryFromForm } from "./Upgrade/Summary";
import ChangeParamForm from "./ChangeParam/Form";
import TransferAppFrom from "./TransferApp/Form";
import DaoTransferForm from "./DaoTransfer/Form";
import BaseTransaction from "./BaseTransaction";
import StakeAppForm from "./StakeApp/Form";
import UpgradeForm from "./Upgrade/Form";
import BaseSuccess from "./BaseSuccess";

const ComponentMap: Partial<
  Record<
    PocketNetworkTransactionTypes,
    {
      form?: () => JSX.Element;
      formSecond?: () => JSX.Element;
      summary: (props: { addValidation?: boolean }) => JSX.Element;
    }
  >
> = {
  [PocketNetworkTransactionTypes.NodeStake]: {
    form: StakeNodeForm,
    formSecond: RewardDelegatorsForm,
    summary: StakeNodeSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.NodeUnjail]: {
    form: UnstakeUnjailNodeForm,
    summary: UnstakeUnjailNodeSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.NodeUnstake]: {
    form: UnstakeUnjailNodeForm,
    summary: UnstakeUnjailNodeSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.AppStake]: {
    form: StakeAppForm,
    summary: StakeAppSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.AppUnstake]: {
    summary: UnstakeAppSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.AppTransfer]: {
    form: TransferAppFrom,
    summary: TransferAppSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.GovChangeParam]: {
    form: ChangeParamForm,
    summary: ChangeParamSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.GovDAOTransfer]: {
    form: DaoTransferForm,
    summary: DaoTransferSummaryFromForm,
  },
  [PocketNetworkTransactionTypes.GovUpgrade]: {
    form: UpgradeForm,
    summary: UpgradeSummaryFromForm,
  },
};

interface PoktTransactionModalProps {
  type: PocketNetworkTransactionTypes;
  onClose: () => void;
}

export default function PoktTransactionModal({
  type: typeFromProps,
  onClose,
}: PoktTransactionModalProps) {
  const lastTypeRef = useRef<PocketNetworkTransactionTypes>();

  useEffect(() => {
    if (typeFromProps) {
      lastTypeRef.current = typeFromProps;
    } else {
      setTimeout(() => {
        lastTypeRef.current = null;
      }, 150);
    }
  }, [typeFromProps]);

  const type = typeFromProps || lastTypeRef.current;

  const {
    form: Form,
    formSecond: SecondForm,
    summary: Summary,
  } = ComponentMap[type] || {};

  return (
    <BaseTransaction
      sendTransaction={async (data, type) => {
        const base = {
          rejected: false,
          fee: data.fee.value,
          vaultPassword: data.vaultPassword,
        } as const;
        switch (type) {
          case PocketNetworkTransactionTypes.NodeStake: {
            return AppToBackground.stakeNode({
              ...base,
              transactionData: {
                amount: (Number(data.amount) * 1e6).toString(),
                chains: data.chains as [string, ...string[]],
                serviceURL: data.serviceURL,
                address: data.fromAddress,
                outputAddress: data.outputAddress,
                operatorPublicKey: data.nodePublicKey,
                memo: data.memo,
                rewardDelegators: data.rewardDelegators
                  .filter((item) => item.type === "added")
                  .reduce(
                    (acc, item) => ({
                      ...acc,
                      [item.address]: Number(item.amount),
                    }),
                    {}
                  ),
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.NodeUnstake: {
            return AppToBackground.unstakeNode({
              ...base,
              transactionData: {
                address: data.fromAddress,
                nodeAddress: data.nodeAddress,
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.NodeUnjail: {
            return AppToBackground.unjailNode({
              ...base,
              transactionData: {
                address: data.fromAddress,
                nodeAddress: data.nodeAddress,
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.AppStake: {
            return AppToBackground.stakeApp({
              ...base,
              transactionData: {
                amount: (Number(data.amount) * 1e6).toString(),
                chains: data.chains as [string, ...string[]],
                address: data.fromAddress,
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.AppUnstake: {
            return AppToBackground.unstakeApp({
              ...base,
              transactionData: {
                address: data.fromAddress,
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.AppTransfer: {
            return AppToBackground.transferApp({
              ...base,
              transactionData: {
                newAppPublicKey: data.newAppPublicKey,
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.GovDAOTransfer: {
            return AppToBackground.daoTransfer({
              ...base,
              transactionData: {
                address: data.fromAddress,
                to: data.recipientAddress,
                amount: (Number(data.amount) * 1e6).toString(),
                memo: data.memo,
                daoAction: data.daoAction,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.GovChangeParam: {
            return AppToBackground.changeParam({
              ...base,
              transactionData: {
                address: data.fromAddress,
                paramKey: data.paramKey,
                paramValue: data.paramValue,
                memo: data.memo,
                overrideGovParamsWhitelistValidation:
                  data.overrideGovParamsWhitelistValidation,
                chainId: data.chainId,
              },
            });
          }
          case PocketNetworkTransactionTypes.GovUpgrade: {
            return AppToBackground.upgrade({
              ...base,
              transactionData: {
                address: data.fromAddress,
                height:
                  data.upgradeType === "version"
                    ? Number(data.upgradeHeight)
                    : 1,
                version:
                  data.upgradeType === "version"
                    ? data.upgradeVersion!
                    : "FEATURE",
                features:
                  data.upgradeType === "version"
                    ? []
                    : data.features
                        .filter((item) => item.type === "added")
                        .map(({ feature, height }) => `${feature}:${height}`),
                memo: data.memo,
                chainId: data.chainId,
              },
            });
          }
          default: {
            throw new Error("Transaction type not supported");
          }
        }
      }}
      defaultFormValue={{}}
      onClose={onClose}
      type={type}
      open={!!typeFromProps}
      form={Form && <Form />}
      formSecond={SecondForm && <SecondForm />}
      summary={Summary && <Summary />}
      success={
        <BaseSuccess>
          <Summary addValidation={false} />
        </BaseSuccess>
      }
    />
  );
}
