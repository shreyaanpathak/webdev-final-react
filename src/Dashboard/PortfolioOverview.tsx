// PortfolioOverview.tsx

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Pie, Line } from "react-chartjs-2";
import { cardVariants } from "./constants";
import * as client from "./client";
import type { PortfolioSummary, PortfolioHistory, Position } from "./client";
import type { RootState } from "../store";
import { FaChartPie, FaChartLine, FaDollarSign, FaArrowUp, FaArrowDown } from "react-icons/fa";

interface PositionCardProps {
  position: Position;
}

const PositionCard = ({ position }: PositionCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-[#0D1F17] p-4 rounded-lg border border-[#10B981]/20 hover:border-[#10B981]/40 transition-colors"
  >
    <div className="flex justify-between items-start">
      <div>
        <h4 className="text-[#FFB800] font-bold text-lg">{position.symbol}</h4>
        <p className="text-[#10B981] text-sm mt-1">{position.quantity} shares</p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold">${position.current_price.toFixed(2)}</p>
        <p className={`text-sm ${position.change >= 0 ? 'text-[#10B981]' : 'text-red-500'} flex items-center justify-end gap-1 mt-1`}>
          {position.change >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          {Math.abs(position.percentChange).toFixed(2)}%
        </p>
      </div>
    </div>
  </motion.div>
);

export const PortfolioOverview = () => {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<PortfolioHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useSelector((state: RootState) => state.accountReducer);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#10B981',
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#0D1F17',
        titleColor: '#FFB800',
        bodyColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?._id) return;

      try {
        setLoading(true);
        const [summaryData, historyData] = await Promise.all([
          client.getPortfolioSummary(currentUser._id),
          client.getPortfolioHistory(currentUser._id)
        ]);
        setSummary(summaryData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to fetch portfolio data:", err);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const pieData = {
    labels: summary?.sector_allocation?.map(item => item.sector) || [],
    datasets: [{
      data: summary?.sector_allocation?.map(item => item.percentage) || [],
      backgroundColor: summary?.sector_allocation?.map(item => item.color) || [],
      borderWidth: 0,
    }]
  };

  const historyData = {
    labels: history?.dates || [],
    datasets: [{
      label: 'Portfolio Value',
      data: history?.values || [],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  if (loading) {
    return (
      <motion.div variants={cardVariants} className="bg-[#141414] rounded-xl p-6 border border-[#10B981]/20 animate-pulse">
        <div className="h-8 bg-[#10B981]/20 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[150px] bg-[#0D1F17] rounded-lg"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={cardVariants} className="bg-[#141414] rounded-xl p-6 border border-red-500/20">
        <div className="text-red-500 text-center">{error}</div>
      </motion.div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <motion.div
      variants={cardVariants}
      className="bg-[#141414] rounded-xl p-6 border border-[#10B981]/20 shadow-lg shadow-[#10B981]/5"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#FFB800] flex items-center gap-2">
          <FaChartPie />
          Portfolio Overview
        </h2>
        <div className="text-sm text-[#10B981]">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Value and Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0D1F17] p-6 rounded-lg border border-[#10B981]/20">
          <div className="flex items-center gap-2 mb-2">
            <FaDollarSign className="text-[#10B981]" />
            <h3 className="text-[#10B981] font-medium">Total Value</h3>
          </div>
          <div className="text-3xl font-bold text-white">
            ${summary.total_value.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0D1F17] p-6 rounded-lg border border-[#10B981]/20">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine className="text-[#10B981]" />
            <h3 className="text-[#10B981] font-medium">Total Gain/Loss</h3>
          </div>
          <div className={`text-3xl font-bold ${summary.total_gain_loss >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
            {summary.total_gain_loss >= 0 ? '+' : '-'}${Math.abs(summary.total_gain_loss).toLocaleString()}
          </div>
          <div className={`text-sm ${summary.total_gain_loss >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
            ({Math.abs(summary.total_gain_loss_percentage).toFixed(2)}%)
          </div>
        </div>

        <div className="bg-[#0D1F17] p-6 rounded-lg border border-[#10B981]/20">
          <div className="flex items-center gap-2 mb-2">
            <FaChartPie className="text-[#10B981]" />
            <h3 className="text-[#10B981] font-medium">Sector Allocation</h3>
          </div>
          <div className="h-[150px]">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Positions Section */}
      <div>
        <h3 className="text-[#10B981] font-bold mb-4 flex items-center gap-2">
          <FaChartLine />
          Current Positions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.positions?.length > 0 ? (
            summary.positions.map((position) => (
              <PositionCard key={position.symbol} position={position} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-[#10B981]/80 bg-[#0D1F17] rounded-lg">
              No positions found
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};