"use client";

import { useSyncExternalStore } from "react";
import { useLanguage } from "./LanguageProvider";

type Theme = "light" | "dark";

function readTheme(): Theme {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

export default function AuthPreferences() {
    const { language, setLanguage } = useLanguage();
    const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);

    function changeTheme(nextTheme: Theme) {
        document.documentElement.classList.toggle(
            "dark",
            nextTheme === "dark"
        );


        try {
            localStorage.setItem("theme", nextTheme);
        } catch { }
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <div
                className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1"
                role="group"
                aria-label="Language"
            >
                <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    aria-pressed={language === "en"}
                    className={`min-h-9 rounded-lg px-3 text-sm font-medium transition ${language === "en"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }`}
                >
                    EN
                </button>

                <button
                    type="button"
                    onClick={() => setLanguage("th")}
                    aria-pressed={language === "th"}
                    className={`min-h-9 rounded-lg px-3 text-sm font-medium transition ${language === "th"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }`}
                >
                    ไทย
                </button>
            </div>

            <div
                className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1"
                role="group"
                aria-label={language === "th" ? "ธีม" : "Appearance"}
            >
                <button
                    type="button"
                    onClick={() => changeTheme("light")}
                    aria-label={language === "th" ? "โหมดสว่าง" : "Light mode"}
                    aria-pressed={theme === "light"}
                    className={`flex min-h-9 min-w-10 items-center justify-center rounded-lg px-2 text-base transition ${theme === "light"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }`}
                >
                    ☀
                </button>

                <button
                    type="button"
                    onClick={() => changeTheme("dark")}
                    aria-label={language === "th" ? "โหมดมืด" : "Dark mode"}
                    aria-pressed={theme === "dark"}
                    className={`flex min-h-9 min-w-10 items-center justify-center rounded-lg px-2 text-base transition ${theme === "dark"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }`}
                >
                    ☾
                </button>
            </div>
        </div>
    );
}