import type { SupportedProtocols } from "@soothe/vault";
import React, { useState } from "react";
import NetworkSelectModal from "./Modal";
import Button from "./Button";

export type NetworkOption<T extends SupportedProtocols = SupportedProtocols> = {
  protocol: T;
  chainId: string;
  isTest?: true;
};

export default function NetworkSelect() {
  const [showModal, setShowModal] = useState(false);
  const toggleShowModal = () => setShowModal((prev) => !prev);

  return (
    <>
      <Button onClick={toggleShowModal} />
      <NetworkSelectModal onClose={toggleShowModal} open={showModal} />
    </>
  );
}
