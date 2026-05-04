import React from 'react';
import { Link } from 'react-router-dom';

const statusColors = {
  draft:        'bg-gray-100 text-gray-600',
  submitted:    'bg-yellow-100 text-yellow-700',
  under_review: 'bg-orange-100 text-orange-700',
  approved:     'bg-blue-100 text-blue-700',
  active:       'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-600',
  paused:       'bg-gray-100 text-gray-500',
};

const COVER_PALETTES = [
  { bg: 'bg-violet-100', emoji: '🎨' },
  { bg: 'bg-emerald-100', emoji: '⚡' },
  { bg: 'bg-amber-100', emoji: '📈' },
  { bg: 'bg-sky-100', emoji: '💻' },
  { bg: 'bg-rose-100', emoji: '✍️' },
  { bg: 'bg-indigo-100', emoji: '🎬' },
  { bg: 'bg-teal-100', emoji: '🔧' },
  { bg: 'bg-orange-100', emoji: '📱' },
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name = '') {
  const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-indigo-500'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getCoverPalette(title = '') {
  const idx = title.charCodeAt(0) % COVER_PALETTES.length;
  return COVER_PALETTES[idx];
}

export default function GigCard({ gig, actions, showStatus = false }) {
  const cover = getCoverPalette(gig.title);
  const initials = getInitials(gig.provider?.name);
  const avatarColor = getAvatarColor(gig.provider?.name);

  const lowestPrice = gig.lowestPrice;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 shadow-card hover:shadow-hover transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Cover area */}
      <div className={`${cover.bg} h-36 flex items-center justify-center relative shrink-0`}>
        <span className="text-5xl select-none">{cover.emoji}</span>
        {showStatus && (
          <span className={`absolute top-3 left-3 badge ${statusColors[gig.status] || 'bg-gray-100 text-gray-600'}`}>
            {gig.status}
          </span>
        )}
        {!showStatus && gig.category?.name && (
          <span className="absolute top-3 left-3 badge bg-white/80 backdrop-blur-sm text-gray-700 text-[11px]">
            {gig.category.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Provider row */}
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
            {initials || '?'}
          </div>
          <span className="text-xs text-gray-500 truncate">{gig.provider?.name ?? 'Provider'}</span>
        </div>

        {/* Title */}
        {gig.slug ? (
          <Link to={`/gigs/${gig.slug}`} className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors hover:underline">
            {gig.title}
          </Link>
        ) : (
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
            {gig.title}
          </h3>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 text-xs">
          {gig.ratingAvg > 0 ? (
            <>
              <span className="text-amber-400 font-semibold">★ {gig.ratingAvg.toFixed(1)}</span>
              <span className="text-gray-400">({gig.totalReviews})</span>
            </>
          ) : (
            <span className="text-gray-400">New</span>
          )}
          {gig.totalOrders > 0 && (
            <span className="text-gray-300">·</span>
          )}
          {gig.totalOrders > 0 && (
            <span className="text-gray-400">{gig.totalOrders} orders</span>
          )}
        </div>

        {/* Footer — price + actions */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          {lowestPrice != null ? (
            <span className="text-xs text-gray-400">
              from <span className="text-base font-bold text-gray-900">${lowestPrice}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400">View packages</span>
          )}
        </div>

        {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
