import React, { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

interface AmountHelperTextProps {
  accountBalance: number;
  transferFee: number;
  isLoadingBalance?: boolean;
  errorBalance?: boolean;
  getBalance?: () => void;
  isLoadingFee?: boolean;
  errorFee?: boolean;
  getFee?: () => void;
  disableAll?: boolean;
  onClickAll: () => void;
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
}) => {
  const content = useMemo(() => {
    if (accountBalance === 0) {
      return (
        <Typography fontSize={12}>
          This account doesn't have balance. Select another.
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
        text = "Error getting the account balance.";
        onClick = getBalance;
      } else {
        text = "Error getting the transfer fee.";
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
          <Stack direction={"row"} alignItems={"center"}>
            <Typography fontSize={12} fontWeight={600}>
              Available:
            </Typography>
            {isLoadingBalance ? (
              <Skeleton width={75} height={20} sx={{ marginLeft: "5px" }} />
            ) : (
              <Typography fontSize={12} sx={{ marginLeft: "5px" }}>
                {accountBalance}
              </Typography>
            )}
          </Stack>

          <Stack direction={"row"} alignItems={"center"}>
            <Typography fontSize={12} fontWeight={600}>
              Fee:
            </Typography>
            {isLoadingFee ? (
              <Skeleton width={50} height={15} sx={{ marginLeft: "5px" }} />
            ) : (
              <Typography fontSize={12} sx={{ marginLeft: "5px" }}>
                {transferFee}
                {/*{roundAndSeparate(transferFee, 6, typeof transferFee === 'number' ? '0' : '-')}*/}
              </Typography>
            )}
          </Stack>
        </Stack>

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
  ]);

  return (
    <Stack
      direction={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
      height={30}
      marginTop={"-10px"}
      width={"100%"}
      component={"span"}
      display={
        !accountBalance &&
        !transferFee &&
        !isLoadingFee &&
        !isLoadingBalance &&
        !errorBalance &&
        !errorFee
          ? "none"
          : "flex"
      }
    >
      {content}
    </Stack>
  );
};

export default AmountHelperText;
