# UX Heuristics & Cognitive Laws (Deep Reference)

Expanded reference for the `ux-designer` skill. Consult when making design rationale decisions or evaluating existing UX.

---

## Nielsen's 10 Usability Heuristics

### 1. Visibility of System Status

The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.

**Civic app examples:**
- Show "Loading 3 of 12 community centres..." with a progress bar
- Display "Last updated: March 15, 2026" on data-driven pages
- Indicate "You are viewing results for M4K 1A1" when location is active
- Show real-time shelter capacity with colour-coded status (green/yellow/red)

**Anti-pattern:** Silent loading — page appears blank for 3 seconds with no indicator.

### 2. Match Between System and Real World

Use language, concepts, and conventions familiar to the user. Follow real-world conventions and present information in a natural order.

**Civic app examples:**
- "Community Centre" not "Facility Entity Type: Recreation"
- "Open until 9 PM today" not "Operating hours: 0600-2100 EST"
- "Spadina" not "Ward 11" (unless targeting city staff)
- Show distance as "1.2 km away" not "1,200 metres" or coordinates

**Anti-pattern:** Exposing database field names or internal organizational terminology in the UI.

### 3. User Control and Freedom

Users often perform actions by mistake. Provide a clearly marked "emergency exit" to leave the unwanted action.

**Civic app examples:**
- "Back to search results" button on facility detail pages (preserving filter state)
- Undo action when removing a saved/favourited facility
- "Clear all filters" to reset search state
- Cancel button on multi-step registration that confirms before discarding

**Anti-pattern:** Registration form that loses all data on browser back.

### 4. Consistency and Standards

Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.

**Civic app examples:**
- Blue map pins for libraries everywhere — not green on one page
- "Register" always means program registration, "Sign up" means account creation
- Card layout consistent: image → title → address → distance → status
- Same filter interaction pattern across all search pages

**Anti-pattern:** Different navigation patterns on different pages of the same app.

### 5. Error Prevention

Even better than good error messages is careful design that prevents problems from occurring in the first place.

**Civic app examples:**
- Postal code field with format mask (`A1A 1A1`) preventing invalid input
- Date picker (not free text) for program date selection
- Disable "Register" button until all required fields are valid
- Auto-suggest neighbourhood names to prevent typos
- Confirm before submitting irreversible actions (registration, 311 requests)

**Anti-pattern:** Free-text address field that only validates after form submission.

### 6. Recognition Rather Than Recall

Minimize the user's memory load by making elements, actions, and options visible. The user should not have to remember information from one page to another.

**Civic app examples:**
- Show recently viewed facilities
- Display applied filters as removable chips above results
- Auto-suggest from previous searches
- Show facility name and address in the registration form header (so users know what they're registering for)

**Anti-pattern:** Facility ID shown on registration page with no name or address context.

### 7. Flexibility and Efficiency of Use

Allow users to tailor frequent actions. Provide accelerators — unseen by novice users — that speed up interaction for experts.

**Civic app examples:**
- "Near me" button for instant location-based search
- Keyboard shortcuts for map navigation (power users)
- Saved searches for regular facility visitors
- URL-based filters (shareable search results)
- Bulk actions for city staff views

**Anti-pattern:** Forcing all users through a 5-step wizard when power users need one click.

### 8. Aesthetic and Minimalist Design

Every extra unit of information competes with the relevant units and diminishes their relative visibility.

**Civic app examples:**
- Facility card shows only: name, address, distance, open/closed status
- Full details (programs, hours, accessibility, contact) behind "View details"
- Map view shows pins only — details in a slide-out drawer on click
- Dashboard shows 4-6 key metrics, not everything

**Anti-pattern:** Facility page that shows 40 fields in a single long form without hierarchy.

### 9. Help Users Recognize, Diagnose, and Recover from Errors

Error messages should be expressed in plain language (not codes), precisely indicate the problem, and constructively suggest a solution.

**Civic app examples:**
- "No community centres found within 2 km. Try expanding your search to 5 km?" (with button)
- "This program is full. 3 similar programs have spots available." (with links)
- "We couldn't find that postal code. Did you mean M4K 1A1?" (with suggestion)
- "Registration failed — the session has expired. Your form data has been saved. Please sign in again."

**Anti-pattern:** "Error 404" or "No results found" with no guidance.

### 10. Help and Documentation

Even though it's better if the system can be used without documentation, it may be necessary to provide help. Such information should be easy to search, focused on the user's task, and list concrete steps.

**Civic app examples:**
- Tooltip on "eFun" explaining what it means and how to get an eFun number
- "How do I register?" link near the registration button
- Contextual help icons next to form fields with civic jargon
- FAQ section addressing top 5 questions for each service

**Anti-pattern:** 50-page PDF user manual linked from the footer.

---

## Shneiderman's 8 Golden Rules of Interface Design

### 1. Strive for Consistency

Consistent sequences of actions in similar situations. Identical terminology in prompts, menus, and help screens. Consistent color, layout, capitalization, and fonts.

**Application:** Establish a component library early. Use the same card layout, button styles, and interaction patterns across all pages. Civic apps often have many similar pages (facility finder, library finder, park finder) — they should feel identical in interaction.

### 2. Seek Universal Usability

Recognize the needs of diverse users. Accommodate differences in age, ability, tech literacy, language, and device.

**Application:** This is paramount for civic apps. Design for:
- Elderly residents on older phones with large text settings
- New immigrants who may not read English fluently
- People with visual/motor impairments
- Power users (city staff) who need efficiency
- Low-bandwidth users in underserved areas

### 3. Offer Informative Feedback

For every user action, there should be system feedback. For frequent/minor actions, the response can be modest. For infrequent/major actions, the response should be more substantial.

**Application:**
- Clicking a filter: subtle chip appears (minor)
- Submitting registration: full success page with confirmation number (major)
- Saving a favourite: brief toast notification (moderate)

### 4. Design Dialogs to Yield Closure

Sequences of actions should have a beginning, middle, and end. Informative feedback at completion gives satisfaction and indicates readiness for the next group of actions.

**Application:** Multi-step registration should end with a clear confirmation page showing: what was registered, when, confirmation number, and next steps. Don't just redirect to the home page.

### 5. Prevent Errors

Design the system so users cannot make serious errors. If an error is made, detect it and offer simple, constructive corrections.

**Application:** Use constrained inputs (date pickers, dropdowns, auto-complete) for civic data entry. Validate as the user types, not on form submission. For destructive actions (cancel registration), require explicit confirmation.

### 6. Permit Easy Reversal of Actions

Actions should be reversible. This relieves anxiety and encourages exploration.

**Application:** Undo favourite removal. Allow filter changes without page reload. Preserve form state on navigation. For irreversible civic actions (registration submission), show a review/confirm step.

### 7. Keep Users in Control

Experienced users want to feel in control. Avoid surprises, tedious sequences, and inability to produce the desired result.

**Application:** Don't auto-redirect after timeout. Don't force unnecessary steps. Let users jump to any step in a wizard (if previous steps are valid). Provide keyboard access to all functionality.

### 8. Reduce Short-Term Memory Load

Humans have limited short-term memory. Keep displays simple, consolidate multi-page displays, and provide time for learning.

**Application:** Show the facility name on every step of registration. Display selected filters visibly. Use breadcrumbs to show navigation context. Don't require users to remember information from a previous page.

---

## Cognitive Laws — Detailed Application Guide

### Fitts's Law

**Principle:** Time to acquire a target is a function of distance to and size of the target.

**Formula implications:**
- Make primary action buttons large and prominent
- Place frequent actions in easy-to-reach areas (thumb zone on mobile)
- Reduce distance between related actions

**Civic app application:**
- "Find Nearest" button: large, full-width on mobile, prominent colour
- Map "Center on me" button: floating, always visible, 48px minimum
- Navigation: most common items at top/bottom of mobile nav (thumb-reachable)
- Avoid tiny links for important actions — no "click here" text links for primary flows

### Hick's Law

**Principle:** Time to make a decision increases logarithmically with the number of choices.

**Formula implications:**
- Reduce the number of choices presented at once
- Group and categorize options
- Provide smart defaults

**Civic app application:**
- Facility type filter: show top 5 categories, "More types" expands to full list
- Search: start with simple search, progressive disclosure for advanced filters
- Registration: pre-fill known information (logged-in user's address, neighbourhood)
- Dashboard: show 4-6 action cards, not 20 links
- Sort options: 3-4 most useful (Distance, Name, Rating), not 10

### Miller's Law

**Principle:** Average person can hold about 7 (±2) items in working memory.

**Application:**
- Search results: show 5-7 results before requiring scroll/pagination
- Navigation: max 5-7 top-level nav items
- Form sections: chunk related fields into groups of 3-5
- Step indicators: max 5-7 steps in a wizard
- Dashboard: 4-6 key metrics/cards

### Jakob's Law

**Principle:** Users spend most of their time on other sites. They expect your site to work the same as the ones they already know.

**Application:**
- Map interactions: follow Google Maps conventions (pinch zoom, tap for details, swipe to pan)
- Search: magnifying glass icon, results below, clear X button
- Card layouts: follow the image-title-description-action pattern users know from e-commerce
- Navigation: hamburger menu on mobile, horizontal nav on desktop
- Forms: label above field, asterisk for required, error below field

### Doherty Threshold

**Principle:** Productivity soars when computer and user interact at a pace (<400ms) that ensures neither has to wait on the other.

**Application:**
- Use skeleton loading states — show the layout shape immediately while data loads
- Optimistic UI: when user favourites a facility, show the heart filled immediately (update server in background)
- Prefetch likely next pages (e.g., preload facility detail when user hovers a card)
- Cache geolocation and recent searches for instant results on return visits
- Filter changes should update results without full page reload

### Von Restorff Effect (Isolation Effect)

**Principle:** An item that "stands out like a sore thumb" is more likely to be remembered.

**Application:**
- "Open Now" green badge on facility cards — stands out among neutral cards
- Urgent alerts (shelter capacity warning, service disruption) in distinct colour (amber/red banner)
- Primary CTA button in contrasting colour against neutral card backgrounds
- "New" badges on recently added facilities or programs
- Highlight the closest result in search results

---

## Common Usability Anti-Patterns in Civic/Government Apps

| Anti-Pattern | Problem | Better Approach |
|-------------|---------|-----------------|
| **Org-chart navigation** | "Parks, Forestry & Recreation" means nothing to residents | Organize by task: "Find a program," "Book a facility" |
| **PDF-first content** | Critical info locked in PDFs — not searchable, not mobile-friendly, not accessible | Structured HTML content with PDF as secondary download |
| **Acronym soup** | "Submit your eFun registration via PFR's ERP system" | Plain language: "Register for a program using your eFun number" |
| **Dead-end pages** | Facility page with no related actions or next steps | Always provide next steps: "Register," "Get directions," "View programs" |
| **Desktop-only maps** | Map interface designed for mouse, unusable on mobile | Mobile-first map with touch gestures and accessible list alternative |
| **Hidden search** | Search buried in navigation or absent entirely | Prominent search bar on every page; search as primary discovery path |
| **Registration walls** | Requiring account creation before browsing content | Let users browse freely; only require auth for registration/booking |
| **Stale data indicators** | "Last updated: 2019" erodes trust even if data is current | Show accurate dates; if data is live, say "Live data from City of Toronto" |
| **Inaccessible forms** | No labels, no error messages, no keyboard navigation | Follow WCAG 2.1 AA for all form patterns |
| **One-size-fits-all** | Same interface for residents and city staff | Role-based views: simple for public, powerful for staff |
