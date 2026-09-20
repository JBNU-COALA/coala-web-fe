# Layout Ownership

- `src/styles/page-frame.css`: page width, horizontal alignment, subnavigation band and hero geometry. All compact heroes use the same dimensions. Text and artwork occupy separate grid tracks.
- `src/shared/ui/PageHero.tsx`: shared banner for every section. `PageFrame.tsx` combines it with a constrained body for activity and profiles.
- `src/shared/ui/SectionNav.tsx`: navigation for community submenus, recruitment views, activity views and profile views. Selection uses one underline without changing button dimensions; the selected item stays visible after navigation and resizing.
- `src/pages/home/resources.css`: information preview media and text layout. Featured and compact items define both grid axes explicitly. Images fill their reserved track without floating or changing the surrounding row height.
- `src/pages/profile/profile-layout.css`: profile identity, activity connections, statistics and detail sections. Sections are unframed; subdued background bands and rules distinguish their roles.
- `ActivityControls.tsx` owns activity date/group/view controls; `ProfileStats.tsx` owns profile summary presentation. API and mutation state remain in their page owners.

Do not reintroduce these selector families in `home.css` or `coala-system.css`. The legacy styles still serve other pages; this refactor intentionally does not rewrite unrelated forms or backend contracts.

## Verification

`design/check-layout.cjs` checks populated pages at 320, 390, 768, 1280 and 1800 px: frame alignment, selected tabs, image containment, hero overlap, navigation and viewport transitions. Fixtures are intercepted only in the test browser and are not imported into runtime code.

`design/check-production.cjs` covers empty/error/auth states. `design/check-activity-api.cjs` covers record creation, conflict preservation, recruitment approval, profile connections and information routes.
