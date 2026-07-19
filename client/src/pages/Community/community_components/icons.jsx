const base = {fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"};

export function HeartIcon({filled, size = 16}) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.3-8.28C1 10.2 1.4 6.6 4.3 4.9c2.3-1.35 5-.7 6.7 1.3.5.58 1.5.58 2 0 1.7-2 4.4-2.65 6.7-1.3 2.9 1.7 3.3 5.3 1.6 7.82C18.7 16.65 12 21 12 21z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 21s-6.7-4.35-9.3-8.28C1 10.2 1.4 6.6 4.3 4.9c2.3-1.35 5-.7 6.7 1.3.5.58 1.5.58 2 0 1.7-2 4.4-2.65 6.7-1.3 2.9 1.7 3.3 5.3 1.6 7.82C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

export function CommentIcon({size = 16}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

export function DotsIcon({size = 18}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function PlusIcon({size = 14}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ImageIcon({size = 15}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function CloseIcon({size = 14}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function CheckBadgeIcon({size = 11}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
