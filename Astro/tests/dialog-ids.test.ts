import { describe, expect, it } from "vitest"

import { getDialogIds } from "../src/lib/dialog-ids"

describe("dialog identity contracts", () => {
  it("creates stable, caller-scoped identities for independent dialog instances", () => {
    // Given: two dialogs rendered by separate records on the same page
    const contact = getDialogIds("site-contact")
    const certificate = getDialogIds("award-2025-certificate")

    // When: each component derives its element identities
    const actual = { contact, certificate }

    // Then: triggers, dialogs, and titles cannot collide between instances
    expect(actual).toEqual({
      contact: {
        trigger: "site-contact-trigger",
        dialog: "site-contact-dialog",
        title: "site-contact-title",
      },
      certificate: {
        trigger: "award-2025-certificate-trigger",
        dialog: "award-2025-certificate-dialog",
        title: "award-2025-certificate-title",
      },
    })
  })
})
