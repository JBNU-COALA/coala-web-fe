# Dummy Data

This folder contains temporary data used while backend endpoints are incomplete or unavailable.

Production-facing code should import real data through `src/shared/api/*`. When a page still needs
placeholder content for UI review, import it directly from this folder so the fallback boundary stays
visible.

Do not add new fixture data under `src/pages/*` or `src/data`.
