'use client';

/**
 * E-Sign Confirmation Page — Sprint C.12
 *
 * Page công khai để xác nhận biên bản bàn giao.
 * URL: /handover/confirm/[token]
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, AlertTriangle, FileText, ShieldCheck } from 'lucide-react';

interface HandoverInfo {
  id: string;
  docNo: string;
  assetTag: string;
  assetName: string;
  toUserName: string;
  confirmedAt: string | null;
}

export default function HandoverConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [handover, setHandover] = useState<HandoverInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/handover/confirm/${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setHandover(j.data.handover);
        } else {
          setError(j.message || 'Token không hợp lệ');
        }
      })
      .catch(() => setError('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/handover/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const j = await r.json();
      if (j.ok) {
        setSuccess(true);
        // Refresh data
        const verifyRes = await fetch(`/api/handover/confirm/${token}`);
        const verifyJ = await verifyRes.json();
        if (verifyJ.ok) {
          setHandover(verifyJ.data.handover);
        }
      } else {
        setError(j.message || 'Xác nhận thất bại');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Xác nhận thất bại</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Vui lòng liên hệ phòng IT để được hỗ trợ.
          </p>
        </div>
      </div>
    );
  }

  if (success || handover?.confirmedAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Xác nhận thành công!</h1>
          <p className="text-gray-600 mb-6">
            Biên bản bàn giao <strong>{handover?.docNo}</strong> đã được xác nhận.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Số biên bản:</span>
                <span className="font-mono font-medium">{handover?.docNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thiết bị:</span>
                <span className="font-medium">{handover?.assetTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tên thiết bị:</span>
                <span>{handover?.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Người nhận:</span>
                <span>{handover?.toUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Xác nhận lúc:</span>
                <span>
                  {handover?.confirmedAt
                    ? new Date(handover.confirmedAt).toLocaleString('vi-VN')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Cảm ơn bạn đã xác nhận. Biên bản đã được ghi nhận trong hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Xác nhận Biên bản Bàn giao</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vui lòng kiểm tra thông tin và xác nhận
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Số biên bản:</span>
              <span className="font-mono font-medium">{handover?.docNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mã tài sản:</span>
              <span className="font-medium">{handover?.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tên thiết bị:</span>
              <span>{handover?.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Người nhận:</span>
              <span>{handover?.toUserName}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Cam kết</p>
              <p className="text-amber-700">
                Tôi xác nhận đã nhận đầy đủ tài sản trên và cam kết bảo quản theo quy định của công ty.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xác nhận...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Xác nhận
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Biên bản này được xác nhận điện tử và có giá trị pháp lý
        </p>
      </div>
    </div>
  );
}
