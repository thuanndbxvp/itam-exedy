'use client';

/**
 * HealthScoreBadge — Sprint C.11
 *
 * Hiển thị điểm sức khỏe thiết bị:
 * - Score 0-100 (100 = tốt nhất)
 * - Color-coded badge: Excellent/Good/Fair/Poor
 * - Progress bar visualization
 */

import { Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface HealthScoreBadgeProps {
  score: number | null;
  grade?: 'excellent' | 'good' | 'fair' | 'poor';
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  compact?: boolean;
}

interface GradeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const gradeConfigs: Record<string, GradeConfig> = {
  excellent: {
    label: 'Tốt',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: <CheckCircle size={14} />,
  },
  good: {
    label: 'Khá',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <Activity size={14} />,
  },
  fair: {
    label: 'Trung bình',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <Clock size={14} />,
  },
  poor: {
    label: 'Cần thay thế',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <AlertTriangle size={14} />,
  },
};

const sizeConfigs = {
  sm: { bar: 'h-1.5', text: 'text-xs', badge: 'px-2 py-0.5', gap: 'gap-1' },
  md: { bar: 'h-2', text: 'text-sm', badge: 'px-2.5 py-1', gap: 'gap-1.5' },
  lg: { bar: 'h-3', text: 'text-base', badge: 'px-3 py-1.5', gap: 'gap-2' },
};

function getGradeFromScore(score: number | null): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score === null) return 'poor';
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

function getGradeFromProps(grade?: string): 'excellent' | 'good' | 'fair' | 'poor' | null {
  if (!grade) return null;
  if (['excellent', 'good', 'fair', 'poor'].includes(grade)) {
    return grade as 'excellent' | 'good' | 'fair' | 'poor';
  }
  return null;
}

export default function HealthScoreBadge({
  score,
  grade,
  showBar = false,
  size = 'md',
  showLabel = true,
  compact = false,
}: HealthScoreBadgeProps) {
  const resolvedGrade = getGradeFromProps(grade) ?? getGradeFromScore(score);
  const config = gradeConfigs[resolvedGrade];
  const sizeConfig = sizeConfigs[size];
  const displayScore = score ?? '—';

  if (compact) {
    // Compact: chỉ icon + score
    return (
      <span
        className={`inline-flex items-center ${sizeConfig.gap} ${config.bgColor} ${config.color} font-medium rounded-full ${sizeConfig.badge}`}
        title={`Health Score: ${displayScore}/100 — ${config.label}`}
      >
        {config.icon}
        <span className={sizeConfig.text}>{displayScore}</span>
      </span>
    );
  }

  if (showBar) {
    // Full: score + bar + label
    const barPercent = score ?? 0;
    return (
      <div className={`flex flex-col ${sizeConfig.gap} ${config.bgColor} rounded-xl p-3 border ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {config.icon}
            <span className={`${config.color} font-semibold ${sizeConfig.text}`}>
              {displayScore}/100
            </span>
          </div>
          {showLabel && (
            <span className={`${config.color} ${sizeConfig.text} font-medium`}>
              {config.label}
            </span>
          )}
        </div>
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeConfig.bar}`}>
          <div
            className={`h-full rounded-full transition-all ${barColor(score ?? 0)}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Default: badge style
  return (
    <span
      className={`inline-flex items-center ${sizeConfig.gap} ${config.bgColor} ${config.color} font-medium rounded-full ${sizeConfig.badge} border ${config.borderColor}`}
      title={`Health Score: ${displayScore}/100 — ${config.label}`}
    >
      {config.icon}
      <span className={sizeConfig.text}>{displayScore}</span>
      {showLabel && <span className={sizeConfig.text}>— {config.label}</span>}
    </span>
  );
}

function barColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// ============================================================================
// ENHANCED COMPONENTS
// ============================================================================

/**
 * Replacement Advisory Banner — hiển thị cảnh báo thay thế
 */
interface ReplacementAlertProps {
  score: number | null;
  recommendation: 'replace' | 'monitor' | 'continue';
  reasons: string[];
  onViewDetails?: () => void;
}

export function ReplacementAlertBanner({
  score,
  recommendation,
  reasons,
  onViewDetails,
}: ReplacementAlertProps) {
  if (recommendation === 'continue' || reasons.length === 0) {
    return null;
  }

  const isReplace = recommendation === 'replace';
  const config = isReplace
    ? {
        bg: 'bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: 'Cảnh báo: Đề xuất thay thế',
        titleColor: 'text-red-800',
        iconColor: 'text-red-600',
      }
    : {
        bg: 'bg-amber-50 border-amber-200',
        icon: <Clock className="w-5 h-5 text-amber-600" />,
        title: 'Lưu ý: Theo dõi / Nâng cấp',
        titleColor: 'text-amber-800',
        iconColor: 'text-amber-600',
      };

  return (
    <div className={`rounded-xl border p-4 ${config.bg}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <h4 className={`font-semibold ${config.titleColor}`}>{config.title}</h4>
          {score !== null && (
            <p className={`text-sm ${config.titleColor} opacity-80 mt-0.5`}>
              Điểm sức khỏe: {score}/100
            </p>
          )}
          <ul className={`text-sm mt-2 space-y-1 ${config.titleColor} opacity-80`}>
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className={`text-sm font-medium ${config.iconColor} hover:underline mt-3`}
            >
              Xem chi tiết →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Health Score Card — card đầy đủ với breakdown factors
 */
interface HealthScoreCardProps {
  score: number | null;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    depreciation: { score: number; max: number; detail: string };
    age: { score: number; max: number; detail: string };
    repair: { score: number; max: number; detail: string };
  };
  recommendation: 'replace' | 'monitor' | 'continue';
  replaceReasons: string[];
}

export function HealthScoreCard({
  score,
  grade,
  factors,
  recommendation,
  replaceReasons,
}: HealthScoreCardProps) {
  const config = gradeConfigs[grade];

  return (
    <div className={`rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${config.color}`} />
          <span className={`font-semibold ${config.color}`}>Điểm sức khỏe</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${config.color}`}>{score ?? '—'}</span>
          <span className={`text-lg ${config.color} opacity-70`}>/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-white rounded-full overflow-hidden mb-4 border border-gray-200">
        <div
          className={`h-full rounded-full transition-all ${barColor(score ?? 0)}`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>

      {/* Grade Label */}
      <div className="text-center mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor} ${config.color} font-medium text-sm border ${config.borderColor}`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* Factors Breakdown */}
      <div className="space-y-3">
        <FactorBar
          label="Khấu hao"
          score={factors.depreciation.score}
          max={factors.depreciation.max}
          detail={factors.depreciation.detail}
        />
        <FactorBar
          label="Tuổi thọ"
          score={factors.age.score}
          max={factors.age.max}
          detail={factors.age.detail}
        />
        <FactorBar
          label="Sửa chữa"
          score={factors.repair.score}
          max={factors.repair.max}
          detail={factors.repair.detail}
        />
      </div>

      {/* Recommendation */}
      {recommendation !== 'continue' && (
        <div className={`mt-4 p-3 rounded-lg border ${recommendation === 'replace' ? 'bg-red-100 border-red-200' : 'bg-amber-100 border-amber-200'}`}>
          <p className={`text-sm font-medium ${recommendation === 'replace' ? 'text-red-800' : 'text-amber-800'}`}>
            {recommendation === 'replace' ? '🔴 Đề xuất thay thế' : '🟡 Nên theo dõi'}
          </p>
          {replaceReasons.length > 0 && (
            <ul className={`text-xs mt-1 space-y-0.5 ${recommendation === 'replace' ? 'text-red-700' : 'text-amber-700'}`}>
              {replaceReasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface FactorBarProps {
  label: string;
  score: number;
  max: number;
  detail: string;
}

function FactorBar({ label, score, max, detail }: FactorBarProps) {
  const percent = max > 0 ? (score / max) * 100 : 0;
  const barColorClass = percent >= 80 ? 'bg-red-500' : percent >= 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">-{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColorClass}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
    </div>
  );
}

/**
 * Quick Stats: Health Score Distribution
 */
interface HealthScoreDistributionProps {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  total: number;
}

export function HealthScoreDistribution({ excellent, good, fair, poor, total }: HealthScoreDistributionProps) {
  if (total === 0) return null;

  const percent = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-end gap-1 h-16">
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${Math.max(4, percent(excellent))}%` }} />
        <span className="text-xs text-gray-600">{percent(excellent)}%</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(4, percent(good))}%` }} />
        <span className="text-xs text-gray-600">{percent(good)}%</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-full bg-amber-500 rounded-t" style={{ height: `${Math.max(4, percent(fair))}%` }} />
        <span className="text-xs text-gray-600">{percent(fair)}%</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-full bg-red-500 rounded-t" style={{ height: `${Math.max(4, percent(poor))}%` }} />
        <span className="text-xs text-gray-600">{percent(poor)}%</span>
      </div>
    </div>
  );
}
