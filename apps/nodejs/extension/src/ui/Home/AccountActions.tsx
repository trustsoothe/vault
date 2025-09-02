import type { IAsset } from "../../redux/slices/app";
import React, { useMemo, useState } from "react";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "react-router-dom";
import {
  PocketNetworkTransactionTypes,
  SupportedProtocols,
} from "@soothe/vault";
import PoktscanLogo from "../assets/img/poktscan_small_icon.svg";
import {
  explorerAccountUrlSelector,
  isAssetsDisabledSelector,
  isPoktTransactionActionsDisabledSelector,
  selectedChainSelector,
  selectedNetworkSelector,
} from "../../redux/selectors/network";
import { selectedAccountSelector } from "../../redux/selectors/account";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import SmallGrayContainer from "../components/SmallGrayContainer";
import useSelectedAsset from "./hooks/useSelectedAsset";
import ManageAssetsModal from "./ManageAssetsModal";
import { roundAndSeparate } from "../../utils/ui";
import { useAppSelector } from "../hooks/redux";
import { themeColors } from "../theme";
import {
  assetsIdOfSelectedAccountSelector,
  assetsSelector,
  existsAssetsForSelectedNetworkSelector,
} from "../../redux/selectors/asset";
import PoktTransactionModal from "../PoktTransaction/PoktTransactionModal";
import { getTransactionTypeLabel } from "../Request/PoktTransactionRequest";
import NetworkNotice from "../components/NetworkNotice";

interface AssetItemProps {
  asset: IAsset;
  onSelectAsset: (asset: IAsset) => void;
}

function AssetItem({ asset, onSelectAsset }: AssetItemProps) {
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);

  const {
    balance,
    usdBalance,
    isLoadingUsdPrice,
    isLoadingBalance,
    balanceError,
    usdPriceError,
    coinSymbol,
  } = useBalanceAndUsdPrice({
    address: selectedAccount.address,
    chainId: asset.chainId,
    protocol: selectedAccount.protocol,
    nameOnError: selectedAccount.name,
    interval: 60000,
    asset,
  });

  return (
    <Button
      sx={{
        height: 55,
        paddingY: 1,
        paddingX: 1.5,
        fontWeight: 400,
        borderRadius: "8px",
        backgroundColor: themeColors.bgLightGray,
      }}
      onClick={() => onSelectAsset(asset)}
    >
      <Stack width={1} spacing={1.2} direction={"row"} alignItems={"center"}>
        <img
          width={23}
          height={23}
          src={asset.iconUrl}
          alt={`${asset.label || asset.symbol}-icon`}
        />
        <Stack
          flexGrow={1}
          minWidth={0}
          alignItems={"flex-start"}
          spacing={0.5}
        >
          <Typography
            variant={"subtitle2"}
            lineHeight={"16px"}
            noWrap={true}
            color={themeColors.black}
          >
            {asset.symbol}
          </Typography>
          <Typography
            lineHeight={"14px"}
            fontSize={11}
            color={themeColors.textSecondary}
          >
            {asset.label || asset.symbol}
          </Typography>
        </Stack>
      </Stack>
      <Stack alignItems={"flex-end"} spacing={0.4}>
        {isLoadingBalance ? (
          <Skeleton variant={"rectangular"} width={75} height={16} />
        ) : (
          <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
            <Typography
              width={1}
              noWrap={true}
              maxWidth={100}
              lineHeight={"16px"}
              textAlign={"right"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {balanceError
                ? "-"
                : roundAndSeparate(balance, asset.decimals, "0")}
            </Typography>
            <Typography
              variant={"subtitle2"}
              lineHeight={"16px"}
              color={themeColors.black}
            >
              {coinSymbol}
            </Typography>
          </Stack>
        )}
        {isLoadingUsdPrice ? (
          <Skeleton variant={"rectangular"} width={50} height={14} />
        ) : (
          <Typography
            variant={"body2"}
            lineHeight={"14px"}
            whiteSpace={"nowrap"}
            color={themeColors.textSecondary}
          >
            $ {usdPriceError ? "-" : roundAndSeparate(usdBalance, 2, "0.00")}
          </Typography>
        )}
      </Stack>
    </Button>
  );
}

export default function AccountActions() {
  const [showManageAssetsModal, setShowManageAssetsModal] = useState(false);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedNetwork = useAppSelector(selectedNetworkSelector);
  const [_, setURLSearchParams] = useSearchParams();
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedAsset = useSelectedAsset();
  const explorerAccountUrl = useAppSelector(
    explorerAccountUrlSelector(!!selectedAsset)
  );
  const protocol = selectedAccount?.protocol;

  const existsAssetsForSelectedNetwork = useAppSelector(
    existsAssetsForSelectedNetworkSelector
  );
  const assetsIdOfAccount = useAppSelector(
    assetsIdOfSelectedAccountSelector,
    shallowEqual
  );
  const assets = useAppSelector(assetsSelector);
  const isPoktTransactionActionsDisabled = useAppSelector(
    isPoktTransactionActionsDisabledSelector
  );
  const isAssetsDisabled = useAppSelector(isAssetsDisabledSelector);
  const isDevMode = useAppSelector((state) => state.app.isDevMode);

  const assetsOfAccount = useMemo(
    () =>
      isAssetsDisabled
        ? []
        : assets.filter(
            (asset) =>
              (assetsIdOfAccount || []).includes(asset.id) &&
              asset.protocol === protocol &&
              asset.chainId === selectedChain
          ),
    [
      protocol,
      selectedChain,
      selectedAccount?.address,
      assetsIdOfAccount,
      isAssetsDisabled,
    ]
  );

  let explorerAccountLink: string, domain: string;

  if (explorerAccountUrl && selectedAccount?.address) {
    explorerAccountLink = explorerAccountUrl.replace(
      ":address",
      selectedAccount.address
    );

    if (selectedAsset) {
      explorerAccountLink = explorerAccountLink.replace(
        ":contractAddress",
        selectedAsset.contractAddress
      );
    }

    const url = new URL(explorerAccountLink);

    domain = url.hostname.split(".").slice(-2).join(".");
  }

  const openManageAssetsModal = () => setShowManageAssetsModal(true);
  const closeManageAssetsModal = () => setShowManageAssetsModal(false);

  const onSelectAsset = (asset: IAsset) => {
    setURLSearchParams({ asset: asset.id });
  };

  return (
    <>
      <ManageAssetsModal
        open={showManageAssetsModal}
        onClose={closeManageAssetsModal}
      />
      <Stack
        flexGrow={1}
        spacing={1.2}
        minHeight={0}
        paddingX={2.4}
        paddingY={2.5}
        flexBasis={"1px"}
        overflow={"auto"}
        bgcolor={themeColors.white}
      >
        {assetsOfAccount.length > 0 &&
          !selectedAsset &&
          assetsOfAccount.map((asset) => (
            <AssetItem
              asset={asset}
              key={asset.id}
              onSelectAsset={onSelectAsset}
            />
          ))}

        <Button
          fullWidth
          component={"a"}
          target={"_blank"}
          href={explorerAccountLink}
          sx={{
            height: 55,
            paddingY: 1,
            paddingLeft: 1.5,
            paddingRight: 1.8,
            borderRadius: "8px",
            textDecoration: "none",
            boxSizing: "border-box",
            backgroundImage: "linear-gradient(to right, #f6f2ff 0%, #e8edfa)",
            "&:hover": {
              backgroundColor: themeColors.gray,
            },
          }}
        >
          <Stack width={1} direction={"row"}>
            <Stack flexGrow={1}>
              <Typography variant={"subtitle2"} color={themeColors.black}>
                Explore
              </Typography>
              <Typography fontSize={11}>Open {domain}</Typography>
            </Stack>
            {[SupportedProtocols.Pocket, SupportedProtocols.Cosmos].includes(
              protocol
            ) && (
              <Stack alignItems={"center"} justifyContent={"center"}>
                <PoktscanLogo />
              </Stack>
            )}
          </Stack>
        </Button>

        {selectedNetwork?.wip && (
          <NetworkNotice notice={selectedNetwork?.wip} />
        )}

        {selectedNetwork?.notices?.length > 0 &&
          selectedNetwork.notices.map((notice) => (
            <NetworkNotice key={notice.name} notice={notice} />
          ))}

        {protocol === SupportedProtocols.Pocket &&
          !isPoktTransactionActionsDisabled &&
          isDevMode && <PoktTransactionActions />}
        {protocol === SupportedProtocols.Ethereum &&
          !isAssetsDisabled &&
          existsAssetsForSelectedNetwork &&
          !selectedAsset && (
            <Button sx={{ padding: 0 }} onClick={openManageAssetsModal}>
              <SmallGrayContainer>
                <Stack flexGrow={1} spacing={0.4} alignItems={"flex-start"}>
                  <Typography
                    lineHeight={"16px"}
                    variant={"subtitle2"}
                    color={themeColors.black}
                  >
                    Manage Assets
                  </Typography>
                  <Typography fontSize={11} lineHeight={"14px"}>
                    Add tokens to you Ethereum account.
                  </Typography>
                </Stack>
                <Stack
                  width={19}
                  height={19}
                  borderRadius={"50%"}
                  alignItems={"center"}
                  boxSizing={"border-box"}
                  justifyContent={"center"}
                  bgcolor={themeColors.textSecondary}
                >
                  <Typography lineHeight={"13px"} color={themeColors.white}>
                    {assetsOfAccount.length}
                  </Typography>
                </Stack>
              </SmallGrayContainer>
            </Button>
          )}
      </Stack>
    </>
  );
}

function PoktTransactionActions() {
  const [selectedType, setSelectedType] =
    useState<PocketNetworkTransactionTypes>(null);

  const closeModal = () => setSelectedType(null);

  const items = [
    {
      description: "Execute a stake node transaction",
      type: PocketNetworkTransactionTypes.NodeStake,
    },
    {
      description: "Execute an unstake node transaction",
      type: PocketNetworkTransactionTypes.NodeUnstake,
    },
    {
      description: "Execute an unjail node transaction",
      type: PocketNetworkTransactionTypes.NodeUnjail,
    },
    {
      description: "Execute a stake app transaction",
      type: PocketNetworkTransactionTypes.AppStake,
    },
    {
      description: "Execute a change param transaction",
      type: PocketNetworkTransactionTypes.GovChangeParam,
    },
    {
      description: "Execute a DAO transfer transaction",
      type: PocketNetworkTransactionTypes.GovDAOTransfer,
    },
    {
      description: "Execute an upgrade transaction",
      type: PocketNetworkTransactionTypes.GovUpgrade,
    },
  ];

  return (
    <>
      <PoktTransactionModal type={selectedType} onClose={closeModal} />
      <Divider
        flexItem
        sx={{
          "& span": {
            color: themeColors.textSecondary,
          },
        }}
      >
        Transactions
      </Divider>
      {items.map((item) => (
        <Button
          fullWidth
          key={item.type}
          sx={{
            height: 55,
            padding: 0,
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
          onClick={() => {
            setSelectedType(item.type);
          }}
        >
          <SmallGrayContainer
            flexGrow={1}
            sx={{ flexDirection: "column!important", alignItems: "flex-start" }}
          >
            <Typography variant={"subtitle2"} color={themeColors.black}>
              {getTransactionTypeLabel(item.type)}
            </Typography>
            <Typography fontSize={11}>{item.description}</Typography>
          </SmallGrayContainer>
        </Button>
      ))}
    </>
  );
}
