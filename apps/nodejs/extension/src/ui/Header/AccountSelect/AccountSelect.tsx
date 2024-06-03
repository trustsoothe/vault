import React from "react";
import { useState } from "react";
import AccountSelectModal from "./Modal";
import AccountSelectButton from "./Button";

export default function AccountSelect() {
  const [showModal, setShowModal] = useState(false);
  const toggleShowModal = () => setShowModal((prev) => !prev);

  return (
    <>
      <AccountSelectButton onClick={toggleShowModal} />
      <AccountSelectModal open={showModal} onClose={toggleShowModal} />
    </>
  );
}
