import React, { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

interface AmountHelperTextProps {
  accountBalance?: number;
  transferFee?: number;
  isLoadingBalance?: boolean;
  errorBalance?: boolean;
  getBalance?: () => void;
  isLoadingFee?: boolean;
  errorFee?: boolean;
  getFee?: () => void;
  disableAll?: boolean;
  onClickAll?: () => void;
  hideBalance?: boolean;
  hideFee?: boolean;
}

const AmountHelperText: React.FC<AmountHelperTextProps> = ({
  accountBalance,
  onClickAll,
  isLoadingBalance,
  isLoadingFee,
  transferFee,
  disableAll,
  errorFee,
  errorBalance,
  getBalance,
  getFee,
  hideBalance = false,
  hideFee = false,
}) => {
  const content = useMemo(() => {
    if (accountBalance === 0 && !errorBalance) {
      return (
        <Typography fontSize={12}>
          This account doesn't have balance.
        </Typography>
      );
    }

    if (errorBalance || errorFee) {
      let text: string, onClick: () => void;

      if (errorFee && errorBalance) {
        text = "Error getting the account balance and transfer fee.";
        onClick = () => {
          if (getBalance) {
            getBalance();
          }
          if (getFee) {
            getFee();
          }
        };
      } else if (errorBalance) {
        text = "Error getting the balance.";
        onClick = getBalance;
      } else {
        text = "Error.";
        onClick = getFee;
      }

      return (
        <Stack direction={"row"} alignItems={"center"} spacing={"5px"}>
          <Typography fontSize={12}>{text}</Typography>
          <Typography
            fontSize={12}
            fontWeight={600}
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={onClick}
          >
            Retry
          </Typography>
        </Stack>
      );
    }

    return (
      <>
        <Stack direction={"row"} alignItems={"center"} spacing={"10px"}>
          {!hideBalance && (
            <Stack direction={"row"} alignItems={"center"}>
              <Typography fontSize={12} fontWeight={600}>
                Available:
              </Typography>
              {isLoadingBalance ? (
                <Skeleton width={75} height={17} sx={{ marginLeft: "5px" }} />
              ) : (
                <Typography fontSize={12} sx={{ marginLeft: "5px" }}>
                  {accountBalance}
                </Typography>
              )}
            </Stack>
          )}
          {!hideFee && (
            <Stack direction={"row"} alignItems={"center"}>
              <Typography fontSize={12} fontWeight={600}>
                Min:
              </Typography>
              {isLoadingFee ? (
                <Skeleton
                  width={40}
                  height={20}
                  variant={"rectangular"}
                  sx={{ marginLeft: "5px" }}
                />
              ) : (
                <Typography fontSize={12} sx={{ marginLeft: "5px" }}>
                  {transferFee}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>

        {onClickAll && (
          <Button
            sx={{
              textAlign: "right",
              padding: 0,
              fontWeight: 600,
              fontSize: 12,
              minWidth: 30,
              width: 30,
              marginRight: "-15px",
              textDecoration: "underline",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            disabled={disableAll || !accountBalance}
            onClick={onClickAll}
          >
            All
          </Button>
        )}
      </>
    );
  }, [
    errorBalance,
    errorFee,
    getBalance,
    getFee,
    accountBalance,
    isLoadingBalance,
    isLoadingFee,
    disableAll,
    onClickAll,
    transferFee,
    hideBalance,
    hideFee,
  ]);

  return (
    <Stack
      direction={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
      height={30}
      width={"100%"}
      component={"span"}
      display={hideBalance && hideFee ? "none" : "flex"}
    >
      {content}
    </Stack>
  );
};

export default AmountHelperText;
