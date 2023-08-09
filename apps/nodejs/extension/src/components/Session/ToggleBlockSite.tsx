import type { RootState } from "../../redux/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { enqueueSnackbar } from "notistack";
import { useAppDispatch } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import { toggleBlockWebsite } from "../../redux/slices/app";
import { revokeSession } from "../../redux/slices/vault";
import OperationFailed from "../common/OperationFailed";
import { BLOCKED_SITES_PAGE, SESSIONS_PAGE } from "../../constants/routes";

interface ToggleBlockSiteProps {
  site?: string;
  sessionId?: string;
  onClose?: () => void;
  onBlocked?: () => void;
  blockedList: RootState["app"]["blockedSites"]["list"];
  sessionList: RootState["vault"]["entities"]["sessions"]["list"];
}

const ToggleBlockSite: React.FC<ToggleBlockSiteProps> = ({
  site: siteFromProps,
  onClose,
  blockedList,
  sessionId: sessionFromProps,
  sessionList,
  onBlocked,
}) => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [site, setSite] = useState<string>(null);
  const [sessionId, setSessionId] = useState<string>(null);
  const [status, setStatus] = useState<
    "loading" | "block" | "unblock" | "error"
  >("loading");
  const onCancel = useCallback(() => {
    if (onClose) {
      return onClose();
    }

    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(BLOCKED_SITES_PAGE);
    }
  }, [navigate, location, onClose]);

  useEffect(() => {
    if (siteFromProps) {
      setSite(siteFromProps);
    } else {
      const website = searchParams.get("site");

      if (website) {
        setSite(website);
      } else {
        onCancel();
      }
    }

    if (sessionFromProps) {
      setSessionId(sessionFromProps);
    } else {
      const session = searchParams.get("sessionId");

      const includes = sessionList.some((item) => item.id === session);

      if (includes) {
        setSessionId(session);
      }
    }
  }, [searchParams, blockedList, sessionList]);

  useEffect(() => {
    if (site) {
      const isBlocked = blockedList.includes(site);

      setStatus(!isBlocked ? "unblock" : "block");
    }
  }, [site]);

  const onClickYes = useCallback(async () => {
    const isBlocking = status === "unblock";
    setStatus("loading");

    const promises: Promise<unknown>[] = [
      dispatch(toggleBlockWebsite(site)).unwrap(),
    ];

    if (isBlocking && sessionId) {
      promises.push(
        dispatch(revokeSession({ sessionId, external: false })).unwrap()
      );
    }

    await Promise.all(promises)
      .then(() => {
        if (isBlocking && onBlocked) {
          onBlocked();
        } else {
          enqueueSnackbar({
            style: { width: 250, minWidth: "250px!important" },
            message: `Site ${
              isBlocking ? "blocked" : "unblocked"
            } successfully.`,
            variant: "success",
            autoHideDuration: 3000,
          });
          navigate(isBlocking ? BLOCKED_SITES_PAGE : SESSIONS_PAGE);
        }
      })
      .catch(() => setStatus("error"));
  }, [dispatch, site, status, sessionId, onBlocked, navigate]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    let text: string, btnText: string;

    const nextStatus = status === "block" ? "unblock" : "block";
    if (status === "error") {
      text = `There was a problem trying to ${nextStatus} "${site}" website.`;
      btnText = "Retry";
    } else {
      text = `Are you sure you want to ${nextStatus} "${site}" website?`;
      btnText = "Yes";
    }

    return (
      <OperationFailed
        text={text}
        onCancel={onCancel}
        onRetry={onClickYes}
        retryBtnText={btnText}
      />
    );
  }, [status, site, onCancel, onClickYes]);

  return (
    <Stack flexGrow={1} justifyContent={"center"} alignItems={"center"}>
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    blockedList: state.app.blockedSites.list,
    sessionList: state.vault.entities.sessions.list,
  };
};

export default connect(mapStateToProps)(ToggleBlockSite);
