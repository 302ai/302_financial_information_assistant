import { IoSend } from "react-icons/io5";
import { MdAddCircleOutline } from "react-icons/md";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import AppFooter from "../global/app-footer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export const Presets = (props: { onSubmit: (value: string) => void }) => {
  const [textAreaValue, setTextAreaValue] = useState('');
  const t = useTranslations();
  const exampleMessages = [
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_1'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_1'),
      message: t('presets.ChatPanel.WhatIsThePriceOfAppleStock')
    },
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_2'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_2'),
      message: t('presets.ChatPanel.ShowMeAStockChartForGOOGL')
    },
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_3'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_3'),
      message: t('presets.ChatPanel.WhatAreSomeRecentEventsAboutAmazon')
    },
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_4'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_4'),
      message: t('presets.ChatPanel.WhatAreMicrosoftsLatestFinancials')
    },
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_5'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_5'),
      message: t('presets.ChatPanel.HowIsTheStockMarketPerformingTodayBySector')
    },
    {
      heading: t('presets.ChatPanel.exampleMessages.Copywriting_heading_6'),
      subheading: t('presets.ChatPanel.exampleMessages.Copywriting_subheading_6'),
      message: t('presets.ChatPanel.ShowMeAScreenerToFindNewStocks')
    }
  ];


  const onSubmitValue = () => {
    if (textAreaValue.trim().length < 1) {
      toast(t('presets.Textarea.placeholderTips'), { position: "top-right" })
      return;
    }
    props.onSubmit(textAreaValue)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className=" grid md:grid-cols-2 grid-cols-1 md:gap-5 gap-2 px-10">
        {
          exampleMessages.map(item => (
            <div key={item.heading} className="border md:p-4 p-2 leading-8 cursor-pointer hover:bg-[#f9f9f9]" onClick={() => props.onSubmit(item.subheading)}>
              <h2 className="font-[600] text-sm">{item.heading}</h2>
              <div className="text-sm text-neutral-500">{item.subheading}</div>
            </div>
          ))
        }
      </div>
      <div className="border md:p-5 p-3">
        <div className="border flex justify-between items-end gap-4 md:p-5 p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="link"><MdAddCircleOutline className="md:!w-[25px] md:!h-[25px] !w-[20px] !h-[20px]" onClick={() => redirect('/')} /></Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('newChat')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Textarea
            value={textAreaValue}
            className="border-none"
            placeholder={t('presets.Textarea.placeholder')}
            onChange={(e) => setTextAreaValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSubmitValue()
              }
            }}
          />
          <Button variant="link" onClick={onSubmitValue}><IoSend className="md:!w-[25px] md:!h-[25px] !w-[20px] !h-[20px]" /></Button>
        </div>
        <AppFooter className="mt-5" />
      </div>
    </div>
  )
}