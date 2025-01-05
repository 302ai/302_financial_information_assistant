import { IChartData } from "@/api/chartDB";
import { IChat } from "@/api/indexedDB";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
type ConfigState = {
  chatData: IChat[],
  chartData: IChartData[],
  chatScroll: number,
  chartScroll: number,
  chartLayout: 'Vertical' | 'Horizontal',
};

export const userAtom = atomWithStorage<ConfigState>(
  "userStore",
  {
    chatData: [],
    chartData: [],
    chatScroll: 0,
    chartScroll: 0,
    chartLayout:'Vertical'
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      }
  ),
  {
    getOnInit: false,
  }
);
