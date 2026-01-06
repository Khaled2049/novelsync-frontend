import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import SlashCommandMenu from "./SlashCommandMenu";

export interface SlashCommand {
  title: string;
  description: string;
  icon?: string;
  command: (props: any) => void;
}

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: new PluginKey("slashCommand"),
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
        allow: ({ state, range }: any) => {
          const $from = state.doc.resolve(range.from);
          const isAtStart =
            $from.parent.textContent.charAt(range.from - $from.start() - 1) ===
            "";
          return (
            isAtStart ||
            $from.parent.textContent.charAt(range.from - $from.start() - 1) ===
              " "
          );
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      // Import Suggestion plugin from @tiptap/suggestion
      // You'll need to install: npm install @tiptap/suggestion
    ];
  },
});

// Suggestion configuration
export const slashCommandSuggestion = (
  onGenerateNextLine: () => Promise<void>
): Partial<SuggestionOptions> => ({
  char: "/",
  pluginKey: new PluginKey("slashCommand"),

  items: ({ query }: { query: string }): SlashCommand[] => {
    const commands: SlashCommand[] = [
      {
        title: "Generate Next Line",
        description: "AI generates suggestions for the next line",
        icon: "✨",
        command: async ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).run();
          await onGenerateNextLine();
        },
      },
      {
        title: "Heading 1",
        description: "Large section heading",
        icon: "H1",
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleHeading({ level: 1 })
            .run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: "H2",
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleHeading({ level: 2 })
            .run();
        },
      },
      {
        title: "Bullet List",
        description: "Create a bullet list",
        icon: "•",
        command: ({ editor, range }: any) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
    ];

    return commands.filter((command) =>
      command.title.toLowerCase().includes(query.toLowerCase())
    );
  },

  command: ({ editor, range, props }: any) => {
    // This is called when Enter is pressed or item is selected
    // props.item is the selected SlashCommand
    if (props.item && props.item.command) {
      props.item.command({ editor, range });
    }
  },

  render: () => {
    let component: ReactRenderer<any>;
    let popup: TippyInstance[];

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(SlashCommandMenu, {
          props: {
            items: props.items,
            command: (item: SlashCommand) => {
              // Execute the command with editor and range
              item.command({
                editor: props.editor,
                range: props.range,
              });
              // Close the suggestion menu
              if (popup && popup[0]) {
                popup[0].hide();
              }
            },
          },
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect as any,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps({
          items: props.items,
          command: (item: SlashCommand) => {
            // Execute the command with editor and range
            item.command({
              editor: props.editor,
              range: props.range,
            });
            // Close the suggestion menu
            if (popup && popup[0]) {
              popup[0].hide();
            }
          },
        });

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as any,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }

        // Handle Enter key - execute the selected command
        if (props.event.key === "Enter") {
          const handled = (component.ref as any)?.onKeyDown(props);
          if (handled) {
            props.event.preventDefault();
            props.event.stopPropagation();
            return true;
          }
        }

        // For arrow keys, let the menu handle them
        const handled = (component.ref as any)?.onKeyDown(props);
        if (handled) {
          props.event.preventDefault();
          props.event.stopPropagation();
          return true;
        }
        return false;
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
});
