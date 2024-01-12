import type { ExternalTransferState } from "../Transfer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import {
  type ExternalTransferData,
  TransferType,
} from "../../contexts/TransferContext";
import { useAppSelector } from "../../hooks/redux";
import { TRANSFER_PAGE } from "../../constants/routes";
import { wPoktAssetSelector } from "../../redux/selectors/asset";

export interface MintTransactionModalProps {
  mintInfo?: {
    mintId: string;
    signatures: string[];
    mintInfo: ExternalTransferData["mintInfo"];
  };
  onClose: () => void;
}

const MintTransactionModal: React.FC<MintTransactionModalProps> = ({
  mintInfo,
  onClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const wPoktAsset = useAppSelector(wPoktAssetSelector);
  const [stillShowModal, setStillShowModal] = useState(false);

  useEffect(() => {
    if (mintInfo) {
      setTimeout(() => setStillShowModal(true), 100);
    } else {
      setTimeout(() => {
        setStillShowModal(false);
      }, 225);
    }
  }, [mintInfo]);

  const onClickAway = useCallback(() => {
    if (mintInfo && stillShowModal) {
      onClose();
    }
  }, [mintInfo, onClose, stillShowModal]);

  const onClickProceed = useCallback(() => {
    if (mintInfo) {
      const state: ExternalTransferState = {
        asset: wPoktAsset,
        transferType: TransferType.mint,
        transferData: {
          amount: "",
          toAddress: "",
          ...mintInfo,
        },
      };
      navigate(TRANSFER_PAGE, { state });
    }
  }, [mintInfo, navigate, wPoktAsset]);

  const content = useMemo(() => {
    return (
      <ClickAwayListener onClickAway={onClickAway}>
        <Stack
          width={1}
          paddingX={2.5}
          paddingTop={1.5}
          paddingBottom={2}
          component={"form"}
          borderRadius={"8px"}
          boxSizing={"border-box"}
          justifyContent={"space-between"}
          bgcolor={theme.customColors.white}
          height={230}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          <Stack>
            <Typography
              fontSize={16}
              fontWeight={700}
              lineHeight={"30px"}
              textAlign={"center"}
              color={theme.customColors.primary999}
            >
              Mint Transaction
            </Typography>
            <Typography
              color={theme.customColors.red100}
              fontWeight={700}
              fontSize={14}
              lineHeight={"20px"}
              textAlign={"center"}
              marginTop={1}
              marginBottom={0.7}
              paddingX={4}
            >
              Are you sure you want to proceed with this mint?
            </Typography>
            <Typography
              fontSize={12}
              lineHeight={"20px"}
              textAlign={"center"}
              marginTop={0.5}
              marginBottom={2}
              paddingX={0.5}
            >
              You recently minted this transaction. If the transaction was
              successful then if you made it again, it will fail.
            </Typography>
          </Stack>
          <Stack direction={"row"} spacing={2} width={1}>
            <Button
              onClick={onClose}
              sx={{
                fontWeight: 700,
                color: theme.customColors.dark50,
                borderColor: theme.customColors.dark25,
                height: 30,
                borderWidth: 1.5,
                fontSize: 14,
              }}
              variant={"outlined"}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              sx={{
                fontWeight: 700,
                height: 30,
                fontSize: 14,
              }}
              variant={"contained"}
              fullWidth
              onClick={onClickProceed}
            >
              Proceed
            </Button>
          </Stack>
        </Stack>
      </ClickAwayListener>
    );
  }, [theme, mintInfo, stillShowModal, onClickAway, onClickProceed, onClose]);

  return (
    <Fade in={!!mintInfo}>
      <Stack
        width={1}
        height={540}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        justifyContent={"center"}
        alignItems={"center"}
        zIndex={9}
        top={-60}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default MintTransactionModal;
