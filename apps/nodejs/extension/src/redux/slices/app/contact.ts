import {SerializedAccountReference, SupportedProtocols} from "@soothe/vault";
import type { RootState } from "../../store";
import type { AppSliceBuilder } from "../../../types";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { CONTACTS_KEY } from "./index";
import {
  ACCOUNT_ALREADY_EXISTS,
  CONTACT_ALREADY_EXISTS,
} from "../../../errors/contact";

export interface Contact {
  id?: string;
  name: string;
  address: string;
  protocol: SupportedProtocols;
}

interface SaveContactParam {
  contact: Contact;
  /** id of the contact to replace */
  idToReplace?: string;
}

export const saveContact = createAsyncThunk(
  "app/saveContact",
  async ({ contact, idToReplace }: SaveContactParam, context) => {
    const alreadySavedContactsRes = await browser.storage.local.get(
      CONTACTS_KEY
    );
    const alreadySavedContacts: SerializedAccountReference[] =
      alreadySavedContactsRes[CONTACTS_KEY] || [];

    const contactAlreadyExists = alreadySavedContacts.some(
      (item) =>
        contact.address === item.address && item.protocol === contact.protocol
    );

    const accounts = (context.getState() as RootState).vault.accounts;

    const accountExists = accounts.some(
      (account) =>
        contact.address === account.address &&
        account.protocol === contact.protocol
    );

    if (accountExists) {
      throw ACCOUNT_ALREADY_EXISTS;
    }

    if (contactAlreadyExists && !idToReplace) {
      throw CONTACT_ALREADY_EXISTS;
    }

    const contactToSave: Contact = {
      id: idToReplace || v4(),
      ...contact,
      name: contact.name.trim(),
    };

    const newContactList = idToReplace
      ? alreadySavedContacts.map((item) =>
          item.id === idToReplace ? contactToSave : item
        )
      : [...alreadySavedContacts, contactToSave];

    await browser.storage.local.set({
      [CONTACTS_KEY]: newContactList,
    });

    return newContactList;
  }
);

export const removeContact = createAsyncThunk(
  "app/removeContact",
  async (idContact: string) => {
    const alreadySavedContactRes = await browser.storage.local.get(
      CONTACTS_KEY
    );
    const alreadySavedContacts: SerializedAccountReference[] =
      alreadySavedContactRes[CONTACTS_KEY] || [];

    const newContactList = alreadySavedContacts.filter(
      (item) => item.id !== idContact
    );

    await browser.storage.local.set({
      [CONTACTS_KEY]: newContactList,
    });

    return newContactList;
  }
);

export const addContactThunksToBuilder = (builder: AppSliceBuilder) => {
  builder.addCase(saveContact.fulfilled, (state, action) => {
    state.contacts = action.payload;
  });

  builder.addCase(removeContact.fulfilled, (state, action) => {
    state.contacts = action.payload;
  });
};
