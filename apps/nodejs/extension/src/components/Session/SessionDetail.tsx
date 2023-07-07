import type { Session } from "@poktscan/keyring";
import React, { useCallback } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch } from "../../hooks/redux";
import { revokeSession as revokeSessionThunk } from "../../redux/slices/vault";

interface SessionDetailProps {
  session: Session;
  onClose: () => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session, onClose }) => {
  const dispatch = useAppDispatch();
  const revokeSession = useCallback(() => {
    dispatch(revokeSessionThunk(session.id)).then(() => onClose());
  }, [session, dispatch, onClose]);

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
        <Typography>Session Detail</Typography>
        <Stack direction={"row"} alignItems={"center"} spacing={"5px"}>
          <IconButton sx={{ padding: 0 }} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <IconButton sx={{ padding: 0 }} onClick={revokeSession}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Typography>Origin: {session?.origin?.value || "Extension"}</Typography>
      <Typography>Valid: {session?.isValid() ? "Yes" : "No"}</Typography>
      <Divider />

      <Typography>Permissions: </Typography>
      <Stack paddingX={"10px"}>
        {session.permissions.map((permission, index) => {
          return (
            <Stack
              padding={"5px"}
              spacing={"3px"}
              borderTop={index !== 0 ? "1px solid lightgray" : undefined}
            >
              <Typography>Resource: {permission.resource}</Typography>
              <Typography>Action: {permission.action}</Typography>
              <Typography>
                Items:{" "}
                {permission.identities.length === 1 &&
                permission.identities[0] === "*"
                  ? "All"
                  : null}
              </Typography>
              {permission.identities.length !== 1 &&
                permission.identities.map((item) => {
                  return (
                    <Stack paddingX={"10px"}>
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
