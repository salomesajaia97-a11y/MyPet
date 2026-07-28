# Admin full control — design

Date: 2026-07-28

## Problem

The admin panel can approve, delete and change roles, but it cannot *edit*
anything, and it has no surface at all for reviews. Anything beyond those few
actions currently needs a developer: an abusive review can only be removed by
the person who wrote it, a listing's text can only be fixed by its owner, VIP
prices live in a TypeScript table, and every visible string lives in dictionary
files.

The goal: the site owner can run the whole site from `/admin` without a
developer.

## Scope

Four modules, built in this order, plus one cross-cutting piece.

### Module 1 — Review moderation (`/admin/reviews`)

Every review in one searchable list (business name, author, text), filterable by
rating and by whether it has an owner reply.

Three distinct powers, because they are not the same decision:

- **Hide** — reversible. `Review.hidden` flag. The public list skips hidden
  reviews and `recomputeBusinessRating` excludes them, so hiding a review
  immediately stops it counting towards the business's average. This is the
  right tool for a disputed review: nothing is destroyed.
- **Delete** — permanent, for abuse and spam. Recomputes the rating.
- **Remove owner reply** — the reply can be the abusive part while the review
  itself is legitimate.

### Module 2 — Edit any listing, edit any business

The APIs already allow an admin through; the panel simply never offered the UI.

- Admin listings list gains an edit form (the owner's form, reused) and a VIP
  control that grants or revokes a promotion, writing `vipTier`/`vipRank` the
  same way a paid grant does so placement stays consistent.
- Admin businesses list gains edit, and a status toggle in both directions
  (today it can only move pending → approved).

### Module 4 — Settings and prices (`/admin/settings`)

A single `SiteSetting` document:

- VIP tier amounts and durations.
- Feature switches: AI search, payments, registration.

`getVipPackages()` merges the stored values over the static defaults, and
checkout reads it. This is safe for money because a Payment already snapshots
its own `amount` and `days` at creation, so repricing never alters an order in
flight.

Switches that can lock the owner out of revenue or signups are labelled as such
and written to the audit log.

### Module 3 — Site text editor (`/admin/content`)

A `SiteText` collection of `(locale, key, value)` overrides, merged over the
static dictionaries at read time behind a cache that is revalidated on save.
The UI lists every dictionary key with EN and KA side by side and a
reset-to-default per key.

Last, because it is the largest and the only one that can visibly break a page:
a blanked-out label is a production defect, so reset-to-default is mandatory,
not a nicety.

### Cross-cutting — audit log

`AdminAction` records actor, action, target type/id and a short summary for
every admin mutation, surfaced at `/admin/audit`.

Built alongside module 1 rather than bolted on afterwards. Once one account can
change anything on the site, the log is what makes a mistake diagnosable and
recoverable.

## Boundaries

- Ratings are never editable by hand. They are derived from reviews, and a
  hand-set average would silently drift the moment a review changed.
- Payments stay read-only in the panel. Refunds happen in the Flitt portal;
  a fake status written locally would contradict the provider.
- The last-admin guards already in place stay in place.

## Testing

- Pure logic gets unit tests: the dictionary merge (override wins, missing
  override falls through, reset removes the row) and the VIP package merge
  (stored value wins, absent tier falls back to default).
- Rating recomputation with a hidden review is the one behaviour worth pinning
  directly, because it is the part that silently affects a public number.
