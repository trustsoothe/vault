import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

interface AmountHelperTextProps {
  accountBalance: number;
  transferFee: number;
  isLoadingBalance?: boolean;
  isLoadingFee?: boolean;
  onClickAll: () => void;
}

const AmountHelperText: React.FC<AmountHelperTextProps> = ({
  accountBalance,
  onClickAll,
  isLoadingBalance,
  isLoadingFee,
  transferFee,
}) => {
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
        !accountBalance && !transferFee && !isLoadingFee && !isLoadingBalance
          ? "none"
          : "flex"
      }
    >
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
        disabled={!accountBalance}
        onClick={onClickAll}
      >
        All
      </Button>
    </Stack>
  );
};

export default AmountHelperText;
