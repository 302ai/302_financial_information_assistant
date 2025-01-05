import { FaRegTrashAlt } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { MdContentCopy } from "react-icons/md";
import { MarkdownViewer } from "./MarkdownViewer";
import { useAtom } from "jotai";
import { userAtom } from "@/stores";
import { toast } from "sonner";
import { deleteChatData, IChat, INews } from "@/api/indexedDB";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import html2md from "html-to-md";

export const MessageListView = () => {
  const t = useTranslations()
  const [{ chatData, chatScroll }, setConfig] = useAtom(userAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onDeleteChat = async (id?: number) => {
    if (id) {
      await deleteChatData(id);
      setConfig((v) => ({
        ...v,
        chatData: v.chatData.filter(f => f.id !== id)
      }))
    }
  }

  const onRenderingNews = (news: INews[]) => {
    if (!news?.length) return;
    return (
      <div className="flex flex-col gap-2 mt-2">
        {
          news.map(item => (
            <div className='flex gap-2 cursor-pointer' key={item.title} onClick={() => window.open(item.link)}>
              <img className='h-full' src={item.thumbnail} alt="" />
              <div className='text-xs font-bold'>{item.snippet}</div>
            </div>
          ))
        }
      </div>
    )
  }

  const ListCom = (props: { item: IChat }) => {
    const chatRef = useRef<HTMLDivElement>(null);
    const { item } = props;

    const onCopyText = () => {
      const htmlContent = chatRef.current?.getHTML();
      if (htmlContent) {
        const markdown = html2md(htmlContent)
        navigator.clipboard.writeText(markdown).then(() => {
          toast(t('home.CopyTextOk'), { position: "top-right" })
        }, (err) => {
          toast(t('home.CopyTextError'), { position: "top-right" })
        });
      }


    }
    return (
      <div className={`flex flex-col p-3 max-w-[85%] group  w-max ${item.role === 'user' && 'ml-auto'}`} key={item.uid} >
        <div className={`flex gap-3`} >
          <img src="/images/global/logo-mini.png" className={`w-6 h-6 ${item.role === 'user' && 'hidden'}`} />
          <div >
            <div className='rounded-sm border p-3'>
              <div ref={chatRef}>
                {
                  item?.status === 'done' ?
                    <MarkdownViewer className={`${item.role === 'user' && 'text-right'}`} content={item.askText} />
                    : <Loader2 className="h-[20px] w-[20px] animate-spin" />
                }
                {onRenderingNews(item.newsData)}
              </div>
            </div>
            {
              item.status === 'done' &&
              <div className='flex justify-end gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-all'>
                <MdContentCopy className='text-sm text-[#8e47f0] cursor-pointer' onClick={onCopyText} />
                <FaRegTrashAlt className='text-sm text-red-600 cursor-pointer' onClick={() => onDeleteChat(item.id)} />
              </div>
            }
          </div>
          <FaCircleUser className={`text-2xl ${item.role !== 'user' && 'hidden'}`} />
        </div>
      </div>
    )
  }

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatScroll])

  return (
    <div className='h-full overflow-y-auto flex flex-col gap-5 p-3'>
      {chatData.map((item, index) => (<ListCom item={item} key={item.uid} />))}
      <div ref={messagesEndRef} /> {/* 添加这个空的 div 作为滚动目标 */}
    </div>
  )
}