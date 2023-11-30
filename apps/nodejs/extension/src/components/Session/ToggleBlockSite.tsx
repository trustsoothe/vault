import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import { toggleBlockWebsite } from "../../redux/slices/app";
import { revokeSession } from "../../redux/slices/vault/session";
import OperationFailed from "../common/OperationFailed";
import { SITES_PAGE } from "../../constants/routes";
import {
  blockedListSelector,
  sessionsSelector,
} from "../../redux/selectors/session";

export const ToggleBlockSiteFromRouter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [site, setSite] = useState<string>(null);
  const [sessionId, setSessionId] = useState<string>(null);

  const sessionList = useAppSelector(sessionsSelector);

  const onCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(`${SITES_PAGE}?tab=blocked`);
    }
  }, [navigate, location]);

  useEffect(() => {
    const website = searchParams.get("site");

    if (website) {
      setSite(website);
    } else {
      onCancel();
    }

    const session = searchParams.get("sessionId");

    const includes = sessionList.some((item) => item.id === session);

    if (includes) {
      setSessionId(session);
    }
  }, []);

  const onSuccessfulToggle = useCallback(() => {
    navigate(`${SITES_PAGE}?tab=blocked`);
  }, []);

  if (site) {
    return (
      <ToggleBlockSite
        site={site}
        onSuccessfulToggle={onSuccessfulToggle}
        sessionId={sessionId}
        onClose={onCancel}
      />
    );
  } else {
    return null;
  }
};

interface ToggleBlockSiteProps {
  site: string;
  sessionId?: string;
  onClose: () => void;
  onBlocked?: () => void;
  onSuccessfulToggle?: () => void;
}

const ToggleBlockSite: React.FC<ToggleBlockSiteProps> = ({
  site,
  onClose,
  sessionId,
  onBlocked,
  onSuccessfulToggle,
}) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "loading" | "block" | "unblock" | "error"
  >("loading");

  const blockedList = useAppSelector(blockedListSelector);

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
            message: `Site ${
              isBlocking ? "blocked" : "unblocked"
            } successfully.`,
            variant: "success",
          });
          if (onSuccessfulToggle) {
            onSuccessfulToggle();
          }
        }
      })
      .catch(() => setStatus("error"));
  }, [dispatch, site, status, sessionId, onBlocked, onSuccessfulToggle]);

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
        onCancel={onClose}
        onRetry={onClickYes}
        retryBtnText={btnText}
        containerProps={{
          marginTop: -3,
        }}
      />
    );
  }, [status, site, onClose, onClickYes]);

  return (
    <Stack flexGrow={1} justifyContent={"center"} alignItems={"center"}>
      {content}
    </Stack>
  );
};

export default ToggleBlockSite;
