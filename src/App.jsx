import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";
import { Search, Command, Loader2 } from "lucide-react";

const BASE_HEIGHT = 140;
const MAX_TEXTAREA_HEIGHT = 300;

function App() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus when window gets focus
  useEffect(() => {
    const unlisten = appWindow.onFocusChanged(({ focused }) => {
      if (focused) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const resizeWindow = async textareaHeight => {
    const extraHeight = Math.max(0, textareaHeight - 36);
    const newHeight = Math.min(
      BASE_HEIGHT + extraHeight,
      BASE_HEIGHT + MAX_TEXTAREA_HEIGHT - 36,
    );
    try {
      await appWindow.setSize(
        new LogicalSize(700, Math.max(BASE_HEIGHT, newHeight)),
      );
    } catch (e) {
      console.error("Failed to resize:", e);
    }
  };

  const hideWindow = async () => {
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "36px";
      inputRef.current.style.overflowY = "hidden";
    }
    await appWindow.setSize(new LogicalSize(700, BASE_HEIGHT));
    await appWindow.hide();
  };

  const handleKeyDown = async e => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      if (!text.trim()) return;
      await handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      await hideWindow();
    }
  };

  const handleInput = e => {
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = newHeight + "px";
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    resizeWindow(newHeight);
  };

  const handleSubmit = async () => {
    setIsSending(true);
    try {
      const isDelegate =
        text.toLowerCase().includes("дживс") ||
        text.includes("#дд") ||
        text.includes("#dd");

      const { error } = await supabase.from("items").insert([
        {
          content: text,
          status: "inbox",
          type: "task",
          user_id: "6ee6af65-83f5-4944-8b55-47e73a2963b0",
          metadata: {
            source: "fleeets-companion",
            delegated: isDelegate,
          },
        },
      ]);

      if (error) throw error;

      await hideWindow();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-start justify-center pt-4 px-4">
      <div className="w-full max-w-2xl bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="flex-shrink-0 pt-1">
            {isSending ? (
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-neutral-400" />
            )}
          </div>

          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Что нужно сделать?"
            disabled={isSending}
            autoFocus
            className="
              flex-1 bg-transparent 
              text-white text-2xl font-light
              placeholder-neutral-500 
              resize-none 
              focus:outline-none 
              leading-normal
              disabled:opacity-50
            "
            rows={1}
            style={{
              height: "36px",
              minHeight: "36px",
              maxHeight: MAX_TEXTAREA_HEIGHT + "px",
              overflowY: "hidden",
            }}
          />

          {text.length > 0 && (
            <span className="text-sm text-neutral-500 font-mono tabular-nums pt-1">
              {text.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 px-5 py-3 border-t border-neutral-700 bg-neutral-800/50">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <kbd className="bg-neutral-700 px-2 py-1 rounded text-xs">↵</kbd>
            <span>строка</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <kbd className="flex items-center gap-1 bg-neutral-700 px-2 py-1 rounded text-xs">
              <Command className="w-3 h-3" />↵
            </kbd>
            <span>сохранить</span>
          </div>
        </div>

        {isSending && (
          <div className="h-1 w-full bg-blue-900">
            <div className="h-full bg-blue-500 animate-progress"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
