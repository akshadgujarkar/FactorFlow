export const ETH_TO_INR = Number(import.meta.env.VITE_ETH_TO_INR || 200000);

export const formatETH = (eth: number) => `${eth.toFixed(4)} ETH`;
export const formatINR = (inr: number) => `Rs ${inr.toLocaleString("en-IN")}`;
export const ethToINR = (eth: number) => eth * ETH_TO_INR;
export const inrToETH = (inr: number) => inr / ETH_TO_INR;

