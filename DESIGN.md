---
version: "0.2.0"
name: "Coala Portal Design System"
description: "Coala public jungle landing and recruiting website, with a green-gray member portal."
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
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 1.16
    letterSpacing: "0"
  page-title:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0"
  section-title:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0"
  caption:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
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

Coala has two distinct surfaces: a public club website at `/` and `/recruiting`, and the existing member dashboard at `/portal`. Public pages follow the approved design below. The remaining portal guidelines apply to the operational pages, not to the public landing or recruiting page.

## Approved Public Website Design (2026-11-24)

### Current public brand palette — supersedes previous section colors

- Unify all public sections around the jungle hero: base `#06100b`, section `#0a1710`, surface `#102219`, raised surface `#152b20`, border `#294333`, warm white text `#f0f2e8`, muted sage text `#a7b6a7`, accent `#bdd59d`.
- Apply this palette to introduction, activities, projects, Culture, History, alumni, recruiting, member entry and the shared footer. Remove the alternating white, pastel, charcoal-blue and light-green section backgrounds. Preserve the existing composition and sizes.
- All project image tiles share the same forest surface instead of individually colored backgrounds. Original project artwork and corporate logo colors remain intact. Corporate marks sit on restrained white inset plates for legibility, inside forest-colored cards.
- History category colors become sage and muted mint, retaining text labels. Footer marks are light, icon circles dark green, and recruiting surfaces follow the same palette.
- The overrides are centralized in `src/pages/landing/forest-theme.css`, scoped to public pages so the operational member portal is unaffected.
- Latest content structure: remove the landing's About block and its detail link. Activity is the first section after the hero and the skip-link destination. Keep the standalone `/about` route. Activity now introduces the supplied learning progression with three substantive areas: 수준별 스터디, 팀 프로젝트와 대회, 기술과 경험 공유; descriptions must reflect the provided curriculum/projects rather than generic navigation prompts.
- Activity copy should read as connected, concrete sentences describing participation: joining an appropriate study level, solving problems together, implementing an idea with a team, presenting or entering competitions, and sharing useful solutions and preparation experiences. Avoid lists of course names and technologies in the overview; leave that detail in Culture.
- Activity vertical padding is 136px / 140px desktop and 88px / 92px mobile, with a 58px / 38px heading-to-content gap. Increase alumni spacing again to 140px / 148px desktop and 100px / 108px mobile; heading gap 58px / 40px and marquee viewport padding 30px / 44px desktop, 24px / 32px mobile. These override earlier spacing notes; preserve shared horizontal alignment.
- Main-page alignment now follows Activity: all sections use horizontal padding `max(6%, calc((100% - 1240px) / 2))`. Remove nested 1100px/1320px width constraints from Product, Culture, History and Alumni inner wrappers. Their headings and content align to the same left/right edges as About and Activity at every viewport size. This supersedes the older per-section container widths below.
- Scroll entrance: use `useScrollReveal` on public landing and recruiting pages. Headings, activity/project/course cards and yearly history groups fade in while moving upward 24px over 650ms, with at most 140ms stagger. Reveal once as each element enters the viewport; never hide it again when scrolling back. Initially visible content is not delayed. Keyboard focus reveals its containing block; reduced motion, unsupported observers and print retain visible content. Disconnect observers on unmount.

### Routes and navigation

- `/`: public club landing. `/recruiting`: public recruiting overview. Accept `/recruiting/` as well.
- Public headers contain exactly `MAIN` (links to `/`) and `RECRUITING` (links to `/recruiting`), aligned right, with the logo on the left. Mark the current page with `aria-current`.
- Header branding pairs the original Coala icon on the left with the handwritten wordmark on the right. Icon 44px and wordmark 120 × 40px on desktop, icon 34px and wordmark 96 × 32px on mobile. Use zero CSS gap (the SVGs contain their own side bearings), a 1px upward icon correction, and matching monochrome strokes. Navigation: bold 24px desktop, 18px mobile, with 48px-tall link targets. Align branding and navigation on the same vertical center with line-height 1.
- Member entry remains in the landing's lower member section and links to `/portal`. Preserve the existing login and email verification guard. Club membership approval is not an existing authorization field; do not claim that this UI implements server-side club-membership approval.
- Existing `/about` remains the detailed introduction page. Internal recruitment posts remain under `/community/recruit`.

### Logos

- Latest compact public header: 80px desktop / 68px mobile height, 38px / 30px icon, 108 × 36px / 88 × 30px wordmark, 20px / 16px navigation with 44px minimum targets. This supersedes earlier header sizing.
- Recruitment banner now uses `public/coala-coding-banner.png`, generated with the built-in image tool, rather than the placeholder illustration. It depicts fictional university students collaborating around laptops, not an actual club event. Prompt brief: photorealistic 3:1 candid Korean university coding club scene, hands/laptops/partial torsos around a wooden table, warm light and forest-green tones, calm center for HTML text, no logos or embedded text. Preserve the original generated asset and use a light dark-green overlay in CSS.
- The banner's `지원하러 가기` button uses a fully rounded pill shape (`border-radius: 999px`, padding `15px 30px`).

- Browser favicon uses the original Coala SVG mark on a rounded forest-green square (`public/favicon.svg`). HTML favicon references use the `coala-logo-20261124` cache version and theme color `#06100b`; do not reference the old cartoon favicon.
- Latest landing ending: remove the standalone Recruiting and Members sections and their explanatory/login copy. Replace them with a full-width image CTA directly above the footer, dark green overlay, centered `코알라에서 함께 개발해요.` and one `지원하러 가기` button linking to `/recruiting`. Use the existing local `coala-card-placeholder.png` illustration until an actual club photo is provided. Preserve `/portal` and its auth guard; only remove the landing block.

- Public header: `public/coala-wordmark.svg`, a custom rounded, handwritten `Coala` wordmark. Use a thin 5-unit rounded stroke to harmonize with the original icon; omit the separate decorative leaf. It uses vector paths, not a rigid system-font wordmark or a raster image. Use the paired sizes specified above.
- Hero, footer brand and footer's final channel icon: `public/coala-logo.svg`, the vector reconstruction of the supplied club mark.
- Keep the supplied JPEG as a source reference only; do not enlarge it in the interface. Preserve the full SVG mark without cropping or blur.
- Use light artwork against the dark landing and a dark treatment on the white recruiting header and footer.

### Landing and entrance animation

- Dark jungle palette: near-black green background, layered green leaves and stems, subtle light and fireflies. The central subject is the Coala logo.
- The opening hero fills exactly the browser viewport (`100dvh`, with `100svh`/`100vh` fallbacks), without minimum or maximum height caps, including mobile and tall desktop screens. The About section begins below the fold and is not visible before scrolling.
- On entrance, foliage moves inward and parts to both sides, revealing the centered logo over approximately 3.4 seconds. Do not loop the entrance.
- No intro skip button. Do not block scrolling or navigation. With `prefers-reduced-motion`, omit the foliage entrance and show the logo immediately.
- No `GROW YOUR / OWN JUNGLE`, scroll prompt, decorative English labels, hero bottom captions, or sentimental promotional slogans. The hero consists of the logo and visual animation; keep a concise accessible heading.
- Below the hero: factual club introduction, activity links, recruiting entry, then member entry. Use short Korean labels such as 동아리 소개, 주요 활동, 모집 안내, 회원 공간.
- Official brand spelling, the two requested English navigation labels and copyright text are allowed; do not add unrelated English decoration.

### Recruiting page

### Main project and alumni showcases

- Music Town uses `width/height: 100%` and `object-fit: contain` so the full landscape artwork and MUSIC TOWN lettering remain visible; fill the remaining tile area with warm cream `#f7edc7` sampled from the artwork. 가야디 fills its square tile using centered `object-fit: cover`. Preserve aspect ratios. Other project images retain their existing fit behavior.
- 가야디 uses the original `src/assets/gayadi.png` with its white outer background and a white (`#fff`) tile. Use normal blending with no sky-blue tint. The generated `gayadi-sky.png` is not used.
- with Festi retains the entire landscape image with `contain`; fill its top/bottom space with matching pale lavender `#eef0ff` rather than forest green.

- Project linking update: image and title links now open the user's supplied destinations in a new tab with `noopener noreferrer` and an accessible new-tab label. Music Town: `https://music-town-official.gayadi.site`; with Festi: `https://github.com/nowimhungry`; 가야디: `https://play.google.com/store/apps/details?id=com.doonow.gayadi&hl=ko`; RePlant: `https://play.google.com/store/apps/details?id=com.anonymous.replantmobileapp&hl=ko`; Trend Core: `https://github.com/NOHHYEONGJUN/shopping-web`; Chickadee: `https://github.com/chickadee-project/chickadee_studio`. This supersedes previous no-link instructions.

Latest scale and animation decisions (supersede the earlier sizing notes below):

- Latest cleanup: remove all decorative `|` bars beside section headings. Project and alumni headings and project card names use weight 500; project descriptions use weight 400. Keep existing font sizes.
- Remove the alumni pause/resume button. Pause the marquee on hover or keyboard focus in its accessible region, and retain the reduced-motion static layout.
- Add a `History / 수상 이력` section between projects and alumni. Use a charcoal background, a vertical year line with nodes, and gold 교내 / lavender 교외 labels. Include all 17 user-supplied entries from 2020–2024, preserving their years, results and supplied classifications (with the three Jeonbuk National University capstone awards corrected to 교내 per the user). Use semantic lists and text labels as well as colors; stack the year and records on mobile. Do not invent additional results from the visual reference.

- At 100% browser zoom, use a shared 1100px content width, 30px section headings, 16px English labels, 21px project names and 16px descriptions. Mobile headings are 25px, labels 14px and project names 20px. Avoid the superseded oversized 44px headings and 1320px gallery.
- Every main section has an English label above its Korean heading: About, Activity, Product, Alumni, Recruiting, Members. These are explicitly requested navigation aids, not decorative slogans.
- Alumni now includes 큐픽스 (Cupix) and HD현대, nine organizations total. Replace the static grid with a seamless 38-second horizontal marquee using two identical groups; hide the duplicate from assistive technology. Pause on hover or keyboard focus, without a visible pause button. Reduced motion shows a static wrapping grid without the duplicate.
- Marquee cards are 230 × 180px desktop, 190 × 170px mobile, with 16px organization names. Preserve the original color of each logo and use local assets.
- Give the alumni marquee extra vertical breathing room: section padding 100px top / 108px bottom, heading gap 44px, and track viewport padding 20px top / 32px bottom. On mobile use section 72px / 80px, heading gap 32px and track 16px / 24px. Preserve the shared horizontal alignment and card sizes.

- Place the project showcase and alumni logo section after activities and before the recruiting entry. Both use a white background and generous spacing, following the supplied three-card reference.
- Project images come from `src/assets`: Music Town, with Festi, 가야디, RePlant, Trend Core, Chickadee. Place the project name and user-supplied description below each square image, as in the supplied reference. Cards have no destination links. Keep descriptions fully visible and naturally wrapped, without truncation or invented claims.
- Approved descriptions: Music Town — 공원 버스킹을 즐기고 소통하는 메타버스 웹앱; with Festi — 전북대학교 축제 동행 매칭 서비스; 가야디 — 여행 계획부터 소중한 순간의 기록까지 함께하는 여행 서비스; RePlant — 쉬었음 청년을 위한 성장 앱. 나만의 미션으로 성장하는 캐릭터와 함께하는 심리상담 플랫폼; Trend Core — 쿠버네티스 기반의 고가용성 패션 쇼핑몰 웹 서비스; Chickadee — 공공 웹사이트의 게시글, 댓글과 이미지에서 광고 의심 문구를 찾아 검토하는 오픈소스.
- Desktop shows three square, softly rounded image tiles in a 1320px-wide content area; at 1100px and below show two, at 600px and below show one with the next partially visible. Preserve full artwork using `object-fit: contain`. Use 24px project names and 18px descriptions on desktop (22px/17px mobile) so the content does not become miniature.
- Previous/next controls scroll the strip; disable controls at boundaries. Support touch, keyboard focus and reduced motion. Do not autoplay.
- Project and alumni headings share the same left accent: a 5 × 28px green (`#658358`) vertical bar with 4px rounded corners and a 14px gap before the title.
- The project heading follows the supplied reference: a muted `Product` label above `함께 만들어낸 결과물`, with the retained left accent on the main title. This user-requested label and title are exceptions to the general rule against decorative English and promotional copy. Make the heading visibly prominent: 44px bold Korean title, 24px label, and 48px navigation buttons; mobile title 32px and label 20px. Allow controls to wrap on narrow screens instead of shrinking the heading. The project title's accent grows to 36px tall (28px mobile).
- Alumni heading is `선배들의 진로`; use the user's supplied affiliations without invented counts, individual names or employment/graduate-study distinctions. Include CJ올리브네트웍스, 이스타항공, 한국식품연구원, 저축은행중앙회, GIST, UNIST and ENERZAi. Do not label these as sponsors.
- Local logo assets and their source URLs are documented in `public/alumni/SOURCES.md`.
- Alumni presentation: a subtle green-gray section background, white rounded cards with restrained borders/shadows, and organization names below logos. Use four centered cards on the first desktop row and three on the second, three columns on tablet and two on mobile. Adjust logo dimensions individually for optical balance, especially FSB, ENERZAi and the padded Eastar artwork. A light hover lift is decorative only; do not imply navigation or add links. Respect reduced motion.
- Keep project and alumni sections on the same 1320px content grid, with 90px 5% desktop padding and 60px 6% mobile padding. Both main headings use 44px/32px desktop/mobile sizes and matching 36px/28px accent bars. Alumni cards are 220px tall with 18px organization names (185px and 16px on mobile), 28px desktop gaps (18px mobile); change to three columns at 1100px and two at 600px. Do not let the alumni section revert to a smaller heading, narrower container or tiny labels.

### Recruiting layout

### Culture curriculum

- Place `Culture / 코알라의 활동 과정` after projects and before the achievement timeline. Match the supplied reference with a white background and four full-width, lightly bordered rounded cards stacked vertically, not a carousel.
- Courses: Base (1학년 / 비전공자, 5–6인), Standard (2학년, 3–4인), Core (3학년, 3–4인), Plus (4학년 이상, 인원 미정). Deduplicate the repeated Base and Standard content supplied by the user.
- Keep audience, group size, goal and weekly meeting/submission format visible. Base, Standard and Core have 3–6월 badges and accessible native `details` for the full 0–8주차 curriculum split into 3–4월 and 5–6월. Plus has no invented schedule or curriculum.
- Preserve all supplied curriculum topics and operating details, including Base's weekly ten Baekjoon problems, Standard's later-provided learning materials, Core's AWS Academy/Learner Lab and Plus's in-person or remote meetings. The `!image.png` text was a placeholder, not an attached activity image; omit rather than display a broken image.
- Use the shared 1100px container, 30px/25px heading sizes, 500-weight titles, muted green audience badges and readable slate body copy. No heading bars or decorative emoji. Stack expanded curriculum columns on smaller screens.

### Recruiting content

- Reference: https://yourssu.com/recruiting/ for the separate public recruiting flow. Use generous whitespace, a light green hero, white content, restrained green accents, and clear section hierarchy.
- Order: recruiting introduction and CTA, open activity listings with category filters, application guidance, expandable frequently asked questions, shared footer.
- Listings use the existing recruits API (study, project, mentoring), and link to existing details/application routes. These are activity postings; do not invent a club admission schedule, departments, interviews or open positions.
- Include loading, empty, failure and retry states. Application guidance must reflect the implemented flow; specific requirements remain in each posting.

### Shared public footer — latest approved layout

- Reference: the compact YOURSSU footer screenshot. White background, all content left-aligned in a single vertical stack. Do not use the superseded gray footer with right-aligned icons.
- Order: club SVG mark; a horizontal row of GitHub, Instagram and Coala icons; clubroom location; copyright.
- No KakaoTalk icon. Replace the former blog/Medium icon with the actual Coala SVG mark linked to `/`.
- GitHub and Instagram remain disabled placeholders with accessible 준비 중 labels until official URLs are supplied. Never invent external account URLs.
- Exact location text: `동아리방 : 공과대학 7호관 지하 7009-1호`.
- Copyright: `© COALA. All rights reserved.`
- Make elements comfortably large: brand 72 × 72px, circular icon controls 44 × 44px, channel artwork 24px (Coala mark 30px), address and copyright 14px on desktop and mobile. Compact vertical padding: 18px top / 20px bottom on desktop, 16px / 18px on mobile. Channel gap is 12px and bottom margin is 8px; brand bottom margin is 4px. Address and copyright use 1.6 line-height with a 3px paragraph bottom margin. Apply these sizes to the shared footer on all pages.
- Pale gray icon circles (`#f5f6f7`) and charcoal artwork/text (`#515965`). Content max-width 1200px, desktop padding 56px 6% 60px, mobile 38px 6% 44px.
- Center the footer Coala icon with a padding-free flex container; keep its 36px artwork from shrinking. Apply a -1.5px horizontal optical correction for the SVG's asymmetric whitespace.
- Shared implementation: `src/pages/landing/PublicFooter.tsx` and `public-footer.css`. Apply changes to both landing and recruiting through this shared component.
- The circular Coala channel icon links to the member community home at `/portal`. Guests sign in before entering through the existing auth guard; the footer brand continues to link to the landing page.

## Member Portal Guidelines

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

- Replace the member dashboard at `/portal` with marketing content. Public marketing content belongs at `/` and `/recruiting` as specified above.
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

### Member-site branding and footer
- Login and member pages use the transparent Coala symbol and handwritten wordmark together in black, matching the public header composition.
- Replace the old single-line copyright footer throughout the member site with the shared `PublicFooter`, including its forest palette, channels, club address, and community link.

### History — 2025 additions
- Include “한국컴퓨터종합학술대회(KCC 2025)” as the event name with “학부 논문 우수상” as its result, and Kuberstronaut attainment in 2025, both under external achievements. Do not display the paper title.
- Label the section `History / 수상 및 자격 취득 이력` to cover awards and certification achievements.

### Login form
- Center a 412px-wide login form with a modest 22px heading, white 40px inputs, and a compact email-save/password-recovery row.
- Use a dark rectangular login button followed by an outlined signup button. Omit social login and promotional copy; retain email authentication and existing password recovery.
- Save only the email locally after successful login when requested; never store the password. Clear the saved email when unchecked.

### Password reset and signup forms
- Match the compact login form styling on signup while preserving all existing Coala fields and validation.
- Password reset shows the local `safety_lock.mp4` in a 130px circular frame, then the title, guidance, email field and a back/next action row.
- After successful code delivery, reveal the six-digit code, new password and confirmation fields with resend support. Preserve the existing request/confirm API, 8–64 character validation, mismatch errors and success return to login. Changing the email resets the code stage.
- Focused account inputs use a near-black border and a subtle 3px gray outer ring across login, signup and password reset.

### Footer channels — latest placement
- Place the three circular channel controls at the top right, aligned with the brand at the top left. Address and copyright occupy full-width rows underneath.
- Enlarge circles to 56px on desktop and 48px on mobile, with 30px/26px artwork and a 38px/34px Coala mark. Use 14px/10px gaps. Preserve compact footer padding and 14px contact text.
- Footer refinement: increase the address to 15px and leave 12px below the brand before the address; keep copyright at 14px.

### Community and account page transitions
- Community home, login, signup and password reset content fades in with a 14px upward entrance over 420ms. Replay on entering each route; keep the shared header and footer stationary.
- Disable this animation when reduced motion is requested. Existing auth redirects remain unchanged.

### Signup dropdown surfaces
- Gender, grade and academic-status selectors use native customizable pickers where supported: a 14px rounded white popup, subtle shadow, padded options, pale-green selection and rotating chevron.
- Animate popup opacity and vertical scale over 180–220ms, including dismissal. Retain native keyboard/accessibility/form behavior and standard select fallback in unsupported browsers. Disable transitions for reduced motion.
- Signup labels show an asterisk only for required fields; omit optional-field labels. Native required semantics remain unchanged.
- Hide dropdown checkmarks; indicate the selected option through its pale-green background and text styling.
- Guest member-site header: show a single `시작하기` button linking to login, with 12px rounded corners and 18px horizontal padding. Remove the separate header login button.
- Footer GitHub links to `https://github.com/JBNU-COALA`; Instagram links to `https://www.instagram.com/coala_jbnu?knvt=dHhlaGhiMjNwdjNs`. Both open in a new tab with noopener/noreferrer.
- All three channel circles lift 4px with a brighter green background and subtle shadow on hover or keyboard focus, and compress slightly on press. Respect reduced motion.
- Header `시작하기` button uses a near-black (#111) background and border with white text, retaining its 12px corner radius.
- Member-site header Coala brand navigates to `/portal` (community home), not the public landing page.
- Remove the portal header introduction menu and public access to the old `/about` page. Legacy `/about` URLs redirect to `/portal`; the public landing remains unchanged.
- Desktop portal header navigation uses a responsive 32–52px gap between menu items for more breathing room; mobile navigation spacing remains unchanged.
