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

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setLabel('开通会员')
      return
    }

    try {
      const quota = await fetchGenerationQuota()
      setLabel(getMembershipActionLabel(quota.isMember))
    } catch {
      setLabel('开通会员')
    }
  }, [])

  useEffect(() => {
    void refresh()
    window.addEventListener('quota-updated', refresh)
    return () => window.removeEventListener('quota-updated', refresh)
  }, [refresh])

  return (
    <Link
      href="/membership"
      className={cn(underline && 'underline underline-offset-2', className)}
    >
      {label}
    </Link>
  )
}
