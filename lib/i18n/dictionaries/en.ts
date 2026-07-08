import type { ka } from "./ka";
import { common } from "./en/common";
import { nav } from "./en/nav";
import { footer } from "./en/footer";
import { home } from "./en/home";
import { marketplace } from "./en/marketplace";
import { listings } from "./en/listings";
import { auth } from "./en/auth";
import { services } from "./en/services";
import { profile } from "./en/profile";
import { admin } from "./en/admin";
import { pages } from "./en/pages";
import { misc } from "./en/misc";

/** English dictionary — must mirror `ka` exactly (typed against it). */
export const en: typeof ka = {
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
};
