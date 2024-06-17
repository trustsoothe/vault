import Menu from "@mui/material/Menu";
import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { removeCustomRpc } from "../../redux/slices/app/network";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { enqueueErrorSnackbar, enqueueSnackbar } from "../../utils/ui";
import SmallGrayContainer from "../components/SmallGrayContainer";
import { labelByProtocolMap } from "../../constants/protocols";
import DialogButtons from "../components/DialogButtons";
import SaveCustomRPCModal from "./SaveCustomRPCModal";
import MenuDivider from "../components/MenuDivider";
import MoreIcon from "../assets/img/more_icon.svg";
import { CustomRPC } from "../../redux/slices/app";
import RPCIcon from "../assets/img/rpc_icon.svg";
import {
  customRpcsSelector,
  networksSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";

interface CustomRPCItemProps {
  customRpc: CustomRPC;
  openSaveModal: (customRpc: CustomRPC) => void;
}

function CustomRPCItem({ customRpc, openSaveModal }: CustomRPCItemProps) {
  const dispatch = useAppDispatch();
  const networks = useAppSelector(networksSelector);
  const networkOfRpc = networks.find(
    (network) =>
      network.protocol === customRpc.protocol &&
      network.chainId === customRpc.chainId
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const removeRpc = () => {
    dispatch(removeCustomRpc(customRpc.id))
      .unwrap()
      .then(() => {
        enqueueSnackbar({
          message: `RPC removed successfully.`,
          variant: "success",
        });
      })
      .catch(() => {
        enqueueErrorSnackbar({
          message: `RPC removed successfully.`,
          variant: "error",
          onRetry: removeRpc,
        });
      });
  };

  return (
    <>
      <SmallGrayContainer>
        <img
          height={15}
          width={15}
          src={networkOfRpc.iconUrl}
          alt={`${networkOfRpc.protocol}-${networkOfRpc.chainId}-icon`}
        />
        <Stack spacing={0.4} flexGrow={1}>
          <Typography variant={"subtitle2"} lineHeight={"16px"}>
            {labelByProtocolMap[customRpc.protocol]}{" "}
            <span style={{ color: themeColors.gray }}>
              ({networkOfRpc.chainIdLabel})
            </span>
          </Typography>
          <Typography
            width={254}
            noWrap={true}
            variant={"body2"}
            lineHeight={"14px"}
            color={themeColors.textSecondary}
          >
            {customRpc.url}
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
            openSaveModal(customRpc);
            handleClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuDivider />
        <MenuItem className={"sensitive"} onClick={removeRpc}>
          Remove RPC
        </MenuItem>
      </Menu>
    </>
  );
}

export default function CustomRPCs() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [rpcToUpdate, setRpcToUpdate] = useState<CustomRPC>(null);
  const customRpcs = useAppSelector(customRpcsSelector);

  const openSaveModal = (customRpc?: CustomRPC) => {
    if (customRpc) {
      setRpcToUpdate(customRpc);
    }
    setShowSaveModal(true);
  };
  const closeSaveModal = () => {
    setShowSaveModal(false);
    setRpcToUpdate(null);
  };

  return (
    <>
      <SaveCustomRPCModal
        open={showSaveModal}
        onClose={closeSaveModal}
        rpcToUpdate={rpcToUpdate}
      />
      <Stack
        height={449}
        spacing={1.2}
        marginX={-2.4}
        marginTop={2.7}
        marginBottom={-2.4}
        width={"calc(100% + 48px)"}
        justifyContent={"space-between"}
      >
        {customRpcs.length === 0 ? (
          <Stack
            width={1}
            alignItems={"center"}
            justifyContent={"center"}
            paddingTop={1.1}
          >
            <RPCIcon />
            <Typography>You don’t have any Custom RPC yet.</Typography>
          </Stack>
        ) : (
          <Stack
            flexGrow={1}
            minHeight={0}
            marginY={2.4}
            paddingX={2.4}
            spacing={1.2}
            flexBasis={"1px"}
            overflow={"auto"}
          >
            {customRpcs.map((rpc) => (
              <CustomRPCItem
                customRpc={rpc}
                key={rpc.id}
                openSaveModal={openSaveModal}
              />
            ))}
          </Stack>
        )}
        <DialogButtons
          containerProps={{
            sx: {
              height: 85,
            },
          }}
          primaryButtonProps={{
            children: "Add Custom RPC",
            variant: "text",
            onClick: () => openSaveModal(),
            sx: {
              backgroundColor: themeColors.white,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            },
          }}
        />
      </Stack>
    </>
  );
}
