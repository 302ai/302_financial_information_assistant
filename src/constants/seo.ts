export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 财讯助手",
      description: "和AI聊天快速获取股票数据和财经资讯",
      image: "/images/global/finance_cn_tool_logo.png",
    },
    en: {
      title: "AI Financial Information Assistant",
      description: "Chat with AI to quickly obtain financial data and news information",
      image: "/images/global/finance_en_tool_logo.png",
    },
    ja: {
      title: "AI 金融アシスタント",
      description: "AIとチャットして財経データとニュース情報を迅速に取得",
      image: "/images/global/finance_jp_tool_logo.png",
    },
  },
};
