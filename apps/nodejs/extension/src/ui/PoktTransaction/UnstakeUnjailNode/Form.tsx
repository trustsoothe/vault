import React from "react";
import MemoInput from "../MemoInput";
import RecipientAutocomplete from "../../Transaction/RecipientAutocomplete";

export default function UnstakeUnjailNodeForm() {
  return (
    <>
      <RecipientAutocomplete
        label={"Node Address"}
        canSelectFrom={true}
        fieldName={"nodeAddress"}
        shouldBeDifferentFrom={false}
      />
      <MemoInput />
    </>
  );
}
