import React from "react";
import BaseShannonTransaction from "./BaseTransaction";

interface ShannonTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShannonTransactionModal({
  open,
  onClose,
}: ShannonTransactionModalProps) {
  return <BaseShannonTransaction open={open} onClose={onClose} />;
}
