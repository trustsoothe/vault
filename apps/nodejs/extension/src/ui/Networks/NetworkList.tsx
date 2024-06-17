import orderBy from "lodash/orderBy";
import React, { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { labelByProtocolMap } from "../../constants/protocols";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import {
  canNetworkBeSelected,
  networksSelector,
  selectedChainSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";
import {
  changeSelectedNetwork,
  Network,
  toggleNetworkCanBeSelected,
} from "../../redux/slices/app";

interface NetworkItemProps {
  network: Network;
}

function NetworkItem({ network }: NetworkItemProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedChain = useAppSelector(selectedChainSelector);
  const canBeSelected = useAppSelector(canNetworkBeSelected(network));

  const toggleCanBeSelected = () => {
    dispatch(toggleNetworkCanBeSelected(network))
      .unwrap()
      .then(() => {
        if (searchParams.get("adding") === "true" && !canBeSelected) {
          dispatch(
            changeSelectedNetwork({
              network: network.protocol,
              chainId: network.chainId,
            })
          )
            .unwrap()
            .then(() => {
              enqueueSnackbar({
                message: (
                  <span style={{ fontSize: 12 }}>
                    Network added and selected successfully.
                  </span>
                ),
                variant: "success",
                autoHideDuration: 4000,
              });
              navigate(ACCOUNTS_PAGE);
            })
            .catch(() =>
              enqueueSnackbar({
                message: "Network added but failed to be selected.",
                variant: "error",
                autoHideDuration: 4000,
              })
            );
        } else {
          enqueueSnackbar({
            message: `Network ${
              canBeSelected ? "removed" : "added"
            } successfully`,
            variant: "success",
            autoHideDuration: 4000,
          });
        }
      })
      .catch(() =>
        enqueueErrorSnackbar({
          message: `Failed trying to ${
            canBeSelected ? "remove" : "add"
          } the network`,
          variant: "error",
          autoHideDuration: 4000,
          onRetry: toggleCanBeSelected,
        })
      );
  };

  return (
    <SmallGrayContainer>
      <img
        src={network.iconUrl}
        alt={`${network.protocol}-${network.chainId}-img`}
        width={15}
        height={15}
      />
      <Stack spacing={0.4} flexGrow={1}>
        <Typography variant={"subtitle2"} lineHeight={"16px"}>
          {network.label}{" "}
          <span style={{ color: themeColors.gray }}>
            ({network.currencySymbol})
          </span>
        </Typography>
        <Typography
          variant={"body2"}
          lineHeight={"14px"}
          color={themeColors.textSecondary}
        >
          {labelByProtocolMap[network.protocol] || network.protocol}
          <span style={{ marginLeft: "8px" }}>
            Chain ID: {network.chainIdLabel}
          </span>
        </Typography>
      </Stack>
      {!network.isDefault && network.chainId !== selectedChain && (
        <Stack>
          <Switch
            checked={canBeSelected}
            onChange={toggleCanBeSelected}
            size={"small"}
          />
        </Stack>
      )}
    </SmallGrayContainer>
  );
}

export default function NetworkList() {
  const networks = useAppSelector(networksSelector);

  const networksOrdered = useMemo(() => {
    return orderBy(
      networks.map((item) => ({
        ...item,
        rank: item.isDefault ? 1 : 2,
      })),
      ["rank"],
      ["asc"]
    );
  }, [networks]);

  return (
    <Stack
      height={425}
      width={1}
      spacing={1.2}
      marginTop={2.7}
      overflow={"auto"}
    >
      {networksOrdered.map((network) => (
        <NetworkItem network={network} key={network.id} />
      ))}
    </Stack>
  );
}
