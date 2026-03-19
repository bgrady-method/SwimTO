# Civic & Government UX Patterns (Deep Reference)

Patterns and personas for designing civic applications, drawn from GOV.UK, Canada.ca, USWDS, and Toronto-specific context. Consult when designing features that serve residents, city staff, or community organizations.

---

## GOV.UK Design System (Gold Standard)

The UK Government Digital Service (GDS) sets the benchmark for civic UX. Key patterns to adopt:

### Notification Banner

**When to use:** To tell users about something they need to know — an important update, a successful action, or a time-sensitive alert.

**Civic app application:**
- Service disruption alerts ("Scarborough Civic Centre is closed today due to weather")
- Successful registration confirmation
- Seasonal notices ("Outdoor pools open June 15 — Register now")

**Pattern:**
```
┌──────────────────────────────────────────┐
│ ⓘ Important                              │
│                                          │
│ Program registration for Summer 2026     │
│ opens April 1 at 7:00 AM.               │
│                                          │
│ [Set a reminder]                         │
└──────────────────────────────────────────┘
```

### Task List Pattern

**When to use:** To show users a list of tasks they need to complete, with status indicators.

**Civic app application:**
- Permit application progress
- Program registration steps
- Account setup checklist

**Pattern:**
```
Application for Community Garden Plot

1. Personal information          [Completed]
2. Plot preferences              [Completed]
3. Garden experience             [In progress]
4. Upload photo ID               [Not started]
5. Review and submit             [Cannot start yet]
```

### Check Answers Pattern

**When to use:** Let users review their answers before submitting. Reduces errors and builds confidence.

**Civic app application:**
- Before submitting any registration or application
- Before sending a 311 service request

**Pattern:**
```
Check your answers before submitting

Personal details
  Name                 Jane Smith          [Change]
  Email                jane@email.com      [Change]

Program details
  Program              Aquafit - Monday    [Change]
  Location             Regent Park CC      [Change]
  Start date           April 6, 2026       [Change]

[Submit registration]
```

### One Thing Per Page

**When to use:** For complex forms and transactions. Each page asks one question or requires one decision.

**Civic app application:**
- Program registration: one step per page (personal info → program selection → schedule → payment → review)
- 311 request: what's the issue → where is it → when did it start → upload photo → review

**Benefits:**
- Reduces cognitive load
- Easy to save progress
- Works well on mobile
- Simpler error handling (one error per page)

### Start Page Pattern

**When to use:** Entry point for a service, explaining what it is, who it's for, and what they'll need.

**Civic app application:**
- Program registration start page
- Permit application landing
- 311 service request entry point

**Pattern:**
```
Register for a recreation program

Use this service to:
- Browse available programs at City of Toronto facilities
- Register yourself or family members
- Pay registration fees online

Before you start, you'll need:
- Your eFun number (or create one)
- A valid email address
- Payment method (credit card or debit)

This usually takes about 10 minutes.

[Start now →]
```

---

## Canada.ca (GCWeb) Design System

### Institutional Landing Page

**Pattern:** Entry point for a government institution or major service area. Hierarchical navigation with clear topic groupings.

**Civic app application:**
- City services directory: group services by resident need (Housing, Transportation, Recreation, Health)
- Not by department (Works & Infrastructure, Community & Social Services)

### Service Initiation Page

**Pattern:** Tells users what a service does, eligibility, what they need, and how to apply. Single clear CTA.

**Civic app application:**
- Each city service (library card, parking permit, recreation registration) should have a service initiation page following this pattern

### Multi-Page Ordered Form

**Pattern:** Step-by-step form with progress indicator, validation per step, save/resume capability.

**Key features:**
- Step indicator showing current position
- "Save and continue later" for long forms
- Validation per step (don't let users proceed with errors)
- Summary/review before submission
- Confirmation page with reference number

---

## US Web Design System (USWDS)

### Banner Component

**Pattern:** Official government website indicator at the very top of the page. Builds trust.

**Civic app application:**
```
┌──────────────────────────────────────────────────┐
│ 🏛 An official City of Toronto application       │
│ [Here's how you know ▼]                          │
└──────────────────────────────────────────────────┘
```

Expanding reveals: official domain verification, data source information, privacy policy link.

### Step Indicator

**Pattern:** Shows progress through a multi-step process with clear labeling.

**Civic app application:**
- Program registration wizard
- Permit application
- Account creation

**Pattern:**
```
① Personal info  →  ② Select program  →  ③ Schedule  →  ④ Payment  →  ⑤ Confirm
     [done]             [current]           [upcoming]     [upcoming]    [upcoming]
```

### Summary Box

**Pattern:** Highlights key information or takeaways in a visually distinct container.

**Civic app application:**
- Facility summary at top of detail page
- Program registration summary
- Search results count and active filters

---

## Toronto.ca Observed Patterns

### Service Directory Layout

**Current pattern on toronto.ca:**
- Alphabetical service listing with search
- Each service links to a detail page with: description, eligibility, how to apply, fees, contact

**Improvement opportunities:**
- Add location-based relevance (show services near the user first)
- Add category filtering (not just alphabetical)
- Show service availability status in real-time

### Facility Page Structure

**Current pattern:**
- Facility name and type
- Address with map link
- Phone number
- Hours of operation (often in table format)
- Programs offered (links to registration)
- Accessibility information
- Photos (sometimes)

**Improvement opportunities:**
- Real-time "Open Now" / "Closed" status
- Distance from user
- Program availability (spots remaining)
- User reviews/ratings (carefully moderated)
- "Similar facilities nearby"

### Map Embed Patterns

**Current approach:** ArcGIS Web AppBuilder maps embedded via iframe.

**Improvement opportunities:**
- Modern map UI with React Leaflet
- Clustering for dense areas
- Mobile-optimized touch interactions
- List view alternative for accessibility
- Filter integration with map view

---

## Civic User Personas

### 1. Resident Seeking Services

**Name:** Priya
**Age:** 34
**Context:** Working parent in Scarborough, looking for after-school programs for her kids
**Tech:** iPhone, comfortable with apps, uses Google Maps daily
**Needs:** Quick search by location, filter by age/activity type, real-time availability, easy registration
**Frustrations:** Having to call to check availability, confusing registration systems, outdated info
**Design implications:**
- Mobile-first design
- Location as primary search dimension
- Real-time availability indicators
- Streamlined registration flow
- Push notifications for program openings

### 2. New Immigrant

**Name:** Ahmed
**Age:** 28
**Context:** Recently arrived in Toronto, finding settlement services, learning about city resources
**Tech:** Android phone (mid-range), some English proficiency, prefers visual cues
**Needs:** Multilingual support, clear visual navigation, service discovery, transit directions
**Frustrations:** Civic jargon, complex forms, assumption of local knowledge (what's a "ward"?)
**Design implications:**
- Plain language (Grade 6 reading level)
- Visual icons and imagery to supplement text
- Tooltips explaining civic terms
- Multilingual toggle (EN/FR minimum, consider other languages)
- Integration with transit directions
- Cultural sensitivity in imagery and examples

### 3. Senior Citizen

**Name:** Margaret
**Age:** 72
**Context:** Lives alone in Etobicoke, looking for social programs and wellness activities
**Tech:** iPad, moderate comfort with technology, larger text settings enabled
**Needs:** Large text/buttons, simple navigation, phone number visible, print-friendly views
**Frustrations:** Small text, complex navigation, too many steps, "click here" with no context
**Design implications:**
- Minimum 16px body text, preferably 18px
- 48x48px minimum touch targets (exceed WCAG minimum)
- Simple, linear navigation
- Prominent phone numbers and physical addresses
- Print stylesheet for offline reference
- High contrast mode support
- Avoid hover-only interactions

### 4. Person with Disability

**Name:** David
**Age:** 45
**Context:** Uses a wheelchair, works downtown, looking for accessible facilities and programs
**Tech:** Desktop with screen reader (NVDA), keyboard-only navigation
**Needs:** Accessibility information upfront, keyboard navigation, screen reader compatibility
**Frustrations:** Accessibility info hidden or absent, inaccessible maps, keyboard traps
**Design implications:**
- Accessibility features as first-class filter (not buried in "more filters")
- Full keyboard navigation for all interactions
- ARIA landmarks and labels on all interactive elements
- Map alternative (list view with addresses)
- Semantic HTML over ARIA when possible
- Skip navigation links
- Announce dynamic content changes to screen readers
- Accessibility details on every facility page (ramp access, elevator, accessible washrooms)

### 5. City Staff

**Name:** Jason
**Age:** 38
**Context:** Recreation coordinator managing programs at multiple community centres
**Tech:** Desktop (work laptop), high tech literacy, uses the system daily
**Needs:** Efficiency, bulk operations, data export, dashboard overview, quick switching between facilities
**Frustrations:** Slow interfaces, too many clicks for common tasks, no bulk actions
**Design implications:**
- Power user shortcuts (keyboard shortcuts, bulk select)
- Dense information display (tables over cards)
- Dashboard with key metrics (registration rates, capacity, waitlists)
- Quick facility switcher
- Data export (CSV, PDF reports)
- Role-based UI (more options, fewer guardrails than public view)

---

## Civic UX Principles — Cross-Reference Matrix

| Principle | GOV.UK | Canada.ca | USWDS | Toronto Context |
|-----------|--------|-----------|-------|-----------------|
| **Plain language** | Content design guide: Grade 6-8 | Canada.ca style guide | Plain language guidelines | Many ESL speakers; avoid civic jargon |
| **One thing per page** | Core pattern for transactions | Multi-page forms | Step indicator | Reduces errors in registration |
| **Progressive disclosure** | Start pages → service pages → detail | Topic → sub-topic → task | Summary boxes → full content | Information density varies by service |
| **Trust indicators** | Crown logo, ".gov.uk" domain | Canada wordmark, official banner | Official banner component | City of Toronto branding, data source labels |
| **Mobile first** | Responsive by default | GCWeb is responsive | Mobile-first grid | High mobile usage for facility finding |
| **Accessibility** | AAA for core content, AA minimum | WCAG 2.1 AA required | WCAG 2.1 AA, Section 508 | Diverse population, AODA compliance |
| **Error handling** | Specific, constructive error messages | Inline validation | Error summary at top | Prevent errors in registration/forms |
| **Feedback** | Success banners, email confirmation | Confirmation pages | Alert components | Confirmation numbers for all transactions |

---

## Toronto-Specific Design Considerations

### Seasonality

Toronto's climate significantly impacts city services. Design should account for:

| Season | UX Impact |
|--------|-----------|
| **Winter** (Dec-Mar) | Indoor programs prominent; outdoor rinks/trails status; snow removal info; cold weather alerts |
| **Spring** (Apr-May) | Program registration opens; outdoor facilities reopening; seasonal transition messaging |
| **Summer** (Jun-Aug) | Outdoor pools, splash pads, camps; extended hours; festivals and events; cooling centres |
| **Fall** (Sep-Nov) | New program sessions; back-to-school programs; fall colour in parks; winter prep info |

### Geography

- **43 wards** — but residents think in neighbourhoods (158 neighbourhoods)
- Dense downtown core vs. sprawling suburban areas (Scarborough, Etobicoke, North York)
- TTC coverage varies — some areas poorly served by transit
- Distance matters more in suburban areas

### Bilingual Requirements

- English and French are official languages
- French text is typically 20-30% longer than English — design layouts with flexibility
- Some services may benefit from additional languages (Simplified Chinese, Tamil, Urdu, Tagalog — top languages after EN/FR in Toronto)
- Use `lang` attribute correctly for screen readers
- Consider right-to-left (RTL) text support for Arabic, Urdu

### AODA Compliance

The Accessibility for Ontarians with Disabilities Act requires:
- WCAG 2.0 Level AA compliance (minimum)
- Accessible formats available on request
- Accessible feedback processes
- Training for staff on accessibility

Design to **WCAG 2.1 AA** (exceeding the legal minimum) to serve all residents.

### Data Freshness

| Data Type | Freshness Expectation | Display Strategy |
|-----------|----------------------|------------------|
| Facility hours | Real-time (holiday closures) | Show "Open Now" with live status |
| Program availability | Near real-time (spots fill up) | Show spots remaining, auto-refresh |
| Shelter capacity | Real-time (critical) | Live numbers, colour-coded urgency |
| Park amenities | Seasonal (changes with season) | Date-stamped, seasonal tags |
| Contact information | Stable (changes rarely) | Standard display, last-verified date |
| Event listings | Weekly/daily updates | Chronological, auto-expire past events |
