import { useEffect } from "react";

const SITE_NAME = "Scorched Quarto";

/** Sets the browser tab title for the current page, restoring the previous
 * title on unmount so navigating away (or between routes that don't all set
 * one) never leaves a stale title behind. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
