"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/LanguageProvider";

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions (delete/reject). */
  danger?: boolean;
}

interface ConfirmContextValue {
  /** Styled replacement for window.confirm — resolves true if confirmed. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Styled replacement for window.alert — single OK button. */
  notify: (opts: Omit<ConfirmOptions, "danger" | "confirmLabel" | "cancelLabel">) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type Mode = "confirm" | "notify";

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [state, setState] = useState<{ opts: ConfirmOptions; mode: Mode } | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({ opts, mode: "confirm" });
      }),
    []
  );

  const notify = useCallback(
    (opts: Omit<ConfirmOptions, "danger" | "confirmLabel" | "cancelLabel">) =>
      new Promise<void>((resolve) => {
        resolver.current = () => resolve();
        setState({ opts, mode: "notify" });
      }),
    []
  );

  const isConfirm = state?.mode === "confirm";

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      <Dialog
        open={!!state}
        onOpenChange={(open) => {
          // ESC / overlay / X close → treat as cancel (false).
          if (!open) settle(false);
        }}
      >
        {state && (
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>{state.opts.title ?? t.common.dialog.confirmTitle}</DialogTitle>
              <DialogDescription>{state.opts.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              {isConfirm && (
                <button
                  type="button"
                  onClick={() => settle(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  {state.opts.cancelLabel ?? t.common.dialog.cancel}
                </button>
              )}
              <button
                type="button"
                onClick={() => settle(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  isConfirm && state.opts.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#0E4A5C] hover:bg-[#0B3D4E]"
                }`}
              >
                {isConfirm ? state.opts.confirmLabel ?? t.common.dialog.confirm : t.common.dialog.ok}
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
