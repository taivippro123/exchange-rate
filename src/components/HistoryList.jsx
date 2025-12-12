import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = 'https://bebe-nonlicking-britni.ngrok-free.dev';

const CURRENCIES = [
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
];

const getFlagUrl = (code) => {
  return `https://wise.com/web-art/assets/flags/${code.toLowerCase()}.svg`;
};

const HistoryList = () => {
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'private'
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'rate', 'from_currency', 'to_currency', 'user'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  // Filters
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    from_currency: '',
    to_currency: '',
    limit: 50
  });

  const currentUserId = localStorage.getItem('userId');

  const formatCurrency = (value) => {
    if (!value || value === '--') return value;
    const num = parseFloat(value);
    const floored = Math.floor(num);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(floored);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      let url = '';
      
      if (activeTab === 'public') {
        url = `${API_BASE_URL}/api/history/public?limit=${filters.limit}`;
      } else {
        if (!currentUserId) {
          console.error('UserId not found');
          setHistory([]);
          setIsLoading(false);
          return;
        }
        url = `${API_BASE_URL}/api/history/me?userId=${currentUserId}&limit=${filters.limit}`;
      }

      // Add filters to URL
      const params = new URLSearchParams();
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.from_currency) params.append('from_currency', filters.from_currency);
      if (filters.to_currency) params.append('to_currency', filters.to_currency);
      
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }

      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        console.error('Failed to fetch history:', response.status);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.fromDate, filters.toDate, filters.from_currency, filters.to_currency, filters.limit]);

  // Expose refresh function globally
  useEffect(() => {
    window.refreshHistory = fetchHistory;
    return () => {
      if (window.refreshHistory) {
        delete window.refreshHistory;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  // Sort history
  const sortedHistory = useMemo(() => {
    if (!history.length) return [];
    
    const sorted = [...history].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'rate':
          aValue = parseFloat(a.rate);
          bValue = parseFloat(b.rate);
          break;
        case 'from_currency':
          aValue = a.from_currency || '';
          bValue = b.from_currency || '';
          break;
        case 'to_currency':
          aValue = a.to_currency || '';
          bValue = b.to_currency || '';
          break;
        case 'user':
          aValue = a.user_name || 'Anonymous';
          bValue = b.user_name || 'Anonymous';
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });
    
    return sorted;
  }, [history, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      from_currency: '',
      to_currency: '',
      limit: 50
    });
  };

  const SortButton = ({ field, label }) => {
    const isActive = sortBy === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
          isActive
            ? 'bg-cyan-500 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {label}
        {isActive && (
          <span className="ml-1">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Lịch sử đổi tiền</h3>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'public'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Công khai
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'private'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Của tôi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-600 mb-1">Từ ngày giờ</label>
            <input
              type="datetime-local"
              value={filters.fromDate ? new Date(filters.fromDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Convert local datetime to ISO 8601 UTC format
                if (value) {
                  const localDate = new Date(value);
                  const isoString = localDate.toISOString();
                  handleFilterChange('fromDate', isoString);
                } else {
                  handleFilterChange('fromDate', '');
                }
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-slate-600 mb-1">Đến ngày giờ</label>
            <input
              type="datetime-local"
              value={filters.toDate ? new Date(filters.toDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Convert local datetime to ISO 8601 UTC format
                if (value) {
                  const localDate = new Date(value);
                  const isoString = localDate.toISOString();
                  handleFilterChange('toDate', isoString);
                } else {
                  handleFilterChange('toDate', '');
                }
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs text-slate-600 mb-1">Từ tiền tệ</label>
            <select
              value={filters.from_currency}
              onChange={(e) => handleFilterChange('from_currency', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Tất cả</option>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs text-slate-600 mb-1">Sang tiền tệ</label>
            <select
              value={filters.to_currency}
              onChange={(e) => handleFilterChange('to_currency', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Tất cả</option>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-all"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

    

      {/* History list */}
      {isLoading ? (
        <div className="text-center py-4 text-slate-500 text-sm">Đang tải...</div>
      ) : sortedHistory.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-sm">
          {activeTab === 'private' && !currentUserId 
            ? 'Vui lòng đăng nhập để xem lịch sử của bạn'
            : 'Chưa có lịch sử'}
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sortedHistory.map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <img
                    src={getFlagUrl(item.from_currency)}
                    alt={item.from_currency}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {item.from_currency}
                  </span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-2">
                  <img
                    src={getFlagUrl(item.to_currency)}
                    alt={item.to_currency}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-slate-900">
                    {item.to_currency}
                  </span>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {formatCurrency(item.rate)}
                </span>
              </div>
              <div className="text-right min-w-[120px]">
                {item.user_id === currentUserId ? (
                  <div className="text-xs text-cyan-600 font-medium mb-1">Tôi</div>
                ) : item.user_name ? (
                  <div className="text-xs text-slate-700 font-medium mb-1">{item.user_name}</div>
                ) : (
                  <div className="text-xs text-slate-400 mb-1">Anonymous</div>
                )}
                <div className="text-xs text-slate-400">
                  {formatDate(item.created_at)}
                </div>
                {item.note && (
                  <div className="text-xs text-slate-500 mt-1 italic">"{item.note}"</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryList;

