import type { SerializedSession } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import { connect } from "react-redux";
import {
  BLOCK_SITE_PAGE,
  DISCONNECT_SITE_PAGE,
  SESSIONS_PAGE,
} from "../../constants/routes";

interface SessionDetailProps {
  sessions: SerializedSession[];
}

const SessionDetail: React.FC<SessionDetailProps> = ({ sessions }) => {
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

  const onDisconnectSite = useCallback(() => {
    navigate(`${DISCONNECT_SITE_PAGE}?id=${session.id}`);
  }, [session, navigate]);

  const onBlockSite = useCallback(() => {
    navigate(
      `${BLOCK_SITE_PAGE}?site=${session.origin}&sessionId=${session.id}`
    );
  }, [session, navigate]);

  return (
    <Stack
      sx={{ "& p": { fontSize: "12px!important" } }}
      overflow={"auto"}
      spacing={"5px"}
      marginTop={"10px"}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography>Origin: {session?.origin || "Extension"}</Typography>
        <Stack direction={"row"} alignItems={"center"} spacing={"5px"}>
          <IconButton sx={{ padding: 0 }} onClick={onBlockSite}>
            <BlockIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton sx={{ padding: 0 }} onClick={onDisconnectSite}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Divider />

      <Typography>Permissions: </Typography>
      <Stack paddingX={"10px"}>
        {session?.permissions?.map((permission, index) => {
          return (
            <Stack
              key={`${permission.resource}-${permission.action}`}
              padding={"5px"}
              spacing={"3px"}
              borderTop={index !== 0 ? "1px solid lightgray" : undefined}
            >
              <Typography>Resource: {permission.resource}</Typography>
              <Typography>Action: {permission.action}</Typography>
              <Typography>
                Items:{" "}
                {permission.identities.length > 0 &&
                permission.identities[0] === "*"
                  ? "All"
                  : null}
              </Typography>
              {!(
                permission.identities.length > 0 &&
                permission.identities[0] === "*"
              ) &&
                permission.identities.map((item) => {
                  return (
                    <Stack paddingX={"10px"} key={item}>
                      <Typography fontSize={"10px!important"}>
                        {item}
                      </Typography>
                    </Stack>
                  );
                })}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  sessions: state.vault.entities.sessions.list,
});

export default connect(mapStateToProps)(SessionDetail);
