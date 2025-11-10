import React, { useState, useEffect } from 'react';
const commonPairs = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'GBP/JPY', 'GBP/CHF', 'AUD/JPY', 'CAD/JPY',
  'CHF/JPY', 'NZD/JPY', 'AUD/CAD', 'AUD/NZD', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD',
  'GBP/AUD', 'GBP/CAD', 'GBP/NZD'
];
export default function App() {
  const [currencies, setCurrencies] = useState({});
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [targetCurrency, setTargetCurrency] = useState('INR');
  const [lotSize, setLotSize] = useState('0.1');
  const [pips, setPips] = useState('');
  const [profitOrLoss, setProfitOrLoss] = useState(null);
  const [plInQuoteCurrency, setPlInQuoteCurrency] = useState(null);
  const [convertedPL, setConvertedPL] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [riskAmount, setRiskAmount] = useState('100');
  const [pipsForLotSize, setPipsForLotSize] = useState('20');
  const [calculatedLotSize, setCalculatedLotSize] = useState(null);
  const [isLotSizeLoading, setIsLotSizeLoading] = useState(false);
  const [lotSizeError, setLotSizeError] = useState(null);
  const [activeTab, setActiveTab] = useState('pl');
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await fetch('https://api.frankfurter.app/currencies');
        if (!response.ok) throw new Error('Failed to fetch currency list.');
        const data = await response.json();
        setCurrencies(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchCurrencies();
  }, []);
  const handleCalculate = () => {
    setProfitOrLoss(null);
    setConvertedPL(null);
    setPlInQuoteCurrency(null);
    setError(null);
    const lot = parseFloat(lotSize);
    const pipsGainedOrLost = parseFloat(pips);
    if (isNaN(lot) || isNaN(pipsGainedOrLost) || lot <= 0) {
      setError('Please enter a valid, positive lot size and a valid pip number.');
      return;
    }
    const [base, quote] = selectedPair.split('/');
    const isJpyPair = quote === 'JPY';
    const pipValueInQuoteCurrency = isJpyPair ? (lot * 1000) : (lot * 10);
    const pl = pipsGainedOrLost * pipValueInQuoteCurrency;
    setProfitOrLoss(pl);
    setPlInQuoteCurrency(quote);
  };
  const handleConvert = async () => {
    if (profitOrLoss === null || plInQuoteCurrency === null) {
      setError("Please calculate P/L first.");
      return;
    }
    if (plInQuoteCurrency === targetCurrency) {
      setConvertedPL(profitOrLoss);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?amount=${Math.abs(profitOrLoss)}&from=${plInQuoteCurrency}&to=${targetCurrency}`);
      if (!response.ok) throw new Error('Currency conversion failed.');
      const data = await response.json();
      if (data.rates && data.rates[targetCurrency]) {
        const convertedValue = data.rates[targetCurrency] * (profitOrLoss > 0 ? 1 : -1);
        setConvertedPL(convertedValue);
      } else {
        throw new Error(`Rate for ${targetCurrency} not available.`);
      }
    } catch (err) {
      setError(err.message);
      setConvertedPL(null);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCalculateLotSize = async () => {
    setCalculatedLotSize(null);
    setLotSizeError(null);
    setIsLotSizeLoading(true);
    const risk = parseFloat(riskAmount);
    const pips = parseFloat(pipsForLotSize);
    if (isNaN(risk) || isNaN(pips) || risk <= 0 || pips <= 0) {
      setLotSizeError('Please enter valid, positive risk and pips.');
      setIsLotSizeLoading(false);
      return;
    }
    const [base, quote] = selectedPair.split('/');
    const isJpyPair = quote === 'JPY';
    const pipValuePerLotInQuote = isJpyPair ? 1000 : 10;
    let conversionRate = 1;
    if (quote !== 'USD') {
      try {
        const response = await fetch(`https://api.frankfurter.app/latest?amount=1&from=${quote}&to=USD`);
        if (!response.ok) throw new Error('Failed to fetch conversion rate.');
        const data = await response.json();
        if (data.rates && data.rates.USD) {
          conversionRate = data.rates.USD;
        } else {
          throw new Error(`Rate for ${quote} to USD not available.`);
        }
      } catch (err) {
        setLotSizeError(err.message);
        setIsLotSizeLoading(false);
        return;
      }
    }
    const pipValuePerLotInUSD = pipValuePerLotInQuote * conversionRate;
    const totalLossPerLotInUSD = pips * pipValuePerLotInUSD;
    const lotSizeResult = risk / totalLossPerLotInUSD;
    setCalculatedLotSize(lotSizeResult.toFixed(2));
    setIsLotSizeLoading(false);
  };
  const currencyOptions = Object.keys(currencies).sort();
  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4 font-sans py-8">
      <div className="w-full max-w-lg bg-gray-800 rounded-xl shadow-2xl">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('pl')}
            className={`flex-1 py-4 px-6 font-bold text-center rounded-tl-xl transition-colors ${activeTab === 'pl' ? 'bg-gray-800 text-indigo-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            P/L Calculator
          </button>
          <button
            onClick={() => setActiveTab('lotSize')}
            className={`flex-1 py-4 px-6 font-bold text-center rounded-tr-xl transition-colors ${activeTab === 'lotSize' ? 'bg-gray-800 text-teal-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            Lot Size Calculator
          </button>
        </div>
        {activeTab === 'pl' && (
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-center text-indigo-400 mb-6">
              Forex P/L Calculator
            </h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Currency Pair</label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {commonPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lotSize" className="block text-sm font-medium text-gray-300 mb-1">Lot Size</label>
                <input
                  id="lotSize"
                  type="number"
                  step="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  placeholder="Enter Lot Size"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="pips" className="block text-sm font-medium text-gray-300 mb-1">Pips (e.g., 50 for profit, -30 for loss)</label>
                <input
                  id="pips"
                  type="number"
                  step="0.1"
                  value={pips}
                  onChange={(e) => setPips(e.target.value)}
                  placeholder="Enter Pips"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleCalculate}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
              >
                Calculate P/L
              </button>
              {error && (
                <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg mt-4">
                  <p><span className="font-bold">Error:</span> {error}</p>
                </div>
              )}
              {profitOrLoss !== null && (
                <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-400">Profit / Loss</h3>
                    <p className={`text-3xl font-extrabold ${profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitOrLoss.toFixed(2)} {plInQuoteCurrency}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="targetCurrency" className="block text-sm font-medium text-gray-300 mb-1">Convert to:</label>
                    <select
                      id="targetCurrency"
                      value={targetCurrency}
                      onChange={(e) => {
                        setTargetCurrency(e.target.value);
                        setConvertedPL(null);
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {currencyOptions.map(code => (
                        <option key={code} value={code}>{code} - {currencies[code]}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleConvert}
                      className="w-full bg-teal-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 transition duration-300 ease-in-out disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Converting...' : `Convert to ${targetCurrency}`}
                    </button>
                  </div>
                  <div className="h-16 flex items-center">
                    {convertedPL !== null ? (
                      <div>
                        <h3 className="text-lg font-medium text-gray-400">Converted P/L</h3>
                        <p className={`text-3xl font-extrabold ${convertedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {convertedPL.toFixed(2)} {targetCurrency}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'lotSize' && (
          <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-center text-teal-400 mb-6">
              Lot Size Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Currency Pair</label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {commonPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Uses the pair's quote currency to get pip value.</p>
              </div>
              <div>
                <label htmlFor="riskAmount" className="block text-sm font-medium text-gray-300 mb-1">Risk Amount (USD)</label>
                <input
                  id="riskAmount"
                  type="number"
                  step="1"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value)}
                  placeholder="Enter Risk Amount"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="pipsForLotSize" className="block text-sm font-medium text-gray-300 mb-1">Stop Loss (Pips)</label>
                <input
                  id="pipsForLotSize"
                  type="number"
                  step="0.1"
                  value={pipsForLotSize}
                  onChange={(e) => setPipsForLotSize(e.target.value)}
                  placeholder="Enter Pips"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleCalculateLotSize}
                className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
                disabled={isLotSizeLoading}
              >
                {isLotSizeLoading ? 'Calculating...' : 'Calculate LotSize'}
              </button>
              {lotSizeError && (
                <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg mt-4">
                  <p><span className="font-bold">Error:</span> {lotSizeError}</p>
                </div>
              )}
              {calculatedLotSize !== null && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-medium text-gray-400">Calculated Lot Size</h3>
                  <p className="text-3xl font-extrabold text-teal-400">
                    {calculatedLotSize}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}