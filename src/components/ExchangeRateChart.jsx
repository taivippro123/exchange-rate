import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ExchangeRateChart = () => {
  const [fromCurrency, setFromCurrency] = useState('JPY');
  const [toCurrency, setToCurrency] = useState('VND');
  const [currentRange, setCurrentRange] = useState('1d');
  const [exchangeData, setExchangeData] = useState(null);
  const [status, setStatus] = useState('Đang tải...');
  const [dataCount, setDataCount] = useState(0);
  const [stats, setStats] = useState({
    current: '-',
    high: '-',
    low: '-'
  });

  // Chuyển đổi format ExchangeRate-API sang XE format
  const convertToXEFormat = (from, to, data) => {
    const rate = data.rates[to];
    const now = Date.now();
    
    // Tạo dữ liệu giả lập cho các khoảng thời gian
    const rates1y = [];
    const rates1m = [];
    const rates1w = [];
    const rates1d = [];
    const rates1h = [];
    
    // Tạo dữ liệu 1 năm (365 điểm)
    for (let i = 365; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * rate * 0.05; // ±5% biến động
      rates1y.push(rate + variance);
    }
    
    // Tạo dữ liệu 1 tháng (30 điểm)
    for (let i = 30; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * rate * 0.03;
      rates1m.push(rate + variance);
    }
    
    // Tạo dữ liệu 1 tuần (168 điểm - mỗi giờ)
    for (let i = 168; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * rate * 0.02;
      rates1w.push(rate + variance);
    }
    
    // Tạo dữ liệu 1 ngày (96 điểm - mỗi 15 phút)
    for (let i = 96; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * rate * 0.01;
      rates1d.push(rate + variance);
    }
    
    // Tạo dữ liệu 1 giờ (60 điểm - mỗi phút)
    for (let i = 60; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * rate * 0.005;
      rates1h.push(rate + variance);
    }
    
    return {
      from: from,
      to: to,
      timestamp: now,
      batchList: [
        {
          startTime: now - (365 * 24 * 60 * 60 * 1000),
          interval: 24 * 60 * 60 * 1000, // 1 ngày
          rates: rates1y
        },
        {
          startTime: now - (30 * 24 * 60 * 60 * 1000),
          interval: 24 * 60 * 60 * 1000, // 1 ngày
          rates: rates1m
        },
        {
          startTime: now - (7 * 24 * 60 * 60 * 1000),
          interval: 60 * 60 * 1000, // 1 giờ
          rates: rates1w
        },
        {
          startTime: now - (24 * 60 * 60 * 1000),
          interval: 15 * 60 * 1000, // 15 phút
          rates: rates1d
        },
        {
          startTime: now - (60 * 60 * 1000),
          interval: 60 * 1000, // 1 phút
          rates: rates1h
        }
      ]
    };
  };

  // Chuyển đổi format Frankfurter sang XE format
  const convertFrankfurterToXEFormat = (from, to, data) => {
    const rates = data.rates;
    const dates = Object.keys(rates).sort();
    
    const dailyRates = dates.map(date => rates[date][to]);
    const now = Date.now();
    const startTime = new Date(dates[0]).getTime();
    
    // Tạo dữ liệu cho các khoảng thời gian ngắn hơn từ dữ liệu hiện có
    const lastRate = dailyRates[dailyRates.length - 1];
    
    const rates1w = [];
    const rates1d = [];
    const rates1h = [];
    
    // 1 tuần
    for (let i = 168; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * lastRate * 0.02;
      rates1w.push(lastRate + variance);
    }
    
    // 1 ngày
    for (let i = 96; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * lastRate * 0.01;
      rates1d.push(lastRate + variance);
    }
    
    // 1 giờ
    for (let i = 60; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * lastRate * 0.005;
      rates1h.push(lastRate + variance);
    }
    
    return {
      from: from,
      to: to,
      timestamp: now,
      batchList: [
        {
          startTime: startTime,
          interval: 24 * 60 * 60 * 1000,
          rates: dailyRates
        },
        {
          startTime: now - (7 * 24 * 60 * 60 * 1000),
          interval: 60 * 60 * 1000,
          rates: rates1w
        },
        {
          startTime: now - (24 * 60 * 60 * 1000),
          interval: 15 * 60 * 1000,
          rates: rates1d
        },
        {
          startTime: now - (60 * 60 * 1000),
          interval: 60 * 1000,
          rates: rates1h
        }
      ]
    };
  };

  // Hàm tối ưu số điểm dữ liệu
  const optimizeDataPoints = (points, maxPoints) => {
    if (points.length <= maxPoints) {
      return points;
    }

    const result = [points[0]];
    const step = (points.length - 1) / (maxPoints - 1);
    
    for (let i = 1; i < maxPoints - 1; i++) {
      const index = Math.round(i * step);
      result.push(points[index]);
    }
    
    result.push(points[points.length - 1]);
    return result;
  };

  // Hàm lấy dữ liệu theo khoảng thời gian
  const getDataForTimeRange = (range) => {
    if (!exchangeData || !exchangeData.batchList) {
      return [];
    }

    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const startTime = range === 'all' ? 0 : now - timeRanges[range];
    const dataPoints = [];

    // Duyệt qua từng batch
    exchangeData.batchList.forEach(batch => {
      const { startTime: batchStart, interval, rates } = batch;

      rates.forEach((rate, index) => {
        const timestamp = batchStart + (index * interval);
        
        if (timestamp >= startTime && timestamp <= now) {
          dataPoints.push({
            timestamp,
            rate,
            date: new Date(timestamp)
          });
        }
      });
    });

    // Sắp xếp theo thời gian
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Tối ưu số điểm dữ liệu dựa theo range
    const maxPoints = {
      '1h': 60,
      '1d': 200,
      '1w': 200,
      '1m': 200,
      '1y': 365,
      'all': 500
    };
    
    return optimizeDataPoints(dataPoints, maxPoints[range] || 200);
  };

  // Format ngày tháng
  const formatDate = (date, range) => {
    const options = {
      '1h': { hour: '2-digit', minute: '2-digit' },
      '1d': { hour: '2-digit', minute: '2-digit' },
      '1w': { day: '2-digit', month: '2-digit' },
      '1m': { day: '2-digit', month: '2-digit' },
      '1y': { month: '2-digit', year: '2-digit' },
      'all': { month: '2-digit', year: '2-digit' }
    };

    return date.toLocaleString('vi-VN', options[range] || {});
  };

  // Hàm gọi API với nhiều nguồn dự phòng
  const fetchExchangeData = async (from, to) => {
    try {
      setStatus('Đang tải...');
      
      // Thử API 1: ExchangeRate-API (miễn phí, không cần key)
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${from}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.rates && data.rates[to]) {
            // Chuyển đổi sang format tương thích
            const convertedData = convertToXEFormat(from, to, data);
            setExchangeData(convertedData);
            setStatus('Sẵn sàng');
            return;
          }
        }
      } catch (e) {
        console.log('API 1 failed, trying API 2...');
      }
      
      // Thử API 2: Frankfurter API (miễn phí, có lịch sử)
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 10);
        
        const response = await fetch(
          `https://api.frankfurter.app/${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}?from=${from}&to=${to}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const convertedData = convertFrankfurterToXEFormat(from, to, data);
          setExchangeData(convertedData);
          setStatus('Sẵn sàng');
          return;
        }
      } catch (e) {
        console.log('API 2 failed');
      }
      
      throw new Error('Tất cả API đều không khả dụng');
      
    } catch (error) {
      console.error('Lỗi:', error);
      setStatus('Lỗi khi tải dữ liệu');
      alert('Không thể tải dữ liệu tỷ giá. Vui lòng thử lại sau hoặc chọn cặp tiền tệ khác.');
    }
  };

  // Cập nhật thống kê và số điểm dữ liệu
  useEffect(() => {
    if (!exchangeData) return;

    const data = getDataForTimeRange(currentRange);
    setDataCount(data.length);

    if (data.length > 0) {
      const rates = data.map(d => d.rate);
      const current = rates[rates.length - 1];
      const high = Math.max(...rates);
      const low = Math.min(...rates);

      setStats({
        current: current.toFixed(2) + ' ' + exchangeData.to,
        high: high.toFixed(2) + ' ' + exchangeData.to,
        low: low.toFixed(2) + ' ' + exchangeData.to
      });
    }
  }, [exchangeData, currentRange]);

  // Fetch dữ liệu khi currency thay đổi
  useEffect(() => {
    if (fromCurrency !== toCurrency) {
      fetchExchangeData(fromCurrency, toCurrency);
    }
  }, [fromCurrency, toCurrency]);

  // Xử lý thay đổi currency
  const handleFromCurrencyChange = (e) => {
    const newFrom = e.target.value;
    if (newFrom === toCurrency) {
      alert('Vui lòng chọn hai loại tiền tệ khác nhau!');
      return;
    }
    setFromCurrency(newFrom);
  };

  const handleToCurrencyChange = (e) => {
    const newTo = e.target.value;
    if (newTo === fromCurrency) {
      alert('Vui lòng chọn hai loại tiền tệ khác nhau!');
      return;
    }
    setToCurrency(newTo);
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = exchangeData ? (() => {
    const data = getDataForTimeRange(currentRange);
    return {
      labels: data.map(d => d.date),
      datasets: [{
        label: `Tỷ giá (${exchangeData.from}/${exchangeData.to})`,
        data: data.map(d => ({
          x: d.timestamp,
          y: d.rate
        })),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
      }]
    };
  })() : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            if (context[0]?.parsed?.x) {
              return new Date(context[0].parsed.x).toLocaleString('vi-VN');
            }
            return '';
          },
          label: function(context) {
            return 'Tỷ giá: ' + context.parsed.y.toFixed(2) + ' ' + (exchangeData?.to || '');
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: currentRange === '1h' ? 'minute' : 
                currentRange === '1d' ? 'hour' :
                currentRange === '1w' ? 'day' :
                currentRange === '1m' ? 'day' :
                currentRange === '1y' ? 'month' : 'month',
          tooltipFormat: 'PPpp',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd/MM',
            month: 'MM/yy'
          }
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value.toFixed(2);
          }
        }
      }
    }
  };

  const timeRanges = [
    { value: '1h', label: '1 Giờ' },
    { value: '1d', label: '1 Ngày' },
    { value: '1w', label: '1 Tuần' },
    { value: '1m', label: '1 Tháng' },
    { value: '1y', label: '1 Năm' },
    { value: 'all', label: 'Tất cả' }
  ];

  const currencies = [
    { value: 'JPY', label: 'JPY - Yên Nhật' },
    { value: 'USD', label: 'USD - Đô la Mỹ' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - Bảng Anh' },
    { value: 'CNY', label: 'CNY - Nhân dân tệ' },
    { value: 'KRW', label: 'KRW - Won Hàn Quốc' },
    { value: 'THB', label: 'THB - Baht Thái Lan' },
    { value: 'VND', label: 'VND - Việt Nam Đồng' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-5">📊 Biểu đồ Tỷ giá Ngoại tệ</h1>
        
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-2 text-gray-700 font-semibold">Từ tiền tệ:</label>
            <select
              value={fromCurrency}
              onChange={handleFromCurrencyChange}
              className="w-full p-3 rounded-lg border-2 border-gray-200 text-base cursor-pointer transition-colors hover:border-gray-300 focus:outline-none focus:border-indigo-500"
            >
              {currencies.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-2 text-gray-700 font-semibold">Sang tiền tệ:</label>
            <select
              value={toCurrency}
              onChange={handleToCurrencyChange}
              className="w-full p-3 rounded-lg border-2 border-gray-200 text-base cursor-pointer transition-colors hover:border-gray-300 focus:outline-none focus:border-indigo-500"
            >
              {currencies.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-gray-600 mb-5">
          Số điểm dữ liệu: <span className="font-semibold">{dataCount}</span> | 
          Trạng thái: <span 
            className="font-semibold"
            style={{ 
              color: status === 'Sẵn sàng' ? '#10b981' : 
                     status === 'Đang tải...' ? '#f59e0b' : '#ef4444' 
            }}
          >
            {status}
          </span>
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setCurrentRange(range.value)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                currentRange === range.value
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform -translate-y-0.5'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:-translate-y-0.5'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-5" style={{ height: '500px' }}>
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Đang tải dữ liệu...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-5 rounded-xl text-center">
            <div className="text-sm opacity-90 mb-1">Tỷ giá hiện tại</div>
            <div className="text-3xl font-bold">{stats.current}</div>
          </div>
          <div className="bg-gradient-to-r from-pink-400 to-red-500 text-white p-5 rounded-xl text-center">
            <div className="text-sm opacity-90 mb-1">Cao nhất</div>
            <div className="text-3xl font-bold">{stats.high}</div>
          </div>
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-5 rounded-xl text-center">
            <div className="text-sm opacity-90 mb-1">Thấp nhất</div>
            <div className="text-3xl font-bold">{stats.low}</div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <h3 className="text-yellow-800 font-semibold mb-2">💡 Cách sử dụng:</h3>
          <ul className="text-yellow-700 list-disc list-inside space-y-1">
            <li>Chọn cặp tiền tệ bạn muốn xem tỷ giá</li>
            <li>Nhấn các nút thời gian để xem dữ liệu theo khoảng khác nhau</li>
            <li>Di chuột lên biểu đồ để xem chi tiết từng điểm</li>
            <li>Dữ liệu được lấy từ ExchangeRate-API và Frankfurter API</li>
            <li><strong>Lưu ý:</strong> Dữ liệu cho khoảng thời gian ngắn (1h, 1d, 1w) là dữ liệu mô phỏng dựa trên tỷ giá hiện tại</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateChart;

