import React, { useCallback } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { CustomRPC } from "../../redux/slices/app";
import { useAppSelector } from "../../hooks/redux";
import DeleteIcon from "@mui/icons-material/Delete";
import TooltipOverflow from "../common/TooltipOverflow";
import { labelByProtocolMap } from "../../constants/protocols";
import {
  ADD_NETWORK_PAGE,
  REMOVE_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";
import {
  chainIdLabelSelector,
  customRpcsSelector,
} from "../../redux/selectors/network";

interface ItemRPCProps {
  rpc: CustomRPC;
}

export const ItemRPC: React.FC<ItemRPCProps> = ({ rpc }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const chainIdLabel = useAppSelector(chainIdLabelSelector(rpc));

  const onClickEdit = useCallback(() => {
    navigate(`${UPDATE_NETWORK_PAGE}?id=${rpc.id}`);
  }, [navigate, rpc]);

  const onClickRemove = useCallback(() => {
    navigate(`${REMOVE_NETWORK_PAGE}?id=${rpc.id}`);
  }, [navigate, rpc]);

  return (
    <Stack
      height={85}
      paddingX={1}
      paddingTop={0.5}
      paddingBottom={1}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        height={30}
        spacing={0.7}
        width={338}
      >
        <TooltipOverflow
          text={rpc.url}
          textProps={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.5px",
            lineHeight: "30px",
            sx: {
              textDecoration: "underline",
              cursor: "pointer",
            },
          }}
        />
        <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
          <IconButton onClick={onClickEdit}>
            <EditIcon sx={{ fontSize: 15 }} />
          </IconButton>
          <IconButton onClick={onClickRemove}>
            <DeleteIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </Stack>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        Protocol: {labelByProtocolMap[rpc.protocol] || rpc.protocol}
      </Typography>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        Chain ID: {chainIdLabel}
      </Typography>
    </Stack>
  );
};

const ListRPCs: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const customRpcs = useAppSelector(customRpcsSelector);

  const onClickAdd = useCallback(() => {
    navigate(ADD_NETWORK_PAGE);
  }, [navigate]);

  return (
    <Stack
      height={1}
      width={1}
      marginTop={1.5}
      justifyContent={"space-between"}
      spacing={1.5}
      maxHeight={450}
    >
      <Stack flexGrow={1} overflow={"auto"} spacing={1.5}>
        {customRpcs.length ? (
          customRpcs.map((rpc) => <ItemRPC rpc={rpc} key={rpc.id} />)
        ) : (
          <Stack justifyContent={"center"} alignItems={"center"} flexGrow={1}>
            <Typography mt={-2.5} fontSize={13}>
              You don't have any custom RPC yet.
            </Typography>
          </Stack>
        )}
      </Stack>

      <Button
        variant={"contained"}
        fullWidth
        sx={{
          backgroundColor: theme.customColors.primary500,
          height: 35,
          fontWeight: 700,
          fontSize: 16,
        }}
        onClick={onClickAdd}
      >
        Add Custom RPC
      </Button>
    </Stack>
  );
};

export default ListRPCs;
