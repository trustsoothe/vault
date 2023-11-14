import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { Session } from "@poktscan/keyring";
import { DISCONNECT_SITE_PAGE } from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar } from "../../utils/ui";
import ExpandIcon from "../../assets/img/expand_icon.svg";
import { useAppSelector } from "../../hooks/redux";

interface ListSessionsProps {
  sessionList: RootState["vault"]["entities"]["sessions"]["list"];
}

interface ListItemProps {
  session: Session;
}

const secsInHour = 3600;

function pad(a, b = 2) {
  return (1e15 + a + "").slice(-b);
}

const secsToText = (secs: number) => {
  if (secs > secsInHour) {
    const hours = Math.floor(secs / secsInHour);
    secs -= hours * secsInHour;
    const minutes = Math.floor(secs / 60);
    secs -= minutes * 60;
    const seconds = Math.floor(secs);

    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else if (secs > 60) {
    const minutes = Math.floor(secs / 60);
    secs -= minutes * 60;
    const seconds = Math.floor(secs);

    return `${minutes}:${pad(seconds)}`;
  } else {
    const seconds = Math.floor(secs);
    return `0:${pad(seconds)}`;
  }
};

const ListItem: React.FC<ListItemProps> = ({ session }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [secsToExpire, setSecsToExpire] = useState(0);
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );

  useEffect(() => {
    const sessionSerialized = session.serialize();

    const handler = () => {
      setSecsToExpire(
        (sessionSerialized.lastActivity +
          sessionSerialized.maxAge * 1000 -
          Date.now()) /
          1000
      );
    };

    handler();
    const interval = setInterval(handler, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session]);

  const onClickDisconnect = useCallback(() => {
    navigate(`${DISCONNECT_SITE_PAGE}?id=${session.id}`);
  }, [session]);

  const toggleExpandAccounts = useCallback(() => {
    setAccountsExpanded((prevState) => !prevState);
  }, []);

  const accountsComponent = useMemo(() => {
    if (!accountsExpanded) {
      return null;
    }

    const idMap = session.permissions
      .filter((item) => item.resource === "account")
      .reduce(
        (acc: string[], permission) => [...acc, ...permission.identities],
        []
      );

    return accounts
      .filter((account) => idMap.includes(account.id))
      .map(({ address, name }) => {
        const addressFirstCharacters = address?.substring(0, 4);
        const addressLastCharacters = address?.substring(address?.length - 4);

        return (
          <Typography
            marginLeft={2}
            lineHeight={"20px"}
            fontSize={11}
            letterSpacing={"0.5px"}
          >
            {name} ({addressFirstCharacters}...{addressLastCharacters})
          </Typography>
        );
      });
  }, [accountsExpanded, accounts, session]);

  if (secsToExpire < 0) {
    return null;
  }

  return (
    <Stack
      paddingY={0.5}
      paddingX={1}
      boxSizing={"border-box"}
      border={`1px  solid ${theme.customColors.dark15}`}
      bgcolor={theme.customColors.dark2}
      borderRadius={"4px"}
    >
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        height={30}
        maxWidth={1}
      >
        <Typography
          maxWidth={270}
          whiteSpace={"nowrap"}
          textOverflow={"ellipsis"}
          overflow={"hidden"}
          fontSize={14}
          fontWeight={500}
          letterSpacing={"0.5px"}
        >
          {session.origin.value}
        </Typography>
        <Typography
          fontSize={13}
          fontWeight={500}
          sx={{
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={onClickDisconnect}
          color={theme.customColors.red100}
        >
          Disconnect
        </Typography>
      </Stack>
      <Stack direction={"row"} justifyContent={"space-between"} height={25}>
        <Typography
          fontSize={12}
          lineHeight={"20px"}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          Disconnect in
        </Typography>
        <Typography
          fontSize={16}
          fontWeight={600}
          lineHeight={"20px"}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          {secsToText(secsToExpire)}
        </Typography>
      </Stack>
      <Stack
        direction={"row"}
        sx={{
          "& svg": {
            transform: `${accountsExpanded ? "rotate(180deg)" : ""}scale(0.67)`,
          },
          cursor: "pointer",
        }}
        height={20}
        alignItems={"center"}
        marginLeft={-1}
        onClick={toggleExpandAccounts}
      >
        <ExpandIcon />
        <Typography
          fontSize={12}
          color={theme.customColors.primary500}
          letterSpacing={"0.5px"}
          sx={{
            textDecoration: !accountsExpanded ? "underline" : undefined,
            userSelect: "none",
          }}
        >
          Accounts Connected
        </Typography>
      </Stack>
      {accountsComponent}
    </Stack>
  );
};

const ListSessions: React.FC<ListSessionsProps> = ({ sessionList }) => {
  const theme = useTheme();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const sessions: Session[] = useMemo(() => {
    return sessionList
      .map((serializedSession) => Session.deserialize(serializedSession))
      .filter((item) => item.isValid() && !!item.origin?.value);
  }, [sessionList]);

  const onClickDisconnectAll = useCallback(() => {
    setStatus("loading");
    AppToBackground.revokeAllExternalSessions()
      .then((res) => {
        if (res.error) {
          setStatus("error");
        } else {
          setStatus("normal");
          enqueueSnackbar({
            message: `All websites have been disconnected.`,
            variant: "success",
          });
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error disconnecting all websites"}
          onCancel={() => setStatus("normal")}
          onRetry={onClickDisconnectAll}
          retryBtnProps={{ type: "button" }}
          containerProps={{
            marginTop: -3,
          }}
        />
      );
    }

    if (!sessions.length) {
      return (
        <Stack flexGrow={1} alignItems={"center"} justifyContent={"center"}>
          <Typography mt={"-50px"}>
            You are not connected to any website.
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack flexGrow={1} spacing={2} justifyContent={"space-between"}>
        <Stack
          flexGrow={1}
          overflow={"auto"}
          boxSizing={"border-box"}
          spacing={2}
          height={370}
        >
          {sessions.map((session) => (
            <ListItem session={session} key={session.id} />
          ))}
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
          onClick={onClickDisconnectAll}
        >
          Disconnect All
        </Button>
      </Stack>
    );
  }, [sessions, onClickDisconnectAll, theme, status]);

  return <>{content}</>;
};

const mapStateToProps = (state: RootState) => {
  return {
    sessionList: state.vault.entities.sessions.list,
  };
};

export default connect(mapStateToProps)(ListSessions);
