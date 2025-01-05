"use client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import ChatToggler from "./chat-toggler";

type HeaderProps = {
  className?: string;
};

const Header = forwardRef<HTMLDivElement, HeaderProps>(({ className }, ref) => {
  const pathname = usePathname();
  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div
        ref={ref}
        className={cn(
          "fixed right-0 top-0 z-50 flex items-center justify-end gap-2 p-2",
          className
        )}
      >
        <ChatToggler />
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
});

Header.displayName = "AppHeader";

export default Header;
