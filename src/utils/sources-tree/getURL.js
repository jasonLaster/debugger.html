/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { parse } from "url";
import { getUnicodeHostname, getUnicodeUrlPath } from "devtools-modules";

import type { Source } from "../../types";
export type ParsedURL = {
  path: string,
  group: string,
  filename: string
};

const urlMap: WeakMap<Source, ParsedURL> = new WeakMap();

export function getFilenameFromPath(pathname?: string) {
  let filename = "";
  if (pathname) {
    filename = pathname.substring(pathname.lastIndexOf("/") + 1);
    // This file does not have a name. Default should be (index).
    if (filename == "" || !filename.includes(".")) {
      filename = "(index)";
    }
  }
  return filename;
}

const NoDomain = "(no domain)";
const def = { path: "", group: "", filename: "" };

function _getURL(source: Source): ParsedURL {
  const { url } = source;
  if (!url) {
    return def;
  }

  const { pathname, protocol, host, path } = parse(url);
  const filename = getUnicodeUrlPath(getFilenameFromPath(pathname));

  switch (protocol) {
    case "javascript:":
      // Ignore `javascript:` URLs for now
      return def;

    case "moz-extension:":
    case "resource:":
      return {
        ...def,
        path,
        filename,
        group: `${protocol}//${host || ""}`
      };

    case "webpack:":
    case "ng:":
      return {
        ...def,
        path: path,
        filename,
        group: `${protocol}//`
      };

    case "about:":
      // An about page is a special case
      return {
        ...def,
        path: "/",
        filename,
        group: url
      };

    case "data:":
      return {
        ...def,
        path: "/",
        group: NoDomain,
        filename: url
      };

    case null:
      if (pathname && pathname.startsWith("/")) {
        // use file protocol for a URL like "/foo/bar.js"
        return {
          ...def,
          path: path,
          filename,
          group: "file://"
        };
      }
      break;

    case "http:":
    case "https:":
      return {
        ...def,
        path: pathname,
        filename,
        group: getUnicodeHostname(host)
      };
  }

  return {
    ...def,
    path: path,
    group: protocol ? `${protocol}//` : "",
    filename
  };
}

export function getURL(source: Source) {
  if (urlMap.has(source)) {
    return urlMap.get(source) || def;
  }

  const url = _getURL(source);
  urlMap.set(source, url);
  return url;
}
