// Disable the rule for legitimate data-load effects in this file.
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

/**
 * IntegrationsClient — Sprint C7-C9 admin UI.
 * Refactored in Sprint R.3 - extracted to components/
 *
 * Quản lý:
 *  - API Tokens (C7): create + list + revoke.
 *  - Email Templates (C8): edit + preview.
 *  - Notification Channels (C9): create + test + delete Slack webhooks.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key, Mail, Bell } from 'lucide-react'
import { TokensTab } from './components/TokensTab'
import { TemplatesTab } from './components/TemplatesTab'
import { ChannelsTab } from './components/ChannelsTab'
import type { Tab } from './types'

const TAB_LABELS: Record<Tab, { label: string; icon: typeof Key }> = {
  tokens: { label: 'API Tokens', icon: Key },
  templates: { label: 'Email Templates', icon: Mail },
  channels: { label: 'Notification Channels', icon: Bell },
}

export default function IntegrationsClient() {
  const [tab, setTab] = useState<Tab>('tokens')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} className="mr-1" /> Quay lại Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
      <p className="text-sm text-gray-500 mb-6">
        Quản lý API tokens, email templates, và notification channels cho tích hợp ngoài.
      </p>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex items-center gap-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map((k) => {
          const Icon = TAB_LABELS[k].icon
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === k
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={14} />
              {TAB_LABELS[k].label}
            </button>
          )
        })}
      </div>

      {tab === 'tokens' && <TokensTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'channels' && <ChannelsTab />}
    </div>
  )
}
