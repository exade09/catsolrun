import { useCallback, useEffect, useRef, useState } from 'react'

import { TOKEN_MINT, shortenMint } from '../config/token'
import { Icon } from './Icon'

export interface ContractBadgeProps {
  /** `compact` trims the address for tight header slots. */
  compact?: boolean
  className?: string
}

export function ContractBadge({ compact = false, className }: ContractBadgeProps) {
  const [copied, setCopied] = useState(false)
  const resetRef = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(resetRef.current), [])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_MINT)
    } catch {
      // Clipboard access can be blocked; the address stays selectable in the DOM.
      return
    }
    setCopied(true)
    window.clearTimeout(resetRef.current)
    resetRef.current = window.setTimeout(() => setCopied(false), 1800)
  }, [])

  return (
    <button
      type='button'
      className={'contract-badge' + (compact ? ' contract-badge--compact' : '') + (className ? ' ' + className : '')}
      onClick={copy}
      title={'Copy contract address ' + TOKEN_MINT}
      aria-label={copied ? 'Contract address copied' : 'Copy contract address ' + TOKEN_MINT}
    >
      <span className='contract-badge__label' aria-hidden='true'>CA</span>
      <span className='contract-badge__value'>{compact ? shortenMint(TOKEN_MINT, 5) : TOKEN_MINT}</span>
      <span className='contract-badge__action' aria-hidden='true'>
        <Icon name={copied ? 'check' : 'copy'} />
      </span>
      <span className='contract-badge__status' role='status' aria-live='polite'>
        {copied ? 'Copied' : ''}
      </span>
    </button>
  )
}
