import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const HeartIcon = ({ size = 22, color = '#A855F7', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </Svg>
);

export const StarIcon = ({ size = 15, color = '#00E5FF', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7-5.4-4.7 7.1-.6z" />
  </Svg>
);

export const DropIcon = ({ size = 22, color = '#A855F7', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <Path fill={color} d="M12 2.5c1.5 2 4 6.5 4 10.5 0 2.5-1.5 4.5-4 4.5s-4-2-4-4.5c0-4 2.5-8.5 4-10.5z" />
    <Circle cx="12" cy="13" r="1.6" fill="#050508" />
  </Svg>
);

export const CalendarIcon = ({ size = 18, color = '#00E5FF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM7 12h5v5H7z" />
  </Svg>
);

export const LockIcon = ({ size = 16, color = '#8A93A3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2zm6-9a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zM12 3a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z" />
  </Svg>
);

// ---- nav icons ----
export const NavHome = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill={color} d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></Svg>
);
export const NavHeart = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill={color} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></Svg>
);
export const NavBars = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="2.5" y="11" width="3.5" height="10" rx="1.75" fill={color} />
    <Rect x="8" y="7" width="3.5" height="14" rx="1.75" fill={color} />
    <Rect x="13.5" y="3" width="3.5" height="18" rx="1.75" fill={color} />
    <Rect x="19" y="7" width="3.5" height="14" rx="1.75" fill={color} />
  </Svg>
);
export const NavGear = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill={color} d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></Svg>
);
