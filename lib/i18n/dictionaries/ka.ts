import { common } from "./ka/common";
import { nav } from "./ka/nav";
import { footer } from "./ka/footer";
import { home } from "./ka/home";
import { marketplace } from "./ka/marketplace";
import { listings } from "./ka/listings";
import { auth } from "./ka/auth";
import { services } from "./ka/services";
import { profile } from "./ka/profile";
import { admin } from "./ka/admin";
import { pages } from "./ka/pages";
import { misc } from "./ka/misc";

/**
 * Georgian dictionary — the source-of-truth shape. `en.ts` mirrors it exactly
 * (enforced via `typeof`), so a missing or renamed key is a compile error.
 * Each namespace lives in its own file under `ka/` for isolated editing.
 */
export const ka = {
  common,
  nav,
  footer,
  home,
  marketplace,
  listings,
  auth,
  services,
  profile,
  admin,
  pages,
  misc,
} as const;
