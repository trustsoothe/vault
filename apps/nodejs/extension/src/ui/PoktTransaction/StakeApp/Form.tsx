import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import BalanceLabel from "../../Transaction/BalanceLabel";
import PoktFeeLabel from "../../Transaction/PoktFeeLabel";
import AmountInput from "../../Transaction/AmountInput";
import useGetAllParams from "../useGetAllParams";
import ChainsSelector from "../ChainsSelector";
import MemoInput from "../MemoInput";
import useGetApp from "../useGetApp";

export default function StakeAppForm() {
  const { watch, setValue, getValues } = useFormContext();
  const [chainId, fromAddress] = watch(["chainId", "fromAddress"]);
  const { allParams: params } = useGetAllParams(chainId);
  const { app, isSuccess } = useGetApp(fromAddress, chainId);

  useEffect(() => {
    if (app) {
      if (!getValues("chains").length) {
        setValue("chains", app.chains);
      }

      if (!getValues("amount")) {
        setValue("amount", (Number(app.staked_tokens) / 1e6).toString());
      }
    }
  }, [app]);

  const appTokens = app?.staked_tokens ? Number(app.staked_tokens) / 1e6 : 0;
  const minStakeAmount =
    appTokens ||
    Number(
      params?.app_params?.find(
        (param) => param.param_key === "application/ApplicationStakeMinimum"
      )?.param_value || 0
    ) / 1e6;

  return (
    <>
      <AmountInput
        marginTop={0}
        label={"Stake Amount"}
        minAmount={minStakeAmount}
        amountToReduce={appTokens}
        amountToSumOnMax={appTokens}
        disableInput={!fromAddress || !isSuccess}
      />
      <BalanceLabel marginTop={0.8} />
      <PoktFeeLabel marginTop={0.4} />
      <ChainsSelector type={"app"} />
      <MemoInput />
    </>
  );
}
