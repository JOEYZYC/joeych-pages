export function attachDialogDismissal(dialog: HTMLDialogElement, restoreFocus: () => void): void {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return
    const bounds = dialog.getBoundingClientRect()
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    if (outside) dialog.close()
  })
  dialog.addEventListener("close", restoreFocus)
}
