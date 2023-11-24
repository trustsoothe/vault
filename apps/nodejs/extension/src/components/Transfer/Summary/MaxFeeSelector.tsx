import type { Theme } from "@mui/material";
import type { EthereumNetworkFee } from "@poktscan/keyring";
import type { FeeSpeed } from "../index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Popover from "@mui/material/Popover";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import React, { useCallback, useMemo, useState } from "react";
import DropDownIcon from "../../../assets/img/drop_down_icon.svg";
import { returnNumWithTwoDecimals } from "../../../utils/ui";
import { useAppSelector } from "../../../hooks/redux";
import { useTransferContext } from "../../../contexts/TransferContext";

interface Option {
  speed: FeeSpeed;
  maxFee: string;
}

interface MaxFeeSelectorProps {
  networkPrice: number;
}

const MaxFeeSelector: React.FC<MaxFeeSelectorProps> = ({ networkPrice }) => {
  const theme: Theme = useTheme();
  const { watch, control } = useFormContext();
  const { networkFee, feeFetchStatus, getNetworkFee } = useTransferContext();
  const [protocol, chainId, asset, fromAddress] = watch([
    "protocol",
    "chainId",
    "asset",
    "from",
  ]);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [popoverWidth, setPopoverWidth] = useState(0);

  const measuredRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      setPopoverWidth(node.getBoundingClientRect().width);
    }
  }, []);

  const onOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const onClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const ethFee = networkFee as EthereumNetworkFee;

  const options: Option[] = useMemo(() => {
    return [
      {
        speed: "low",
        maxFee: ethFee?.low?.amount,
      },
      {
        speed: "medium",
        maxFee: ethFee?.medium?.amount,
      },
      {
        speed: "high",
        maxFee: ethFee?.high?.amount,
      },
    ];
  }, [ethFee]);

  const symbol = useAppSelector((state) => {
    return (
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.currencySymbol || ""
    );
  });

  const nativeBalance = useAppSelector((state) => {
    return state.app.accountBalances?.[protocol]?.[chainId]?.[fromAddress]
      ?.amount;
  });

  return (
    <Controller
      control={control}
      name={"feeSpeed"}
      rules={{
        ...(asset && {
          validate: (value) => {
            return Number(ethFee?.[value]?.amount) > nativeBalance
              ? "Max fee is higher than balance"
              : true;
          },
        }),
      }}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <>
          <Stack alignItems={"flex-end"}>
            {feeFetchStatus === "loading" ? (
              <Skeleton variant={"rectangular"} width={150} height={14} />
            ) : feeFetchStatus === "error" ? (
              <Typography fontSize={11} color={theme.customColors.red100}>
                Error getting max fee.{" "}
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={getNetworkFee}
                >
                  Retry
                </span>
              </Typography>
            ) : (
              <Stack
                ref={measuredRef}
                direction={"row"}
                height={20}
                width={"min-content"}
                alignItems={"center"}
                borderRadius={"4px"}
                sx={{
                  cursor: "pointer",
                  ...(!!anchorEl && {
                    borderBottom: "none",
                    borderBottomLeftRadius: "0px",
                    borderBottomRightRadius: "0px",
                  }),
                  "& svg": {
                    marginLeft: -0.5,
                    marginTop: -0.1,
                    transform: { xs: "scale(0.7)", md: "scale(0.8)" },
                  },
                  "& path": {
                    fill: theme.customColors.dark75,
                  },
                }}
                justifyContent={"space-between"}
                onClick={onOpenPopover}
                marginRight={"-10px!important"}
              >
                <Typography
                  fontSize={12}
                  letterSpacing={"0.5px"}
                  whiteSpace={"nowrap"}
                  fontWeight={500}
                >
                  {ethFee?.[value]?.amount} {symbol} / $
                  {returnNumWithTwoDecimals(
                    Number(ethFee?.[value]?.amount || 0) * networkPrice,
                    "0"
                  )}{" "}
                  USD
                </Typography>
                <DropDownIcon />
              </Stack>
            )}
            {error && feeFetchStatus === "fetched" && (
              <Typography
                fontSize={10}
                color={theme.customColors.red100}
                textAlign={"right"}
                className={"error"}
              >
                {error.message}
              </Typography>
            )}
          </Stack>
          <Popover
            open={!!anchorEl && feeFetchStatus === "fetched"}
            anchorEl={anchorEl}
            onClose={onClosePopover}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: 0,
            }}
            transitionDuration={200}
            transformOrigin={{ vertical: "top", horizontal: 1 }}
            PaperProps={{
              sx: {
                maxHeight: 105,
                height: 105,
                paddingX: 0,
                marginLeft: -1,
                width: popoverWidth ? popoverWidth + 10 : 100,
                boxShadow:
                  "0px 5px 5px -10px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.01), 0px 3px 14px -5px rgba(0,0,0,0.12)",
                borderBottomLeftRadius: "4px",
                borderBottomRightRadius: "4px",
                borderTop: "none!important",
              },
            }}
          >
            {options.map((option) => (
              <Stack
                key={option.speed}
                justifyContent={"center"}
                sx={{
                  cursor: "pointer",
                  paddingLeft: 1,
                  paddingRight: 0.5,
                  minHeight: `33px !important`,
                  backgroundColor:
                    value === option.speed
                      ? `${theme.customColors.primary100}!important`
                      : undefined,
                  ":hover": {
                    backgroundColor: `${theme.customColors.dark5}`,
                  },
                  ":focus": {
                    backgroundColor: "transparent !important",
                  },
                }}
                onClick={() => {
                  onChange(option.speed);
                  onClosePopover();
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    color: theme.customColors.dark75,
                    fontWeight: 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {option.maxFee} {symbol} / $
                  {returnNumWithTwoDecimals(
                    Number(option.maxFee || 0) * networkPrice
                  )}{" "}
                  USD
                </Typography>
              </Stack>
            ))}
          </Popover>
        </>
      )}
    />
  );
};

export default MaxFeeSelector;
