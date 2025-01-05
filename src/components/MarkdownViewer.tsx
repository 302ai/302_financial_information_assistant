import React, { useMemo} from "react";
import markdownit from 'markdown-it';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className }) => {

    const md = useMemo(() => {
        const instance = new markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true
        });
        instance.disable('fence');
        
        const defaultRender = instance.renderer.rules.link_open || ((tokens, idx, options, env, self) => {
            return self.renderToken(tokens, idx, options);
        });

        instance.renderer.rules.link_open = (tokens, idx, options, env, self) => {
            tokens[idx].attrPush(['target', '_blank']);
            tokens[idx].attrPush(['rel', 'noopener noreferrer']);
            
            return defaultRender(tokens, idx, options, env, self);
        };

        return instance;
    }, []);

    const processedContent = useMemo(() => {
        return content
            ?.replace(/^```\w*\n/, '')
            .replace(/```$/, '')
            .trim();
    }, [content]);

    return (
        <div
            className={`prose prose-sm [&_*]:text-foreground max-w-max cursor-text ${className}`}
            dangerouslySetInnerHTML={{
                __html: md?.render(processedContent || '')
            }}
        />
    );
};
