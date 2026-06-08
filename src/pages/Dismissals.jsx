import React, { useState, useEffect, useMemo } from "react";
import { API } from "@/actions/userAction";
import { URL } from "../constants/userConstants";

export default function DismissalsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    batsman: "",
    seriesId: "",
    season: "",
    format: "",
    bowlerType: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: "total", direction: "desc" });

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.batsman) params.append("batsman", filters.batsman);
        if (filters.seriesId) params.append("seriesId", filters.seriesId);
        if (filters.season) params.append("season", filters.season);
        if (filters.format) params.append("format", filters.format);
        if (filters.bowlerType) params.append("bowlerType", filters.bowlerType);
        const res = await API.get(`${URL}/api/match/dismissals?${params.toString()}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dismissals:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // Extract all unique wicket types from the data
  const allWicketTypes = useMemo(() => {
    const types = new Set();
    data.forEach((row) => {
      Object.keys(row.counts).forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [data]);

  // Sorting logic
  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === "batsman") {
        aVal = a.batsman.toLowerCase();
        bVal = b.batsman.toLowerCase();
      } else if (sortConfig.key === "total") {
        aVal = a.total;
        bVal = b.total;
      } else {
        aVal = a.counts[sortConfig.key] || 0;
        bVal = b.counts[sortConfig.key] || 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      batsman: "",
      seriesId: "",
      season: "",
      format: "",
      bowlerType: "",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 Dismissals Breakdown by Batsman</h1>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg items-end">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Batsman</label>
          <input
            type="text"
            placeholder="e.g., Kohli"
            value={filters.batsman}
            onChange={(e) => handleFilterChange("batsman", e.target.value)}
            className="border rounded px-2 py-1 text-sm w-40"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Series ID</label>
          <input
            type="text"
            placeholder="Series ID"
            value={filters.seriesId}
            onChange={(e) => handleFilterChange("seriesId", e.target.value)}
            className="border rounded px-2 py-1 text-sm w-32"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Season</label>
          <input
            type="text"
            placeholder="e.g., 2026"
            value={filters.season}
            onChange={(e) => handleFilterChange("season", e.target.value)}
            className="border rounded px-2 py-1 text-sm w-28"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Format</label>
          <select
            value={filters.format}
            onChange={(e) => handleFilterChange("format", e.target.value)}
            className="border rounded px-2 py-1 text-sm w-28"
          >
            <option value="">All</option>
            <option value="t20">T20</option>
            <option value="odi">ODI</option>
            <option value="test">Test</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Bowler Type</label>
          <select
            value={filters.bowlerType}
            onChange={(e) => handleFilterChange("bowlerType", e.target.value)}
            className="border rounded px-2 py-1 text-sm w-28"
          >
            <option value="">All</option>
            <option value="pace">Pace</option>
            <option value="spin">Spin</option>
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm mt-auto"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="p-2 text-left cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort("batsman")}
              >
                Batsman {sortConfig.key === "batsman" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              {allWicketTypes.map((type) => (
                <th
                  key={type}
                  className="p-2 text-center cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort(type)}
                >
                  {type} {sortConfig.key === type && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              ))}
              <th
                className="p-2 text-center cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort("total")}
              >
                Total {sortConfig.key === "total" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={allWicketTypes.length + 2} className="p-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={allWicketTypes.length + 2} className="p-8 text-center text-gray-400">
                  No dismissals found for the selected filters.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row.batsman} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-medium">{row.batsman}</td>
                  {allWicketTypes.map((type) => (
                    <td key={type} className="p-2 text-center">
                      {row.counts[type] || 0}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold">{row.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}