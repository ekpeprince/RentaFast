# **App Name**: RentaFast

## Core Features:

- Homepage with Search: Display a mobile-optimized homepage with a prominent search bar, category filters, and featured listings.
- Property Card Component: Display property information using a reusable card component with image, price badge, title, subtitle, and heart icon for saving.
- Dynamic Property Details Page: Implement dynamic routing to show detailed information about a selected property, including description, amenities, and contact options.
- Chat with Agent: Allow users to initiate a chat with the property agent.
- Mock Data Integration: Integrate mock data from `mockData.js` to display initial listings and property details.
- Firebase Configuration: Set up Firebase configuration using `firebaseConfig.js` with placeholders for API Key, Auth Domain, and Project ID.
- Fetch Listings Service: Create a `fetchListings()` function to retrieve listings (initially from mock data, later to be swapped with Firestore).

## Style Guidelines:

- Primary color: Navy Blue (#003366) for headers, buttons, and primary text.
- Accent color: Vibrant Orange (#FF8C00) for price badges, CTAs, and notification indicators.
- Background color: Clean White (#FFFFFF) to maximize white space and readability.
- Font: 'Inter', a sans-serif for a modern and readable look, suitable for both body and headlines.
- Use rounded corners (rounded-xl) on cards and inputs to provide a friendly user experience.
- Lucide React icons for consistent and clean visual representation of features and amenities.
- Subtle transitions and animations for a smooth user experience when navigating between pages.