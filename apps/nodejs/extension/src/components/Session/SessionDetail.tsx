import type { Session } from "@poktscan/keyring";
import React from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";

interface SessionDetailProps {
  session: Session;
  onClose: () => void;
  onDisconnect: () => void;
  openToggleBlockSite: (
    site: string,
    toBlock?: boolean,
    session?: Session
  ) => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({
  session,
  onClose,
  onDisconnect,
  openToggleBlockSite,
}) => {
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
        <Typography>Origin: {session?.origin?.value || "Extension"}</Typography>
        <Stack direction={"row"} alignItems={"center"} spacing={"5px"}>
          <IconButton sx={{ padding: 0 }} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <IconButton
            sx={{ padding: 0 }}
            onClick={() =>
              openToggleBlockSite(session.origin.value, false, session)
            }
          >
            <BlockIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton sx={{ padding: 0 }} onClick={onDisconnect}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Divider />

      <Typography>Permissions: </Typography>
      <Stack paddingX={"10px"}>
        {session.permissions.map((permission, index) => {
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

export default SessionDetail;
