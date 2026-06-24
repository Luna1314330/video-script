'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/auth-client'
import { fetchGenerationQuota } from '@/lib/generation/client'
import { getMembershipActionLabel } from '@/lib/profile/client'
import { cn } from '@/lib/utils'

type MembershipLinkProps = {
  className?: string
  underline?: boolean
}

export function MembershipLink({ className, underline }: MembershipLinkProps) {
  const [label, setLabel] = useState('开通会员')
  const [visible, setVisible] = useState(false)

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setVisible(false)
      return
    }

    try {
      const quota = await fetchGenerationQuota()
      if (!quota.membershipPurchaseEnabled) {
        setVisible(false)
        return
      }
      setVisible(true)
      setLabel(getMembershipActionLabel(quota.isMember))
    } catch {
      setVisible(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    window.addEventListener('quota-updated', refresh)
    return () => window.removeEventListener('quota-updated', refresh)
  }, [refresh])

  if (!visible) return null

  return (
    <Link
      href="/membership/purchase"
      className={cn(underline && 'underline underline-offset-2', className)}
    >
      {label}
    </Link>
  )
}
