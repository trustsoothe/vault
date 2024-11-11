import { PocketNetworkFee, SupportedProtocols } from "@poktscan/vault";
import { z } from "zod";
import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import { getSchemaFromParamKey, govAclListSchema } from "./schemas";
import Summary, { SummaryRowItem } from "../../components/Summary";
import { RenderMessage } from "../../Request/SignTypedData";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import useGetAllParams from "../useGetAllParams";
import { themeColors } from "../../theme";
import CheckInput from "../CheckInput";

interface ChangeParamSummaryProps {
  fromAddress: string;
  chainId: string;
  paramKey: string;
  paramValue: string;
  memo: string;
  overrideGovParamsWhitelistValidation: boolean;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  addValidation?: boolean;
}

export default function ChangeParamSummary({
  fromAddress,
  chainId,
  paramKey,
  paramValue,
  memo,
  overrideGovParamsWhitelistValidation,
  fee,
  addValidation = true,
}: ChangeParamSummaryProps) {
  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });
  const { allParams: params } = useGetAllParams(chainId);

  const allParams = [
    ...(params?.app_params || []),
    ...(params?.node_params || []),
    ...(params?.pocket_params || []),
    ...(params?.auth_params || []),
    ...(params?.gov_params || []),
  ].reduce(
    (acc, param) => ({ ...acc, [param.param_key]: param.param_value }),
    {}
  );

  const { schema } = getSchemaFromParamKey(paramKey, allParams[paramKey]);
  const valueIsObject =
    schema instanceof z.ZodObject || schema instanceof z.ZodArray;

  let valueParsed = paramValue;

  if (valueIsObject) {
    try {
      valueParsed = JSON.parse(paramValue);
    } catch {}
  }

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfoFromAddress
          address={fromAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
    {
      type: "row",
      label: "Param Key",
      value: paramKey,
    },
    {
      type: "row",
      label: "Current Value",
      containerProps: {
        sx: {
          "& > p": {
            alignSelf: "flex-start",
          },
        },
      },
      value:
        valueIsObject && allParams[paramKey] ? (
          <Stack
            width={1}
            padding={1}
            marginTop={2.5}
            marginLeft={-8.8}
            borderRadius={"8px"}
            bgcolor={themeColors.white}
            border={`1px solid ${themeColors.borderLightGray}`}
          >
            <RenderMessage
              message={JSON.parse(allParams[paramKey])}
              capitalizeMessage={false}
              marginLeft={0.3}
              fontSize={11}
            />
          </Stack>
        ) : (
          <Typography
            variant={"subtitle2"}
            fontSize={13}
            sx={{ wordBreak: "break-word" }}
          >
            {allParams[paramKey]}
          </Typography>
        ),
    },
    {
      type: "row",
      label: "New Value",
      containerProps: {
        sx: {
          "& > p": {
            alignSelf: "flex-start",
          },
        },
      },
      value:
        valueIsObject && typeof valueParsed === "object" ? (
          <Stack
            width={1}
            padding={1}
            marginTop={2.5}
            marginLeft={-6.7}
            borderRadius={"8px"}
            bgcolor={themeColors.white}
            border={`1px solid ${themeColors.borderLightGray}`}
          >
            <RenderMessage
              message={valueParsed}
              capitalizeMessage={false}
              marginLeft={0.3}
              fontSize={11}
            />
          </Stack>
        ) : (
          <Typography
            variant={"subtitle2"}
            fontSize={13}
            sx={{ wordBreak: "break-word" }}
          >
            {paramValue}
          </Typography>
        ),
    },
    {
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value} ${coinSymbol}`,
    },
  ];

  if (overrideGovParamsWhitelistValidation) {
    rows.push({
      type: "row",
      label: "Override Gov Params Whitelist Validation",
      value: "true",
    });
  }

  if (memo) {
    rows.push({
      type: "row",
      label: "Memo",
      value: memo,
    });
  }

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary rows={rows} />
    </Stack>
  );

  return !addValidation ? (
    summaryComponent
  ) : (
    <>
      <SummaryValidator
        chainId={chainId}
        fromAddress={fromAddress}
        customValidation={() => {
          if (!params) {
            return "Loading params from blockchain...";
          }

          if (!allParams[paramKey]) {
            return "Invalid param key";
          }

          try {
            schema.parse(valueParsed);
          } catch {
            return "Invalid param value";
          }

          try {
            const addressesWithPermission = govAclListSchema
              .parse(JSON.parse(allParams["gov/acl"]))
              .value.filter((item) => item.acl_key === paramKey)
              .map((item) => item.address);

            if (!addressesWithPermission.includes(fromAddress)) {
              return "You are not authorized to change this param";
            }
          } catch {
            return "Cannot validate you have permission to change this param";
          }

          return true;
        }}
      >
        {summaryComponent}
      </SummaryValidator>
      <CheckInput />
      <VaultPasswordInput />
    </>
  );
}

export function ChangeParamSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [
    chainId,
    fee,
    fromAddress,
    memo,
    overrideGovParamsWhitelistValidation,
    paramKey,
    paramValue,
    fetchingFee,
  ] = watch([
    "chainId",
    "fee",
    "fromAddress",
    "memo",
    "overrideGovParamsWhitelistValidation",
    "paramKey",
    "paramValue",
    "fetchingFee",
  ]);

  return (
    <ChangeParamSummary
      fromAddress={fromAddress}
      chainId={chainId}
      paramKey={paramKey}
      paramValue={paramValue}
      memo={memo}
      overrideGovParamsWhitelistValidation={
        overrideGovParamsWhitelistValidation
      }
      fee={{
        fee,
        fetchingFee,
      }}
      addValidation={addValidation}
    />
  );
}
