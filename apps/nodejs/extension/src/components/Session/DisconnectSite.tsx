import type { SerializedSession } from "@soothe/vault";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { SITES_PAGE } from "../../constants/routes";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import { sessionsSelector } from "../../redux/selectors/session";

const DisconnectSite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<SerializedSession>(null);

  const sessions = useAppSelector(sessionsSelector);

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(SITES_PAGE);
    }
  }, [navigate, location]);

  useEffect(() => {
    const id = searchParams.get("id");
    const sessionFromStore = sessions.find((item) => item.id === id);
    if (sessionFromStore && session?.id !== id) {
      setSession(sessionFromStore);
      return;
    }

    if (!sessionFromStore) {
      onCancel();
    }
  }, [searchParams, sessions]);

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const disconnect = useCallback(() => {
    setStatus("loading");
    AppToBackground.revokeSession(session.id).then((result) => {
      if (result.error) {
        setStatus("error");
      } else {
        enqueueSnackbar({
          message: `Site disconnected successfully.`,
          variant: "success",
        });
        navigate(SITES_PAGE);
      }
    });
  }, [session]);

  return useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error disconnecting the website."}
          onCancel={onCancel}
          onRetry={disconnect}
        />
      );
    }

    return (
      <Stack
        flexGrow={1}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={"15px"}
      >
        <Typography fontSize={16} textAlign={"center"}>
          Are you sure you want to disconnect{" "}
          <span style={{ fontWeight: 600 }}>"{session?.origin}"</span> website?
        </Typography>
        <Stack direction={"row"} width={250} spacing={"15px"}>
          <Button
            variant={"outlined"}
            sx={{ textTransform: "none", height: 30, fontWeight: 500 }}
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant={"contained"}
            sx={{ textTransform: "none", height: 30, fontWeight: 600 }}
            onClick={disconnect}
            fullWidth
          >
            Yes
          </Button>
        </Stack>
      </Stack>
    );
  }, [status, disconnect, session, onCancel]);
};

export default DisconnectSite;
