import type { RootState } from "../../redux/store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useAppDispatch } from "../../hooks/redux";
import CircularLoading from "../common/CircularLoading";
import { toggleBlockWebsite } from "../../redux/slices/app";
import { revokeSession } from "../../redux/slices/vault";
import OperationFailed from "../common/OperationFailed";

interface ToggleBlockSiteProps {
  site: string;
  sessionId?: string;
  onClose: () => void;
  onBlocked?: () => void;
  blockedList: RootState["app"]["blockedSites"]["list"];
}

const ToggleBlockSite: React.FC<ToggleBlockSiteProps> = ({
  site,
  onClose,
  blockedList,
  sessionId,
  onBlocked,
}) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<
    "loading" | "success" | "block" | "unblock" | "error"
  >("loading");
  const wasBlocking = useRef<boolean>(null);

  useEffect(() => {
    const isBlocked = blockedList.includes(site);

    setStatus(!isBlocked ? "unblock" : "block");
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
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));

    wasBlocking.current = isBlocking;

    if (isBlocking && onBlocked) {
      onBlocked();
    }
  }, [dispatch, site, status, sessionId, onBlocked]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    let text: string, btnText: string;

    const nextStatus = status === "block" ? "unblock" : "block";
    if (status === "error") {
      text = `There was a problem trying to ${nextStatus} "${site}" website.`;
      btnText = "Retry";
    } else if (status === "success") {
      const nextStatus = !wasBlocking.current ? "unblock" : "block";

      text = `The website "${site}" was successfully ${nextStatus}ed`;
      btnText = "Ok";
    } else {
      text = `Are you sure you want to ${nextStatus} "${site}" website?`;
      btnText = "Yes";
    }

    const isSuccess = status === "success";

    const action = isSuccess ? onClose : onClickYes;

    return (
      <OperationFailed
        text={text}
        onCancel={onClose}
        onRetry={action}
        retryBtnText={btnText}
        cancelBtnProps={{
          sx: {
            display: status !== "success" ? "inline-flex" : "none",
          },
        }}
      />
    );
  }, [status, site, onClose]);

  return (
    <Stack flexGrow={1} justifyContent={"center"} alignItems={"center"}>
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    blockedList: state.app.blockedSites.list,
  };
};

export default connect(mapStateToProps)(ToggleBlockSite);
