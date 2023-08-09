import type { SerializedSession } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { enqueueSnackbar } from "notistack";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { SESSIONS_PAGE } from "../../constants/routes";

interface DisconnectSiteProps {
  sessions: SerializedSession[];
}

const DisconnectSite: React.FC<DisconnectSiteProps> = ({ sessions }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<SerializedSession>(null);

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(SESSIONS_PAGE);
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
          style: { width: 250, minWidth: "250px!important" },
          message: `Site disconnected successfully.`,
          variant: "success",
          autoHideDuration: 2500,
        });
        navigate(SESSIONS_PAGE);
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

const mapStateToProps = (state: RootState) => ({
  sessions: state.vault.entities.sessions.list,
});

export default connect(mapStateToProps)(DisconnectSite);
