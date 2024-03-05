import type { Theme } from "@mui/material";
import type { EthereumNetworkFee } from "@soothe/vault";
import type { FeeSpeed } from "../index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Popover from "@mui/material/Popover";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DropDownIcon from "../../../assets/img/drop_down_icon.svg";
import { returnNumWithTwoDecimals } from "../../../utils/ui";
import { useAppSelector } from "../../../hooks/redux";
import { useTransferContext } from "../../../contexts/TransferContext";
import { symbolOfNetworkSelector } from "../../../redux/selectors/network";
import { accountBalancesSelector } from "../../../redux/selectors/account";
import { timeByFeeSpeedMap } from "../Form/AmountFeeInputs";

interface Option {
  speed: FeeSpeed;
  maxFee: string;
}

interface MaxFeeSelectorProps {
  networkPrice?: number;
}

const MaxFeeSelector: React.FC<MaxFeeSelectorProps> = ({
  networkPrice = 0,
}) => {
  const theme: Theme = useTheme();
  const { watch, control } = useFormContext();
  const { networkFee, feeFetchStatus, getNetworkFee, status } =
    useTransferContext();
  const [protocol, chainId, asset, fromAddress] = watch([
    "protocol",
    "chainId",
    "asset",
    "from",
  ]);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [popoverWidth, setPopoverWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const accountBalances = useAppSelector(accountBalancesSelector);
  const symbol = useAppSelector(symbolOfNetworkSelector(protocol, chainId));

  useEffect(() => {
    if (containerRef.current) {
      setPopoverWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, [networkFee, feeFetchStatus]);

  const measuredRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      containerRef.current = node;
      setPopoverWidth(node.getBoundingClientRect().width);
    }
  }, []);

  const onOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (status === "summary") {
        setAnchorEl(event.currentTarget);
      }
    },
    [status]
  );

  const onClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const ethFee = networkFee as EthereumNetworkFee;

  const options: Option[] = useMemo(() => {
    const opts: Option[] = [
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

    if (ethFee?.site) {
      opts.unshift({
        speed: "site",
        maxFee: ethFee.site.amount,
      });
    }

    return opts;
  }, [ethFee]);

  const nativeBalance =
    accountBalances?.[protocol]?.[chainId]?.[fromAddress]?.amount;

  return (
    <Controller
      control={control}
      name={"feeSpeed"}
      rules={{
        deps: ["amount"],
        ...(asset && {
          validate: (value) => {
            return Number(ethFee?.[value]?.amount) > nativeBalance
              ? "Max fee is higher than balance"
              : true;
          },
        }),
      }}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        if (feeFetchStatus === "loading" && !networkFee) {
          return <Skeleton variant={"rectangular"} width={150} height={14} />;
        }

        if (feeFetchStatus === "error") {
          return (
            <Typography fontSize={11} color={theme.customColors.red100}>
              Error getting max fee.{" "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={getNetworkFee}
              >
                Retry
              </span>
            </Typography>
          );
        }
        return (
          <>
            <Stack alignItems={"flex-end"} maxWidth={280}>
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
                marginRight={
                  status === "summary" ? "-10px!important" : undefined
                }
              >
                <Typography
                  fontSize={11}
                  whiteSpace={"nowrap"}
                  textOverflow={"ellipsis"}
                  overflow={"hidden"}
                  maxWidth={270}
                >
                  {ethFee?.[value]?.amount} {symbol} / $
                  {returnNumWithTwoDecimals(
                    Number(ethFee?.[value]?.amount || 0) * networkPrice,
                    "0"
                  )}{" "}
                  USD
                </Typography>
                {status === "summary" && <DropDownIcon />}
              </Stack>
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
                  marginTop: 0.3,
                  maxHeight: options.length === 4 ? 160 : 126,
                  height: options.length === 4 ? 160 : 126,
                  paddingX: 0,
                  marginLeft: -1,
                  width: popoverWidth ? popoverWidth + 10 : 100,
                  boxShadow:
                    "0px 5px 0px -10px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.02), 0px 10px 30px -2px rgba(0,0,0,0.4)",
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
                    minHeight: `40px !important`,
                    backgroundColor:
                      value === option.speed
                        ? `${theme.customColors.primary100}!important`
                        : undefined,
                    ":hover": {
                      backgroundColor: `${theme.customColors.dark5}`,
                    },
                  }}
                  onClick={() => {
                    onChange(option.speed);
                    onClosePopover();
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: theme.customColors.dark90,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {option.maxFee} {symbol} / $
                    {returnNumWithTwoDecimals(
                      Number(option.maxFee || 0) * networkPrice,
                      "0"
                    )}{" "}
                    USD
                  </Typography>
                  <Typography fontSize={9} color={theme.customColors.dark75}>
                    Est. {timeByFeeSpeedMap[option.speed]}
                  </Typography>
                </Stack>
              ))}
            </Popover>
          </>
        );
      }}
    />
  );
};

export default MaxFeeSelector;
