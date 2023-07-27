import type { RootState } from "../../redux/store";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { IconButton } from "@mui/material";
import Button from "@mui/material/Button";
import { FixedSizeList } from "react-window";
import Typography from "@mui/material/Typography";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Session } from "@poktscan/keyring";
import SessionDetail from "./SessionDetail";
import DisconnectSite from "./DisconnectSite";
import BlockedList from "./BlockedList";
import ToggleBlockSite from "./ToggleBlockSite";

interface ListSessionsProps {
  sessionList: RootState["vault"]["entities"]["sessions"]["list"];
}

const ListSessions: React.FC<ListSessionsProps> = ({ sessionList }) => {
  const [view, setView] = useState<
    "list" | "disconnect" | "detail" | "block-list" | "toggle-block"
  >("list");
  const [selectedSite, setSelectedSite] = useState<string>(null);
  const [selectedSession, setSelectedSession] = useState<Session>(null);
  const toBlockListRef = useRef<boolean>(false);

  const sessions: Session[] = useMemo(() => {
    return sessionList
      .map((serializedSession) => Session.deserialize(serializedSession))
      .filter((item) => item.isValid() && !!item.origin?.value);
  }, [sessionList]);

  const onDisconnectSite = useCallback((session: Session) => {
    setSelectedSession(session);
    setView("disconnect");
  }, []);

  const onClickDetail = useCallback((session: Session) => {
    setView("detail");
    setSelectedSession(session);
  }, []);

  const onCloseDetail = useCallback(() => {
    setView("list");
    setSelectedSession(null);
  }, []);

  const onCloseToggleSite = useCallback(() => {
    setSelectedSite(null);
    setSelectedSession(null);
    setView(toBlockListRef.current ? "block-list" : "list");
    toBlockListRef.current = false;
  }, []);

  const openToggleBlockSite = useCallback(
    (site: string, toBlockList?: boolean, session?: Session) => {
      setSelectedSite(site);
      setView("toggle-block");
      toBlockListRef.current = toBlockList || false;
      if (session) {
        setSelectedSession(session);
      }
    },
    []
  );

  const onClickBlockList = useCallback(() => {
    setView("block-list");
  }, []);

  const content = useMemo(() => {
    if (selectedSession && view === "detail") {
      return (
        <SessionDetail
          session={selectedSession}
          onClose={onCloseDetail}
          openToggleBlockSite={openToggleBlockSite}
          onDisconnect={() => setView("disconnect")}
        />
      );
    }

    if (selectedSession && view === "disconnect") {
      return (
        <DisconnectSite session={selectedSession} onClose={onCloseDetail} />
      );
    }

    if (selectedSite && view === "toggle-block") {
      return (
        <ToggleBlockSite
          site={selectedSite}
          onClose={onCloseToggleSite}
          sessionId={selectedSession?.id}
        />
      );
    }

    if (view === "block-list") {
      return (
        <BlockedList
          onClose={onCloseToggleSite}
          toggleBlockSite={openToggleBlockSite}
        />
      );
    }

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
                  <Stack direction={"row"} spacing={"10px"}>
                    <IconButton
                      sx={{ padding: 0 }}
                      onClick={() =>
                        openToggleBlockSite(
                          sessionItem.origin.value,
                          false,
                          sessionItem
                        )
                      }
                    >
                      <BlockIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      sx={{ padding: 0 }}
                      onClick={() => onDisconnectSite(sessionItem)}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
            );
          }}
        </FixedSizeList>
      </Stack>
    );
  }, [
    sessions,
    onCloseDetail,
    selectedSession,
    onDisconnectSite,
    onClickDetail,
    view,
    selectedSite,
    openToggleBlockSite,
  ]);

  const hideHeader = ["disconnect", "block-list", "toggle-block"].includes(
    view
  );

  return (
    <>
      {!hideHeader && (
        <Stack
          marginTop={"15px"}
          display={view === "disconnect" ? "none" : "flex"}
        >
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Typography variant={"h5"}>Connected Sites</Typography>
            <Button
              sx={{ color: "red", textTransform: "none", fontWeight: 600 }}
              onClick={onClickBlockList}
            >
              Blocks
            </Button>
          </Stack>
        </Stack>
      )}
      {content}
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    sessionList: state.vault.entities.sessions.list,
  };
};

export default connect(mapStateToProps)(ListSessions);
