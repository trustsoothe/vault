import React from "react";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";
import useDidMountEffect from "../hooks/useDidMountEffect";
import useGetBalance from "../hooks/useGetBalance";
import { useAppSelector } from "../hooks/redux";
import { themeColors } from "../theme";
import Decimal from "decimal.js";

interface SummaryValidatorProps {
  amount?: number;
  children: React.ReactNode;
  customValidation?: (value: unknown) => string | true;
  fromAddress: string;
  chainId: string;
}

export default function SummaryValidator({
  children,
  customValidation,
  amount = 0,
  fromAddress,
  chainId,
}: SummaryValidatorProps) {
  const requirePasswordForSensitiveOpts = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const { control, getFieldState, clearErrors } = useFormContext();

  const { balance, isLoading } = useGetBalance({
    address: fromAddress,
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  useDidMountEffect(() => {
    if (getFieldState("fee").error && !isLoading) {
      clearErrors("fee");
    }
  }, [isLoading]);

  return (
    <Controller
      name={"fee"}
      control={control}
      rules={{
        validate: (fee: PocketNetworkFee, formValues) => {
          if (isLoading || !fee) {
            return "Loading...";
          }

          if (
            !balance ||
            new Decimal(fee.value)
              .add(amount)
              .toDecimalPlaces(6)
              .gt(new Decimal(balance).toDecimalPlaces(6))
          ) {
            return "Insufficient balance";
          }

          return customValidation?.(formValues) || true;
        },
      }}
      render={({ fieldState: { error } }) => (
        <>
          {children}
          {error?.message && (
            <>
              <Typography
                fontSize={11}
                marginTop={0.8}
                lineHeight={"16px"}
                color={themeColors.red}
              >
                {error.message}
              </Typography>
              {requirePasswordForSensitiveOpts && (
                <Divider sx={{ marginTop: 1.2 }} />
              )}
            </>
          )}
        </>
      )}
    />
  );
}
