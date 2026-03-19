# Changelog - RentaFast Cross River

All notable changes to this project will be documented in this file.

## [1.1.0] - 2024-05-24
### Added
- `README.md`: Professional documentation for the platform, features, and tech stack.
- `src/lib/app-config.ts`: Centralized configuration for Cross River hubs, currency, and feature toggles.
- `CHANGELOG.md`: This file, to track development progress.

### Fixed
- **Next.js 15 Route Resolution**: Updated dynamic routes in `src/app/property/[id]/page.tsx` and `src/app/chat/[id]/page.tsx` to correctly resolve `params` as a Promise using `React.use()`.
- **Flickering 404 Issue**: Modified `useDoc` and `useCollection` hooks to initialize `isLoading` to `true`, preventing premature "Not Found" states before data arrival.
- **Leads Dashboard Permissions**: Synchronized the application query in `src/app/leads/page.tsx` with Firestore security rules by enforcing a mandatory `landlordId` filter.
- **Public Profile Access**: Updated `firestore.rules` to allow public `get` access for user profiles, enabling tenants to see landlord/agent names on property details.
- **Public Stats Engagement**: Permitted unauthenticated users to increment `viewCount` on properties.
- **Sign-Up Race Condition**: Hardened `src/app/signup/page.tsx` to ensure the user profile document is successfully written to Firestore before redirecting to the dashboard.

### Changed
- **UI Polish**: Removed the blur effect from the homepage feature cards for a cleaner, higher-contrast visual presentation.
- **Security Logic**: Refined `firestore.rules` helpers (`isAdmin`, `isOwner`) for better reliability during initial account creation.

---
*Built with Trust and AI for the Cross River State property market.*
