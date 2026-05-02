---
version: "0.1.0"
name: "Coala Portal Design System"
description: "A sober green-gray-black community portal for Coala members, connecting community, recruiting, activity records, shared resources, and instance rental."
colors:
  primary: "#1a5d41"
  primary-strong: "#14492f"
  accent: "#4caf82"
  page: "#f2f5f3"
  surface: "#ffffff"
  surface-raised: "#f8fbfa"
  surface-muted: "#eef3f0"
  text: "#1a2520"
  text-secondary: "#3a4d44"
  text-muted: "#5f7167"
  text-inverse: "#effcf4"
  border: "#d8e1dd"
  border-strong: "#b7c4be"
  success: "#2e7d4f"
  warning: "#c87a00"
  danger: "#c0392b"
  info: "#1f5fa8"
typography:
  display:
    fontFamily: "Manrope, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 1.16
    letterSpacing: "0"
  page-title:
    fontFamily: "Manrope, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0"
  section-title:
    fontFamily: "Manrope, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "Manrope, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0"
  caption:
    fontFamily: "Manrope, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    height: "42px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  gateway-row:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Coala Portal Design System

## Overview

Coala is not a marketing landing page. It is a logged-in operating portal for club members. The UI should feel like a quiet internal service desk: useful at first glance, dense enough for repeated use, and restrained enough that notices, recruiting deadlines, activity status, and instance rental are easy to scan.

The current primary product surfaces are:

1. Home
2. 인스턴스
3. Community
4. Recruit
5. Activity
6. Profile / Auth

`인스턴스` is the header and page title label. Treat instance rental as a real service entry point that the Coala team operates separately. In this portal, show that the feature exists and make the entry point prominent. Do not over-explain internal infrastructure operations or invent deep cloud-management dashboards unless backend/product scope explicitly adds them.

## Colors

- Use green for primary actions, active navigation, service availability, and selected state.
- Use gray and green-gray for structure: page backgrounds, borders, secondary surfaces, metadata, and quiet labels.
- Use black-green text for hierarchy. Avoid pure black except where inherited browser rendering makes it unavoidable.
- Keep the current minor accent colors as supporting tones only: sky for information/resource variants, sand/amber for highlights or top picks, rose/red for warnings, and mint for positive/resource states.
- Do not introduce dominant purple, blue, orange, beige, or decorative gradient palettes. Secondary colors may appear only as semantic badges, resource variants, ranking states, or small data accents.
- Dark green panels are allowed for first-screen hero or key service emphasis, but they must contain functional status, navigation, or summary content.

## Typography

- Use the existing `Manrope + Noto Sans KR` stack everywhere.
- Headings must be compact. Portal pages are operational tools, not editorial articles.
- Do not use negative letter spacing. `letter-spacing` should remain `0` except small uppercase eyebrows, where positive spacing is allowed.
- Body text should stay around 13-15px in dense panels. Large hero text is reserved for Home and major feature pages only.

## Layout

- Preserve the current centered `1280px` max-width app frame, but do not keep detailed navigation in a left sidebar.
- Use a header-connected flow: global header navigation first, then a compact secondary context bar directly below the header, then the page content.
- Home should use the full app width and must not show profile/status UI, including a persistent profile panel, right activity rail, or header user chip.
- Functional sections may use a right activity rail for the signed-in user's current work: instance rental state, community writing activity, recruiting participation, and activity status.
- Avoid shrinking the main work area with a persistent left menu unless the page itself is a detail workspace that clearly needs a side panel.
- Main content should be organized as full-width sections or individual cards. Do not place cards inside decorative section cards.
- Home is an information dashboard, not a feature directory. The first viewport should show:
  - A Coala introduction slider for notices, promotions, or club introduction images.
  - Info Share post lists, especially popular shared resources.
  - Recent posts across the community.
  - Popular community posts and notices that affect the feed.
  - Clear links into the relevant full pages only where they support the information flow.
- Page interiors should follow the same rhythm:
  - page intro or functional hero
  - control bar or tabs
  - list/table/card content
  - empty/loading states
- Use 8-16px gaps and 8-12px component radius. Avoid overly rounded pill-heavy layouts except for status chips and navigation tabs.

## Elevation & Depth

- Prefer borders and subtle surface changes over strong shadows.
- Cards use one light border and a very soft shadow only where separation from the page background is needed.
- Dark panels should not use decorative orb or bokeh effects. Grid texture is acceptable when it supports the portal/infrastructure feel.

## Shapes

- Controls: 8px radius.
- Content cards: 12px radius.
- Major hero panels: 16px radius.
- Avatar/status chips: full radius.
- Avoid oversized rounded rectangles with text when an icon button or row action would communicate the same thing more clearly.

## Components

### Header Navigation

- Keep top navigation task-based and short.
- Display order: Home, Instance, Community, Recruit, Activity.
- Use `인스턴스` in the header and page title. Use `인스턴스 대여` for the primary rental action.
- Preserve the sticky translucent app header, but it should feel like a modern product shell: compact brand block, icon-supported nav pills, and a clear active state.
- The header may include a lightweight global action such as community search, but it must navigate to a real page or feature.
- Page-specific menus should appear as a secondary bar under this header, so users read the flow as "top-level section -> section tools."

### Home Dashboard

Home must not repeat the header's major navigation as a "주요 기능" block and should not show a secondary shortcut bar. Use the top area as an image slider for club introductions, notices, or promotional banners. Below it, prioritize Info Share post lists, full community posts, and popular posts. Do not place operational stat blocks such as "today queue" unless backed by real data.

### 인스턴스

This page is a gateway and existing-service surface. It may show tabs for 신청하기, 신청 내역, 문의사항, 관리자 if those screens exist, but the design language should communicate "service entry point" rather than "full cloud console." The banner copy should say that members can rent instances used for Coala projects, with one short supporting explanation. Avoid fake infrastructure telemetry, invented inventory dashboards, or detailed operational promises unless real data exists.

### Community

Apply university-department patterns here: notices, popular posts, board filters, search, post list, detail, comments. Prioritize stable information retrieval over promotional layout. Keep the banner compact, move writing actions below search/filter controls, and distinguish notice/popular filters from general board filters.

### Info Share

Info Share is not a multi-tab dashboard by default. Use the same compact banner grammar as Community and Instance, then show latest/shared resource lists, schedule if needed, and all resources. Provide a distinct Info Share writing entry. The Coala club introduction belongs on Home, not inside Info Share.

### Recruit

Use club-site patterns here: clear categories, status badges, member counts, deadline/availability, and detail pages with host information. Cards must surface status and apply action without requiring users to open every detail page.

### Activity

Use dashboard patterns here: ranking, source formulas, search, tabs, and stable table rows. GitHub is one source, but the page should also include developer-community behaviors such as code review, technical Q&A, shared resources, mentoring, and future open-source contribution data. Keep visual excitement restrained; the ranking itself is the content.

### Profile/Auth

Keep forms plain and reliable. Profile should summarize account identity, contribution/activity, and written posts using the same tab and card grammar as the rest of the portal.

## Existing Design Preservation

The current UI already contains reference-driven design work. Future changes should preserve these elements unless the product direction explicitly changes. External references should refine these patterns, not replace them wholesale.

### App Shell

- Keep the soft green-gray page background: the app should continue to read as green/gray/black, not white SaaS, blue dashboard, or colorful consumer app.
- Preserve the sticky translucent header with backdrop blur. It gives the portal a lightweight app frame without adding a heavy top bar.
- Keep the brand treatment in Korean as `코알라`: dark green color, no English `member portal` subtitle, and compact placement at the left.
- Keep the main navigation as compact rounded pills. Active state should stay dark green with light text; inactive state should remain quiet gray-green.

### Header-Connected Context Navigation

- Detailed menus should not live as a persistent left rail. They should follow the active top navigation as a compact horizontal context bar.
- Keep the context bar compact: light raised surface, subtle border, small radius, short title, and horizontally scrollable task chips.
- Context items may reuse the current icon, label, active state, and badge grammar, but descriptions should be reduced or hidden in the horizontal form.
- Profile access should live in the header user chip or a dedicated profile/settings page.
- User profile/status should not appear on Home. In Instance, Community, Recruit, and Activity, it may appear as a right activity rail with current personal progress, pending work, and recent activity.

### Community Composer

- Community writing should follow common forum/discussion composer patterns: category or board first, title, body editor, tags, then publish confirmation.
- Use a right-side publish checklist for completeness and contextual guidance. The checklist should validate real fields already on the form; do not add fake workflow steps.
- Keep the editor focused and spacious. Secondary actions such as markdown copy and exit should stay lower emphasis than publish.

### Cards And Lists

- Preserve `surface-card` as the base card style: light green-white surface, green-gray border, subtle shadow, and moderate radius.
- List rows should keep the current operational feel: lightly tinted background, border, 10-12px radius, compact title/meta/action structure.
- Continue using transparent or low-emphasis text buttons for secondary row actions. Reserve filled green buttons for primary task entry.
- Avoid nested cards. Existing panels can contain rows, tables, and compact modules, but page sections should not become card-inside-card layouts.

### Home

- Preserve the portal-dashboard intent of Home, but make it an information-sharing dashboard first. It should summarize shared resources and community posts rather than route users through major feature cards.
- The previous hero/banner pattern is valid: dark green overlay, real visual asset or functional visual panel, concise heading, and direct actions.
- Keep recent posts and Info Share updates as the largest modules.
- Recruiting, ranking/activity, and service notices should not appear as major Home modules. Mention them only when they are normal feed updates.

### Recruit

- Preserve the current recruit page grammar: green hero area, search/filter row, status badges, recommendation cards, and deadline/member information.
- Amber or sand highlight treatments are acceptable for `TOP PICK` or similar emphasis, but they should remain accents.
- Recruit cards should stay scannable: category, status, member count, short description, and action should be visible without opening details.

### Activity

- Preserve the compact dashboard pattern: source cards, podium/ranking emphasis, search/tabs, and stable table rows.
- Ranking visuals may use stronger contrast, but the page should still feel like an internal contribution dashboard rather than a game screen.
- Monospace numerals are acceptable for scores, counts, or rank data where they improve scanability.

### 인스턴스

- Preserve the current dark green service hero and tabbed request flow. The page should feel connected to the rest of Coala, not like a separate cloud vendor console.
- Use the page to make instance rental discoverable and understandable. Header/page titles should say `인스턴스`; the primary action should say `인스턴스 대여`; support content should use `문의사항`.
- Do not add fake metrics, invented instance inventory, synthetic uptime charts, or unsupported cloud-console controls.

## Reference Application Rules

- When an external reference conflicts with the existing Coala UI, the existing Coala UI wins unless the requested change explicitly calls for redesign.
- Toss reference: use for compact task rows only inside feature pages where needed. Do not use Toss-like service grouping as the main Home content because the header already owns major navigation.
- Codeit reference: use on Info Share and future Learn. Good for tracks, short learning units, Q&A, reviews, and benefit comparisons. Do not apply subscription/pricing patterns.
- University department reference: use on Community, notices, resources, seminars, and footer/contact. Good for stable IA and official information hierarchy.
- Club website reference: use on Recruit and About/Contact. Good for activity cards, recruiting cards, yearly plans, and member-facing direct links.
- Dashboard/SaaS reference: use on Activity and admin-like tables. Good for compact filters, status chips, dense lists, and repeated operational workflows.
- GitHub Discussions reference: use for community organization and composer structure. Categories have distinct purposes and formats, so Coala writing should start with board/category selection before title/body.
- Discourse reference: use for forum writing flow. New topics commonly carry title, body, category, and tags; Coala composer should keep these visible in one flow with a publish checklist.
- Inflearn/learning-community reference: use for Q&A readability. Surface course/topic context, question title, content, save/write actions, and answer/reply continuity without making the page feel like a marketing page.

## Do's And Don'ts

Do:

- Keep the green/gray/black palette.
- Preserve existing shell, card, list, hero, context-bar, and navigation patterns before adding new patterns.
- Put real user tasks before explanatory copy.
- Use one component grammar for search bars, filter chips, tabs, cards, and status badges.
- Keep 인스턴스 prominent as a major feature.
- Preserve `DESIGN.md` in Git; do not add it to `.gitignore`.

Do not:

- Create a marketing landing page as the main experience.
- Replace current Coala design patterns only because an external reference looks newer.
- Put detailed section menus in a persistent left sidebar when they should visually follow the selected top-level header menu.
- Invent unsupported instance operational metrics or cloud-console details.
- Use decorative emoji as core UI decoration. If an existing emoji-like marker remains, treat it as a small supporting accent only.
- Use cards inside cards for page sections.
- Introduce unrelated color themes per page.
- Hide key actions behind only sidebar context.

## Responsive Behavior

- At <=1120px, keep the secondary context bar above content and let its items scroll horizontally when needed.
- At <=720px, gateway rows should stack metadata beneath the title/description.
- At <=520px, hide nonessential hero visual panels and keep primary actions full width.
- Text inside buttons and cards must not overflow. Long Korean labels should wrap or move to a second line.

## Accessibility

- Preserve visible focus using the existing `--focus-ring`.
- All clickable destinations must be buttons or links, not inert cards with only `onClick`.
- Do not rely only on color for state. Pair colors with labels such as 모집 중, 승인, 검토 중, 마감.
- Interactive rows need accessible labels when the visible text is not enough.

## Implementation Notes

- CSS tokens live in `src/index.css`; page-level composition currently lives in `src/pages/home/home.css`.
- Route labels and contextual menus live in `src/navigation/navigationData.ts`.
- Home dashboard data lives in `src/data/homeData.ts`.
- Instance UI lives under `src/pages/service/`.
