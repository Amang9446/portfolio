"use client";

import {
  Bold,
  CircleHelp,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
} from "lucide-react";
export type EditorMode = "write" | "split" | "preview";

export const EDITOR_MODES: EditorMode[] = ["write", "split", "preview"];

const MODE_HINTS: Record<EditorMode, string> = {
  write: "Editor only",
  split: "Editor and live preview side by side",
  preview: "Rendered result only",
};

const SHORTCUT_GROUPS: {
  group: string;
  items: { keys: string; action: string }[];
}[] = [
  {
    group: "Inline",
    items: [
      { keys: "⌘ B", action: "Bold" },
      { keys: "⌘ I", action: "Italic" },
      { keys: "⌘ ⇧ X", action: "Strikethrough" },
      { keys: "⌘ E", action: "Inline code" },
      { keys: "⌘ K", action: "Insert link" },
    ],
  },
  {
    group: "Blocks",
    items: [
      { keys: "⌘ ⇧ 2", action: "Heading (toggles)" },
      { keys: "⌘ ⇧ 3", action: "Subheading (toggles)" },
      { keys: "⌘ ⇧ E", action: "Code block" },
      { keys: "⌘ ⇧ .", action: "Quote" },
      { keys: "⌘ ⇧ 7", action: "Numbered list" },
      { keys: "⌘ ⇧ 8", action: "Bullet list" },
      { keys: "⌘ ⇧ I", action: "Insert image" },
      { keys: "Tab / ⇧ Tab", action: "Indent / outdent" },
      { keys: "Enter", action: "Continue list / quote; exit on empty item" },
    ],
  },
  {
    group: "Editor",
    items: [
      { keys: "⌘ S", action: "Save post" },
      { keys: "⌘ ⇧ P", action: "Cycle write / split / preview" },
      { keys: "Esc", action: "Close this panel" },
      {
        keys: "Paste / drop",
        action: "Image uploads on Save; URL over selection links it",
      },
    ],
  },
];

/** The formatting actions the toolbar drives, supplied by the form. */
export interface EditorActions {
  bold: () => void;
  italic: () => void;
  strikethrough: () => void;
  heading: () => void;
  subheading: () => void;
  link: () => void;
  inlineCode: () => void;
  codeBlock: () => void;
  quote: () => void;
  bulletList: () => void;
  numberedList: () => void;
  taskList: () => void;
  image: () => void;
  table: () => void;
  divider: () => void;
}

const ICON = "h-3.5 w-3.5";

function toolbarItems(actions: EditorActions) {
  return [
    {
      icon: <Bold className={ICON} />,
      label: "Bold (⌘B)",
      action: actions.bold,
    },
    {
      icon: <Italic className={ICON} />,
      label: "Italic (⌘I)",
      action: actions.italic,
    },
    {
      icon: <Strikethrough className={ICON} />,
      label: "Strikethrough (⌘⇧X)",
      action: actions.strikethrough,
    },
    {
      icon: <Heading2 className={ICON} />,
      label: "Heading (⌘⇧2 · toggles)",
      action: actions.heading,
    },
    {
      icon: <Heading3 className={ICON} />,
      label: "Subheading (⌘⇧3 · toggles)",
      action: actions.subheading,
    },
    {
      icon: <Link2 className={ICON} />,
      label: "Link (⌘K)",
      action: actions.link,
    },
    {
      icon: <Code className={ICON} />,
      label: "Inline code (⌘E)",
      action: actions.inlineCode,
    },
    {
      icon: <SquareCode className={ICON} />,
      label: "Code block (⌘⇧E · TSX)",
      action: actions.codeBlock,
    },
    {
      icon: <Quote className={ICON} />,
      label: "Quote (⌘⇧.)",
      action: actions.quote,
    },
    {
      icon: <List className={ICON} />,
      label: "Bullet list (⌘⇧8)",
      action: actions.bulletList,
    },
    {
      icon: <ListOrdered className={ICON} />,
      label: "Numbered list (⌘⇧7)",
      action: actions.numberedList,
    },
    {
      icon: <ListTodo className={ICON} />,
      label: "Task list",
      action: actions.taskList,
    },
    {
      icon: <ImageIcon className={ICON} />,
      label: "Image (⌘⇧I · uploads on Save)",
      action: actions.image,
    },
    {
      icon: <TableIcon className={ICON} />,
      label: "Table",
      action: actions.table,
    },
    {
      icon: <Minus className={ICON} />,
      label: "Divider",
      action: actions.divider,
    },
  ];
}

const buttonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

interface EditorToolbarProps {
  actions: EditorActions;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  shortcutsOpen: boolean;
  onShortcutsOpenChange: (open: boolean) => void;
}

export default function EditorToolbar({
  actions,
  mode,
  onModeChange,
  shortcutsOpen,
  onShortcutsOpenChange,
}: EditorToolbarProps) {
  const items = toolbarItems(actions);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-input bg-secondary/50 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-0.5">
        {items.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            onClick={tool.action}
            className={buttonClass}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5">
        <div className="relative">
          <button
            type="button"
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
            aria-expanded={shortcutsOpen}
            onClick={() => onShortcutsOpenChange(!shortcutsOpen)}
            className={buttonClass}
          >
            <CircleHelp className={ICON} />
          </button>
          {shortcutsOpen && (
            <>
              <button
                type="button"
                aria-label="Close shortcuts"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => onShortcutsOpenChange(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 max-h-96 w-72 overflow-y-auto rounded-md border border-border bg-popover p-3 shadow-md">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Shortcuts
                </p>
                {/* The group heading sits outside the <dl>: only dt/dd/div
                    are valid there, so a <p> child would be invalid HTML. */}
                {SHORTCUT_GROUPS.map((group) => (
                  <section key={group.group} className="mt-3">
                    <h3 className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground/70">
                      {group.group}
                    </h3>
                    <dl className="mt-1.5 space-y-1.5">
                      {group.items.map((shortcut) => (
                        <div
                          key={shortcut.action}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <dt className="shrink-0 font-mono text-muted-foreground">
                            {shortcut.keys}
                          </dt>
                          <dd className="text-right text-foreground">
                            {shortcut.action}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>

        {EDITOR_MODES.map((value) => (
          <button
            key={value}
            type="button"
            title={MODE_HINTS[value]}
            onClick={() => onModeChange(value)}
            className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
              mode === value
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
