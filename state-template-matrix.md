# State Template Matrix

The Utah thesis templatizes to all 50 states by swapping four variables. This is the data spec for the programmatic `[State]` page build — each `<state>-billboards.com` node renders the same underwriting waterfall localized by:

| Variable | What it drives | Source of truth |
|---|---|---|
| **Permit authority** | "where you verify a transferable off-premise permit" | State DOT outdoor-advertising control office |
| **Digital eligibility** | The value lever — gates the 3–5× re-rate scenario | State law + local sign code |
| **Inventory source** | "where the off-market boards actually are" | State DOT inventory + regional broker |
| **Traffic data** | AADT for underwriting the rate card | State DOT traffic counts (AADT) |

## Seed rows (verified-pattern, fill remaining via build)

| State | Permit authority | Digital eligibility | DOT traffic |
|---|---|---|---|
| Utah | UDOT Outdoor Advertising Control | Restrictive | UDOT AADT |
| Texas | TxDOT | Permissive | TxDOT AADT |
| Florida | FDOT | Permissive | FDOT AADT |
| California | Caltrans OOH | Restrictive (CA Outdoor Advertising Act) | Caltrans AADT |
| Vermont | n/a — **billboards banned statewide** | None (prohibited) | VTrans |
| Maine | n/a — **billboards banned statewide** | None (prohibited) | MaineDOT |
| Hawaii | n/a — **billboards banned statewide** | None (prohibited) | HDOT |
| Alaska | n/a — **billboards banned statewide** | None (prohibited) | DOT&PF |

> Note: 4 states (VT, ME, HI, AK) prohibit billboards outright — their geo pages should pivot to an investor-education / "why no inventory here" angle rather than a buy thesis. This is itself differentiated, non-spam content.

## TODO (next build, option B)
Complete all 50 rows with: DOT permit office URL, statute citation, digital-conversion status (permitted / restricted / prohibited), DOT AADT data endpoint, top 3 regional brokers. Output as JSON to drive the templated page render.
