// @flow

import { getFrames } from "../../selectors";
import { getClosestFunction } from "../../utils/ast";

import type { Frame } from "../../types";
import type { ThunkArgs } from "../types";

export function updateFrameLocation(frame: Frame, sourceMaps: any) {
  return sourceMaps.getOriginalLocation(frame.location).then(loc => ({
    ...frame,
    location: loc,
    generatedLocation: frame.generatedLocation || frame.location
  }));
}

function updateDisplayName(frame: Frame, symbols: Symbols) {
  const originalLocation = frame.location;
  const originalFunction = getClosestFunction(
    symbols.functions,
    originalLocation
  );

  const originalDisplayName = originalFunction.displayName;
  return { ...frame, originalDisplayName };
}

export function updateDisplayNames(frames: Frame[], symbolsMap: Symbols) {
  return frames.map(frame =>
    updateDisplayName(frame, symbolsMap[frame.location.sourceId])
  );
}

function updateFrameLocations(
  frames: Frame[],
  sourceMaps: any
): Promise<Frame[]> {
  if (!frames || frames.length == 0) {
    return Promise.resolve(frames);
  }

  return Promise.all(
    frames.map(frame => updateFrameLocation(frame, sourceMaps))
  );
}

/**
 * Map call stack frame locations to original locations.
 * e.g.
 * 1. When the debuggee pauses
 * 2. When a source is pretty printed
 *
 * @memberof actions/pause
 * @static
 */
export function mapFrames() {
  return async function({ dispatch, getState, sourceMaps }: ThunkArgs) {
    const frames = getFrames(getState());
    if (!frames) {
      return;
    }

    let mappedFrames = await updateFrameLocations(frames, sourceMaps);
    mappedFrames = updateDisplayNames(mappedFrames, symbols);

    dispatch({
      type: "MAP_FRAMES",
      frames: mappedFrames
    });
  };
}
