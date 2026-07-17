// Thin wrapper around the Android Contact Picker API with typed fallback.
// https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API

type ContactRecord = { name?: string[]; tel?: string[]; email?: string[] };
type ContactsManager = {
  select: (
    props: Array<"name" | "tel" | "email">,
    opts?: { multiple?: boolean },
  ) => Promise<ContactRecord[]>;
};

export function contactPickerSupported(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return "contacts" in navigator && "ContactsManager" in window;
}

export async function pickContact(): Promise<{ name: string; phone: string } | null> {
  if (!contactPickerSupported()) return null;
  try {
    const mgr = (navigator as unknown as { contacts: ContactsManager }).contacts;
    const results = await mgr.select(["name", "tel"], { multiple: false });
    const c = results?.[0];
    if (!c) return null;
    return {
      name: (c.name?.[0] ?? "").trim(),
      phone: (c.tel?.[0] ?? "").trim(),
    };
  } catch {
    return null;
  }
}
