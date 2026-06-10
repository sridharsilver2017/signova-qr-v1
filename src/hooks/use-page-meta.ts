import { useEffect } from "react";

type PageMeta = {
  title: string;
  description?: string;
};

function upsertMeta(name: string, content: string) {
  let element = document.querySelector(
    `meta[name="${name}"]`,
  ) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    document.title = title;
    if (description) upsertMeta("description", description);
  }, [title, description]);
}
