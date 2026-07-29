'use client';

/**
 * HealthScoreSummary — Sprint C.11
 *
 * Hiển thị tổng quan Health Score trên Dashboard.
 * Lazy loaded component.
 */

import { Activity, AlertTriangle, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { HealthScoreDistribution } from '@/components/assets/HealthScoreBadge'

interface Distribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  total: number;
}

interface ReplacementCandidate {
  id: string;
  assetTag: string;
  name: string;
  healthScore: number | null;
  repairCount: number;
  purchaseDate: string | null;
}

interface Props {
  distribution: Distribution;
  avgScore: number | null;
  needsReplacement: number;
  topReplacementCandidates: ReplacementCandidate[];
}

function getGradeColor(grade: 'excellent' | 'good' | 'fair' | 'poor') {
  switch (grade) {
    case 'excellent': return 'text-emerald-600';
    case 'good': return 'text-blue-600';
    case 'fair': return 'text-amber-600';
    case 'poor': return 'text-red-600';
  }
}

function getGradeBg(grade: 'excellent' | 'good' | 'fair' | 'poor') {
  switch (grade) {
    case 'excellent': return 'bg-emerald-50 border-emerald-200';
    case 'good': return 'bg-blue-50 border-blue-200';
    case 'fair': return 'bg-amber-50 border-amber-200';
    case 'poor': return 'bg-red-50 border-red-200';
  }
}

export default function HealthScoreSummary({ distribution, avgScore, needsReplacement, topReplacementCandidates }: Props) {
  const { excellent, good, fair, poor, total } = distribution;

  const avgGrade = avgScore === null ? 'poor' : avgScore >= 85 ? 'excellent' : avgScore >= 70 ? 'good' : avgScore >= 50 ? 'fair' : 'poor';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Điểm sức khỏe thiết bị</h3>
        </div>
        {needsReplacement > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700">
            <AlertTriangle size={12} />
            {needsReplacement} cần thay thế
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Average Score */}
          <div className={`text-center p-3 rounded-xl border ${getGradeBg(avgGrade)}`}>
            <p className="text-3xl font-bold">{avgScore ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Điểm TB</p>
          </div>

          {/* Excellent */}
          <div className="text-center p-3 rounded-xl border bg-emerald-50 border-emerald-200">
            <p className="text-2xl font-bold text-emerald-600">{excellent}</p>
            <p className="text-xs text-emerald-600 mt-1">Tốt (85-100)</p>
          </div>

          {/* Good */}
          <div className="text-center p-3 rounded-xl border bg-blue-50 border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{good}</p>
            <p className="text-xs text-blue-600 mt-1">Khá (70-84)</p>
          </div>

          {/* Fair + Poor */}
          <div className="text-center p-3 rounded-xl border bg-amber-50 border-amber-200">
            <p className="text-2xl font-bold text-amber-600">{fair + poor}</p>
            <p className="text-xs text-amber-600 mt-1">Cần theo dõi</p>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Phân bố điểm sức khỏe</p>
          <HealthScoreDistribution
            excellent={excellent}
            good={good}
            fair={fair}
            poor={poor}
            total={total}
          />
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Tốt</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Khá</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> TB</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Kém</span>
          </div>
        </div>

        {/* Top Replacement Candidates */}
        {topReplacementCandidates.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500" />
              Thiết bị cần thay thế
            </p>
            <div className="space-y-2">
              {topReplacementCandidates.map((asset) => (
                <a
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown size={14} className="text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{asset.assetTag}</p>
                      <p className="text-xs text-gray-500">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{asset.healthScore ?? '—'}</p>
                    <p className="text-xs text-gray-400">{asset.repairCount} lần sửa</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Chưa có dữ liệu thiết bị</p>
          </div>
        )}
      </div>
    </div>
  );
}
