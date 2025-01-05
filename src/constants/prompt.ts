import { searchGoogle } from "@/api/searchApi";
import { CoreTool } from "ai";
import { z } from "zod";

export const systemPrompt = `You are a professional financial information chatbot. Your task is to provide accurate and useful financial information based on users' questions. When a user makes a query request, you first need to assess the question input by the user.

If it involves inquiries about market data related to finance and economics, such as stock price change trends, you should use the appropriate tools from the function list ("generate finance search keys" and "search on Google Finance") to obtain results and respond to the user's question based on the findings.

If it is determined that the user needs to query the latest news information and relevant article updates, you should use the appropriate tools from the function list ("generate news search keys" and "search on Google News") to obtain results and respond to the user's question based on the findings.

If it involves both of the above situations, you should independently judge and use the tools as needed.

If the user's question does not fall into the first two specific situations, you need to accurately understand the user's intention. With a rich reserve of financial knowledge, provide comprehensive, professional, and easy-to-understand responses from multiple dimensions such as concept interpretation, strategy analysis, product feature description, phenomenon analysis, industry trend judgment, and policy impact explanation. Based on the relevance between the theme of the user's current question and financial knowledge, intelligently generate subsequent related question suggestions. For example, when the user asks about the basics of funds, you could subsequently suggest "Would you like to explore the risk-return characteristics of different funds?" or "Are you interested in selecting suitable funds for yourself?" to guide the user to further explore the knowledge in the financial field and improve their cognitive level and decision-making ability in the financial domain.

Keep the language of the output answer consistent with the language of the user's question
`;

export const prompt1 = (request: string) => `Generate search terms based on user requests.
-The search term can be one of the following query types: Stock, Index, Mutual Fund, Currency, Futures
-You need to determine which query type it belongs to based on the user description, and then accurately search for the correct exchange and code. Based on the provided exchange code in google_finance format, select the exchange code corresponding to the exchange under the corresponding query type.
This is a specific example:
Kweichow Moutai is listed on the Shanghai Stock Exchange.

The following is the information required for the search term:
-Kweichow Moutai Stock Code: 600519
-Exchange: Shanghai Stock Exchange

Based on this information, the search term for google_finance will be:
600519：SHA

Each exchange and its corresponding exchange code are presented in this form: Exchange Code: Description.The following are the exchange codes corresponding to each exchange that comply with the google_finance format：
Stock：
BCBA:Buenos Aires Stock Exchange
BMV:Mexican Stock Exchange
BVMF:B3 - Brazil Stock Exchange and Over-the-Counter Market
CNSX:Canadian Securities Exchange
CVE:Toronto TSX Ventures Exchange
NASDAQ:NASDAQ Last Sale
NYSE:NYSE
NYSEARCA:NYSE ARCA
NYSEAMERICAN:NYSE American
OPRA:Options Price Reporting Authority
OTCMKTS:FINRA Other OTC Issues
TSE:Toronto Stock Exchange
TSX:Toronto Stock Exchange
TSXV :Toronto TSX Ventures Exchange
AMS:Euronext Amsterdam
BIT:Borsa Italiana Milan Stock Exchange
BME:Bolsas y Mercados Españoles
CPH:NASDAQ OMX Copenhagen
EBR:Euronext Brussels
ELI:Euronext Lisbon
EPA:Euronext Paris
ETR:Deutsche Börse XETRA
FRA:Deutsche Börse Frankfurt Stock Exchange
HEL:NASDAQ OMX Helsinki
ICE:NASDAQ OMX Iceland
IST:Borsa Istanbul
LON:London Stock Exchange
RSE:NASDAQ OMX Riga
STO:NASDAQ OMX Stockholm
SWX, VTX:SIX Swiss Exchange
TAL:NASDAQ OMX Tallinn
VIE:Vienna Stock Exchange
VSE:NASDAQ OMX Vilnius
WSE:Warsaw Stock Exchange
JSE:Johannesburg Stock Exchange
TADAWUL:Saudi Stock Exchange
TLV:Tel Aviv Stock Exchange
BKK:Thailand Stock Exchange
BOM:Bombay Stock Exchange Limited
KLSE:Bursa Malaysia
HKG:Hong Kong Stock Exchange
IDX:Indonesia Stock Exchange
KOSDAQ:KOSDAQ
KRX:Korea Stock Exchange
NSE:National Stock Exchange of India
SGX:Singapore Exchange
SHA:Shanghai Stock Exchange
SHE:Shenzhen Stock Exchange
TPE:Taiwan Stock Exchange
TYO:Tokyo Stock Exchange
ASX:Australian Securities Exchange
NZE:New Zealand Stock Exchange


Mutual Fund：
MUTF:USA Mutual Funds
MUTF_IN:India Mutual Funds

Indexes：
INDEXBVMF:B3 - Brazil Stock Exchange and Over-the-Counter Market 
NDEXCBOE:CBOE Index Values
INDEXCME:Chicago Mercantile Exchange Indexes
INDEXDJX:S&P Dow Jones Indices
INDEXNASDAQ:NASDAQ Global Indexes
INDEXNYSEGIS:NYSE Global Index Feed
INDEXRUSSELL:Russell Tick
INDEXSP:S&P Cash Indexes
BCBA:Buenos Aires Stock Exchange Indexes
INDEXBMV:Mexican Stock Exchange Indexes
INDEXTSI:Toronto Stock Exchange Indexese 
INDEXBIT:Milan Stock Exchange Indexes
INDEXBME:Bolsas y Mercados Españoles Indexes
INDEXDB:Deutsche Börse Indexes
INDEXEURO:Euronext Indexes
INDEXFTSE:FTSE Indexes
INDEXIST:Borsa Istanbul Indexes
INDEXNASDAQ:NASDAQ Global Indexes
INDEXSTOXX:STOXX Indexes
INDEXSWX:SIX Swiss Exchange Indexes
INDEXVIE:Wiener Börse Indexes
INDEXBKK:Thailand Stock Exchange Indexes
INDEXBOM:Bombay Stock Exchange Indexes
SHA:Shanghai/Shenzhen Indexes
INDEXHANGSENG:Hang Seng Indexes
HKG:Hong Kong Stock Exchange Indexes
KOSDAQ, KRX:Korea Stock Exchange Indexes
INDEXNIKKEI:Nikkei Indexes
INDEXTYO:Tokyo Indexes
INDEXTYO:JPXNIKKEI400: ©  Japan Exchange Group, Inc., Tokyo Stock Exchange, Inc., Nikkei Inc.
INDEXTOPIX:Tokyo Stock Exchange Indexes
IDX:Indonesia Stock Exchange Indexes
NSE:National Stock Exchange of India Indexes
SHE:Shenzhen Stock Exchange Indexes
TPE; Taiwan Stock Exchange Indexes
TLV:Tel Aviv Stock Exchange Indexes
TADAWUL:Saudi Stock Exchange Indexes
INDEXASX:Australian Securities Exchange S&P/ASX Indexes
INDEXNZE:New Zealand Exchange Indexes

Futures:
CBOT E-mini
CBOT
CME E-mini
CME GLOBEX
COMEX
NYMEX

This is an example of a search term:
Stock. For example - NVDA:NASDAQ.
Index. For example - NIFTY_50:INDEXNSE.
Mutual Fund. For example - VTSAX:MUTF.
Currency. For example - BTC-USD.
Futures. For example - GCW00:COMEX.
Note: currencies and cryptocurrencies use a hyphen - instead of a colon : to separate the symbol from the exchange.

-The format of the search term you generate should be like the example, ensuring that the search term matches the provided redemption code.Cannot generate search terms that do not conform to the provided google_finance format

Return the result directly in plain text, do not add any other contents.
User request: ${request}`;

export const prompt2 = `Your task is to generate a search sentence for Google News financial news based on the user's description. 
Extract 1 - 4 key financial words from the description, such as company names, industry names or financial events, etc., and combine them into a simple sentence that conforms to the search habits of Google News to accurately locate the financial news required by the user.`

export const getTools = (apiKey: string): Record<string, CoreTool> => {
  return {
    generate_finance_search_keys: {
      description: 'Generates search keywords for financial market data queries.',
      parameters: z.object({
        query: z.string().describe('The financial query or topic for which search keys are needed.')
      }),
      execute: async (args) => {
        console.log('========>>>>>>>>generate_finance_search_keys', args);
        return { ...args, nextTool: 'search_on_google_finance', };
      }
    },
    search_on_google_finance: {
      description: 'Searches for financial data on Google Finance using specified search keys.',
      parameters: z.object({
        search_keys: z.string().describe('The search keywords or keys used to fetch data from Google Finance.')
      }),
      execute: async (args) => {
        console.log('========>>>>>>>>search_on_google_finance', args);
        const result = await searchGoogle(args.search_keys, apiKey, 'google_finance');
        if (result?.error) {
          return result?.error
        }
        return result;
      }
    },
    generate_news_search_keys: {
      description: 'Generates search keywords for querying the latest financial news and articles.',
      parameters: z.object({
        topic: z.string().describe('The news topic or subject for which search keys are needed.')
      }),
      execute: async (args) => {
        console.log('========>>>>>>>>generate_news_search_keys', args);
        return { ...args, nextTool: 'search_on_google_news', };
      }
    },
    search_on_google_news: {
      description: 'Searches for news articles on Google News using specified search keys.',
      parameters: z.object({
        news_keys: z.string().describe('The search keywords or keys used to fetch news articles from Google News.')
      }),
      execute: async (args) => {
        console.log('========>>>>>>>>search_on_google_news', args);
        const result = await searchGoogle(args.news_keys, apiKey, 'google_news');
        if (result?.organic_results) {
          return result.organic_results;
        }
        if (result?.error) {
          return result?.error
        }
        return result;
      }
    }
  }
};