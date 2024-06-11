import React, { useEffect, useState } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../components/DialogButtons";
import BaseDialog from "../components/BaseDialog";
import SendSubmitted from "./SendSubmitted";
import SendSummary from "./SendSummary";
import SendForm from "./SendForm";

type Status = "form" | "summary" | "submitted";

interface SendModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SendModal({ open, onClose }: SendModalProps) {
  const [status, setStatus] = useState<Status>("submitted");

  useEffect(() => {
    // const timeout = setTimeout(() => setStatus("form"), 150);
    // return () => clearTimeout(timeout);
  }, [open]);

  let content: React.ReactNode;

  switch (status) {
    case "form":
      content = (
        <>
          <DialogContent
            sx={{
              paddingX: 2.4,
              paddingTop: "24px!important",
              paddingBottom: 2,
            }}
          >
            <SendForm />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Next",
                // type: "submit",
                onClick: () => setStatus("summary"),
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "summary":
      content = (
        <>
          <DialogContent
            sx={{
              paddingX: 2.4,
              paddingTop: "24px!important",
              paddingBottom: 2,
              rowGap: 1.6,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SendSummary />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Next",
                // type: "submit",
                onClick: () => setStatus("submitted"),
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "submitted":
      content = (
        <>
          <DialogContent
            sx={{
              paddingX: 2.4,
              paddingTop: "24px!important",
              paddingBottom: 2,
              rowGap: 1.6,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SendSubmitted />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                // type: "submit",
                onClick: onClose,
              }}
            />
          </DialogActions>
        </>
      );
      break;
  }

  return (
    <BaseDialog open={open} onClose={onClose} title={"Send"}>
      {content}
    </BaseDialog>
  );
}
