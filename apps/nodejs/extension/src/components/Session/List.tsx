import type { RootState } from "../../redux/store";
import React, { useCallback, useMemo } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { IconButton } from "@mui/material";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Session } from "@poktscan/keyring";
import { CONNECTED_SITE_DETAIL_PAGE } from "../../constants/routes";

interface ListSessionsProps {
  sessionList: RootState["vault"]["entities"]["sessions"]["list"];
}

const ListSessions: React.FC<ListSessionsProps> = ({ sessionList }) => {
  const navigate = useNavigate();

  const sessions: Session[] = useMemo(() => {
    return sessionList
      .map((serializedSession) => Session.deserialize(serializedSession))
      .filter((item) => item.isValid() && !!item.origin?.value);
  }, [sessionList]);

  const onClickDetail = useCallback(
    (session: Session) => {
      navigate(`${CONNECTED_SITE_DETAIL_PAGE}?id=${session.id}`);
    },
    [navigate]
  );

  const content = useMemo(() => {
    if (!sessions.length) {
      return (
        <Stack
          flexGrow={1}
          alignItems={"center"}
          justifyContent={"center"}
          sx={{
            "& p": {
              fontSize: "14px!important",
            },
          }}
        >
          <Typography mt={"-50px"} fontWeight={500}>
            You are not connected to any website.
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack
        flexGrow={1}
        overflow={"auto"}
        marginTop={"10px"}
        paddingX={"7px"}
        boxSizing={"border-box"}
      >
        <FixedSizeList
          itemData={sessions}
          itemSize={66}
          height={383}
          itemCount={sessions.length}
          width={"100%"}
        >
          {({ index, data, style }) => {
            const sessionItem = data[index];
            return (
              <Stack
                borderTop={index !== 0 ? "1px solid lightgray" : undefined}
                paddingY={"10px"}
                direction={"row"}
                alignItems={"center"}
                justifyContent={"space-between"}
                paddingX={"4px"}
                key={sessionItem.id}
                style={style}
                boxSizing={"border-box"}
              >
                <Stack spacing={"5px"}>
                  <Typography fontSize={12}>
                    Origin: {sessionItem?.origin?.value || "Extension"}
                  </Typography>
                  <Typography fontSize={12}>
                    Permissions: {sessionItem.permissions.length}
                  </Typography>
                </Stack>

                <Stack spacing={"10px"} width={"min-content"}>
                  <IconButton
                    sx={{ padding: 0 }}
                    onClick={() => onClickDetail(sessionItem)}
                  >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Stack>
            );
          }}
        </FixedSizeList>
      </Stack>
    );
  }, [sessions, onClickDetail]);

  return <>{content}</>;
};

const mapStateToProps = (state: RootState) => {
  return {
    sessionList: state.vault.entities.sessions.list,
  };
};

export default connect(mapStateToProps)(ListSessions);
