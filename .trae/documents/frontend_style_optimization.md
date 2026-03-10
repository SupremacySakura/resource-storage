# Frontend Style & Responsiveness Optimization Plan

This plan aims to overhaul the frontend UI/UX of the Resource Storage application to a unified, modern "Tech/Futuristic" theme with full mobile responsiveness, without modifying business logic.

## 1. Global Theme Definition (`src/style.css`)
Establish a centralized design token system using CSS variables for consistent styling.

-   **Color Palette**:
    -   Backgrounds: Deep Space Blue (`#0b1120`, `#1e293b`)
    -   Accents: Neon Cyan (`#06b6d4`), Electric Purple (`#8b5cf6`), Success Green (`#10b981`), Warning Orange (`#f59e0b`)
    -   Text: White/Off-white for readability
-   **Effects**:
    -   Glassmorphism: `backdrop-filter: blur(12px)`, semi-transparent backgrounds.
    -   Glows: `box-shadow` with accent colors.
    -   Borders: Thin, subtle borders with gradients.
-   **Typography**:
    -   Font family: 'Inter', system-ui, sans-serif.
    -   Monospace for data/numbers.

## 2. Component Style Updates

### 2.1 Sidebar (`src/components/Sidebar.vue`)
-   **Style**:
    -   Dark glassmorphism background.
    -   Active menu items with neon glow strip on the left.
    -   Hover effects with subtle lighting.
-   **Responsiveness**:
    -   **Desktop**: Collapsible sidebar (existing).
    -   **Mobile**: Convert to a full-screen drawer or off-canvas menu controlled by a hamburger button (to be added in Layout).
    -   Hide text/logos when screen width is small (< 768px) if not using drawer.

### 2.2 Login Page (`src/pages/Login.vue`)
-   **Visuals**:
    -   Background: Animated particles or a high-quality abstract tech background.
    -   Form Container: Glassmorphism card centered on screen.
    -   Inputs: Minimalist with glowing focus states.
-   **Layout**:
    -   Full responsive flex/grid layout.
    -   On mobile, remove the decorative left side and center the form.

### 2.3 Layout Shell (`src/pages/HomePage.vue`)
-   **Structure**:
    -   Add a **Mobile Header** visible only on small screens, containing the "Menu" toggle button.
    -   Use `el-drawer` or conditional classes for the Sidebar on mobile.
-   **Background**: Apply the global deep space background here to cover all pages.

### 2.4 Dashboard (`src/pages/Dashboard.vue`)
-   **Cards**: Update `el-card` styles to use the new glassmorphism classes.
-   **Grid**:
    -   Use CSS Grid with `minmax`.
    -   Desktop: 4 columns for metrics, 2 columns for charts.
    -   Mobile: 1 column stack.
-   **Charts/Icons**: Update colors to match the neon accents.

### 2.5 File List (`src/pages/FileList.vue`)
-   **Layout**:
    -   Desktop: Split view (Left List | Right Preview).
    -   Mobile: Full-width List. Clicking a file opens the Preview in a **Dialog/Drawer** instead of a side column.
-   **Styling**:
    -   List items: Modern, comfortable touch targets (44px+ height).
    -   Icons: Brighter, high-contrast colors.

### 2.6 File Upload (`src/pages/FileUpload.vue`)
-   **Drop Zone**:
    -   Cyberpunk style dashed borders with pulsing animation.
-   **File List**:
    -   Card-based layout for uploaded items.
    -   Progress bars with neon gradient.

## 3. Implementation Steps

1.  **Theme Setup**: Update `src/style.css` with new CSS variables.
2.  **Login Overhaul**: Refactor `src/pages/Login.vue` styles.
3.  **Sidebar & Layout**:
    -   Modify `src/components/Sidebar.vue` styling.
    -   Update `src/pages/HomePage.vue` to handle mobile menu toggling.
4.  **Dashboard Update**: Refactor `src/pages/Dashboard.vue`.
5.  **File List Responsive**: Refactor `src/pages/FileList.vue` (logic for mobile preview state).
6.  **Upload Page Update**: Refactor `src/pages/FileUpload.vue`.
7.  **Global Polish**: Check scrollbars, transitions, and font sizes.

## 4. Verification
-   Check desktop view (1920x1080).
-   Check mobile view (375x667) using Chrome DevTools.
-   Ensure all interactions (clicks, uploads) work without layout breakage.
