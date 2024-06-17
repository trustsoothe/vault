import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import useUsdPrice from "../hooks/useUsdPrice";
import { themeColors } from "../theme";
import {
  networkSymbolSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";

export default function PriceFooter() {
  const networkSymbol = useAppSelector(networkSymbolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);

  const { isLoading, usdPrice } = useUsdPrice({
    protocol: selectedProtocol,
    chainId: selectedChain,
  });

  return (
    <Stack
      width={1}
      height={40}
      paddingX={2.4}
      paddingY={1.2}
      direction={"row"}
      alignItems={"center"}
      boxSizing={"border-box"}
      bgcolor={themeColors.white}
      justifyContent={"space-between"}
      borderTop={`1px solid ${themeColors.borderLightGray}`}
    >
      <Typography color={themeColors.gray}>{networkSymbol} Price</Typography>
      {isLoading ? (
        <Skeleton width={70} height={20} variant={"rectangular"} />
      ) : (
        <Typography>$ {roundAndSeparate(usdPrice, 5, "0.00")}</Typography>
      )}
    </Stack>
  );
}
