/**
 * Minimal hash-based router used by the ported Cymatic app screens.
 * Provides the small subset of navigation helpers the original screens relied on,
 * so the whole app lives on "/" with in-app views addressed by "#/path".
 */
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Loc = { pathname: string; search: string; hash: string };

function readLoc(): Loc {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, search = ""] = raw.split("?");
  return { pathname: pathPart || "/", search: search ? `?${search}` : "", hash: "" };
}

const LocCtx = createContext<Loc>({ pathname: "/", search: "", hash: "" });

export function navigateTo(to: string, replace = false) {
  const url = `${window.location.pathname}${window.location.search}#${to}`;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function HashRouter({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState<Loc>(() => readLoc());
  useEffect(() => {
    const on = () => setLoc(readLoc());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  return <LocCtx.Provider value={loc}>{children}</LocCtx.Provider>;
}

export const useLocation = () => useContext(LocCtx);
export const useNavigate = () => (to: string, opts?: { replace?: boolean }) => navigateTo(to, opts?.replace);

export function Route(_props: { path: string; element: ReactNode }) {
  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  let match: ReactNode = null;
  let fallback: ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || match) return;
    const p = child.props as { path: string; element: ReactNode };
    if (p.path === "*") fallback = p.element;
    else if (p.path === pathname) match = p.element;
  });
  return <>{match ?? fallback}</>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  useEffect(() => navigateTo(to, replace), [to, replace]);
  return null;
}

type NavLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
  to: string;
  className?: string | ((s: { isActive: boolean }) => string);
  children?: ReactNode | ((s: { isActive: boolean }) => ReactNode);
  end?: boolean;
};

export function NavLink({ to, className, children, onClick, end: _end, ...rest }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <a
      {...rest}
      href={`#${to}`}
      className={typeof className === "function" ? className({ isActive }) : className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigateTo(to);
      }}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </a>
  );
}
