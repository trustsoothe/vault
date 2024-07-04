import uniq from "lodash/uniq";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Session, SupportedProtocols } from "@poktscan/vault";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { sessionsSelector } from "../../redux/selectors/session";
import { networksSelector } from "../../redux/selectors/network";
import { accountsSelector } from "../../redux/selectors/account";
import { labelByProtocolMap } from "../../constants/protocols";
import ConnectionIcon from "../assets/img/connection_icon.svg";
import useDidMountEffect from "../hooks/useDidMountEffect";
import ConnectionDetailModal from "./ConnectionDetailModal";
import DialogButtons from "../components/DialogButtons";
import MenuDivider from "../components/MenuDivider";
import { useAppSelector } from "../hooks/redux";
import MoreIcon from "../assets/img/more_icon.svg";
import { themeColors } from "../theme";

interface ConnectionItemProps {
  connection: Session;
  openDetailModal: (connection: Session) => void;
}

function ConnectionItem({ connection, openDetailModal }: ConnectionItemProps) {
  const accounts = useAppSelector(accountsSelector);
  const networks = useAppSelector(networksSelector);
  const networkOfConnection = networks.find(
    (network) =>
      network.protocol === connection.protocol &&
      network.chainId ===
        (connection.protocol === SupportedProtocols.Pocket ? "mainnet" : "1")
  );

  const addressesOfAccountsConnected = uniq(
    connection.permissions
      .filter((item) => item.resource === "account")
      .reduce(
        (acc: string[], permission) => [...acc, ...permission.identities],
        []
      )
  );

  const accountsConnected = accounts.filter((account) =>
    addressesOfAccountsConnected.includes(account.address)
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const disconnect = () => {
    AppToBackground.revokeSession(connection.id).then((result) => {
      if (result.error) {
        enqueueErrorSnackbar({
          onRetry: disconnect,
          message: {
            title: "Failed to Disconnect",
            content: `There was an error while disconnecting ${connection.origin.value} website.`,
          },
          variant: "error",
        });
      } else {
        enqueueSnackbar({
          message: {
            title: "Site Disconnected",
            content: `${connection.origin.value} was disconnected successfully.`,
          },
          variant: "success",
        });
      }
    });
  };

  return (
    <>
      <SmallGrayContainer>
        <img
          height={15}
          width={15}
          src={networkOfConnection.iconUrl}
          alt={`${networkOfConnection.protocol}-icon`}
        />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {labelByProtocolMap[connection.protocol]}
          </Typography>
          <Typography
            width={254}
            noWrap={true}
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {accountsConnected.length}{" "}
            {`Account${accountsConnected.length === 1 ? "" : "s"}`}
            <span
              style={{
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                marginLeft: "8px",
              }}
            >
              {connection.origin.value}
            </span>
          </Typography>
        </Stack>
        <IconButton
          sx={{ height: 25, width: 27, borderRadius: "8px" }}
          onClick={handleClick}
        >
          <MoreIcon />
        </IconButton>
      </SmallGrayContainer>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 190,
              marginTop: 0.8,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            openDetailModal(connection);
            handleClose();
          }}
        >
          View Details
        </MenuItem>
        <MenuDivider />
        <MenuItem
          className={"sensitive"}
          onClick={() => {
            disconnect();
            handleClose();
          }}
        >
          Disconnect
        </MenuItem>
      </Menu>
    </>
  );
}

export default function SiteConnections() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [connectionToDetail, setConnectionToDetail] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const connections = useAppSelector(sessionsSelector);

  const [connectionsToShow, setConnectionsToShow] = useState(
    connections
      .filter((item) => {
        const session = Session.deserialize(item);
        return session.isValid() && !!session.origin?.value;
      })
      .map((item) => Session.deserialize(item))
  );

  useDidMountEffect(() => {
    setConnectionsToShow(
      connections
        .filter((item) => {
          const session = Session.deserialize(item);
          return session.isValid() && !!session.origin?.value;
        })
        .map((item) => Session.deserialize(item))
    );
  }, [connections]);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionsToShow((prev) => prev.filter((item) => item.isValid()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const disconnectAll = () => {
    setIsLoading(true);
    AppToBackground.revokeAllExternalSessions()
      .then((res) => {
        if (res.error) {
          enqueueErrorSnackbar({
            onRetry: disconnectAll,
            message: "Error disconnecting all connections",
            variant: "error",
          });
        } else {
          enqueueSnackbar({
            message: `All websites have been disconnected`,
            variant: "success",
          });
        }
      })
      .finally(() => setIsLoading(false));
  };

  const openDetailModal = (connection: Session) => {
    setShowDetailModal(true);
    setConnectionToDetail(connection);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setTimeout(() => setConnectionToDetail(null), 150);
  };

  return (
    <>
      <ConnectionDetailModal
        connection={connectionToDetail}
        onClose={closeDetailModal}
        open={showDetailModal}
      />
      {connectionsToShow.length === 0 ? (
        <Stack
          flexGrow={1}
          paddingTop={4}
          alignItems={"center"}
          bgcolor={themeColors.white}
        >
          <ConnectionIcon />
          <Typography>You are not connected to any website.</Typography>
        </Stack>
      ) : (
        <Stack
          width={1}
          height={1}
          bgcolor={themeColors.white}
          justifyContent={"space-between"}
        >
          <Stack
            flexGrow={1}
            minHeight={0}
            flexBasis={"1px"}
            overflow={"auto"}
            marginY={2.4}
            marginLeft={2.4}
            marginRight={2}
            paddingRight={0.4}
            spacing={1.2}
          >
            {connectionsToShow.map((item) => (
              <ConnectionItem
                key={item.id}
                connection={item}
                openDetailModal={openDetailModal}
              />
            ))}
          </Stack>
          <DialogButtons
            containerProps={{
              sx: {
                height: 85,
              },
            }}
            primaryButtonProps={{
              children: "Disconnect All",
              variant: "text",
              disabled: isLoading,
              onClick: disconnectAll,
              sx: {
                color: themeColors.red,
                backgroundColor: themeColors.white,
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
              },
            }}
          />
        </Stack>
      )}
    </>
  );
}
