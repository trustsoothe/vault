import React, { useCallback, useMemo, useState } from "react";
import { Session } from "@poktscan/keyring";
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { revokeSession as revokeSessionThunk } from "../../redux/slices/vault";
import { useAppDispatch } from "../../hooks/redux";
import SessionDetail from "./SessionDetail";

interface ListSessionsProps {
  session: RootState["vault"]["vaultSession"];
  isLoading: boolean;
  sessionList: RootState["vault"]["entities"]["sessions"]["list"];
}

const ListSessions: React.FC<ListSessionsProps> = ({
  session,
  isLoading,
  sessionList,
}) => {
  const [sessionToDetail, setSessionToDetail] = useState<Session>(null);
  const dispatch = useAppDispatch();

  const sessions: Session[] = useMemo(() => {
    return sessionList.map((serializedSession) =>
      Session.deserialize(serializedSession)
    );
  }, [sessionList]);

  const revokeSession = useCallback(
    (sessionIdToRevoke: string) => {
      dispatch(revokeSessionThunk(sessionIdToRevoke));
    },
    [dispatch]
  );

  const onClickDetail = useCallback((session: Session) => {
    setSessionToDetail(session);
  }, []);

  const onCloseDetail = useCallback(() => {
    setSessionToDetail(null);
  }, []);

  if (sessionToDetail) {
    return <SessionDetail session={sessionToDetail} onClose={onCloseDetail} />;
  }

  return (
    <Stack flexGrow={1} overflow={"auto"} marginTop={"10px"} paddingX={"7px"}>
      {sessions.map((sessionItem, index) => (
        <Stack
          borderTop={index !== 0 ? "1px solid lightgray" : undefined}
          paddingY={"10px"}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          paddingX={"8px"}
          // @ts-ignore
          key={sessionItem._id}
        >
          <Stack>
            <Typography fontSize={12}>
              Origin: {sessionItem?.origin?.value || "Extension"}
            </Typography>
            <Typography fontSize={12}>
              Permissions: {sessionItem.permissions.length}
            </Typography>
            <Typography fontSize={12}>
              Valid: {sessionItem.isValid() ? "Yes" : "No"}
            </Typography>
          </Stack>

          <Stack spacing={"10px"} width={"min-content"}>
            <IconButton
              sx={{ padding: 0 }}
              onClick={() => onClickDetail(sessionItem)}
            >
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              sx={{ padding: 0 }}
              // @ts-ignore
              onClick={() => revokeSession(sessionItem._id)}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    session: state.vault.vaultSession,
    sessionList: state.vault.entities.sessions.list,
    isLoading: state.vault.entities.sessions.loading,
  };
};

export default connect(mapStateToProps)(ListSessions);
