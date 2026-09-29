"use client";

import React, { useState, useMemo } from "react";
import { StationData } from "@/lib/api";
import { getCategoryInfo } from "@/lib/aqi";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface StationTableProps {
  stations: StationData[];
  onSelectStation?: (station: StationData) => void;
}

type SortField = "name" | "city" | "aqi" | "pm25" | "pm10";
type SortOrder = "asc" | "desc";

export const StationTable: React.FC<StationTableProps> = ({
  stations,
  onSelectStation,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortField, setSortField] = useState<SortField>("aqi");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set(stations.map((s) => s.city));
    return ["all", ...Array.from(set).sort()];
  }, [stations]);

  // Filter & Sort
  const processedData = useMemo(() => {
    let list = [...stations];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
      );
    }

    if (selectedCity !== "all") {
      list = list.filter((s) => s.city === selectedCity);
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      } else {
        return sortOrder === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    return list;
  }, [stations, searchTerm, selectedCity, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      {/* Header, Search, City Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Delhi NCR Real-Time Station Directory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official monitoring station measurements & CPCB classifications
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station or city..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All NCR Cities" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-slate-800">
            <tr>
              <th
                onClick={() => toggleSort("name")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Station</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("city")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>City</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("aqi")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>AQI</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">Category</th>
              <th
                onClick={() => toggleSort("pm25")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>PM2.5</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("pm10")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>PM10</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">NO2</th>
              <th className="py-3 px-3">SO2</th>
              <th className="py-3 px-3">O3</th>
              <th className="py-3 px-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData.map((st) => {
              const cat = st.aqi !== null ? getCategoryInfo(st.aqi) : { color: "#94a3b8" };

              return (
                <tr
                  key={st.id}
                  onClick={() => onSelectStation && onSelectStation(st)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    {st.name}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                    {st.city}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900 dark:text-white text-sm">
                    {st.aqi ?? "N/A"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold inline-block"
                      style={{
                        backgroundColor: `${cat.color}18`,
                        color: cat.color,
                      }}
                    >
                      {st.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {st.pm25 !== null ? `${st.pm25} µg/m³` : "--"}
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {st.pm10 !== null ? `${st.pm10} µg/m³` : "--"}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {st.no2 !== null ? `${st.no2}` : "--"}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {st.so2 !== null ? `${st.so2}` : "--"}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {st.o3 !== null ? `${st.o3}` : "--"}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(st.last_updated)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, processedData.length)} of{" "}
          {processedData.length} stations
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-200 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
