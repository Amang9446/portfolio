// Theme boot script, rendered by a SERVER component (the root layout).
//
// next-themes normally injects this itself, but its ThemeProvider is a client
// component that renders a <script> element — which React 19.2 flags with
// "Encountered a script tag while rendering React component" on every client
// render. Rendering the identical script from a server component keeps the
// pre-hydration theme boot (no flash of the wrong theme) without the warning,
// and without library patching. The storage key and values mirror the
// client provider in theme-provider.tsx — keep them in sync.
const boot = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||((!t||t==='system')&&m);var e=document.documentElement;e.classList.add(d?'dark':'light');e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: boot }} />;
}
