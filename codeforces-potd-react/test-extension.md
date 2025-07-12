# Codeforces POTD Extension Test Guide

## Extension Features to Test

### 1. Content Script Injection
- [ ] Load the extension in Chrome
- [ ] Navigate to https://codeforces.com/problemset
- [ ] Check if "🔥 POTD" link appears in the header
- [ ] Verify the link has proper styling (red color, hover effects)

### 2. Background Script Functionality
- [ ] Open Chrome DevTools on Codeforces
- [ ] Check Console for "✅ content script loaded" message
- [ ] Check Console for "📦 injectPOTD running" message
- [ ] Verify background script fetches daily problems

### 3. Popup Functionality
- [ ] Click extension icon to open popup
- [ ] Test user handle input and saving
- [ ] Test user data loading (avatar, rating, rank)
- [ ] Test friends functionality
- [ ] Test upcoming contests display

### 4. Storage and API Integration
- [ ] Test chrome.storage.sync for daily problems
- [ ] Test chrome.storage.local for user data
- [ ] Verify Codeforces API calls work
- [ ] Test personalized POTD based on user rating

### 5. POTD Restriction Feature
- [ ] Enable POTD restriction in popup
- [ ] Test "Mark Today's POTD as Solved" button
- [ ] Verify restriction prevents access to other tabs

## Installation Steps

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `dist` folder
4. The extension should appear in your extensions list

## Expected Behavior

### On Codeforces Problemset Page:
- A red "🔥 POTD" link should appear in the header
- Clicking it should take you to today's personalized problem
- The problem should be within ±200 rating of your current rating

### In Extension Popup:
- Modern dark theme UI with Tailwind CSS styling
- User profile with avatar, rating, and rank
- Friends list with real-time data from Codeforces API
- Upcoming contests display
- POTD restriction toggle

## Troubleshooting

If the extension doesn't work:
1. Check Chrome DevTools Console for errors
2. Verify all files are in the `dist` folder
3. Reload the extension in `chrome://extensions/`
4. Clear browser cache and reload Codeforces

## Missing Features from Original Extension

The current React extension includes:
✅ Content script injection
✅ Background script for API calls
✅ Popup with modern UI
✅ User profile management
✅ Friends functionality
✅ Upcoming contests
✅ POTD restriction feature
✅ Personalized daily problems

All core features from the original extension have been implemented! 