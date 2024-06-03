import React from "react";
import IconButton from "@mui/material/IconButton";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import { APP_CONTAINER_ID } from "../../constants/ui";
import CloseIcon from "../assets/img/close_icon.svg";

interface BaseDialogProps extends Omit<DialogProps, "onClose"> {
  title?: string;
  onClose?: () => void;
}

export default function BaseDialog(props: BaseDialogProps) {
  return (
    <Dialog
      {...props}
      fullWidth
      container={() => document.getElementById(APP_CONTAINER_ID)}
      sx={{
        position: "absolute",
        "& .MuiDialog-container": {
          alignItems: "flex-start",
        },
        ...props?.sx,
      }}
      PaperProps={{
        ...props?.PaperProps,
        sx: {
          margin: 2.4,
          borderRadius: "8px",
          backgroundColor: "#fff",
          width: "calc(100% - 48px)",
          maxWidth: "calc(100% - 48px)",
          maxHeight: "calc(100% - 48px)",
          boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.1)",
          ...props?.PaperProps?.sx,
        },
      }}
      slotProps={{
        ...props?.slotProps,
        backdrop: {
          ...props?.slotProps?.backdrop,
          sx: {
            position: "absolute",
            backgroundColor: "rgba(17, 22, 28, 0.5)",
            //@ts-ignore
            ...props?.slotProps?.backdrop?.sx,
          },
        },
      }}
    >
      {props.title && (
        <DialogTitle
          variant={"subtitle2"}
          textAlign={"center"}
          sx={{
            padding: 0,
            height: 56,
            lineHeight: "56px",
            userSelect: "none",
            position: "relative",
            borderBottom: "1px solid #eff1f4",
          }}
        >
          {props.title}
          {props.onClose && (
            <IconButton
              onClick={props.onClose}
              sx={{
                position: "absolute",
                right: 16,
                top: 16,
                height: 23,
                width: 23,
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      {props.children}
    </Dialog>
  );
}
