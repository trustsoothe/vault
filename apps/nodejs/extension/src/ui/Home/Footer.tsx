import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import useUsdPrice from "../hooks/useUsdPrice";
import { themeColors } from "../theme";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import useSelectedAsset from "./hooks/useSelectedAsset";

export default function Footer() {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAsset = useSelectedAsset();

  const { isLoading, usdPrice, coinSymbol } = useUsdPrice({
    protocol: selectedProtocol,
    chainId: selectedChain,
    asset: selectedAsset,
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
      <Stack alignItems={"left"}>
        <Typography color={themeColors.gray}>v{process.env.APP_VERSION}</Typography>
      </Stack>
      <Stack direction={"row"} alignItems={"center"} gap={0.6}>
        <Typography color={themeColors.gray}>{coinSymbol} Price </Typography>
        {isLoading ? (
          <Skeleton width={70} height={20} variant={"rectangular"} />
        ) : (
          <Typography>$ {roundAndSeparate(usdPrice, 5, "0.00")}</Typography>
        )}
      </Stack>
    </Stack>
  );
}
