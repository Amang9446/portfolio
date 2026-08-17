import {
  Info,
  Lightbulb,
  MessageSquareWarning,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import type { CalloutKind } from "@/lib/remark-callouts";

const CALLOUTS: Record<CalloutKind, { label: string; Icon: typeof Info }> = {
  note: { label: "Note", Icon: Info },
  tip: { label: "Tip", Icon: Lightbulb },
  important: { label: "Important", Icon: MessageSquareWarning },
  warning: { label: "Warning", Icon: TriangleAlert },
  caution: { label: "Caution", Icon: OctagonAlert },
};

type BlockquoteProps = ComponentPropsWithoutRef<"blockquote"> & {
  node?: unknown;
  "data-callout"?: string;
  "data-callout-title"?: string;
};

/**
 * Renders `> [!NOTE]` blockquotes tagged by `remark-callouts` as labelled
 * panels, and leaves every other blockquote untouched.
 */
export default function Callout({
  node,
  children,
  "data-callout": kind,
  "data-callout-title": title,
  ...props
}: BlockquoteProps) {
  void node;

  const callout = kind ? CALLOUTS[kind as CalloutKind] : undefined;
  if (!callout) return <blockquote {...props}>{children}</blockquote>;

  const { label, Icon } = callout;

  return (
    <blockquote {...props} data-callout={kind}>
      <p className="callout-label">
        <Icon aria-hidden="true" className="callout-icon" />
        {/* A custom title replaces the label visually, but the kind still has
            to reach screen readers — the icon is decorative. */}
        {title && <span className="sr-only">{label}: </span>}
        <span>{title || label}</span>
      </p>
      {children}
    </blockquote>
  );
}
