import React from "react";
import MemoInput from "../MemoInput";
import RecipientAutocomplete from "../../Transaction/RecipientAutocomplete";

export default function Form() {
  return (
    <>
      <RecipientAutocomplete
        label={"New App Public Key"}
        canSelectContact={false}
        acceptPublicKey={true}
        fieldName={"newAppPublicKey"}
      />
      <MemoInput />
    </>
  );
}
