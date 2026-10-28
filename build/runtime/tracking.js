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
	let t = globalThis.navigator?.globalPrivacyControl === !0;
	return !!e.enabled && !t && !(e.consentRequired && !e.consentGranted) && (e.respectDnt === !1 || globalThis.navigator?.doNotTrack !== "1");
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
], a = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
function o(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		if (!e || typeof e != "object") return;
		let r = e;
		if (Array.isArray(r.all)) {
			r.all.forEach(n);
			return;
		}
		if (Array.isArray(r.any)) {
			r.any.forEach(n);
			return;
		}
		let i = e;
		(i.source ?? "answer") === "url" && typeof i.field == "string" && a.test(i.field) && t.add(i.field);
	};
	for (let r of e.steps) {
		if (r.type === "hidden" && r.settings?.source === "url") {
			let e = r.settings.sourceKey || r.key;
			a.test(e) && t.add(e);
		}
		for (let e of [...r.logic ?? [], ...(r.options ?? []).flatMap((e) => e.logic ?? [])]) n(e.if);
	}
	for (let t of e.outcomes ?? []) n(t.if);
	return [...t].slice(0, 100);
}
function s(e) {
	let t = new URLSearchParams(globalThis.location?.search ?? ""), n = {};
	for (let r of e.slice(0, 100)) {
		if (!a.test(r)) continue;
		let e = t.get(r);
		e !== null && e.length <= 1e3 && (n[r] = e);
	}
	return n;
}
function c(e) {
	try {
		let t = new URL(e);
		return ["http:", "https:"].includes(t.protocol) ? `${t.origin}${t.pathname}`.slice(0, 2048) : "";
	} catch {
		return "";
	}
}
function l(a = {}, o = e(), s = {
	href: globalThis.location?.href ?? "",
	referrer: globalThis.document?.referrer ?? ""
}, l = Date.now()) {
	if (!n(a)) return f(o), {};
	try {
		let e = JSON.parse(o?.getItem("cff_ft") ?? "null");
		if (e && typeof e == "object" && Number(e.expiresAt) > l && Number(e.expiresAt) <= l + 7776e6) return u(e);
	} catch {}
	let d;
	try {
		d = new URL(s.href || "https://localhost/");
	} catch {
		return {};
	}
	if (!["http:", "https:"].includes(d.protocol)) return {};
	let p = {}, m = {};
	for (let e of r) {
		let t = d.searchParams.get(`utm_${e}`);
		t && (p[e] = t.slice(0, 255));
	}
	for (let e of i) {
		let t = d.searchParams.get(e);
		t && (m[e] = t.slice(0, 255));
	}
	let h = {
		landingPage: c(s.href),
		landingReferrer: c(s.referrer),
		utm: p,
		clickIds: m,
		expiresAt: l + Math.min(90, Math.max(1, Number.isFinite(a.days) ? a.days : 30)) * 864e5
	};
	try {
		o?.setItem(t, JSON.stringify(h));
	} catch {}
	return u(h);
}
function u(e) {
	let t = {}, n = {};
	for (let n of r) typeof e.utm?.[n] == "string" && (t[n] = e.utm[n].slice(0, 255));
	for (let t of i) typeof e.clickIds?.[t] == "string" && (n[t] = e.clickIds[t].slice(0, 255));
	return {
		landingPage: c(e.landingPage ?? ""),
		landingReferrer: c(e.landingReferrer ?? ""),
		utm: t,
		clickIds: n
	};
}
function d(e = {}, t = []) {
	if (!n(e)) return f(), {};
	let r = s(t);
	return {
		...l(e),
		pageTitle: globalThis.document?.title?.slice(0, 500) ?? "",
		pageUrl: c(globalThis.location?.href ?? ""),
		referrer: c(globalThis.document?.referrer ?? ""),
		...Object.keys(r).length ? { urlParams: r } : {},
		locale: globalThis.navigator?.language?.slice(0, 35) ?? "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		screen: globalThis.screen ? `${screen.width}x${screen.height}` : ""
	};
}
function f(n = e()) {
	try {
		n?.removeItem(t);
	} catch {}
}
typeof window < "u" && window.cffTracking?.enabled && l(window.cffTracking);
//#endregion
export { l as captureFirstTouch, f as clearFirstTouch, d as collectMeta, t as firstTouchKey, c as safePageUrl, o as urlSourceKeys };
