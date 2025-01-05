import { useAtom } from 'jotai';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import LoadAnimation from './LoadAnimation';
import { MdAutorenew } from 'react-icons/md';
import { FaRegTrashAlt } from 'react-icons/fa';
import { searchGoogle } from '@/api/searchApi';
import { appConfigAtom, store, userAtom } from '@/stores';
import VChart, { ILineChartSpec } from '@visactor/vchart';
import React, { useEffect, useRef, useState } from 'react';
import { ErrorToast, IErrorCode } from '@/utils/errorToast';
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from "react-icons/io";
import { deleteChartData, IChart, IChartData, updateChartData } from '@/api/chartDB';

const StockChart = (props: { chart: IChartData }) => {
  const t = useTranslations()
  const { id, data } = props.chart;
  const { code, summary, graph, search_metadata } = data;

  const [load, setLoad] = useState(false);
  const { apiKey } = store.get(appConfigAtom);
  const [{ chartScroll }, setConfig] = useAtom(userAtom);

  const chartRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const prices = graph.map(item => item.price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      function extractTime(dateString: string): string {
        const match = dateString.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        return match ? match[1] : '';
      }
      const spec: ILineChartSpec = {
        type: 'line',
        data: {
          values: graph.map(item => ({
            ...item,
            time: extractTime(item.date)
          })),
        },
        xField: 'time',
        yField: 'price',
        theme: {
        background: 'transparent'
        },
        axes: [
          {
            orient: 'left',
            range: {
              min: minPrice,
              max: maxPrice
            },
          },
          {
            orient: 'bottom',
          }
        ],
        point: {
          style: {
            size: 0
          },
          state: {
            dimension_hover: {
              size: datum => {
                return 10;
              },
              fill: datum => {
                return '#137333';
              }
            }
          }
        },
        tooltip: {
          dimension: {
            title: {
              value: datum => {
                return `${datum?.currency} $${datum?.price}`
              }
            },
            content: [{
              isKeyAdaptive: true,
              value: datum => {
                return `${datum?.date}`
              },
              valueStyle: {
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 500,
                fontColor: '#5f6368'
              },
              hasShape: false
            },
            {
              value: datum => {
                return `${datum?.volume}`
              },
              valueStyle: {
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 500,
                fontColor: '#5f6368',
              },
              hasShape: false
            }]
          },
          mark: {
            title: {
              value: datum => {
                return `${datum?.currency} $${datum?.price}`
              }
            },
            content: [{
              isKeyAdaptive: true,
              value: datum => {
                return `${datum?.date}`
              },
              valueStyle: {
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 500,
                fontColor: '#5f6368'
              },
              hasShape: false
            },
            {
              value: datum => {
                return `${datum?.volume}`
              },
              valueStyle: {
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 500,
                fontColor: '#5f6368',
              },
              hasShape: false
            }]
          },
        },
      };

      const vchart = new VChart(spec, { dom: chartRef.current });
      vchart.renderAsync();

      return () => {
        vchart.release();
      };
    }
  }, [props.chart]);

  const onDelete = async () => {
    if (!id) return;
    await deleteChartData(id);
    setConfig((v => ({ ...v, chartData: v.chartData.filter(item => item.id !== id) })))
  }

  const onUpdateChartData = async () => {
    if (!apiKey || !code) return;
    try {
      setLoad(true);
      const result = await searchGoogle(code, apiKey, 'google_finance') as IChart & IErrorCode;
      if (result?.error) {
        toast(() => (ErrorToast(result.error.err_code)), { position: "top-right" })
      }
      if (result?.summary && result?.search_metadata && result?.graph && id) {
        const newData = {
          ...data,
          summary: result.summary,
          search_metadata: result.search_metadata,
          graph: result.graph,
        }
        await updateChartData(id, { ...props.chart, data: { ...newData } })
        setConfig((v => ({
          ...v, chartData: v.chartData.map(item => {
            if (item.id === id) {
              return { ...item, data: newData }
            }
            return item
          })
        })))
      }
    } catch (error) {
      toast(t('update_fail'), { position: "top-right" })
    }
    setLoad(false);
  }

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [chartScroll])

  return (
    <div className='border flex flex-col relative  bg-background' style={{ height: 400, width: '100%' }}>
      <div className={`absolute w-full h-full left-0 top-0 flex justify-center items-center z-50 backdrop-blur-[2px] bg-white/20 ${!load && 'hidden'}`}>
        <LoadAnimation />
      </div>
      <div>
        <div className='flex justify-between items-center border-b py-4 px-2'>
          <h3 className='text-2xl'>{summary.title}</h3>
          <div className='flex gap-3'>
            <Button variant="outline" size="sm" onClick={onUpdateChartData}><MdAutorenew /></Button>
            <Button variant="outline" size="sm" className='text-red-600 hover:text-[#f00]' onClick={onDelete}><FaRegTrashAlt /></Button>
          </div>
        </div>
        <div className='py-3 flex gap-4 items-center p-4'>
          <h2 className='text-3xl font-[520]'>${summary.price}</h2>
          <div className={`flex items-center font-bold ${summary.price_change.movement === 'Up' ? 'text-[#137333] ' : 'text-[#a50e0e]'}`}>
            <div className={`rounded-lg flex py-1 px-2 ${summary.price_change.movement === 'Up' ? 'bg-[#e6f4ea] ' : 'bg-[#fce8e6]'}`}>
              {summary.price_change.movement === 'Up' ? <IoIosArrowRoundUp className='text-2xl' /> : <IoIosArrowRoundDown className='text-2xl' />}
              {Math.floor(summary.price_change.percentage * 1000) / 1000}%
            </div>
            <div className='ml-4'>{summary.price_change.amount > 0 ? '+' : ''}{Math.floor(summary.price_change.amount * 1000) / 1000} Today</div>
          </div>
        </div>
      </div>
      <div ref={chartRef} className='flex-1' />
      <div className='w-full text-center text-sm text-slate-500 py-2'>{code}</div>
      <div ref={messagesEndRef} /> {/* 添加这个空的 div 作为滚动目标 */}
    </div>
  )
};

export default StockChart;