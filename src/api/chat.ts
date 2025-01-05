'use server'
import { IChart } from './chartDB';
import { INews } from './indexedDB';
import { createOpenAI } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';
import { LanguageModelV1LogProbs } from '@ai-sdk/provider';
import { getTools, prompt1, prompt2, systemPrompt } from '@/constants/prompt';
import { CoreAssistantMessage, CoreMessage, CoreToolMessage, streamText, TextStreamPart } from 'ai';
import ky from 'ky';

interface IPrames {
  messages: { role: 'user' | 'assistant', content: string }[];
  apiKey?: string;
  model?: string;
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;


export async function chat(params: IPrames) {
  const { messages, apiKey, model } = params;
  if (!apiKey || !model) return;

  const stream = createStreamableValue<{
    type: string,
    textDelta?: string,
    logprobs?: LanguageModelV1LogProbs,
    data?: IChart | INews[],
  }>({ type: 'text-delta', textDelta: '' })
  const tools = getTools(apiKey);
  try {
    const openai = createOpenAI({
      apiKey,
      baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof URL ? input : new URL(input.toString())
        try {
          return await ky(url, {
            ...init,
            retry: 0,
            timeout: false,
          })
        } catch (error: any) {
          if (error.response) {
            const errorData = await error.response.json();
            stream.error({ message: errorData })
          } else {
            stream.error({ message: error })
          }
          return error;
        }
      },
    });
    (async () => {
      try {
        const { fullStream } = streamText({
          model: openai(model),
          system: systemPrompt,
          messages,
          tools,
        });
        const onGetResult = async (fullStream: AsyncIterableStream<TextStreamPart<any>>) => {
          const assistantList: CoreAssistantMessage = { role: 'assistant', content: [] };
          const toolList: CoreToolMessage = { role: 'tool', content: [] };
          let systemPrompt2 = '';
          for await (const chunk of fullStream) {
            if (chunk.type === 'text-delta') {
              stream.update({ type: 'text-delta', textDelta: chunk.textDelta })
            } else if (chunk.type === 'tool-call') {
              if (['generate_finance_search_keys'].includes(chunk.toolName)) {
                systemPrompt2 = prompt1(chunk.args.query)
              }
              if (['generate_news_search_keys'].includes(chunk.toolName)) {
                systemPrompt2 = prompt2
              }
              // @ts-expect-error ---
              assistantList.content.push(chunk)
            } else if (chunk.type === 'tool-result') {
              if (chunk?.result?.error) {
                stream.error({ message: chunk?.result })
                stream.done();
              }
              if (chunk.toolName === 'search_on_google_finance') {
                stream.update({ type: 'search_on_google_finance', data: { ...chunk?.result, code: chunk?.args.search_keys } })
              }
              if (chunk.toolName === 'search_on_google_news') {
                stream.update({ type: 'search_on_google_news', data: [...chunk?.result] })
              }
              toolList.content.push(chunk)
            } else if (chunk.type === 'step-finish') {
              if (toolList.content.length > 0 && assistantList.content.length > 0) {
                const { fullStream: newFullStream } = await streamText({
                  system: systemPrompt2,
                  model: openai(model, { logprobs: 5 }),
                  messages: [...messages, { ...assistantList }, { ...toolList }] as CoreMessage[],
                  tools,
                })
                await onGetResult(newFullStream)

              }
            } else if (chunk.type === 'finish') {
              stream.update({ type: 'logprobs', logprobs: chunk.logprobs })
            }
          }
        }
        await onGetResult(fullStream)
        stream.done()
      } catch (error) {
        stream.done()
        stream.error({ message: 'Initialization error' })
      }
    })();
  } catch (error) {
    stream.done()
    stream.error({ message: 'Initialization error' })
  }
  return { output: stream.value }
}