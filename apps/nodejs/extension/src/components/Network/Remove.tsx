import type { CustomRPC } from "../../redux/slices/app";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { NETWORKS_PAGE } from "../../constants/routes";
import { enqueueSnackbar } from "../../utils/ui";
import { removeCustomRpc } from "../../redux/slices/app/network";
import { customRpcsSelector } from "../../redux/selectors/network";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { ItemRPC } from "./ListRPCs";

const RemoveRpc: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [rpc, setRpc] = useState<CustomRPC>(null);
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const customRpcs = useAppSelector(customRpcsSelector);

  const onCancel = useCallback(() => {
    navigate(`${NETWORKS_PAGE}?tab=customs`);
  }, [navigate, location]);

  useEffect(() => {
    const id = searchParams.get("id");
    const rpcFromStore = customRpcs.find((item) => item.id === id);
    if (rpcFromStore && rpc?.id !== id) {
      setRpc(rpcFromStore);
      return;
    }

    if (!rpcFromStore) {
      onCancel();
    }
  }, [searchParams, customRpcs]);

  const removeRpc = useCallback(() => {
    if (rpc) {
      setStatus("loading");
      dispatch(removeCustomRpc(rpc.id))
        .unwrap()
        .then(() => {
          enqueueSnackbar({
            message: `RPC removed successfully.`,
            variant: "success",
          });
          navigate(`${NETWORKS_PAGE}?tab=customs`);
        })
        .catch(() => {
          setStatus("error");
        });
    }
  }, [rpc, dispatch]);

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error removing the RPC."}
          onCancel={onCancel}
          onRetry={removeRpc}
        />
      );
    }

    return (
      <Stack flexGrow={1} marginTop={3.5} justifyContent={"space-between"}>
        <Stack flexGrow={1}>
          <Typography
            fontSize={18}
            width={1}
            marginBottom={"30px!important"}
            textAlign={"center"}
            fontWeight={700}
            lineHeight={"28px"}
            color={theme.customColors.primary999}
          >
            Are you sure you want to remove the following RPC?
          </Typography>
          {rpc && <ItemRPC rpc={rpc} />}
        </Stack>
        <Stack direction={"row"} width={1} spacing={2}>
          <Button
            variant={"outlined"}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            onClick={removeRpc}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, removeRpc, rpc, onCancel]);
};

export default RemoveRpc;
