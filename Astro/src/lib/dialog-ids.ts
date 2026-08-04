export type DialogIds = {
  readonly trigger: string
  readonly dialog: string
  readonly title: string
}

export function getDialogIds(instanceId: string): DialogIds {
  return {
    trigger: `${instanceId}-trigger`,
    dialog: `${instanceId}-dialog`,
    title: `${instanceId}-title`,
  }
}
