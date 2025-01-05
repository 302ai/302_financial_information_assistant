import ky from "ky"

// Search and draw chart data
export const searchGoogle = async (q: string, apiKey: string, engine: 'google_news' | 'google_finance') => {
  try {
    const result = await ky.get('https://api.302.ai/searchapi/search', {
      searchParams: {
        q,
        engine,
        api_key: apiKey,
      }
    }).then(res => res.json())
    return result
  } catch (error: any) {
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return errorData;
      } catch (parseError) {
        return { error: parseError }
      }
    } else {
      return { error: error }
    }
  }
}