import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'neutral', // 'sky' | 'emerald' | 'gold' | 'crimson' | 'neutral' | 'nsqf'
  size = 'md',        // 'sm' | 'md'
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`} {...props}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      <span className="badge-content">{children}</span>
    </span>
  );
}

// Helper to get formatted status badge
export function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    // Assessment & Task Scores
    COMPETENT: { label: 'Competent', variant: 'emerald', dot: true },
    PARTIALLY_DEMONSTRATED: { label: 'Partially Demonstrated', variant: 'gold', dot: true },
    NOT_DEMONSTRATED: { label: 'Not Demonstrated', variant: 'crimson', dot: true },
    NOT_ASSESSED: { label: 'Not Assessed', variant: 'neutral', dot: false },

    // Assignment & Workflow States
    DRAFT: { label: 'Draft', variant: 'neutral', dot: false },
    ASSIGNED: { label: 'Assigned', variant: 'sky', dot: true },
    ACCEPTED: { label: 'Accepted', variant: 'sky', dot: true },
    IN_PROGRESS: { label: 'In Progress', variant: 'sky', dot: true },
    AWAITING_REVIEW: { label: 'Awaiting Review', variant: 'gold', dot: true },
    COMPLETED: { label: 'Completed', variant: 'emerald', dot: true },
    REASSIGNED: { label: 'Reassigned', variant: 'gold', dot: false },
    CANCELLED: { label: 'Cancelled', variant: 'crimson', dot: false },

    // Qualification Status
    VERIFIED: { label: 'NCVET Verified', variant: 'emerald', dot: true },
    PENDING_REVIEW: { label: 'Review Pending', variant: 'gold', dot: true },
  };

  const key = String(status || '').toUpperCase();
  const config = statusConfig[key] || { label: status || 'Unknown', variant: 'neutral', dot: false };

  return (
    <Badge variant={config.variant} size={size} dot={config.dot}>
      {config.label}
    </Badge>
  );
}
