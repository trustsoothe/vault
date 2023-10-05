import type { AccountWithBalance } from "../../types";
import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface ListAccountItemProps {
  account: AccountWithBalance;
  isLoadingTokens?: boolean;
  containerProps?: StackProps;
}

const ListAccountItem: React.FC<ListAccountItemProps> = ({
  account,
  isLoadingTokens,
  containerProps,
}) => {
  return (
    <Stack flexGrow={1} spacing={"5px"} {...containerProps}>
      <Stack direction={"row"} spacing={"5px"} alignItems={"center"} width={1}>
        <Typography fontWeight={600}>{account.name}</Typography>
        <Typography fontWeight={600} marginX={"3px"}>
          •
        </Typography>
        {isLoadingTokens ? (
          <Skeleton height={15} width={75} variant={"rectangular"} />
        ) : (
          <Typography
            sx={{ fontSize: "10px!important" }}
            component={"span"}
            color={"dimgrey"}
            fontWeight={600}
          >
            {account?.balance || 0} POKT
          </Typography>
        )}
      </Stack>
      <Typography>{account.address}</Typography>
      <Typography>
        Protocol: {labelByProtocolMap[account.protocol.name]}
      </Typography>
      <Typography>
        ChainID: {labelByChainID[account.protocol.chainID]}
      </Typography>
    </Stack>
  );
};

export default ListAccountItem;
