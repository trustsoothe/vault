import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { Session } from "@soothe/vault";
import { DISCONNECT_SITE_PAGE } from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar, getTruncatedText, secsToText } from "../../utils/ui";
import ExpandIcon from "../../assets/img/expand_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { sessionsSelector } from "../../redux/selectors/session";
import { accountsSelector } from "../../redux/selectors/account";
import TooltipOverflow from "../common/TooltipOverflow";
import { labelByProtocolMap } from "../../constants/protocols";

interface ListItemProps {
  session: Session;
}

const ListItem: React.FC<ListItemProps> = ({ session }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [secsToExpire, setSecsToExpire] = useState(0);
  const [accountsExpanded, setAccountsExpanded] = useState(false);
  const accounts = useAppSelector(accountsSelector);

  useEffect(() => {
    if (!session.maxAge) {
      return;
    }

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
      .filter((account) => idMap.includes(account.address))
      .map(({ address, name }) => {
        return (
          <Typography
            marginLeft={2}
            lineHeight={"20px"}
            fontSize={11}
            letterSpacing={"0.5px"}
            key={address}
          >
            {name} ({getTruncatedText(address)})
          </Typography>
        );
      });
  }, [accountsExpanded, accounts, session]);

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
        spacing={1}
        width={337}
      >
        <TooltipOverflow
          enableTextCopy={false}
          containerProps={{
            height: 30,
            marginTop: "-5px!important",
          }}
          textProps={{
            height: 30,
            lineHeight: "30px",
          }}
          text={session.origin.value}
          linkProps={{
            fontSize: 14,
            fontWeight: 500,
          }}
        />
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
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        height={25}
        display={secsToExpire < 0 || !session.maxAge ? "none" : "flex"}
      >
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
      <Stack direction={"row"} justifyContent={"space-between"} height={25}>
        <Typography
          fontSize={12}
          lineHeight={"20px"}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          Protocol
        </Typography>
        <Typography
          fontSize={12}
          lineHeight={"20px"}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          {labelByProtocolMap[session.protocol] || session.protocol}
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

const ListSessions: React.FC = () => {
  const theme = useTheme();
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const sessionList = useAppSelector(sessionsSelector);

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

export default ListSessions;
