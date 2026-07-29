'use client';

/**
 * HandoverHistory — Sprint C.12
 *
 * Hiển thị lịch sử bàn giao của một asset.
 * List các biên bản: checkout (HANDOVER), return (RETURN), transfer (TRANSFER).
 */

import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, ArrowRight, User } from 'lucide-react';

interface HandoverRecord {
  id: string;
  docNo: string;
  action: 'HANDOVER' | 'RETURN' | 'TRANSFER';
  handoverDate: string;
  toUser: { firstName: string; lastName: string | null };
  confirmedAt: string | null;
  condition: string | null;
}

interface Props {
  assetId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getActionBadge(action: HandoverRecord['action']) {
  switch (action) {
    case 'HANDOVER':
      return {
        label: 'Cấp phát',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <ArrowRight size={12} />,
      };
    case 'RETURN':
      return {
        label: 'Thu hồi',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: <ArrowRight size={12} className="rotate-180" />,
      };
    case 'TRANSFER':
      return {
        label: 'Điều chuyển',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: <ArrowRight size={12} />,
      };
  }
}

export default function HandoverHistory({ assetId }: Props) {
  const [records, setRecords] = useState<HandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/handover?assetId=${assetId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setRecords(j.data.handovers.map((h: HandoverRecord) => ({
            ...h,
            handoverDate: h.handoverDate,
            confirmedAt: h.confirmedAt,
          })));
        } else {
          setError(j.message ?? 'Lỗi tải dữ liệu');
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải lịch sử bàn giao...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
        Lỗi: {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p>Chưa có biên bản bàn giao nào.</p>
        <p className="text-sm mt-1">Biên bản sẽ được tạo khi cấp phát hoặc thu hồi thiết bị.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const badge = getActionBadge(record.action);
        return (
          <div
            key={record.id}
            className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                  {record.confirmedAt ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle size={10} />
                      Đã xác nhận
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <Clock size={10} />
                      Chưa xác nhận
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Số biên bản:</span>
                    <p className="font-mono font-medium">{record.docNo}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày:</span>
                    <p>{formatDate(record.handoverDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Người nhận:</span>
                    <p className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      {record.toUser.firstName}
                      {record.toUser.lastName ? ` ${record.toUser.lastName}` : ''}
                    </p>
                  </div>
                  {record.condition && (
                    <div>
                      <span className="text-gray-500">Tình trạng:</span>
                      <p>{record.condition}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Status */}
              <div className="text-right">
                {record.confirmedAt ? (
                  <span className="text-xs text-emerald-600">
                    {formatDate(record.confirmedAt)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Chờ xác nhận</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
