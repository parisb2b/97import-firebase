const KEY = import.meta.env.VITE_EXCHANGE_KEY;

export const fetchRMBRate = async (): Promise<number> => {
  const res = await fetch(`https://v6.exchangerate-api.com/v6/${KEY}/pair/EUR/CNY`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error(data['error-type']);
  return data.conversion_rate;
};
