import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  height?: number; 
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, height = 35, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = `${height}px`;
        textarea.style.height = `${Math.min(textarea.scrollHeight, 300) || 35}px`; 
        textarea.style.overflowY = textarea.scrollHeight > 300 ? "auto" : "hidden"; 
      }
    };

    React.useEffect(() => {
      adjustHeight(); 
    }, [value, className]);

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          "flex h-auto max-h-[600px] w-full resize-none rounded-md border outline-none border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground  disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onInput={adjustHeight}
        value={value}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
