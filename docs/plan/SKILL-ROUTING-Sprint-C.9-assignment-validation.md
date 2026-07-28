# SKILL-ROUTING: Sprint C.9 - Asset & License Assignment Validation

## 1. Relevant Skills
- **React/Next.js UI Mod:** Required to update `CheckoutAssetButton.tsx`, `AssetsPageClient.tsx`, `AssetDetailClient.tsx`, and `LicenseSeatsClient.tsx` to handle the disabled state of the Checkout button.
- **Prisma & Domain Commands:** Required to modify `src/lib/commands/asset.ts` and `src/lib/commands/license.ts` for Target Asset status validation.

## 2. Dependencies
- Needs basic knowledge of how `CheckoutAssetButton.tsx` interacts with its parent to know how to pass down the `deployable` flag (or `status` object).
- Needs to know that `Asset` includes `status: StatusLabel` but this might not be fetched on all list APIs, so the GraphQL/Prisma queries in the Server Components might need to select `status: { select: { deployable: true } }` if not already present.

## 3. Potential Pitfalls
- In `AssetsPageClient.tsx`, check if the `asset.status` is passed down from the server-side page. If only a flat subset of fields is passed, the server page must be modified to include `asset.status.deployable`.
- In `AssetDetailClient.tsx`, the `asset` object should already contain the `status` relation.
- Be careful with the `asset.status.archived` check in backend commands. Target Asset might be fetched via `select: { id: true, assetTag: true }`. Need to change it to include `select: { ..., status: { select: { archived: true } } }` to perform the check.
