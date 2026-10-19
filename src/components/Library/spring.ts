/**
 * SwiftUI-style analytic spring: ω = 2π/duration, ζ = 1 − bounce. Solved in closed form
 * (not integrated step by step), so it's frame-rate independent, and a retarget carries
 * the mover's current position AND velocity into the new spring — interrupting a motion
 * redirects it smoothly instead of restarting from rest. Matches the harness's
 * sParams/sEval/sRetarget exactly, just as pure functions instead of module globals (so
 * each <Library> instance gets its own spring state, not a shared one).
 */
export interface SpringState {
  target: number;
  x0: number;
  v0: number;
  t0: number;
  w: number;
  z: number;
  rest: boolean;
  pending: { target: number; at: number } | null;
}

export function sParams(duration: number, bounce: number): { w: number; z: number } {
  return { w: (2 * Math.PI) / (duration / 1000), z: Math.max(0.05, Math.min(1, 1 - bounce)) };
}

export function sEval(st: SpringState, now: number): { y: number; v: number } {
  const t = Math.max(0, now - st.t0),
    w = st.w,
    z = st.z,
    x0 = st.x0,
    v0 = st.v0;
  let x: number, v: number;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z),
      e = Math.exp(-z * w * t),
      B = (v0 + z * w * x0) / wd,
      c = Math.cos(wd * t),
      sn = Math.sin(wd * t);
    x = e * (x0 * c + B * sn);
    v = e * ((B * wd - z * w * x0) * c - (x0 * wd + z * w * B) * sn);
  } else {
    const e2 = Math.exp(-w * t);
    x = (x0 + (v0 + w * x0) * t) * e2;
    v = (v0 - w * (v0 + w * x0) * t) * e2;
  }
  return { y: st.target + x, v };
}

export function sRetarget(prev: SpringState | undefined, target: number, at: number, duration: number, bounce: number): SpringState {
  const cur = prev ? sEval(prev, at) : { y: target, v: 0 };
  const P = sParams(duration, bounce);
  return { target, x0: cur.y - target, v0: cur.v, t0: at, w: P.w, z: P.z, rest: false, pending: null };
}
