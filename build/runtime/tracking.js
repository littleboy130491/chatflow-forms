//#region assets/src/runtime/persistence.ts
function e() {
	try {
		return globalThis.localStorage;
	} catch {
		return;
	}
}
//#endregion
//#region assets/src/tracking/index.ts
var t = "cff_ft";
function n(e) {
	return !!e.enabled && !(e.consentRequired && !e.consentGranted) && (e.respectDnt === !1 || globalThis.navigator?.doNotTrack !== "1");
}
var r = [
	"source",
	"medium",
	"campaign",
	"term",
	"content"
], i = [
	"gclid",
	"fbclid",
	"msclkid",
	"ttclid"
];
function a(e) {
	try {
		let t = new URL(e);
		return ["http:", "https:"].includes(t.protocol) ? `${t.origin}${t.pathname}`.slice(0, 2048) : "";
	} catch {
		return "";
	}
}
function o(o = {}, c = e(), u = {
	href: globalThis.location?.href ?? "",
	referrer: globalThis.document?.referrer ?? ""
}, d = Date.now()) {
	if (!n(o)) return l(c), {};
	try {
		let e = JSON.parse(c?.getItem("cff_ft") ?? "null");
		if (e && typeof e == "object" && Number(e.expiresAt) > d && Number(e.expiresAt) <= d + 7776e6) return s(e);
	} catch {}
	let f;
	try {
		f = new URL(u.href || "https://localhost/");
	} catch {
		return {};
	}
	if (!["http:", "https:"].includes(f.protocol)) return {};
	let p = {}, m = {};
	for (let e of r) {
		let t = f.searchParams.get(`utm_${e}`);
		t && (p[e] = t.slice(0, 255));
	}
	for (let e of i) {
		let t = f.searchParams.get(e);
		t && (m[e] = t.slice(0, 255));
	}
	let h = {
		landingPage: a(u.href),
		landingReferrer: a(u.referrer),
		utm: p,
		clickIds: m,
		expiresAt: d + Math.min(90, Math.max(1, Number.isFinite(o.days) ? o.days : 30)) * 864e5
	};
	try {
		c?.setItem(t, JSON.stringify(h));
	} catch {}
	return s(h);
}
function s(e) {
	let t = {}, n = {};
	for (let n of r) typeof e.utm?.[n] == "string" && (t[n] = e.utm[n].slice(0, 255));
	for (let t of i) typeof e.clickIds?.[t] == "string" && (n[t] = e.clickIds[t].slice(0, 255));
	return {
		landingPage: a(e.landingPage ?? ""),
		landingReferrer: a(e.landingReferrer ?? ""),
		utm: t,
		clickIds: n
	};
}
function c(e = {}) {
	return n(e) ? {
		...o(e),
		pageTitle: globalThis.document?.title?.slice(0, 500) ?? "",
		pageUrl: a(globalThis.location?.href ?? ""),
		referrer: a(globalThis.document?.referrer ?? ""),
		locale: globalThis.navigator?.language?.slice(0, 35) ?? "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		screen: globalThis.screen ? `${screen.width}x${screen.height}` : ""
	} : (l(), {});
}
function l(n = e()) {
	try {
		n?.removeItem(t);
	} catch {}
}
typeof window < "u" && window.cffTracking?.enabled && o(window.cffTracking);
//#endregion
export { o as captureFirstTouch, l as clearFirstTouch, c as collectMeta, t as firstTouchKey, a as safePageUrl };
