'use client'

import dayjs from 'dayjs'
import { toast } from 'sonner';
import { chat } from '@/api/chat';
import { useAtom } from "jotai";
import { v4 as uuidV4 } from 'uuid';
import { Loader2 } from 'lucide-react';
import { IoSend } from 'react-icons/io5';
import { useEffect, useState } from 'react';
import { concurrentMap } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { MdAutorenew } from "react-icons/md";
import { readStreamableValue } from 'ai/rsc';
import BarChart from '@/components/BarChart';
import { FaRegTrashAlt } from "react-icons/fa";
import { Presets } from '@/components/presets';
import { searchGoogle } from '@/api/searchApi';
import { Button } from '@/components/ui/button';
import { FaGripVertical } from "react-icons/fa";
import { FaGripHorizontal } from "react-icons/fa";
import { MdAddCircleOutline } from 'react-icons/md';
import { Textarea } from '@/components/ui/textarea';
import AppFooter from '@/components/global/app-footer';
import LoadAnimation from '@/components/LoadAnimation';
import { appConfigAtom, store, userAtom } from '@/stores';
import { ErrorToast, IErrorCode } from '@/utils/errorToast';
import { MessageListView } from '@/components/MessageListView';
import { useIsHideBrand } from "@/hooks/global/use-is-hide-brand";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { addChatData, clearAllChatData, getChatData, IChat, INews, updateChatData } from '@/api/indexedDB';
import { addChartData, clearAllChartData, getChartData, IChart, IChartData, updateChartData, updateChartSort } from '@/api/chartDB';

export default function Home() {
  const t = useTranslations()
  const [{ apiKey, modelName: model }] = useAtom(appConfigAtom);
  const [{ chartData, chatData, chartLayout }, setConfig] = useAtom(userAtom);
  const [isLoad, setIsLoad] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [load, setLoad] = useState(false);
  const isHideBrand = useIsHideBrand();

  const getOnChatData = async () => {
    const data = await getChatData();
    const chartDataInit = await getChartData();
    setConfig((v) => ({ ...v, chatData: data || [], chartData: chartDataInit || [] }))
  }

  const onClearAllChat = async () => {
    await clearAllChatData();
    await clearAllChartData();
    setConfig((v => ({ ...v, chatData: [], chartData: [] })))
  }

  const onAddChatData = async (role: 'user' | 'assistant', askText?: string) => {
    const result = await addChatData({
      role,
      newsData: [],
      uid: uuidV4(),
      askText: askText || '',
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: role === 'assistant' ? 'perform' : 'done'
    });
    return result;
  }

  const onNewChat = async () => {
    if (isLoad) return;
    await clearAllChatData();
    await clearAllChartData();
    setConfig((v => ({ ...v, chartData: [], chatData: [] })))
  }

  const onSubmit = async (value: string) => {
    if (!value.trim()) {
      toast(t('home.Textarea.placeholderTips'), { position: "top-right" })
      return;
    }
    const data = await onAddChatData('user', value);
    const newChatData = [...JSON.parse(JSON.stringify(chatData)), { ...data }]
    setConfig((v) => ({ ...v, chatData: [...v.chatData, { ...data }], chatScroll: 1 }))
    await generate(newChatData);
    setTextAreaValue('')
  }

  const generate = async (messages: IChat[]) => {
    let chatValue = '';
    let newChartData: IChartData = {} as IChartData;
    let newsData: INews[] = [];
    let newChat = await onAddChatData('assistant');
    setConfig((v) => ({ ...v, chatData: [...v.chatData, { ...newChat }], chatScroll: 2 }))
    try {
      setIsLoad(true);
      let isDataAdded = false;
      const result = await chat({ apiKey, model, messages: messages.map(item => ({ role: item.role, content: item.askText })) });
      if (result?.output) {
        for await (const delta of readStreamableValue(result.output)) {
          if (delta?.type === 'text-delta') {
            chatValue += delta?.textDelta;
            newChat = { ...newChat, askText: chatValue, status: chatValue.length ? 'done' : 'perform' };
            setConfig((v) => ({
              ...v,
              chatData: v.chatData.map(item => item.uid === newChat.uid ? { ...newChat } : item),
              chatScroll: v.chatScroll += 1
            }))
            if (Object.keys(newChartData).length) {
              const addResult = await addChartData({ ...newChartData });
              setConfig((v) => ({
                ...v,
                chartData: [...v.chartData, { ...addResult }],
                chartScroll: 1,
              }))
              newChartData = {} as IChartData;
            }
          } else if (delta?.type === 'search_on_google_finance') {
            // @ts-expect-error ---
            if (delta?.data?.summary && delta?.data?.search_metadata && delta?.data?.graph) {
              const { summary, search_metadata, graph, code } = delta.data as IChart;
              const initData: IChartData = {
                data: {
                  code,
                  graph,
                  summary,
                  search_metadata,
                },
                type: 'search_on_google_finance',
                sort: 0,
              }
              newChartData = initData;
            }
          } else if (delta?.type === 'search_on_google_news') {
            // @ts-expect-error ---
            const first4 = delta.data.slice(0, 4);
            newsData = first4;
          } else if (delta?.type === 'logprobs' && !isDataAdded) {
            await updateChatData(newChat.id, { ...newChat, newsData });
            setConfig((v) => ({
              ...v,
              chatData: v.chatData.map(item => item.uid === newChat.uid ? { ...newChat, newsData } : item),
              chatScroll: 0,
            }))
            isDataAdded = true;
          }
        }
      }
    } catch (error: any) {
      if (error?.message?.error?.err_code) {
        toast(() => (ErrorToast(error.message.error.err_code)), { position: "top-right" })
      }
      await updateChatData(newChat.id, { ...newChat, status: 'done' });
      setConfig((v) => ({
        ...v,
        chatData: v.chatData.map(item => item.uid === newChat.uid ? { ...newChat, status: 'done' } : item),
        chatScroll: 0
      }))
    }
    setIsLoad(false);
  }

  const onUpdateAllChartData = async () => {
    if (!chartData?.length || !apiKey) return;
    const concurrency = 5;
    setLoad(true)
    const updateChartItem = async (item: typeof chartData[0]) => {
      try {
        const result = await searchGoogle(item.data.code, apiKey, 'google_finance') as IChart & IErrorCode;
        if (result?.summary && result?.search_metadata && result?.graph && item.id) {
          const newData = {
            ...item.data,
            summary: result.summary,
            search_metadata: result.search_metadata,
            graph: result.graph,
          };
          await updateChartData(item.id, { ...item, data: { ...newData } });
        }
        if (result?.error) {
          return Promise.reject(result);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    };
    try {
      await concurrentMap(chartData, updateChartItem, concurrency);
    } catch (error: any) {
      if (error?.error?.err_code) {
        toast(() => (ErrorToast(error?.error?.err_code)), { position: "top-right" })
      } else {
        toast(t('update_fail'), { position: "top-right" })
      }
    }
    await getOnChatData()
    setLoad(false)
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newChartData = Array.from(chartData);
    const [removed] = newChartData.splice(result.source.index, 1);
    newChartData.splice(result.destination.index, 0, removed);
    setConfig((v) => ({ ...v, chartData: newChartData }))
    await updateChartSort(newChartData);
  };

  useEffect(() => {
    getOnChatData();
  }, [])

  return (
    <div className='h-screen sm:max-w-[80vw] px-5 w-full flex flex-col justify-between gap-5 mx-auto py-5 overflow-y-hidden bg-background '>
      <div className='h-12 w-full flex items-center justify-center gap-3'>
        {!isHideBrand && <img src="/images/global/logo-mini.png" className='h-full' />}
        <h2 className='text-2xl font-bold'>{t('home.title')}</h2>
      </div>
      {
        (chatData.length > 0 || chartData.length > 0) ?
          <>
            <div className='flex gap-5 flex-1' style={{ height: 'calc(100vh - 180px)' }}>
              <div className='border w-[30vw] rounded-sm flex flex-col gap-3'>
                <div className=' text-end p-2'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className='text-red-600 hover:text-[#f00]' onClick={onClearAllChat}><FaRegTrashAlt /></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('clearChatList')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <MessageListView />
                <div className="border-t flex justify-between items-end gap-4 py-2 px-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='cursor-pointer h-9 flex items-center' onClick={onNewChat}><MdAddCircleOutline className="text-2xl text-[#8e47f0]" /></div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('newChat')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Textarea
                    value={textAreaValue}
                    className="border-none"
                    placeholder={t('home.Textarea.placeholder')}
                    disabled={isLoad}
                    onChange={(e) => setTextAreaValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        onSubmit(textAreaValue)
                      }
                    }}
                  />
                  <div onClick={() => onSubmit(textAreaValue)} className='cursor-pointer h-9 flex items-center'>
                    {isLoad ? <Loader2 className="h-[20px] w-[20px] animate-spin" /> : <IoSend className="text-xl text-[#8e47f0]" />}
                  </div>
                </div>
              </div>
              <div className='border flex-1 rounded-sm p-5 relative'>
                <div className={`absolute w-full h-full left-0 top-0 flex justify-center items-center z-50 backdrop-blur-[2px] bg-white/20 ${!load && 'hidden'}`}>
                  <LoadAnimation />
                </div>
                <div className='flex w-full gap-3 justify-end items-center mb-5'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={onUpdateAllChartData}><MdAutorenew /></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('updateChartList')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="outline" size="sm" onClick={() => setConfig(v => ({ ...v, chartLayout: v.chartLayout === 'Horizontal' ? 'Vertical' : 'Horizontal' }))}>
                    {chartLayout === 'Vertical' ? <FaGripVertical /> : <FaGripHorizontal />}
                  </Button>
                </div>
                <div className={`border overflow-y-auto rounded-md p-4`} style={{ height: 'calc(100% - 55px)' }}>
                  {
                    chartData?.length ?
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="droppable" direction={chartLayout === 'Vertical' ? 'vertical' : 'horizontal'}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`grid gap-5 h-auto ${chartLayout === 'Vertical' ? ' grid-cols-1' : ' grid-cols-2'}`}
                            >
                              {chartData.map((item, index) => (
                                <Draggable key={item.id} draggableId={`${item.id}`} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <BarChart chart={item} />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                      : <div className='w-full h-full flex justify-center items-center'><img src="/images/global/empty.png" /></div>
                  }
                </div>
              </div>
            </div>
            <AppFooter />
          </> : <Presets onSubmit={onSubmit} />
      }
    </div>
  )
}