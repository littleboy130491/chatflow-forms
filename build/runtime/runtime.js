//#region node_modules/preact/dist/preact.module.js
var e, t, n, r, i, a, o, s, c, l, u, d, f, p, m = {}, h = [], g = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, _ = Array.isArray;
function v(e, t) {
	for (var n in t) e[n] = t[n];
	return e;
}
function y(e) {
	e && e.parentNode && e.parentNode.removeChild(e);
}
function b(t, n, r) {
	var i, a, o, s = {};
	for (o in n) o == "key" ? i = n[o] : o == "ref" ? a = n[o] : s[o] = n[o];
	if (arguments.length > 2 && (s.children = arguments.length > 3 ? e.call(arguments, 2) : r), typeof t == "function" && t.defaultProps != null) for (o in t.defaultProps) s[o] === void 0 && (s[o] = t.defaultProps[o]);
	return x(t, s, i, a, null);
}
function x(e, r, i, a, o) {
	var s = {
		type: e,
		props: r,
		key: i,
		ref: a,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: void 0,
		__v: o ?? ++n,
		__i: -1,
		__u: 0
	};
	return o == null && t.vnode != null && t.vnode(s), s;
}
function S(e) {
	return e.children;
}
function C(e, t) {
	this.props = e, this.context = t;
}
function w(e, t) {
	if (t == null) return e.__ ? w(e.__, e.__i + 1) : null;
	for (var n; t < e.__k.length; t++) if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
	return typeof e.type == "function" ? w(e) : null;
}
function T(e) {
	if (e.__P && e.__d) {
		var n = e.__v, r = n.__e, i = [], a = [], o = v({}, n);
		o.__v = n.__v + 1, t.vnode && t.vnode(o), re(e.__P, o, n, e.__n, e.__P.namespaceURI, 32 & n.__u ? [r] : null, i, r ?? w(n), !!(32 & n.__u), a), o.__v = n.__v, o.__.__k[o.__i] = o, ae(i, o, a), n.__e = n.__ = null, o.__e != r && E(o);
	}
}
function E(e) {
	if ((e = e.__) != null && e.__c != null) return e.__e = e.__c.base = null, e.__k.some(function(t) {
		if (t != null && t.__e != null) return e.__e = e.__c.base = t.__e;
	}), E(e);
}
function D(e) {
	(!e.__d && (e.__d = !0) && r.push(e) && !O.__r++ || i != t.debounceRendering) && ((i = t.debounceRendering) || a)(O);
}
function O() {
	try {
		for (var e, t = 1; r.length;) r.length > t && r.sort(o), e = r.shift(), t = r.length, T(e);
	} finally {
		r.length = O.__r = 0;
	}
}
function ee(e, t, n, r, i, a, o, s, c, l, u) {
	var d, f, p, g, _, v, y = r && r.__k || h, b = t.length;
	for (c = k(n, t, y, c, b), d = 0; d < b; d++) (p = n.__k[d]) != null && (f = p.__i != -1 && y[p.__i] || m, p.__i = d, v = re(e, p, f, i, a, o, s, c, l, u), g = p.__e, p.ref && f.ref != p.ref && (f.ref && ce(f.ref, null, p), u.push(p.ref, p.__c || g, p)), _ == null && g != null && (_ = g), 4 & p.__u ? (c = A(p, c, e), f.__e && (f.__e = null)) : typeof p.type == "function" && v !== void 0 ? c = v : g && (c = g.nextSibling), p.__u &= -7);
	return n.__e = _, c;
}
function k(e, t, n, r, i) {
	var a, o, s, c, l, u = n.length, d = u, f = 0;
	for (e.__k = Array(i), a = 0; a < i; a++) (o = t[a]) != null && typeof o != "boolean" && typeof o != "function" ? (typeof o == "string" || typeof o == "number" || typeof o == "bigint" || o.constructor == String ? o = e.__k[a] = x(null, o, null, null, null) : _(o) ? o = e.__k[a] = x(S, { children: o }, null, null, null) : o.constructor === void 0 && o.__b > 0 ? o = e.__k[a] = x(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : e.__k[a] = o, c = a + f, o.__ = e, o.__b = e.__b + 1, s = null, (l = o.__i = te(o, n, c, d)) != -1 && (d--, (s = n[l]) && (s.__u |= 2)), s == null || s.__v == null ? (l == -1 && (i > u ? f-- : i < u && f++), typeof o.type != "function" && (o.__u |= 4)) : l != c && (l == c - 1 ? f-- : l == c + 1 ? f++ : (l > c ? f-- : f++, o.__u |= 4))) : e.__k[a] = null;
	if (d) for (a = 0; a < u; a++) (s = n[a]) != null && !(2 & s.__u) && (s.__e == r && (r = w(s)), le(s, s));
	return r;
}
function A(e, t, n) {
	var r, i;
	if (typeof e.type == "function") {
		for (r = e.__k, i = 0; r && i < r.length; i++) r[i] && (r[i].__ = e, t = A(r[i], t, n));
		return t;
	}
	e.__e != t && (t && e.type && !t.parentNode && (t = w(e)), t = n.insertBefore(e.__e, t || null));
	do
		t = t && t.nextSibling;
	while (t != null && t.nodeType == 8);
	return t;
}
function te(e, t, n, r) {
	var i, a, o, s = e.key, c = e.type, l = t[n], u = l != null && !(2 & l.__u);
	if (l === null && s == null || u && s == l.key && c == l.type) return n;
	if (r > +!!u) {
		for (i = n - 1, a = n + 1; i >= 0 || a < t.length;) if ((l = t[o = i >= 0 ? i-- : a++]) != null && !(2 & l.__u) && s == l.key && c == l.type) return o;
	}
	return -1;
}
function ne(e, t, n) {
	t[0] == "-" ? e.setProperty(t, n ?? "") : e[t] = n == null ? "" : typeof n != "number" || g.test(t) ? n : n + "px";
}
function j(e, t, n, r, i) {
	var a, o;
	n: if (t == "style") {
		if (typeof n == "string") e.style.cssText = n;
		else {
			if (typeof r == "string" && (e.style.cssText = r = ""), r) for (t in r) n && t in n || ne(e.style, t, "");
			if (n) for (t in n) r && n[t] == r[t] || ne(e.style, t, n[t]);
		}
	} else if (t[0] == "o" && t[1] == "n") a = t != (t = t.replace(u, "$1")), o = t.toLowerCase(), t = o in e || t == "onFocusOut" || t == "onFocusIn" ? o.slice(2) : t.slice(2), e.l || (e.l = {}), e.l[t + a] = n, n ? r ? n[l] = r[l] : (n[l] = d, e.addEventListener(t, a ? p : f, a)) : e.removeEventListener(t, a ? p : f, a);
	else {
		if (i == "http://www.w3.org/2000/svg") t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
		else if (t != "width" && t != "height" && t != "href" && t != "list" && t != "form" && t != "tabIndex" && t != "download" && t != "rowSpan" && t != "colSpan" && t != "role" && t != "popover" && t in e) try {
			e[t] = n ?? "";
			break n;
		} catch {}
		typeof n == "function" || (n == null || !1 === n && t[4] != "-" ? e.removeAttribute(t) : e.setAttribute(t, t == "popover" && n == 1 ? "" : n));
	}
}
function M(e) {
	return function(n) {
		if (this.l) {
			var r = this.l[n.type + e];
			if (n[c] == null) n[c] = d++;
			else if (n[c] < r[l]) return;
			return r(t.event ? t.event(n) : n);
		}
	};
}
function re(e, n, r, i, a, o, s, c, l, u) {
	var d, f, p, m, g, b, x, T, E, D, O, k, A, te, ne, j, M = n.type;
	if (n.constructor !== void 0) return null;
	128 & r.__u && (l = !!(32 & r.__u), o = [c = n.__e = r.__e]), (d = t.__b) && d(n);
	n: if (typeof M == "function") {
		f = s.length;
		try {
			if (E = n.props, D = M.prototype && M.prototype.render, O = (d = M.contextType) && i[d.__c], k = d ? O ? O.props.value : d.__ : i, r.__c ? T = (p = n.__c = r.__c).__ = p.__E : (D ? n.__c = p = new M(E, k) : (n.__c = p = new C(E, k), p.constructor = M, p.render = ue), O && O.sub(p), p.state || (p.state = {}), p.__n = i, m = p.__d = !0, p.__h = [], p._sb = []), D && p.__s == null && (p.__s = p.state), D && M.getDerivedStateFromProps != null && (p.__s == p.state && (p.__s = v({}, p.__s)), v(p.__s, M.getDerivedStateFromProps(E, p.__s))), g = p.props, b = p.state, p.__v = n, m) D && M.getDerivedStateFromProps == null && p.componentWillMount != null && p.componentWillMount(), D && p.componentDidMount != null && p.__h.push(p.componentDidMount);
			else {
				if (D && M.getDerivedStateFromProps == null && E !== g && p.componentWillReceiveProps != null && p.componentWillReceiveProps(E, k), n.__v == r.__v || !p.__e && p.shouldComponentUpdate != null && !1 === p.shouldComponentUpdate(E, p.__s, k)) {
					n.__v != r.__v && (p.props = E, p.state = p.__s, p.__d = !1), n.__e = r.__e, n.__k = r.__k, n.__k.some(function(e) {
						e && (e.__ = n);
					}), h.push.apply(p.__h, p._sb), p._sb = [], p.__h.length && s.push(p), c = w(r);
					break n;
				}
				p.componentWillUpdate != null && p.componentWillUpdate(E, p.__s, k), D && p.componentDidUpdate != null && p.__h.push(function() {
					p.componentDidUpdate(g, b, x);
				});
			}
			if (p.context = k, p.props = E, p.__P = e, p.__e = !1, A = t.__r, te = 0, D) p.state = p.__s, p.__d = !1, A && A(n), d = p.render(p.props, p.state, p.context), h.push.apply(p.__h, p._sb), p._sb = [];
			else do
				p.__d = !1, A && A(n), d = p.render(p.props, p.state, p.context), p.state = p.__s;
			while (p.__d && ++te < 25);
			p.state = p.__s, p.getChildContext != null && (i = v(v({}, i), p.getChildContext())), D && !m && p.getSnapshotBeforeUpdate != null && (x = p.getSnapshotBeforeUpdate(g, b)), ne = d != null && d.type === S && d.key == null ? oe(d.props.children) : d, c = ee(e, _(ne) ? ne : [ne], n, r, i, a, o, s, c, l, u), p.base = n.__e, n.__u &= -161, p.__h.length && s.push(p), T && (p.__E = p.__ = null);
		} catch (e) {
			if (s.length = f, n.__v = null, l || o != null) {
				if (e.then) {
					for (n.__u |= l ? 160 : 128; c && c.nodeType == 8 && c.nextSibling;) c = c.nextSibling;
					o != null && (o[o.indexOf(c)] = null), n.__e = c;
				} else if (o != null) for (j = o.length; j--;) y(o[j]);
			} else n.__e = r.__e;
			n.__k ?? (n.__k = r.__k || []), e.then || ie(n), t.__e(e, n, r);
		}
	} else o == null && n.__v == r.__v ? (n.__k = r.__k, n.__e = r.__e) : c = n.__e = se(r.__e, n, r, i, a, o, s, l, u);
	return (d = t.diffed) && d(n), 128 & n.__u ? void 0 : c;
}
function ie(e) {
	e && (e.__c && (e.__c.__e = !0), e.__k && e.__k.some(ie));
}
function ae(e, n, r) {
	for (var i = 0; i < r.length; i++) ce(r[i], r[++i], r[++i]);
	t.__c && t.__c(n, e), e.some(function(n) {
		try {
			e = n.__h, n.__h = [], e.some(function(e) {
				e.call(n);
			});
		} catch (e) {
			t.__e(e, n.__v);
		}
	});
}
function oe(e) {
	return typeof e != "object" || !e || e.__b > 0 ? e : _(e) ? e.map(oe) : e.constructor === void 0 ? v({}, e) : null;
}
function se(n, r, i, a, o, s, c, l, u) {
	var d, f, p, h, g, v, b, x = i.props || m, S = r.props, C = r.type;
	if (C == "svg" ? o = "http://www.w3.org/2000/svg" : C == "math" ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), s != null) {
		for (d = 0; d < s.length; d++) if ((g = s[d]) && "setAttribute" in g == !!C && (C ? g.localName == C : g.nodeType == 3)) {
			n = g, s[d] = null;
			break;
		}
	}
	if (n == null) {
		if (C == null) return document.createTextNode(S);
		n = document.createElementNS(o, C, S.is && S), l && (t.__m && t.__m(r, s), l = !1), s = null;
	}
	if (C == null) x === S || l && n.data == S || (n.data = S);
	else {
		if (s = C == "textarea" && S.defaultValue != null ? null : s && e.call(n.childNodes), !l && s != null) for (x = {}, d = 0; d < n.attributes.length; d++) x[(g = n.attributes[d]).name] = g.value;
		for (d in x) g = x[d], d == "dangerouslySetInnerHTML" ? p = g : d == "children" || d in S || d == "value" && "defaultValue" in S || d == "checked" && "defaultChecked" in S || j(n, d, null, g, o);
		for (d in S) g = S[d], d == "children" ? h = g : d == "dangerouslySetInnerHTML" ? f = g : d == "value" ? v = g : d == "checked" ? b = g : l && typeof g != "function" || x[d] === g || j(n, d, g, x[d], o);
		if (f) l || p && (f.__html == p.__html || f.__html == n.innerHTML) || (n.innerHTML = f.__html), r.__k = [];
		else if (p && (n.innerHTML = ""), ee(r.type == "template" ? n.content : n, _(h) ? h : [h], r, i, a, C == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o, s, c, s ? s[0] : i.__k && w(i, 0), l, u), s != null) for (d = s.length; d--;) y(s[d]);
		l && C != "textarea" || (d = "value", C == "progress" && v == null ? n.removeAttribute("value") : v != null && (v !== n[d] || C == "progress" && !v || C == "option" && v != x[d]) && j(n, d, v, x[d], o), d = "checked", b != null && b != n[d] && j(n, d, b, x[d], o));
	}
	return n;
}
function ce(e, n, r) {
	try {
		if (typeof e == "function") {
			var i = typeof e.__u == "function";
			i && e.__u(), i && n == null || (e.__u = e(n));
		} else e.current = n;
	} catch (e) {
		t.__e(e, r);
	}
}
function le(e, n, r) {
	var i, a;
	if (t.unmount && t.unmount(e), (i = e.ref) && (i.current && i.current != e.__e || ce(i, null, n)), (i = e.__c) != null) {
		if (i.componentWillUnmount) try {
			i.componentWillUnmount();
		} catch (e) {
			t.__e(e, n);
		}
		i.base = i.__P = i.__n = null;
	}
	if (i = e.__k) for (a = 0; a < i.length; a++) i[a] && le(i[a], n, r || typeof e.type != "function");
	r || y(e.__e), e.__c = e.__ = e.__e = void 0;
}
function ue(e, t, n) {
	return this.constructor(e, n);
}
function de(n, r, i) {
	var a, o, s, c;
	r == document && (r = document.documentElement), t.__ && t.__(n, r), o = (a = typeof i == "function") ? null : i && i.__k || r.__k, s = [], c = [], re(r, n = (!a && i || r).__k = b(S, null, [n]), o || m, m, r.namespaceURI, !a && i ? [i] : o ? null : r.firstChild ? e.call(r.childNodes) : null, s, !a && i ? i : o ? o.__e : r.firstChild, a, c), ae(s, n, c), n.props.children = null;
}
e = h.slice, t = { __e: function(e, t, n, r) {
	for (var i, a, o; t = t.__;) if ((i = t.__c) && !i.__) try {
		if ((a = i.constructor) && a.getDerivedStateFromError != null && (i.setState(a.getDerivedStateFromError(e)), o = i.__d), i.componentDidCatch != null && (i.componentDidCatch(e, r || {}), o = i.__d), o) return i.__E = i;
	} catch (t) {
		e = t;
	}
	throw e;
} }, n = 0, C.prototype.setState = function(e, t) {
	var n = this.__s != null && this.__s != this.state ? this.__s : this.__s = v({}, this.state);
	typeof e == "function" && (e = e(v({}, n), this.props)), e && v(n, e), e != null && this.__v && (t && this._sb.push(t), D(this));
}, C.prototype.forceUpdate = function(e) {
	this.__v && (this.__e = !0, e && this.__h.push(e), D(this));
}, C.prototype.render = S, r = [], a = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, o = function(e, t) {
	return e.__v.__b - t.__v.__b;
}, O.__r = 0, s = Math.random().toString(8), c = "__d" + s, l = "__a" + s, u = /(PointerCapture)$|Capture$/i, d = 0, f = M(!1), p = M(!0);
//#endregion
//#region assets/src/runtime/styles.css?inline
var fe = "dialog.overlay{border:1px solid var(--cff-border,#ddd);width:min(620px,100vw - 24px);max-width:none;max-height:calc(100dvh - 24px);color:var(--cff-text,#171717);background:var(--cff-bg,#fff);border-radius:12px;padding:0;overflow:auto;box-shadow:0 18px 64px #0003}dialog.overlay::backdrop{background:#0005}dialog.launcher{width:min(420px,100vw - 24px);margin:auto 16px 80px auto}dialog.launcher.left{margin:auto auto 80px 16px}.overlay-content .chat{min-height:min(600px,100dvh - 90px);max-height:calc(100dvh - 90px)}.overlay-close{margin:8px 8px 0 auto;display:block}.launcher:not(dialog){z-index:2147483000;position:fixed;bottom:20px;box-shadow:0 8px 28px #0002}.launcher.right{right:20px}.launcher.left{left:20px}.scale{flex-wrap:wrap}.chat video,.chat img{max-width:100%;height:auto}.chat fieldset{border:0;gap:12px;padding:0;display:grid}.chat input[type=range]{width:100%}@media (prefers-reduced-motion:no-preference){dialog.overlay[open]{animation:.18s ease-out cff-overlay-in}@keyframes cff-overlay-in{0%{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}}:host{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light;--cff-primary:#171717;--cff-bubble-bot-bg:#f1f1f1;--cff-user-bg:#e5e5e5;--cff-text:#171717;--cff-radius:12px;--cff-font:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;--cff-width:720px;display:block}*{box-sizing:border-box}.chat{font:16px/1.5 var(--cff-font);color:var(--cff-text);max-width:var(--cff-width);border-radius:var(--cff-radius);background:#fff;border:1px solid #dedede;margin-inline-start:auto;margin-inline-end:auto;overflow:hidden}.fullpage{border:0;border-radius:0;min-height:100svh}header{border-bottom:1px solid #dedede;justify-content:space-between;align-items:center;gap:8px;padding:16px;display:flex}.identity{align-items:center;gap:10px;display:flex}.identity img{object-fit:cover;border-radius:50%;width:42px;height:42px}.identity small{color:#555;display:block}.online-dot{background:#21713d;border-radius:50%;width:7px;height:7px;margin-inline-end:6px;display:inline-block}nav{gap:6px;display:flex}.progress{background:#e5e5e5;height:4px}.progress span{background:var(--cff-primary);height:100%;transition:width .25s;display:block}.conversation{scrollbar-gutter:stable;max-height:75svh;padding:20px;overflow-y:auto}.fullpage .conversation{max-height:none}.bubble{border-radius:var(--cff-radius);white-space:pre-wrap;overflow-wrap:anywhere;max-width:90%;margin-block-start:10px;margin-block-end:10px;padding:12px 16px;animation:.2s appear}.bot{background:var(--cff-bubble-bot-bg)}.user{background:var(--cff-user-bg);color:var(--cff-text);text-align:start;margin-inline-start:auto;display:block}.user small{opacity:.8;font-size:12px;display:block}.active{margin-block-start:16px;margin-block-end:16px}button,.button,input,textarea,select{font:inherit}button,.button{background:var(--cff-primary);color:#fff;border:1px solid var(--cff-primary);border-radius:var(--cff-radius);cursor:pointer;min-height:44px;padding:10px 16px;text-decoration:none;display:inline-block}nav button{color:var(--cff-text);background:0 0;border-color:#bbb;padding:8px}button:disabled{opacity:.55;cursor:not-allowed}button:focus-visible{outline-offset:3px;outline:3px solid #2463eb}a:focus-visible{outline-offset:3px;outline:3px solid #2463eb}input:focus-visible{outline-offset:3px;outline:3px solid #2463eb}textarea:focus-visible{outline-offset:3px;outline:3px solid #2463eb}select:focus-visible{outline-offset:3px;outline:3px solid #2463eb}a{color:inherit;text-decoration:underline}label{margin-block-start:8px;margin-block-end:8px;font-weight:600;display:block}input:not([type=checkbox]),textarea,select{border-radius:var(--cff-radius);color:#171717;background:#fff;border:1px solid #999;width:100%;min-height:44px;padding:12px}textarea{resize:vertical;min-height:100px}form button{margin-block-start:12px}small,.help{font-size:13px}.help{color:#555}.input-row{align-items:center;gap:8px;display:flex}.country select{max-width:240px}.chips{flex-wrap:wrap;gap:8px;display:flex}.chip{color:var(--cff-text);text-align:start;background:0 0;border-color:#888}.chip[aria-pressed=true]{background:var(--cff-primary);color:#fff}.continue{flex-basis:100%;margin-top:8px}.cards .chip{flex:160px}.cards img{object-fit:cover;width:100%;height:100px;margin-bottom:8px;display:block}.consent{align-items:flex-start;gap:12px;font-weight:400;display:flex}.consent input{flex-shrink:0;width:24px;height:24px}.link-button{color:var(--cff-text);background:0 0;border:0;text-decoration:underline}.summary{border-radius:var(--cff-radius);border:1px solid #bbb;padding:16px}h2{margin-top:0;font-size:18px}dl{margin:0}dl>div{border-bottom:1px solid #ddd;padding-block-start:8px;padding-block-end:8px}dt{font-weight:600}dd{overflow-wrap:anywhere;margin:0}.notice{border-radius:var(--cff-radius);color:#171717;background:#f2f2f2;margin:12px;padding:16px}.notice button,.ending .button,.ending button{margin-block-start:6px;margin-block-end:6px;margin-inline-end:8px}.typing{gap:5px;width:70px;display:flex}.typing i{background:#666;border-radius:50%;width:7px;height:7px;animation:.9s infinite dot}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}footer{color:#555;border-top:1px solid #ddd;padding:12px 20px;font-size:12px}footer small{font-size:11px;display:block}.honeypot,.sr-only{clip:rect(0,0,0,0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.chat.dark{color:#f5f5f5;--cff-text:#f5f5f5;--cff-primary:#e5e5e5;--cff-user-bg:#3a3a3a;--cff-bubble-bot-bg:#292929;background:#171717}.dark button:not(.chip):not(.link-button):not(.user){color:#171717}.dark .help,.dark footer,.dark .identity small{color:#ccc}.dark .chip[aria-pressed=true]{color:#171717}@keyframes appear{0%{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes dot{50%{opacity:.3;transform:translateY(-2px)}}@media (prefers-reduced-motion:reduce){*,:before,:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}@media (max-width:480px){header,.conversation{padding:12px}.bubble{max-width:96%}nav button{padding:8px;font-size:13px}.chat{border-inline-start:0;border-inline-end:0;border-radius:0}}";
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/typeof.js
function pe(e) {
	"@babel/helpers - typeof";
	return pe = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, pe(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/toPrimitive.js
function me(e, t) {
	if (pe(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (pe(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/toPropertyKey.js
function he(e) {
	var t = me(e, "string");
	return pe(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/defineProperty.js
function N(e, t, n) {
	return (t = he(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region assets/src/runtime/api.ts
var P = class extends Error {
	constructor(e, t, n = 0, r = []) {
		super(e), N(this, "code", void 0), N(this, "status", void 0), N(this, "retryAfter", void 0), N(this, "issues", void 0), this.code = e, this.status = t, this.retryAfter = n, this.issues = r;
	}
};
function ge() {
	if ("randomUUID" in globalThis.crypto) return crypto.randomUUID();
	let e = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	e[6] = e[6] & 15 | 64, e[8] = e[8] & 63 | 128;
	let t = Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("");
	return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
}
var _e = class {
	constructor(e, t = fetch, n = (e) => new Promise((t) => setTimeout(t, e))) {
		if (N(this, "fetcher", void 0), N(this, "pause", void 0), N(this, "base", void 0), this.fetcher = t, this.pause = n, this.base = new URL(e, globalThis.location?.href ?? "https://localhost/"), !["https:", "http:"].includes(this.base.protocol) || this.base.username || this.base.password || this.base.hash || [...this.base.searchParams.keys()].some((e) => e !== "rest_route") || globalThis.location && this.base.origin !== location.origin) throw new P("cff_unsafe_endpoint", 0);
		!this.base.searchParams.has("rest_route") && !this.base.pathname.endsWith("/") && (this.base.pathname += "/");
	}
	url(e, t) {
		let n = new URL(this.base);
		return n.searchParams.has("rest_route") ? n.searchParams.set("rest_route", n.searchParams.get("rest_route").replace(/\/$/, "") + "/" + e) : n.pathname += e, t !== void 0 && n.searchParams.set("version", String(t)), n.href;
	}
	async request(e, t = "GET", n, r = {}, i = "no-store", a) {
		let o = n === void 0 ? void 0 : JSON.stringify(n);
		for (let n = 0; n < 3; n++) {
			let s = new AbortController(), c = setTimeout(() => s.abort(), 15e3), l;
			try {
				l = await this.fetcher(this.url(e, a), {
					method: t,
					headers: {
						Accept: "application/json",
						...o ? { "Content-Type": "application/json" } : {},
						...r
					},
					...o ? { body: o } : {},
					credentials: "same-origin",
					cache: i,
					redirect: "error",
					signal: s.signal
				});
			} catch {
				if (clearTimeout(c), n === 2 || globalThis.navigator?.onLine === !1) throw new P("cff_network", 0);
				await this.pause(500 * 2 ** n);
				continue;
			}
			clearTimeout(c);
			let u;
			try {
				u = await l.json();
			} catch {
				if (l.status < 500 && l.status !== 429) throw new P("cff_invalid_response", l.status);
				u = {};
			}
			if (l.ok) return u;
			let d = u && typeof u == "object" ? u : {}, f = d.data?.retryAfter ?? l.headers.get("Retry-After") ?? 0, p = Math.max(0, (Number.isFinite(Number(f)) ? Number(f) : (Date.parse(String(f)) - Date.now()) / 1e3) || 0), m = typeof d.code == "string" ? d.code : "cff_request_failed";
			if ((l.status >= 500 || l.status === 429 || m === "cff_request_pending" || m === "cff_idempotency_pending") && n < 2 && p <= 30) await this.pause(Math.max(p * 1e3, 500 * 2 ** n));
			else throw new P(m, l.status, p, Array.isArray(d.data?.errors) ? d.data.errors : []);
		}
		throw new P("cff_network", 0);
	}
	form(e, t) {
		return this.request(`forms/${e}`, "GET", void 0, {}, "default", t);
	}
	startToken(e, t) {
		return this.request(`forms/${e}/start-token`, "POST", { version: t });
	}
	start(e, t, n, r, i, a) {
		return this.request("sessions", "POST", {
			formId: e,
			version: t,
			meta: n,
			prefill: r
		}, {
			"X-CFF-Start-Token": i,
			"Idempotency-Key": a
		});
	}
	resume(e, t) {
		return this.request("sessions/resume", "POST", { formId: e }, { "X-CFF-Resume-Token": t });
	}
	get(e) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new P("cff_invalid_session", 0);
		return this.request(`sessions/${e.sessionId}`, "GET", void 0, { "X-CFF-Request-Token": e.requestToken });
	}
	mutate(e, t, n, r) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new P("cff_invalid_session", 0);
		return this.request(`sessions/${e.sessionId}${t === "POST" ? "/submit" : ""}`, t, n, {
			"X-CFF-Request-Token": e.requestToken,
			"Idempotency-Key": r
		});
	}
	submit(e, t, n) {
		return this.mutate(e, "POST", t, n);
	}
	async upload(e, t, n) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new P("cff_invalid_session", 0);
		let r = new FormData();
		r.append("fieldId", t), r.append("file", n);
		let i = new AbortController(), a = setTimeout(() => i.abort(), 12e4);
		try {
			let t = await this.fetcher(this.url(`sessions/${e.sessionId}/uploads`), {
				method: "POST",
				body: r,
				headers: {
					"X-CFF-Request-Token": e.requestToken,
					"Idempotency-Key": ge(),
					Accept: "application/json"
				},
				credentials: "same-origin",
				cache: "no-store",
				redirect: "error",
				signal: i.signal
			});
			if (!t.ok) throw new P("cff_upload_failed", t.status);
			return await t.json();
		} finally {
			clearTimeout(a);
		}
	}
}, ve, F, ye, be, xe = 0, Se = [], I = t, Ce = I.__b, we = I.__r, Te = I.diffed, Ee = I.__c, De = I.unmount, Oe = I.__;
function ke(e, t) {
	I.__h && I.__h(F, e, xe || t), xe = 0;
	var n = F.__H || (F.__H = {
		__: [],
		__h: []
	});
	return e >= n.__.length && n.__.push({}), n.__[e];
}
function L(e) {
	return xe = 1, Ae(Be, e);
}
function Ae(e, t, n) {
	var r = ke(ve++, 2);
	if (r.t = e, !r.__c && (r.__ = [n ? n(t) : Be(void 0, t), function(e) {
		var t = r.__N ? r.__N[0] : r.__[0], n = r.t(t, e);
		t !== n && (r.__N = [n, r.__[1]], r.__c.setState({}));
	}], r.__c = F, !F.__f)) {
		var i = function(e, t, n) {
			if (!r.__c.__H) return !0;
			var i = !1, o = r.__c.props !== e;
			if (r.__c.__H.__.some(function(e) {
				if (e.__N) {
					i = !0;
					var t = e.__[0];
					e.__ = e.__N, e.__N = void 0, t !== e.__[0] && (o = !0);
				}
			}), a) {
				var s = a.call(this, e, t, n);
				return i ? s || o : s;
			}
			return !i || o;
		};
		F.__f = !0;
		var a = F.shouldComponentUpdate, o = F.componentWillUpdate;
		F.componentWillUpdate = function(e, t, n) {
			if (this.__e) {
				var r = a;
				a = void 0, i(e, t, n), a = r;
			}
			o && o.call(this, e, t, n);
		}, F.shouldComponentUpdate = i;
	}
	return r.__N || r.__;
}
function R(e, t) {
	var n = ke(ve++, 3);
	!I.__s && ze(n.__H, t) && (n.__ = e, n.u = t, F.__H.__h.push(n));
}
function je(e, t) {
	var n = ke(ve++, 4);
	!I.__s && ze(n.__H, t) && (n.__ = e, n.u = t, F.__h.push(n));
}
function Me(e) {
	return xe = 5, Ne(function() {
		return { current: e };
	}, []);
}
function Ne(e, t) {
	var n = ke(ve++, 7);
	return ze(n.__H, t) && (n.__ = e(), n.__H = t, n.__h = e), n.__;
}
function Pe() {
	for (var e; e = Se.shift();) {
		var t = e.__H;
		if (e.__P && t) try {
			t.__h.some(Le), t.__h.some(Re), t.__h = [];
		} catch (n) {
			t.__h = [], I.__e(n, e.__v);
		}
	}
}
I.__b = function(e) {
	F = null, Ce && Ce(e);
}, I.__ = function(e, t) {
	e && t.__k && t.__k.__m && (e.__m = t.__k.__m), Oe && Oe(e, t);
}, I.__r = function(e) {
	we && we(e), ve = 0;
	var t = (F = e.__c).__H;
	t && (ye === F ? (t.__h = [], F.__h = [], t.__.some(function(e) {
		e.__N && (e.__ = e.__N), e.u = e.__N = void 0;
	})) : (t.__h.some(Le), t.__h.some(Re), t.__h = [], ve = 0)), ye = F;
}, I.diffed = function(e) {
	Te && Te(e);
	var t = e.__c;
	t && t.__H && (t.__H.__h.length && (Se.push(t) !== 1 && be === I.requestAnimationFrame || ((be = I.requestAnimationFrame) || Ie)(Pe)), t.__H.__.some(function(e) {
		e.u && (e.__H = e.u, e.u = void 0);
	})), ye = F = null;
}, I.__c = function(e, t) {
	t.some(function(e) {
		try {
			e.__h.some(Le), e.__h = e.__h.filter(function(e) {
				return !e.__ || Re(e);
			});
		} catch (n) {
			t.some(function(e) {
				e.__h && (e.__h = []);
			}), t = [], I.__e(n, e.__v);
		}
	}), Ee && Ee(e, t);
}, I.unmount = function(e) {
	De && De(e);
	var t, n = e.__c;
	n && n.__H && (n.__H.__.some(function(e) {
		try {
			Le(e);
		} catch (e) {
			t = e;
		}
	}), n.__H = void 0, t && I.__e(t, n.__v));
};
var Fe = typeof requestAnimationFrame == "function";
function Ie(e) {
	var t, n = function() {
		clearTimeout(r), Fe && cancelAnimationFrame(t), setTimeout(e);
	}, r = setTimeout(n, 35);
	Fe && (t = requestAnimationFrame(n));
}
function Le(e) {
	var t = F, n = e.__c;
	typeof n == "function" && (e.__c = void 0, n()), F = t;
}
function Re(e) {
	var t = F;
	e.__c = e.__(), F = t;
}
function ze(e, t) {
	return !e || e.length !== t.length || t.some(function(t, n) {
		return t !== e[n];
	});
}
function Be(e, t) {
	return typeof t == "function" ? t(e) : t;
}
//#endregion
//#region assets/src/shared/logic/value.ts
var z = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Ve = () => Object.create(null), B = (e, t, n, r) => r === void 0 ? {
	path: e,
	code: t,
	message: n
} : {
	path: e,
	code: t,
	message: n,
	fieldKey: r
}, V = (e) => e.replace(/~/g, "~0").replace(/\//g, "~1"), He = (e) => typeof e == "object" && !!e && !Array.isArray(e) && Object.keys(e).sort().join(",") === "other,value" && typeof e.value == "string" && typeof e.other == "string", Ue = (e) => He(e) ? e.value : e, We = (e) => e == null || e === "" || Array.isArray(e) && e.length === 0 || typeof e == "object" && !!e && Object.keys(e).length === 0;
function Ge(e, t) {
	if (e === t) return !0;
	if (e === null || t === null || typeof e != "object" || typeof t != "object" || Array.isArray(e) !== Array.isArray(t)) return !1;
	let n = e, r = t, i = Object.keys(n);
	return i.length === Object.keys(r).length && i.every((e) => z(r, e) && Ge(n[e], r[e]));
}
var H = (e) => typeof e == "number" && Number.isFinite(e);
function U(e) {
	if (typeof e != "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null;
	let [t, n, r] = e.split("-").map(Number), i = [
		31,
		t % 4 == 0 && (t % 100 != 0 || t % 400 == 0) ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	];
	return t >= 1 && n >= 1 && n <= 12 && r >= 1 && r <= (i[n - 1] ?? 0) ? [
		t,
		n,
		r
	] : null;
}
function Ke(e, t) {
	let n = U(e);
	if (!t || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?Z$/.test(t)) return null;
	let r = U(t.slice(0, 10));
	return !n || !r || e > t.slice(0, 10) ? null : r[0] - n[0] - +(r[1] * 100 + r[2] < n[1] * 100 + n[2]);
}
function qe(e) {
	if (typeof e != "string" || e.length > 512 || /[^\x20-\x7e]|[()|]/.test(e)) return null;
	let t = {
		d: "0-9",
		w: "A-Za-z0-9_",
		s: " \\t\\r\\n\\f\\x0b"
	}, n = (e, n) => t[e] ? n ? t[e] : `[${t[e]}]` : [
		"D",
		"W",
		"S"
	].includes(e) ? n ? null : `[^${t[e.toLowerCase()]}]` : "nrt\\.[]{}^$*+?-/".includes(e) ? `\\${e}` : null, r = "", i = !1, a = 0;
	for (let t = 0; t < e.length; t++) {
		let o = e[t];
		if (o === "\\") {
			let a = e[++t];
			if (a === void 0) return null;
			let o = n(a, !1);
			if (o === null) return null;
			r += o, i = !0;
		} else if (o === "[") {
			let a = "[", o = !1;
			for (t++; t < e.length; t++) {
				let r = e[t];
				if (r === "]") {
					o = !0, a += "]";
					break;
				}
				if (r === "[") return null;
				if (r === "\\") {
					let r = e[++t];
					if (r === void 0) return null;
					let i = n(r, !0);
					if (i === null) return null;
					a += i;
				} else a += r;
			}
			if (!o) return null;
			r += a, i = !0;
		} else if ([
			"*",
			"+",
			"?",
			"{"
		].includes(o)) {
			if (!i) return null;
			let n = o, s = !0;
			if (o === "{") {
				let r = /^\{(\d+)(?:,(\d*))?\}/.exec(e.slice(t));
				if (!r) return null;
				let i = Number(r[1]), a = r[2] === "" ? Infinity : Number(r[2] ?? r[1]);
				if (i > 1e3 || a !== Infinity && (a > 1e3 || a < i)) return null;
				s = i !== a, n = r[0], t += n.length - 1;
			}
			if (s && ++a > 1 || (o === "*" || o === "+" || n.endsWith(",}")) && !(e.startsWith("^") && e.endsWith("$"))) return null;
			r += n, i = !1;
		} else if (o === "^" || o === "$") {
			if (o === "^" && t !== 0 || o === "$" && t !== e.length - 1) return null;
			r += o === "$" ? "$(?![\\s\\S])" : o, i = !1;
		} else if (o === "]" || o === "}") return null;
		else r += o === "." ? "[^\\n\\r\u2028\u2029]" : o, i = !0;
	}
	return r;
}
function Je(e) {
	let t = qe(e);
	if (t === null) return null;
	try {
		return new RegExp(t, "u");
	} catch {
		return null;
	}
}
var Ye = (e, t) => typeof e == "string" && [...e].length <= 4096 && (Je(t)?.test(e) ?? !1), Xe = {
	version: 4,
	country_calling_codes: {
		1: [
			"US",
			"AG",
			"AI",
			"AS",
			"BB",
			"BM",
			"BS",
			"CA",
			"DM",
			"DO",
			"GD",
			"GU",
			"JM",
			"KN",
			"KY",
			"LC",
			"MP",
			"MS",
			"PR",
			"SX",
			"TC",
			"TT",
			"VC",
			"VG",
			"VI"
		],
		7: ["RU", "KZ"],
		20: ["EG"],
		27: ["ZA"],
		30: ["GR"],
		31: ["NL"],
		32: ["BE"],
		33: ["FR"],
		34: ["ES"],
		36: ["HU"],
		39: ["IT", "VA"],
		40: ["RO"],
		41: ["CH"],
		43: ["AT"],
		44: [
			"GB",
			"GG",
			"IM",
			"JE"
		],
		45: ["DK"],
		46: ["SE"],
		47: ["NO", "SJ"],
		48: ["PL"],
		49: ["DE"],
		51: ["PE"],
		52: ["MX"],
		53: ["CU"],
		54: ["AR"],
		55: ["BR"],
		56: ["CL"],
		57: ["CO"],
		58: ["VE"],
		60: ["MY"],
		61: [
			"AU",
			"CC",
			"CX"
		],
		62: ["ID"],
		63: ["PH"],
		64: ["NZ"],
		65: ["SG"],
		66: ["TH"],
		81: ["JP"],
		82: ["KR"],
		84: ["VN"],
		86: ["CN"],
		90: ["TR"],
		91: ["IN"],
		92: ["PK"],
		93: ["AF"],
		94: ["LK"],
		95: ["MM"],
		98: ["IR"],
		211: ["SS"],
		212: ["MA", "EH"],
		213: ["DZ"],
		216: ["TN"],
		218: ["LY"],
		220: ["GM"],
		221: ["SN"],
		222: ["MR"],
		223: ["ML"],
		224: ["GN"],
		225: ["CI"],
		226: ["BF"],
		227: ["NE"],
		228: ["TG"],
		229: ["BJ"],
		230: ["MU"],
		231: ["LR"],
		232: ["SL"],
		233: ["GH"],
		234: ["NG"],
		235: ["TD"],
		236: ["CF"],
		237: ["CM"],
		238: ["CV"],
		239: ["ST"],
		240: ["GQ"],
		241: ["GA"],
		242: ["CG"],
		243: ["CD"],
		244: ["AO"],
		245: ["GW"],
		246: ["IO"],
		247: ["AC"],
		248: ["SC"],
		249: ["SD"],
		250: ["RW"],
		251: ["ET"],
		252: ["SO"],
		253: ["DJ"],
		254: ["KE"],
		255: ["TZ"],
		256: ["UG"],
		257: ["BI"],
		258: ["MZ"],
		260: ["ZM"],
		261: ["MG"],
		262: ["RE", "YT"],
		263: ["ZW"],
		264: ["NA"],
		265: ["MW"],
		266: ["LS"],
		267: ["BW"],
		268: ["SZ"],
		269: ["KM"],
		290: ["SH", "TA"],
		291: ["ER"],
		297: ["AW"],
		298: ["FO"],
		299: ["GL"],
		350: ["GI"],
		351: ["PT"],
		352: ["LU"],
		353: ["IE"],
		354: ["IS"],
		355: ["AL"],
		356: ["MT"],
		357: ["CY"],
		358: ["FI", "AX"],
		359: ["BG"],
		370: ["LT"],
		371: ["LV"],
		372: ["EE"],
		373: ["MD"],
		374: ["AM"],
		375: ["BY"],
		376: ["AD"],
		377: ["MC"],
		378: ["SM"],
		380: ["UA"],
		381: ["RS"],
		382: ["ME"],
		383: ["XK"],
		385: ["HR"],
		386: ["SI"],
		387: ["BA"],
		389: ["MK"],
		420: ["CZ"],
		421: ["SK"],
		423: ["LI"],
		500: ["FK"],
		501: ["BZ"],
		502: ["GT"],
		503: ["SV"],
		504: ["HN"],
		505: ["NI"],
		506: ["CR"],
		507: ["PA"],
		508: ["PM"],
		509: ["HT"],
		590: [
			"GP",
			"BL",
			"MF"
		],
		591: ["BO"],
		592: ["GY"],
		593: ["EC"],
		594: ["GF"],
		595: ["PY"],
		596: ["MQ"],
		597: ["SR"],
		598: ["UY"],
		599: ["CW", "BQ"],
		670: ["TL"],
		672: ["NF"],
		673: ["BN"],
		674: ["NR"],
		675: ["PG"],
		676: ["TO"],
		677: ["SB"],
		678: ["VU"],
		679: ["FJ"],
		680: ["PW"],
		681: ["WF"],
		682: ["CK"],
		683: ["NU"],
		685: ["WS"],
		686: ["KI"],
		687: ["NC"],
		688: ["TV"],
		689: ["PF"],
		690: ["TK"],
		691: ["FM"],
		692: ["MH"],
		850: ["KP"],
		852: ["HK"],
		853: ["MO"],
		855: ["KH"],
		856: ["LA"],
		880: ["BD"],
		886: ["TW"],
		960: ["MV"],
		961: ["LB"],
		962: ["JO"],
		963: ["SY"],
		964: ["IQ"],
		965: ["KW"],
		966: ["SA"],
		967: ["YE"],
		968: ["OM"],
		970: ["PS"],
		971: ["AE"],
		972: ["IL"],
		973: ["BH"],
		974: ["QA"],
		975: ["BT"],
		976: ["MN"],
		977: ["NP"],
		992: ["TJ"],
		993: ["TM"],
		994: ["AZ"],
		995: ["GE"],
		996: ["KG"],
		998: ["UZ"]
	},
	countries: {
		AC: [
			"247",
			"00",
			"(?:[01589]\\d|[2-467])\\d{4}",
			[5, 6]
		],
		AD: [
			"376",
			"00",
			"(?:1|6\\d)\\d{7}|[135-9]\\d{5}",
			[
				6,
				8,
				9
			],
			[
				[
					"(\\d{3})(\\d{3})",
					"$1 $2",
					["[135-9]"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["1"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["6"]
				]
			]
		],
		AE: [
			"971",
			"00",
			"(?:[4-7]\\d|9[0-689])\\d{7}|800\\d{2,9}|[2-4679]\\d{7}",
			[
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{3})(\\d{2,9})",
					"$1 $2",
					["60|8"]
				],
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[236]|[479][2-8]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d)(\\d{5})",
					"$1 $2 $3",
					["[479]"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["5"],
					"0$1"
				]
			],
			"0"
		],
		AF: [
			"93",
			"00",
			"[2-7]\\d{8}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[2-7]"],
				"0$1"
			]],
			"0"
		],
		AG: [
			"1",
			"011",
			"(?:268|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([457]\\d{6})$|1",
			"268$1",
			0,
			"268"
		],
		AI: [
			"1",
			"011",
			"(?:264|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2457]\\d{6})$|1",
			"264$1",
			0,
			"264"
		],
		AL: [
			"355",
			"00",
			"(?:700\\d\\d|900)\\d{3}|8\\d{5,7}|(?:[2-5]|6\\d)\\d{7}",
			[
				6,
				7,
				8,
				9
			],
			[
				[
					"(\\d{3})(\\d{3,4})",
					"$1 $2",
					["80|9"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["4[2-6]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[2358][2-5]|4"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["[23578]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["6"],
					"0$1"
				]
			],
			"0"
		],
		AM: [
			"374",
			"00",
			"(?:[1-489]\\d|55|60|77)\\d{6}",
			[8],
			[
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["[89]0"],
					"0 $1"
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["2|3[12]"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["1|47"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["[3-9]"],
					"0$1"
				]
			],
			"0"
		],
		AO: [
			"244",
			"00",
			"[29]\\d{8}",
			[9],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[29]"]
			]]
		],
		AR: [
			"54",
			"00",
			"(?:11|[89]\\d\\d)\\d{8}|[2368]\\d{9}",
			[10, 11],
			[
				[
					"(\\d{4})(\\d{2})(\\d{4})",
					"$1 $2-$3",
					[
						"2(?:2[024-9]|3[0-59]|47|6[245]|9[02-8])|3(?:3[28]|4[03-9]|5[2-46-8]|7[1-578]|8[2-9])",
						"2(?:[23]02|6(?:[25]|4[6-8])|9(?:[02356]|4[02568]|72|8[23]))|3(?:3[28]|4(?:[04679]|3[5-8]|5[4-68]|8[2379])|5(?:[2467]|3[237]|8[2-5])|7[1-578]|8(?:[2469]|3[2578]|5[4-8]|7[36-8]|8[5-8]))|2(?:2[24-9]|3[1-59]|47)",
						"2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3[78]|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8[23])|7[1-578]|8(?:[2469]|3[278]|5[56][46]|86[3-6]))|2(?:2[24-9]|3[1-59]|47)|38(?:[58][78]|7[378])|3(?:4[35][56]|58[45]|8(?:[38]5|54|76))[4-6]",
						"2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3(?:5(?:4[0-25689]|[56])|[78])|58|8[2379])|5(?:[2467]|3[237]|8(?:[23]|4(?:[45]|60)|5(?:4[0-39]|5|64)))|7[1-578]|8(?:[2469]|3[278]|54(?:4|5[13-7]|6[89])|86[3-6]))|2(?:2[24-9]|3[1-59]|47)|38(?:[58][78]|7[378])|3(?:454|85[56])[46]|3(?:4(?:36|5[56])|8(?:[38]5|76))[4-6]"
					],
					"0$1",
					1
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2-$3",
					["1"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["[68]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2-$3",
					["[23]"],
					"0$1",
					1
				],
				[
					"(\\d)(\\d{4})(\\d{2})(\\d{4})",
					"$2 15-$3-$4",
					[
						"9(?:2[2-469]|3[3-578])",
						"9(?:2(?:2[024-9]|3[0-59]|47|6[245]|9[02-8])|3(?:3[28]|4[03-9]|5[2-46-8]|7[1-578]|8[2-9]))",
						"9(?:2(?:[23]02|6(?:[25]|4[6-8])|9(?:[02356]|4[02568]|72|8[23]))|3(?:3[28]|4(?:[04679]|3[5-8]|5[4-68]|8[2379])|5(?:[2467]|3[237]|8[2-5])|7[1-578]|8(?:[2469]|3[2578]|5[4-8]|7[36-8]|8[5-8])))|92(?:2[24-9]|3[1-59]|47)",
						"9(?:2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3[78]|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8[23])|7[1-578]|8(?:[2469]|3[278]|5(?:[56][46]|[78])|7[378]|8(?:6[3-6]|[78]))))|92(?:2[24-9]|3[1-59]|47)|93(?:4[35][56]|58[45]|8(?:[38]5|54|76))[4-6]",
						"9(?:2(?:[23]02|6(?:[25]|4(?:64|[78]))|9(?:[02356]|4(?:[0268]|5[2-6])|72|8[23]))|3(?:3[28]|4(?:[04679]|3(?:5(?:4[0-25689]|[56])|[78])|5(?:4[46]|8)|8[2379])|5(?:[2467]|3[237]|8(?:[23]|4(?:[45]|60)|5(?:4[0-39]|5|64)))|7[1-578]|8(?:[2469]|3[278]|5(?:4(?:4|5[13-7]|6[89])|[56][46]|[78])|7[378]|8(?:6[3-6]|[78]))))|92(?:2[24-9]|3[1-59]|47)|93(?:4(?:36|5[56])|8(?:[38]5|76))[4-6]"
					],
					"0$1",
					0,
					"$1 $2 $3-$4"
				],
				[
					"(\\d)(\\d{2})(\\d{4})(\\d{4})",
					"$2 15-$3-$4",
					["91"],
					"0$1",
					0,
					"$1 $2 $3-$4"
				],
				[
					"(\\d{3})(\\d{3})(\\d{5})",
					"$1-$2-$3",
					["8"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{3})(\\d{4})",
					"$2 15-$3-$4",
					["9"],
					"0$1",
					0,
					"$1 $2 $3-$4"
				]
			],
			"0",
			0,
			"0?(?:(11|2(?:2(?:02?|[13]|2[13-79]|4[1-6]|5[2457]|6[124-8]|7[1-4]|8[13-6]|9[1267])|3(?:02?|1[467]|2[03-6]|3[13-8]|[49][2-6]|5[2-8]|[67])|4(?:7[3-578]|9)|6(?:[0136]|2[24-6]|4[6-8]?|5[15-8])|80|9(?:0[1-3]|[19]|2\\d|3[1-6]|4[02568]?|5[2-4]|6[2-46]|72?|8[23]?))|3(?:3(?:2[79]|6|8[2578])|4(?:0[0-24-9]|[12]|3[5-8]?|4[24-7]|5[4-68]?|6[02-9]|7[126]|8[2379]?|9[1-36-8])|5(?:1|2[1245]|3[237]?|4[1-46-9]|6[2-4]|7[1-6]|8[2-5]?)|6[24]|7(?:[069]|1[1568]|2[15]|3[145]|4[13]|5[14-8]|7[2-57]|8[126])|8(?:[01]|2[15-7]|3[2578]?|4[13-6]|5[4-8]?|6[1-357-9]|7[36-8]?|8[5-8]?|9[124])))15)?",
			"9$1"
		],
		AS: [
			"1",
			"011",
			"(?:[58]\\d\\d|684|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([267]\\d{6})$|1",
			"684$1",
			0,
			"684"
		],
		AT: [
			"43",
			"00",
			"1\\d{3,12}|2\\d{6,12}|43(?:(?:0\\d|5[02-9])\\d{3,9}|2\\d{4,5}|[3467]\\d{4}|8\\d{4,6}|9\\d{4,7})|5\\d{4,12}|8\\d{7,12}|9\\d{8,12}|(?:[367]\\d|4[0-24-9])\\d{4,11}",
			[
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13
			],
			[
				[
					"(\\d)(\\d{3,12})",
					"$1 $2",
					["1(?:11|[2-9])"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})",
					"$1 $2",
					["517"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3,5})",
					"$1 $2",
					["5[079]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3,10})",
					"$1 $2",
					["(?:31|4)6|51|6(?:48|5[0-3579]|[6-9])|7(?:20|32|8)|[89]", "(?:31|4)6|51|6(?:485|5[0-3579]|[6-9])|7(?:20|32|8)|[89]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3,9})",
					"$1 $2",
					["[2-467]|5[2-6]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["5"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4,7})",
					"$1 $2 $3",
					["5"],
					"0$1"
				]
			],
			"0"
		],
		AU: [
			"61",
			"001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011",
			"1(?:[0-79]\\d{7}(?:\\d(?:\\d{2})?)?|8[0-24-9]\\d{7})|[2-478]\\d{8}|1\\d{4,7}",
			[
				5,
				6,
				7,
				8,
				9,
				10,
				12
			],
			[
				[
					"(\\d{2})(\\d{3,4})",
					"$1 $2",
					["16"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2,4})",
					"$1 $2 $3",
					["16"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["14|4"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[2378]"],
					"(0$1)"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["1(?:30|[89])"]
				]
			],
			"0",
			0,
			"(183[12])|0",
			0,
			0,
			0,
			[
				["(?:(?:241|349)0\\d\\d|8(?:51(?:0(?:0[03-9]|[12479]\\d|3[2-9]|5[0-8]|6[1-9]|8[0-7])|1(?:[0235689]\\d|1[0-69]|4[0-589]|7[0-47-9])|2(?:0[0-79]|[18][13579]|2[14-9]|3[0-46-9]|[4-6]\\d|7[89]|9[0-4])|[34]\\d\\d)|91(?:(?:[0-58]\\d|6[0135-9])\\d|7(?:0[0-24-9]|[1-9]\\d)|9(?:[0-46-9]\\d|5[0-79]))))\\d{3}|(?:2(?:[0-26-9]\\d|3[0-8]|4[02-9]|5[0135-9])|3(?:[0-3589]\\d|4[0-578]|6[1-9]|7[0-35-9])|7(?:[013-57-9]\\d|2[0-8])|8(?:55|6[0-8]|[78]\\d|9[02-9]))\\d{6}", [9]],
				["4(?:79[01]|83[0-36-9]|95[0-3])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-47-9])\\d{6}", [9]],
				["180(?:0\\d{3}|2)\\d{3}", [7, 10]],
				["190[0-26]\\d{6}", [10]],
				0,
				0,
				0,
				["163\\d{2,6}", [
					5,
					6,
					7,
					8,
					9
				]],
				["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]],
				["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [
					6,
					8,
					10,
					12
				]]
			],
			"0011"
		],
		AW: [
			"297",
			"00",
			"(?:[25-79]\\d\\d|800)\\d{4}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[25-9]"]
			]]
		],
		AX: [
			"358",
			"00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]))",
			"2\\d{4,9}|35\\d{4,5}|(?:60\\d\\d|800)\\d{4,6}|7\\d{5,11}|(?:[14]\\d|3[0-46-9]|50)\\d{4,8}",
			[
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			0,
			"0",
			0,
			0,
			0,
			0,
			"18",
			0,
			"00"
		],
		AZ: [
			"994",
			"00",
			"365\\d{6}|(?:[124579]\\d|60|88)\\d{7}",
			[9],
			[
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["90"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					[
						"1[28]|2|365|46",
						"1[28]|2|365[45]|46",
						"1[28]|2|365(?:4|5[02])|46"
					],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[13-9]"],
					"0$1"
				]
			],
			"0"
		],
		BA: [
			"387",
			"00",
			"6\\d{8}|(?:[35689]\\d|49|70)\\d{6}",
			[8, 9],
			[
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["6[1-3]|[7-9]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2-$3",
					["[3-5]|6[56]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3 $4",
					["6"],
					"0$1"
				]
			],
			"0"
		],
		BB: [
			"1",
			"011",
			"(?:246|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"246$1",
			0,
			"246"
		],
		BD: [
			"880",
			"00",
			"[1-469]\\d{9}|8[0-79]\\d{7,8}|[2-79]\\d{8}|[2-9]\\d{7}|[3-9]\\d{6}|[57-9]\\d{5}",
			[
				6,
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{4,6})",
					"$1-$2",
					["31[5-8]|[459]1"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3,7})",
					"$1-$2",
					["3(?:[67]|8[013-9])|4(?:6[168]|7|[89][18])|5(?:6[128]|9)|6(?:[15]|28)|7[2-589]|8(?:0[014-9]|[12])|9[358]|(?:3[2-5]|4[235]|5[2-578]|6[0389]|76|8[3-7]|9[24])1|(?:44|66)[01346-9]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3,6})",
					"$1-$2",
					["[13-9]|2[23]"],
					"0$1"
				],
				[
					"(\\d)(\\d{7,8})",
					"$1-$2",
					["2"],
					"0$1"
				]
			],
			"0"
		],
		BE: [
			"32",
			"00",
			"4\\d{8}|[1-9]\\d{7}",
			[8, 9],
			[
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["(?:80|9)0"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[239]|4[23]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[15-8]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["4"],
					"0$1"
				]
			],
			"0"
		],
		BF: [
			"226",
			"00",
			"[024-7]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[024-7]"]
			]]
		],
		BG: [
			"359",
			"00",
			"00800\\d{7}|[2-7]\\d{6,7}|[89]\\d{6,8}|2\\d{5}",
			[
				6,
				7,
				8,
				9,
				12
			],
			[
				[
					"(\\d)(\\d)(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["2"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["43[1-6]|70[1-9]"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2,3})",
					"$1 $2 $3",
					["[356]|4[124-7]|7[1-9]|8[1-6]|9[1-7]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["(?:70|8)0"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{2})",
					"$1 $2 $3",
					["43[1-7]|7"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[48]|9[08]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["9"],
					"0$1"
				]
			],
			"0"
		],
		BH: [
			"973",
			"00",
			"[136-9]\\d{7}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[13679]|8[02-4679]"]
			]]
		],
		BI: [
			"257",
			"00",
			"(?:[267]\\d|31)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[2367]"]
			]]
		],
		BJ: [
			"229",
			"00",
			"(?:01\\d|8)\\d{7}",
			[8, 10],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"]
			], [
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4 $5",
				["0"]
			]]
		],
		BL: [
			"590",
			"00",
			"7090\\d{5}|(?:[56]9|[89]\\d)\\d{7}",
			[9],
			0,
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["(?:59(?:0(?:2[7-9]|3[3-7]|5[12]|87)|87\\d)|80[6-9]\\d\\d)\\d{4}"],
				["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5]))|7090[0-4])\\d{4}"],
				["80[0-5]\\d{6}"],
				["8[129]\\d{7}"],
				0,
				0,
				0,
				0,
				["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]
			]
		],
		BM: [
			"1",
			"011",
			"(?:441|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"441$1",
			0,
			"441"
		],
		BN: [
			"673",
			"00",
			"[2-578]\\d{6}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[2-578]"]
			]]
		],
		BO: [
			"591",
			"00(?:1\\d)?",
			"(?:[2-7]\\d\\d|8001)\\d{5}",
			[8, 9],
			[
				[
					"(\\d)(\\d{7})",
					"$1 $2",
					["[23]|4[46]|50"]
				],
				[
					"(\\d{8})",
					"$1",
					["[5-7]"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["8"]
				]
			],
			"0",
			0,
			"0(1\\d)?"
		],
		BQ: [
			"599",
			"00",
			"(?:[34]1|7\\d)\\d{5}",
			[7],
			0,
			0,
			0,
			0,
			0,
			0,
			"[347]"
		],
		BR: [
			"55",
			"00(?:1[245]|2[1-35]|31|4[13]|[56]5|99)",
			"[1-467]\\d{9,10}|55[0-46-9]\\d{8}|[34]\\d{7}|55\\d{7,8}|(?:5[0-46-9]|[89]\\d)\\d{7,9}",
			[
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{4})(\\d{4})",
					"$1-$2",
					["300|4(?:0[02]|37|86)", "300|4(?:0(?:0|20)|370|864)"]
				],
				[
					"(\\d{3})(\\d{2,3})(\\d{4})",
					"$1 $2 $3",
					["(?:[358]|90)0"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2-$3",
					["(?:[14689][1-9]|2[12478]|3[1-578]|5[13-5]|7[13-579])[2-57]"],
					"($1)"
				],
				[
					"(\\d{2})(\\d{5})(\\d{4})",
					"$1 $2-$3",
					["[16][1-9]|[2-57-9]"],
					"($1)"
				]
			],
			"0",
			0,
			"(?:0|90)(?:(1[245]|2[1-35]|31|4[13]|[56]5|99)(\\d{10,11}))?",
			"$2"
		],
		BS: [
			"1",
			"011",
			"(?:242|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([3-8]\\d{6})$|1",
			"242$1",
			0,
			"242"
		],
		BT: [
			"975",
			"00",
			"[178]\\d{7}|[2-8]\\d{6}",
			[7, 8],
			[[
				"(\\d)(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[2-6]|7[246]|8[2-4]"]
			], [
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["1[67]|[78]"]
			]]
		],
		BW: [
			"267",
			"00",
			"(?:0800|(?:[37]|800)\\d)\\d{6}|(?:[2-6]\\d|90)\\d{5}",
			[
				7,
				8,
				10
			],
			[
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["90"]
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[24-6]|3[15-9]"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[37]"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["0"]
				],
				[
					"(\\d{3})(\\d{4})(\\d{3})",
					"$1 $2 $3",
					["8"]
				]
			]
		],
		BY: [
			"375",
			"810",
			"(?:[12]\\d|33|44|902)\\d{7}|8(?:0[0-79]\\d{5,7}|[1-7]\\d{9})|8(?:1[0-489]|[5-79]\\d)\\d{7}|8[1-79]\\d{6,7}|8[0-79]\\d{5}|8\\d{5}",
			[
				6,
				7,
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{3})(\\d{3})",
					"$1 $2",
					["800"],
					"8 $1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2,4})",
					"$1 $2 $3",
					["800"],
					"8 $1"
				],
				[
					"(\\d{4})(\\d{2})(\\d{3})",
					"$1 $2-$3",
					["1(?:5[169]|6[3-5]|7[179])|2(?:1[35]|2[34]|3[3-5])", "1(?:5[169]|6(?:3[1-3]|4|5[125])|7(?:1[3-9]|7[0-24-6]|9[2-7]))|2(?:1[35]|2[34]|3[3-5])"],
					"8 0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2-$3-$4",
					["1(?:[56]|7[467])|2[1-3]"],
					"8 0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2-$3-$4",
					["[1-4]"],
					"8 0$1"
				],
				[
					"(\\d{3})(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["[89]"],
					"8 $1"
				]
			],
			"8",
			0,
			"0|80?",
			0,
			0,
			0,
			0,
			"8~10"
		],
		BZ: [
			"501",
			"00",
			"(?:0800\\d|[2-8])\\d{6}",
			[7, 11],
			[[
				"(\\d{3})(\\d{4})",
				"$1-$2",
				["[2-8]"]
			], [
				"(\\d)(\\d{3})(\\d{4})(\\d{3})",
				"$1-$2-$3-$4",
				["0"]
			]]
		],
		CA: [
			"1",
			"011",
			"[2-9]\\d{9}|3\\d{6}",
			[7, 10],
			0,
			"1",
			0,
			0,
			0,
			0,
			0,
			[
				["(?:2(?:04|[23]6|[48]9|5[07]|[67]3)|3(?:06|43|54|6[578]|82)|4(?:03|1[68]|[26]8|3[178]|50|74)|5(?:06|1[49]|48|79|8[147])|6(?:04|[18]3|39|47|72)|7(?:0[59]|42|53|78|8[02])|8(?:[06]7|19|25|7[39])|9(?:0[25]|42))[2-9]\\d{6}", [10]],
				["", [10]],
				["8(?:00|33|44|55|66|77|88)[2-9]\\d{6}", [10]],
				["900[2-9]\\d{6}", [10]],
				["52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|(?:5(?:2[125-9]|3[23]|44|66|77|88)|6(?:22|33))[2-9]\\d{6}", [10]],
				0,
				["310\\d{4}", [7]],
				0,
				["600[2-9]\\d{6}", [10]]
			]
		],
		CC: [
			"61",
			"001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011",
			"1(?:[0-79]\\d{8}(?:\\d{2})?|8[0-24-9]\\d{7})|[148]\\d{8}|1\\d{5,7}",
			[
				6,
				7,
				8,
				9,
				10,
				12
			],
			0,
			"0",
			0,
			"([59]\\d{7})$|0",
			"8$1",
			0,
			0,
			[
				["8(?:51(?:0(?:02|31|60|89)|1(?:18|76)|223)|91(?:0(?:1[0-2]|29)|1(?:[28]2|50|79)|2(?:10|64)|3(?:[06]8|22)|4[29]8|62\\d|70[23]|959))\\d{3}", [9]],
				["4(?:79[01]|83[0-36-9]|95[0-3])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-47-9])\\d{6}", [9]],
				["180(?:0\\d{3}|2)\\d{3}", [7, 10]],
				["190[0-26]\\d{6}", [10]],
				0,
				0,
				0,
				0,
				["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]],
				["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [
					6,
					8,
					10,
					12
				]]
			],
			"0011"
		],
		CD: [
			"243",
			"00",
			"(?:(?:[189]|5\\d)\\d|2)\\d{7}|[1-68]\\d{6}",
			[
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["88"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["[1-6]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["5"],
					"0$1"
				]
			],
			"0"
		],
		CF: [
			"236",
			"00",
			"8776\\d{4}|(?:[27]\\d|61)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[26-8]"]
			]]
		],
		CG: [
			"242",
			"00",
			"222\\d{6}|(?:0\\d|80)\\d{7}",
			[9],
			[[
				"(\\d)(\\d{4})(\\d{4})",
				"$1 $2 $3",
				["8"]
			], [
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[02]"]
			]]
		],
		CH: [
			"41",
			"00",
			"8\\d{11}|[2-9]\\d{8}",
			[9, 12],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8[047]|90"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[2-79]|81"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4 $5",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		CI: [
			"225",
			"00",
			"[02]\\d{9}",
			[10],
			[[
				"(\\d{2})(\\d{2})(\\d)(\\d{5})",
				"$1 $2 $3 $4",
				["2"]
			], [
				"(\\d{2})(\\d{2})(\\d{2})(\\d{4})",
				"$1 $2 $3 $4",
				["0"]
			]]
		],
		CK: [
			"682",
			"00",
			"[2-578]\\d{4}",
			[5],
			[[
				"(\\d{2})(\\d{3})",
				"$1 $2",
				["[2-578]"]
			]]
		],
		CL: [
			"56",
			"(?:0|1(?:1[0-69]|2[02-5]|5[13-58]|69|7[0167]|8[018]))0",
			"12300\\d{6}|6\\d{9,10}|[2-9]\\d{8}",
			[
				9,
				10,
				11
			],
			[
				[
					"(\\d{5})(\\d{4})",
					"$1 $2",
					["219", "2196"],
					"($1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["60|809"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["44"]
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["2[1-36]"],
					"($1)"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["9(?:10|[2-9])"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["3[2-5]|[47]|5[1-3578]|6[13-57]|8(?:0[1-8]|[1-9])"],
					"($1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["60|8"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3 $4",
					["60"]
				]
			]
		],
		CM: [
			"237",
			"00",
			"[26]\\d{8}|88\\d{6,7}",
			[8, 9],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["88"]
			], [
				"(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4 $5",
				["[26]|88"]
			]]
		],
		CN: [
			"86",
			"00|1(?:[12]\\d|79)\\d\\d00",
			"(?:(?:1[03-689]|2\\d)\\d\\d|6)\\d{8}|1\\d{10}|[126]\\d{6}(?:\\d(?:\\d{2})?)?|86\\d{5,6}|(?:[3-579]\\d|8[0-57-9])\\d{5,9}",
			[
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{2})(\\d{5,6})",
					"$1 $2",
					[
						"(?:10|2[0-57-9])[19]|3(?:[157]|35|49|9[1-68])|4(?:1[124-9]|2[179]|6[47-9]|7|8[23])|5(?:[1357]|2[37]|4[36]|6[1-46]|80)|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:07|1[236-8]|2[5-7]|[37]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3|4[13]|5[1-5]|7[0-79]|9[0-35-9])|(?:4[35]|59|85)[1-9]",
						"(?:10|2[0-57-9])(?:1[02]|9[56])|8078|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))1",
						"10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|80781|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))12",
						"10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|807812|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))123",
						"10(?:1(?:0|23)|9[56])|2[0-57-9](?:1(?:00|23)|9[56])|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:1[124-9]|2[179]|[35][1-9]|6[47-9]|7\\d|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:078|1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|3\\d|4[13]|5[1-5]|7[0-79]|9[0-35-9]))123"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5,6})",
					"$1 $2",
					[
						"3(?:[157]|35|49|9[1-68])|4(?:[17]|2[179]|6[47-9]|8[23])|5(?:[1357]|2[37]|4[36]|6[1-46]|80)|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])|(?:4[35]|59|85)[1-9]",
						"(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))[19]",
						"85[23](?:10|95)|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[14-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))(?:10|9[56])",
						"85[23](?:100|95)|(?:3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[47-9]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[14-9]|8[36-8]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))(?:100|9[56])"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["(?:4|80)0"]
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					[
						"10|2(?:[02-57-9]|1[1-9])",
						"10|2(?:[02-57-9]|1[1-9])",
						"10[0-79]|2(?:[02-57-9]|1[1-79])|(?:10|21)8(?:0[1-9]|[1-9])"
					],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["3(?:[3-59]|7[02-68])|4(?:[26-8]|3[3-9]|5[2-9])|5(?:3[03-9]|[468]|7[028]|9[2-46-9])|6|7(?:[0-247]|3[04-9]|5[0-4689]|6[2368])|8(?:[1-358]|9[1-7])|9(?:[013479]|5[1-5])|(?:[34]1|55|79|87)[02-9]"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{7,8})",
					"$1 $2",
					["9"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["80"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[3-578]"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["1[3-9]"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3 $4",
					["[12]"],
					"0$1",
					1
				]
			],
			"0",
			0,
			"(1(?:[12]\\d|79)\\d\\d)|0",
			0,
			0,
			0,
			0,
			"00"
		],
		CO: [
			"57",
			"00(?:4(?:[14]4|56)|[579])",
			"(?:46|60\\d\\d)\\d{6}|(?:1\\d|[39])\\d{9}",
			[
				8,
				10,
				11
			],
			[
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["46"]
				],
				[
					"(\\d{3})(\\d{7})",
					"$1 $2",
					["6|90"],
					"($1)"
				],
				[
					"(\\d{3})(\\d{7})",
					"$1 $2",
					["3[0-357]|9[14]"]
				],
				[
					"(\\d)(\\d{3})(\\d{7})",
					"$1-$2-$3",
					["1"],
					"0$1",
					0,
					"$1 $2 $3"
				]
			],
			"0",
			0,
			"0([3579]|4(?:[14]4|56))?"
		],
		CR: [
			"506",
			"00",
			"(?:8\\d|90)\\d{8}|(?:[24-8]\\d{3}|3005)\\d{4}",
			[8, 10],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[2-7]|8[3-9]"]
			], [
				"(\\d{3})(\\d{3})(\\d{4})",
				"$1-$2-$3",
				["[89]"]
			]],
			0,
			0,
			"(19(?:0[0-2468]|1[09]|20|66|77|99))"
		],
		CU: [
			"53",
			"119",
			"(?:[2-7]|8\\d\\d)\\d{7}|[2-47]\\d{6}|[34]\\d{5}",
			[
				6,
				7,
				8,
				10
			],
			[
				[
					"(\\d{2})(\\d{4,6})",
					"$1 $2",
					["2[1-4]|[34]"],
					"(0$1)"
				],
				[
					"(\\d)(\\d{6,7})",
					"$1 $2",
					["7"],
					"(0$1)"
				],
				[
					"(\\d)(\\d{7})",
					"$1 $2",
					["[56]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{7})",
					"$1 $2",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		CV: [
			"238",
			"0",
			"(?:[2-59]\\d\\d|800)\\d{4}",
			[7],
			[[
				"(\\d{3})(\\d{2})(\\d{2})",
				"$1 $2 $3",
				["[2-589]"]
			]]
		],
		CW: [
			"599",
			"00",
			"(?:[34]1|60|(?:7|9\\d)\\d)\\d{5}",
			[7, 8],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[3467]"]
			], [
				"(\\d)(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["9[4-8]"]
			]],
			0,
			0,
			0,
			0,
			0,
			"[69]"
		],
		CX: [
			"61",
			"001[14-689]|14(?:1[14]|34|4[17]|[56]6|7[47]|88)0011",
			"1(?:[0-79]\\d{8}(?:\\d{2})?|8[0-24-9]\\d{7})|[148]\\d{8}|1\\d{5,7}",
			[
				6,
				7,
				8,
				9,
				10,
				12
			],
			0,
			"0",
			0,
			"([59]\\d{7})$|0",
			"8$1",
			0,
			0,
			[
				["8(?:51(?:0(?:01|30|59|88)|1(?:17|46|75)|2(?:22|35))|91(?:00[6-9]|1(?:[28]1|49|78)|2(?:09|63)|3(?:12|26|75)|4(?:56|97)|64\\d|7(?:0[01]|1[0-2])|958))\\d{3}", [9]],
				["4(?:79[01]|83[0-36-9]|95[0-3])\\d{5}|4(?:[0-36]\\d|4[047-9]|[58][0-24-9]|7[02-8]|9[0-47-9])\\d{6}", [9]],
				["180(?:0\\d{3}|2)\\d{3}", [7, 10]],
				["190[0-26]\\d{6}", [10]],
				0,
				0,
				0,
				0,
				["14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}", [9]],
				["13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4}", [
					6,
					8,
					10,
					12
				]]
			],
			"0011"
		],
		CY: [
			"357",
			"00",
			"(?:[279]\\d|[58]0)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{6})",
				"$1 $2",
				["[257-9]"]
			]]
		],
		CZ: [
			"420",
			"00",
			"(?:[2-578]\\d|60)\\d{7}|9\\d{8,11}",
			[
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[2-8]|9[015-7]"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})(\\d{2})",
					"$1 $2 $3 $4",
					["96"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["9"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["9"]
				]
			]
		],
		DE: [
			"49",
			"00",
			"[2579]\\d{5,14}|49(?:[34]0|69|8\\d)\\d\\d?|49(?:37|49|60|7[089]|9\\d)\\d{1,3}|49(?:2[024-9]|3[2-689]|7[1-7])\\d{1,8}|(?:1|[368]\\d|4[0-8])\\d{3,13}|49(?:[015]\\d|2[13]|31|[46][1-8])\\d{1,9}",
			[
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15
			],
			[
				[
					"(\\d{2})(\\d{3,13})",
					"$1 $2",
					["3[02]|40|[68]9"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3,12})",
					"$1 $2",
					["2(?:0[1-389]|1[124]|2[18]|3[14])|3(?:[35-9][15]|4[015])|906|(?:2[4-9]|4[2-9]|[579][1-9]|[68][1-8])1", "2(?:0[1-389]|12[0-8])|3(?:[35-9][15]|4[015])|906|2(?:[13][14]|2[18])|(?:2[4-9]|4[2-9]|[579][1-9]|[68][1-8])1"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{2,11})",
					"$1 $2",
					["[24-6]|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])|70[2-8]|8(?:0[2-9]|[1-8])|90[7-9]|[79][1-9]", "[24-6]|3(?:3(?:0[1-467]|2[127-9]|3[124578]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|4[13578]|9[1346])|5(?:0[14]|2[1-3589]|6[1-4]|7[13468]|8[13568])|6(?:2[1-489]|3[124-6]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|6|7[1467]|8[136])|9(?:0[12479]|2[1358]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))|70[2-8]|8(?:0[2-9]|[1-8])|90[7-9]|[79][1-9]|3[68]4[1347]|3(?:47|60)[1356]|3(?:3[46]|46|5[49])[1246]|3[4579]3[1357]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["138"],
					"0$1"
				],
				[
					"(\\d{5})(\\d{2,10})",
					"$1 $2",
					["3"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5,11})",
					"$1 $2",
					["181"],
					"0$1"
				],
				[
					"(\\d{3})(\\d)(\\d{4,10})",
					"$1 $2 $3",
					["1(?:3|80)|9"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{7,8})",
					"$1 $2",
					["1[67]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{7,12})",
					"$1 $2",
					["8"],
					"0$1"
				],
				[
					"(\\d{5})(\\d{6})",
					"$1 $2",
					[
						"185",
						"1850",
						"18500"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["7"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{7})",
					"$1 $2",
					["18[68]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{7})",
					"$1 $2",
					["15[1279]"],
					"0$1"
				],
				[
					"(\\d{5})(\\d{6})",
					"$1 $2",
					["15[03568]", "15(?:[0568]|3[13])"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{8})",
					"$1 $2",
					["18"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{7,8})",
					"$1 $2 $3",
					["1(?:6[023]|7)"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{2})(\\d{7})",
					"$1 $2 $3",
					["15[279]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{8})",
					"$1 $2 $3",
					["15"],
					"0$1"
				]
			],
			"0"
		],
		DJ: [
			"253",
			"00",
			"(?:2\\d|77)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[27]"]
			]]
		],
		DK: [
			"45",
			"00",
			"[2-9]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[2-9]"]
			]]
		],
		DM: [
			"1",
			"011",
			"(?:[58]\\d\\d|767|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-7]\\d{6})$|1",
			"767$1",
			0,
			"767"
		],
		DO: [
			"1",
			"011",
			"(?:[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			0,
			0,
			0,
			"8001|8[024]9"
		],
		DZ: [
			"213",
			"00",
			"(?:[1-4]|[5-79]\\d|80)\\d{7}",
			[8, 9],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[1-4]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["9"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[5-8]"],
					"0$1"
				]
			],
			"0"
		],
		EC: [
			"593",
			"00",
			"1\\d{9,10}|(?:[2-7]|9\\d)\\d{7}",
			[
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2-$3",
					["[2-7]"],
					"(0$1)",
					0,
					"$1-$2-$3"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["9"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["1"]
				]
			],
			"0"
		],
		EE: [
			"372",
			"00",
			"8\\d{9}|[4578]\\d{7}|(?:[3-8]\\d|90)\\d{5}",
			[
				7,
				8,
				10
			],
			[
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[369]|4[3-8]|5(?:[0-2]|5[0-478]|6[45])|7[1-9]|88", "[369]|4[3-8]|5(?:[02]|1(?:[0-8]|95)|5[0-478]|6(?:4[0-4]|5[1-589]))|7[1-9]|88"]
				],
				[
					"(\\d{4})(\\d{3,4})",
					"$1 $2",
					["[45]|8(?:00|[1-49])", "[45]|8(?:00[1-9]|[1-49])"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["7"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8"]
				]
			]
		],
		EG: [
			"20",
			"00",
			"[189]\\d{8,9}|[24-6]\\d{8}|[135]\\d{7}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d)(\\d{7,8})",
					"$1 $2",
					["[23]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{6,7})",
					"$1 $2",
					["1[35]|[4-6]|8[2468]|9[235-7]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{8})",
					"$1 $2",
					["1"],
					"0$1"
				]
			],
			"0"
		],
		EH: [
			"212",
			"00",
			"[5-8]\\d{8}",
			[9],
			0,
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["528[89]\\d{5}"],
				["(?:6(?:[0-79]\\d|8[0-247-9])|7(?:[016-8]\\d|2[0-8]|3[01]|5[0-5]))\\d{6}"],
				["80[0-7]\\d{6}"],
				["89\\d{7}"],
				0,
				0,
				0,
				0,
				["(?:592(?:4[0-2]|93)|80[89]\\d\\d)\\d{4}"]
			]
		],
		ER: [
			"291",
			"00",
			"[178]\\d{6}",
			[7],
			[[
				"(\\d)(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[178]"],
				"0$1"
			]],
			"0"
		],
		ES: [
			"34",
			"00",
			"(?:400|[5-9]\\d\\d)\\d{6}",
			[9],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[89]00"]
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[4-9]"]
			]]
		],
		ET: [
			"251",
			"00",
			"(?:11|[2-57-9]\\d)\\d{7}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[1-57-9]"],
				"0$1"
			]],
			"0"
		],
		FI: [
			"358",
			"00|99(?:[01469]|5(?:[14]1|3[23]|5[59]|77|88|9[09]))",
			"[1-35689]\\d{4}|7\\d{10,11}|(?:[124-7]\\d|3[0-46-9])\\d{8}|[1-9]\\d{5,8}",
			[
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{5})",
					"$1",
					["20[2-59]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3,7})",
					"$1 $2",
					["(?:[1-3]0|[68])0|70[07-9]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4,8})",
					"$1 $2",
					["[14]|2[09]|50|7[135]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{6,10})",
					"$1 $2",
					["7"],
					"0$1"
				],
				[
					"(\\d)(\\d{4,9})",
					"$1 $2",
					["(?:19|[2568])[1-8]|3(?:0[1-9]|[1-9])|9"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			"1[03-79]|[2-9]",
			0,
			"00"
		],
		FJ: [
			"679",
			"0(?:0|52)",
			"45\\d{5}|(?:0800\\d|[235-9])\\d{6}",
			[7, 11],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[235-9]|45"]
			], [
				"(\\d{4})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["0"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		FK: [
			"500",
			"00",
			"[2-7]\\d{4}",
			[5]
		],
		FM: [
			"691",
			"00",
			"(?:[39]\\d\\d|820)\\d{4}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[389]"]
			]]
		],
		FO: [
			"298",
			"00",
			"[2-9]\\d{5}",
			[6],
			[[
				"(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3",
				["[2-9]"]
			]],
			0,
			0,
			"(10(?:01|[12]0|88))"
		],
		FR: [
			"33",
			"00",
			"[1-9]\\d{8}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"],
				"0 $1"
			], [
				"(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4 $5",
				["[1-79]"],
				"0$1"
			]],
			"0"
		],
		GA: [
			"241",
			"00",
			"(?:[067]\\d|11)\\d{6}|[2-7]\\d{6}",
			[7, 8],
			[
				[
					"(\\d)(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[2-7]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["0"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["11|[67]"],
					"0$1"
				]
			],
			0,
			0,
			"0(11\\d{6}|60\\d{6}|61\\d{6}|6[256]\\d{6}|7[467]\\d{6})",
			"$1"
		],
		GB: [
			"44",
			"00",
			"[1-357-9]\\d{9}|[18]\\d{8}|8\\d{6}",
			[
				7,
				9,
				10
			],
			[
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					[
						"800",
						"8001",
						"80011",
						"800111",
						"8001111"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3",
					[
						"845",
						"8454",
						"84546",
						"845464"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{6})",
					"$1 $2",
					["800"],
					"0$1"
				],
				[
					"(\\d{5})(\\d{4,5})",
					"$1 $2",
					[
						"1(?:38|5[23]|69|76|94)",
						"1(?:(?:38|69)7|5(?:24|39)|768|946)",
						"1(?:3873|5(?:242|39[4-6])|(?:697|768)[347]|9467)"
					],
					"0$1"
				],
				[
					"(\\d{4})(\\d{5,6})",
					"$1 $2",
					["1(?:[2-69][02-9]|[78])"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[25]|7(?:0|6[02-9])", "[25]|7(?:0|6(?:[03-9]|2[356]))"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{6})",
					"$1 $2",
					["7"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[1389]"],
					"0$1"
				]
			],
			"0",
			0,
			"0|180020",
			0,
			0,
			0,
			[
				["(?:1(?:1(?:3(?:[0-58]\\d\\d|73[0-5])|4(?:(?:[0-5]\\d|70)\\d|69[7-9])|(?:(?:5[0-26-9]|[78][0-49])\\d|6(?:[0-4]\\d|5[01]))\\d)|(?:2(?:(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-47-9]|7[013-9]|9\\d)\\d|1(?:[0-7]\\d|8[0-3]))|(?:3(?:0\\d|1[0-8]|[25][02-9]|3[02-579]|[468][0-46-9]|7[1-35-79]|9[2-578])|4(?:0[03-9]|[137]\\d|[28][02-57-9]|4[02-69]|5[0-8]|[69][0-79])|5(?:0[1-35-9]|[16]\\d|2[024-9]|3[015689]|4[02-9]|5[03-9]|7[0-35-9]|8[0-468]|9[0-57-9])|6(?:0[034689]|1\\d|2[0-35689]|[38][013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|9[0-24578])|7(?:0[0246-9]|2\\d|3[0236-8]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-57-9]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\\d|8[02-9]|9[02569])|9(?:0[02-589]|[18]\\d|2[02-689]|3[1-57-9]|4[2-9]|5[0-579]|6[2-47-9]|7[0-24578]|9[2-57]))\\d)\\d)|2(?:0[013478]|3[0189]|4[017]|8[0-46-9]|9[0-2])\\d{3})\\d{4}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-47-9]|8[3-5])))|3(?:6(?:38[2-5]|47[23])|8(?:47[04-9]|64[0157-9]))|4(?:044[1-7]|20(?:2[23]|8\\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[1-3]))|5(?:2(?:4(?:3[2-79]|6\\d)|76\\d)|6(?:26[06-9]|686))|6(?:06(?:4\\d|7[4-79])|295[5-7]|35[34]\\d|47(?:24|61)|59(?:5[08]|6[67]|74)|9(?:55[0-4]|77[23]))|7(?:26(?:6[13-9]|7[0-7])|(?:442|688)\\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\\d|37(?:5[2-5]|8[239])|843[2-58])|9(?:0(?:0(?:6[1-8]|85)|52\\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\\d{3}", [9, 10]],
				["7(?:457[0-57-9]|700[01]|911[028])\\d{5}|7(?:[1-3]\\d\\d|4(?:[0-46-9]\\d|5[0-689])|5(?:0[0-8]|[13-9]\\d|2[0-35-9])|7(?:0[1-9]|[1-7]\\d|8[02-9]|9[0-689])|8(?:[014-9]\\d|[23][0-8])|9(?:[024-9]\\d|1[02-9]|3[0-689]))\\d{6}", [10]],
				["80[08]\\d{7}|800\\d{6}|8001111"],
				["(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[2-49]))\\d{7}|845464\\d", [7, 10]],
				["70\\d{8}", [10]],
				0,
				["(?:3[0347]|55)\\d{8}", [10]],
				["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}", [10]],
				["56\\d{8}", [10]]
			],
			0,
			" x"
		],
		GD: [
			"1",
			"011",
			"(?:473|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"473$1",
			0,
			"473"
		],
		GE: [
			"995",
			"00",
			"(?:[3-57]\\d\\d|800)\\d{6}",
			[9],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["70"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["32"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[57]"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[348]"],
					"0$1"
				]
			],
			"0"
		],
		GF: [
			"594",
			"00",
			"(?:694\\d|7093)\\d{5}|(?:59|[89]\\d)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[5-7]|80[6-9]|9[47]"],
				"0$1"
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[89]"],
				"0$1"
			]],
			"0"
		],
		GG: [
			"44",
			"00",
			"(?:1481|[357-9]\\d{3})\\d{6}|8\\d{6}(?:\\d{2})?",
			[
				7,
				9,
				10
			],
			0,
			"0",
			0,
			"([25-9]\\d{5})$|0|180020",
			"1481$1",
			0,
			0,
			[
				["1481[25-9]\\d{5}", [10]],
				["7(?:(?:781|839)\\d|911[17])\\d{5}", [10]],
				["80[08]\\d{7}|800\\d{6}|8001111"],
				["(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[0-3]))\\d{7}|845464\\d", [7, 10]],
				["70\\d{8}", [10]],
				0,
				["(?:3[0347]|55)\\d{8}", [10]],
				["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}", [10]],
				["56\\d{8}", [10]]
			]
		],
		GH: [
			"233",
			"00",
			"[235]\\d{8}|800\\d{5,6}",
			[8, 9],
			[[
				"(\\d{3})(\\d{5})",
				"$1 $2",
				["8"],
				"0$1"
			], [
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[2358]"],
				"0$1"
			]],
			"0"
		],
		GI: [
			"350",
			"00",
			"(?:[25]\\d|60)\\d{6}",
			[8],
			[[
				"(\\d{3})(\\d{5})",
				"$1 $2",
				["2"]
			]]
		],
		GL: [
			"299",
			"00",
			"(?:19|[2-689]\\d|70)\\d{4}",
			[6],
			[[
				"(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3",
				["19|[2-9]"]
			]]
		],
		GM: [
			"220",
			"00",
			"[48]\\d{8}|[2-9]\\d{6}",
			[7, 9],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[235-9]|4(?:[0-35]|4[16-9])"]
			], [
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[48]"]
			]]
		],
		GN: [
			"224",
			"00",
			"722\\d{6}|(?:3|6\\d)\\d{7}",
			[8, 9],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["3"]
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[67]"]
			]]
		],
		GP: [
			"590",
			"00",
			"7090\\d{5}|(?:[56]9|[89]\\d)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[5-79]|80[6-9]"],
				"0$1"
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"],
				"0$1"
			]],
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["(?:59(?:0(?:0[1-68]|[14][0-24-9]|2[0-68]|3[1-9]|5[3-579]|[68][0-689]|7[08]|9\\d)|87\\d)|80[6-9]\\d\\d)\\d{4}"],
				["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5]))|7090[0-4])\\d{4}"],
				["80[0-5]\\d{6}"],
				["8[129]\\d{7}"],
				0,
				0,
				0,
				0,
				["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]
			]
		],
		GQ: [
			"240",
			"00",
			"222\\d{6}|(?:3\\d|55|[89]0)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[235]"]
			], [
				"(\\d{3})(\\d{6})",
				"$1 $2",
				["[89]"]
			]]
		],
		GR: [
			"30",
			"00",
			"5005000\\d{3}|8\\d{9,11}|(?:[269]\\d|70)\\d{8}",
			[
				10,
				11,
				12
			],
			[
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["21|7"]
				],
				[
					"(\\d{4})(\\d{6})",
					"$1 $2",
					["2(?:2|3[2-57-9]|4[2-469]|5[2-59]|6[2-9]|7[2-69]|8[2-49])|5"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[2689]"]
				],
				[
					"(\\d{3})(\\d{3,4})(\\d{5})",
					"$1 $2 $3",
					["8"]
				]
			]
		],
		GT: [
			"502",
			"00",
			"80\\d{6}|(?:1\\d{3}|[2-7])\\d{7}",
			[8, 11],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[2-8]"]
			], [
				"(\\d{4})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["1"]
			]]
		],
		GU: [
			"1",
			"011",
			"(?:[58]\\d\\d|671|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"671$1",
			0,
			"671"
		],
		GW: [
			"245",
			"00",
			"[49]\\d{8}|4\\d{6}",
			[7, 9],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["40"]
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[49]"]
			]]
		],
		GY: [
			"592",
			"001",
			"(?:[2-8]\\d{3}|9008)\\d{3}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[2-9]"]
			]]
		],
		HK: [
			"852",
			"00(?:30|5[09]|[126-9]?)",
			"8[0-46-9]\\d{6,7}|9\\d{4,7}|(?:[2-7]|9\\d{3})\\d{7}",
			[
				5,
				6,
				7,
				8,
				9,
				11
			],
			[
				[
					"(\\d{3})(\\d{2,5})",
					"$1 $2",
					["900", "9003"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[2-7]|8[1-4]|9(?:0[1-9]|[1-8])"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["9"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		HN: [
			"504",
			"00",
			"8\\d{10}|[237-9]\\d{7}",
			[8, 11],
			[[
				"(\\d{4})(\\d{4})",
				"$1-$2",
				["[237-9]"]
			]]
		],
		HR: [
			"385",
			"00",
			"[2-69]\\d{8}|80\\d{5,7}|[1-79]\\d{7}|6\\d{6}",
			[
				7,
				8,
				9
			],
			[
				[
					"(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["6[01]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2,3})",
					"$1 $2 $3",
					["8"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{3})",
					"$1 $2 $3",
					["1"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["6|7[245]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["9"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[2-57]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		HT: [
			"509",
			"00",
			"[2-589]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{4})",
				"$1 $2 $3",
				["[2-589]"]
			]]
		],
		HU: [
			"36",
			"00",
			"[235-7]\\d{8}|[1-9]\\d{7}",
			[8, 9],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"(06 $1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[27][2-9]|3[2-7]|4[24-9]|5[2-79]|6|8[2-57-9]|9[2-69]"],
					"(06 $1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[2-9]"],
					"06 $1"
				]
			],
			"06"
		],
		ID: [
			"62",
			"00[89]",
			"00[1-9]\\d{9,14}|(?:[1-36]|8\\d{5})\\d{6}|00\\d{9}|[1-9]\\d{8,10}|[2-9]\\d{7}",
			[
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16,
				17
			],
			[
				[
					"(\\d)(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["15"]
				],
				[
					"(\\d{2})(\\d{5,9})",
					"$1 $2",
					["2[124]|[36]1"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{5,7})",
					"$1 $2",
					["800"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5,8})",
					"$1 $2",
					["[2-79]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{3,4})(\\d{3})",
					"$1-$2-$3",
					["8[1-35-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{6,8})",
					"$1 $2",
					["1"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["804"],
					"0$1"
				],
				[
					"(\\d{3})(\\d)(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["80"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})(\\d{4,5})",
					"$1-$2-$3",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		IE: [
			"353",
			"00",
			"(?:1\\d|[2569])\\d{6,8}|4\\d{6,9}|7\\d{8}|8\\d{8,9}",
			[
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["2[24-9]|47|58|6[237-9]|9[35-9]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["[45]0"],
					"(0$1)"
				],
				[
					"(\\d)(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[2569]|4[1-69]|7[14]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["70"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["81"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[78]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["1"]
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["4"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3 $4",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		IL: [
			"972",
			"0(?:0|1(?:05|[2-9]))",
			"1\\d{6}(?:\\d{3,5})?|[57]\\d{8}|[1-489]\\d{7}",
			[
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{4})(\\d{3})",
					"$1-$2",
					["125"]
				],
				[
					"(\\d{4})(\\d{2})(\\d{2})",
					"$1-$2-$3",
					["121"]
				],
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["[2-489]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["[57]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1-$2-$3",
					["12"]
				],
				[
					"(\\d{4})(\\d{6})",
					"$1-$2",
					["159"]
				],
				[
					"(\\d)(\\d{3})(\\d{3})(\\d{3})",
					"$1-$2-$3-$4",
					["1[7-9]"]
				],
				[
					"(\\d{3})(\\d{1,2})(\\d{3})(\\d{4})",
					"$1-$2 $3-$4",
					["15"]
				]
			],
			"0"
		],
		IM: [
			"44",
			"00",
			"1624\\d{6}|(?:[3578]\\d|90)\\d{8}",
			[10],
			0,
			"0",
			0,
			"([25-8]\\d{5})$|0|180020",
			"1624$1",
			0,
			"74576|(?:16|7[56])24"
		],
		IN: [
			"91",
			"00",
			"(?:000800|[2-9]\\d\\d)\\d{7}|1\\d{7,12}",
			[
				8,
				9,
				10,
				11,
				12,
				13
			],
			[
				[
					"(\\d{8})",
					"$1",
					[
						"5(?:0|2[23]|3[03]|[67]1|88)",
						"5(?:0|2(?:21|3)|3(?:0|3[23])|616|717|888)",
						"5(?:0|2(?:21|3)|3(?:0|3[23])|616|717|8888)"
					],
					0,
					1
				],
				[
					"(\\d{4})(\\d{4,5})",
					"$1 $2",
					["180", "1800"],
					0,
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["140"],
					0,
					1
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					[
						"11|2[02]|33|4[04]|79[1-6]|80[2-46]",
						"11|2[02]|33|4[04]|79[1-6]|80(?:[2-4]|6[0-589])",
						"11|2[02]|33|4[04]|79(?:[124-6]|3(?:[02-9]|1[0-24-9]))|80(?:[2-4]|6[0-589])"
					],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					[
						"1(?:2[0-249]|3[0-25]|4[145]|[68]|7[1257])|2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|5[12]|[78]1)|6(?:12|[2-4]1|5[17]|6[13]|80)|7(?:12|3[134]|61|88)|8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91)|(?:43|59|75)[15]|(?:1[59]|29|67)[14]",
						"1(?:2[0-24]|3[0-25]|4[145]|[59][14]|6[1-9]|7[1257]|8[1-57-9])|2(?:1[257]|3[013]|4[01]|5[0137]|6[058]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|[578]1|9[15])|674|7(?:(?:3[34]|5[15])[2-6]|61[346]|88[0-8])|8(?:70[2-6]|84[235-7]|91[3-7])|(?:1(?:29|60|8[06])|261|552|6(?:12|[2-47]1|5[17]|6[13]|80)|7(?:12|31)|8(?:16|2[014]|3[126]|6[136]|7[78]|83))[2-7]",
						"1(?:2[0-24]|3[0-25]|4[145]|[59][14]|6[1-9]|7[1257]|8[1-57-9])|2(?:1[257]|3[013]|4[01]|5[0137]|6[058]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|22|[36][25]|4[28]|[578]1|9[15])|6(?:12(?:[2-6]|7[0-8])|74[2-7])|7(?:3171|5[15][2-6]|61[346]|88(?:[2-7]|82))|8(?:70[2-6]|84(?:[2356]|7[19])|91(?:[3-6]|7[19]))|73[134][2-6]|8(?:16|2[014]|3[126]|6[136]|7[78]|83)(?:[2-6]|7[19])|(?:1(?:29|60|8[06])|261|552|6(?:[2-4]1|5[17]|6[13]|7(?:1|4[0189])|80)|7(?:12|88[01]))[2-7]"
					],
					"0$1",
					1
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					[
						"1(?:[2-479]|5[0235-9])|[2-5]|6(?:1[1358]|2[2457-9]|3[2-5]|4[235-7]|5[2-689]|6[24578]|7[235689]|8[1-6])|7(?:1[013-9]|3[129]|5[29]|6[02-5]|70)|807",
						"1(?:[2-479]|5[0235-9])|[2-5]|6(?:1[1358]|2(?:[2457]|84|95)|3(?:[2-4]|55)|4[235-7]|5[2-689]|6[24578]|7(?:[23569]|8[0-57-9])|8[1-6])|7(?:1(?:[013-8]|9[6-9])|3(?:17|2[0-49]|9[2-57])|5(?:2[1-3]|9[0-6])|6(?:0[5689]|2[5-9]|3[02-8]|4|5[0-367])|70[13-7])|807[19]",
						"1(?:[2-479]|5(?:[0236-9]|5[013-9]))|[2-5]|6(?:2(?:84|95)|355|8(?:28[235-7]|3))|73179|807(?:1|9[1-3])|(?:1552|6(?:(?:1[1358]|2[2457]|3[2-4]|4[235-7]|5[2-689]|6[24578])\\d|7(?:[23569]\\d|8[0-57-9])|8(?:[14-6]\\d|2[0-79]))|7(?:1(?:[013-8]\\d|9[6-9])|3(?:2[0-49]|9[2-57])|5(?:2[1-3]|9[0-6])|6(?:0[5689]|2[5-9]|3[02-8]|4\\d|5[0-367])|70[13-7]))[2-7]"
					],
					"0$1",
					1
				],
				[
					"(\\d{5})(\\d{5})",
					"$1 $2",
					["16|[6-9]"],
					"0$1",
					1
				],
				[
					"(\\d{4})(\\d{2,4})(\\d{4})",
					"$1 $2 $3",
					["18[06]", "18[06]0"],
					0,
					1
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["18"],
					0,
					1
				]
			],
			"0"
		],
		IO: [
			"246",
			"00",
			"3\\d{6}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["3"]
			]]
		],
		IQ: [
			"964",
			"00",
			"(?:1|7\\d\\d)\\d{7}|[2-6]\\d{7,8}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[2-6]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["7"],
					"0$1"
				]
			],
			"0"
		],
		IR: [
			"98",
			"00",
			"[1-9]\\d{9}|(?:[1-8]\\d\\d|9)\\d{3,4}",
			[
				4,
				5,
				6,
				7,
				10
			],
			[
				[
					"(\\d{4,5})",
					"$1",
					["96"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4,5})",
					"$1 $2",
					["(?:1[137]|2[13-68]|3[1458]|4[145]|5[1468]|6[16]|7[1467]|8[13467])[12689]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["9"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[1-8]"],
					"0$1"
				]
			],
			"0"
		],
		IS: [
			"354",
			"00|1(?:0(?:01|[12]0)|100)",
			"(?:38\\d|[4-9])\\d{6}",
			[7, 9],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[4-9]"]
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["3"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		IT: [
			"39",
			"00",
			"0\\d{5,11}|1\\d{8,10}|3(?:[0-8]\\d{7,10}|9\\d{7,8})|(?:43|55|70)\\d{8}|8\\d{5}(?:\\d{2,4})?",
			[
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{2})(\\d{4,6})",
					"$1 $2",
					["0[26]"]
				],
				[
					"(\\d{3})(\\d{3,6})",
					"$1 $2",
					["0[13-57-9][0159]|8(?:03|4[17]|9[2-5])", "0[13-57-9][0159]|8(?:03|4[17]|9(?:2|3[04]|[45][0-4]))"]
				],
				[
					"(\\d{4})(\\d{2,6})",
					"$1 $2",
					["0(?:[13-579][2-46-8]|8[236-8])"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["894"]
				],
				[
					"(\\d{2})(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["0[26]|5"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["1(?:44|[679])|[378]|43"]
				],
				[
					"(\\d{3})(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["0[13-57-9][0159]|14"]
				],
				[
					"(\\d{2})(\\d{4})(\\d{5})",
					"$1 $2 $3",
					["0[26]"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["0"]
				],
				[
					"(\\d{3})(\\d{4})(\\d{4,5})",
					"$1 $2 $3",
					["[03]"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				["0(?:669[0-79]\\d{1,6}|831\\d{2,8})|0(?:1(?:[0159]\\d|[27][1-5]|31|4[1-4]|6[1356]|8[2-57])|2\\d\\d|3(?:[0159]\\d|2[1-4]|3[12]|[48][1-6]|6[2-59]|7[1-7])|4(?:[0159]\\d|[23][1-9]|4[245]|6[1-5]|7[1-4]|81)|5(?:[0159]\\d|2[1-5]|3[2-6]|4[1-79]|6[4-6]|7[1-578]|8[3-8])|6(?:[0-57-9]\\d|6[0-8])|7(?:[0159]\\d|2[12]|3[1-7]|4[2-46]|6[13569]|7[13-6]|8[1-59])|8(?:[0159]\\d|2[3-578]|3[2356]|[6-8][1-5])|9(?:[0159]\\d|[238][1-5]|4[12]|6[1-8]|7[1-6]))\\d{2,7}"],
				["3[2-9]\\d{7,8}|(?:31|43)\\d{8}", [9, 10]],
				["80(?:0\\d{3}|3)\\d{3}", [6, 9]],
				["(?:0878\\d{3}|89(?:2\\d|3[04]|4(?:[0-4]|[5-9]\\d\\d)|5[0-4]))\\d\\d|(?:1(?:44|6[346])|89(?:38|5[5-9]|9))\\d{6}", [
					6,
					8,
					9,
					10
				]],
				["1(?:78\\d|99)\\d{6}", [9, 10]],
				["3[2-8]\\d{9,10}", [11, 12]],
				0,
				0,
				["55\\d{8}", [10]],
				["84(?:[08]\\d{3}|[17])\\d{3}", [6, 9]]
			]
		],
		JE: [
			"44",
			"00",
			"1534\\d{6}|(?:[3578]\\d|90)\\d{8}",
			[10],
			0,
			"0",
			0,
			"([0-24-8]\\d{5})$|0|180020",
			"1534$1",
			0,
			0,
			[
				["1534[0-24-8]\\d{5}"],
				["7(?:(?:(?:50|82)9|937)\\d|7(?:00[378]|97\\d))\\d{5}"],
				["80(?:07(?:35|81)|8901)\\d{4}"],
				["(?:8(?:4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|90(?:066[59]|1810|71(?:07|55)))\\d{4}"],
				["701511\\d{4}"],
				0,
				["(?:3(?:0(?:07(?:35|81)|8901)|3\\d{4}|4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|55\\d{4})\\d{4}"],
				["76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}"],
				["56\\d{8}"]
			]
		],
		JM: [
			"1",
			"011",
			"(?:[58]\\d\\d|658|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			0,
			0,
			0,
			"658|876"
		],
		JO: [
			"962",
			"00",
			"(?:(?:[2689]|7\\d)\\d|32|427|53)\\d{6}",
			[8, 9],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[2356]|87"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{5,6})",
					"$1 $2",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1 $2",
					["70"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[47]"],
					"0$1"
				]
			],
			"0"
		],
		JP: [
			"81",
			"010",
			"00[1-9]\\d{6,14}|[25-9]\\d{9}|(?:00|[1-9]\\d\\d)\\d{6}",
			[
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16,
				17
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1-$2-$3",
					["(?:12|57|99)0"],
					"0$1"
				],
				[
					"(\\d{4})(\\d)(\\d{4})",
					"$1-$2-$3",
					[
						"1(?:26|3[79]|4[56]|5[4-68]|6[3-5])|499|5(?:76|97)|746|8(?:3[89]|47|51)|9(?:80|9[16])",
						"1(?:267|3(?:7[247]|9[278])|466|5(?:47|58|64)|6(?:3[245]|48|5[4-68]))|499[2468]|5(?:76|97)9|7468|8(?:3(?:8[7-9]|96)|477|51[2-9])|9(?:802|9(?:1[23]|69))|1(?:45|58)[67]",
						"1(?:267|3(?:7[247]|9[278])|466|5(?:47|58|64)|6(?:3[245]|48|5[4-68]))|499[2468]|5(?:769|979[2-69])|7468|8(?:3(?:8[7-9]|96[2457-9])|477|51[2-9])|9(?:802|9(?:1[23]|69))|1(?:45|58)[67]"
					],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["60"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1-$2-$3",
					["3|4(?:2[09]|7[01])|6[1-9]", "3|4(?:2(?:0|9[02-69])|7(?:0[019]|1))|6[1-9]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					[
						"1(?:1|5[45]|77|88|9[69])|2(?:2[1-37]|3[0-269]|4[59]|5|6[24]|7[1-358]|8[1369]|9[0-38])|4(?:[28][1-9]|3[0-57]|[45]|6[248]|7[2-579]|9[29])|5(?:2|3[0459]|4[0-369]|5[29]|8[02389]|9[0-389])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9[2-6])|8(?:2[124589]|3[26-9]|49|51|6|7[0-468]|8[68]|9[019])|9(?:[23][1-9]|4[15]|5[138]|6[1-3]|7[156]|8[189]|9[1-489])",
						"1(?:1|5(?:4[018]|5[017])|77|88|9[69])|2(?:2(?:[127]|3[014-9])|3[0-269]|4[59]|5(?:[1-3]|5[0-69]|9[19])|62|7(?:[1-35]|8[0189])|8(?:[16]|3[0134]|9[0-5])|9(?:[028]|17))|4(?:2(?:[13-79]|8[014-6])|3[0-57]|[45]|6[248]|7[2-47]|8[1-9]|9[29])|5(?:2|3(?:[045]|9[0-8])|4[0-369]|5[29]|8[02389]|9[0-3])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9(?:[23]|4[0-59]|5[01569]|6[0167]))|8(?:2(?:[1258]|4[0-39]|9[0-2469])|3(?:[29]|60)|49|51|6(?:[0-24]|36|5[0-3589]|7[23]|9[01459])|7[0-468]|8[68])|9(?:[23][1-9]|4[15]|5[138]|6[1-3]|7[156]|8[189]|9(?:[1289]|3[34]|4[0178]))|(?:264|837)[016-9]|2(?:57|93)[015-9]|(?:25[0468]|422|838)[01]|(?:47[59]|59[89]|8(?:6[68]|9))[019]",
						"1(?:1|5(?:4[018]|5[017])|77|88|9[69])|2(?:2[127]|3[0-269]|4[59]|5(?:[1-3]|5[0-69]|9(?:17|99))|6(?:2|4[016-9])|7(?:[1-35]|8[0189])|8(?:[16]|3[0134]|9[0-5])|9(?:[028]|17))|4(?:2(?:[13-79]|8[014-6])|3[0-57]|[45]|6[248]|7[2-47]|9[29])|5(?:2|3(?:[045]|9(?:[0-58]|6[4-9]|7[0-35689]))|4[0-369]|5[29]|8[02389]|9[0-3])|7(?:2[02-46-9]|34|[58]|6[0249]|7[57]|9(?:[23]|4[0-59]|5[01569]|6[0167]))|8(?:2(?:[1258]|4[0-39]|9[0169])|3(?:[29]|60|7(?:[017-9]|6[6-8]))|49|51|6(?:[0-24]|36[2-57-9]|5(?:[0-389]|5[23])|6(?:[01]|9[178])|7(?:2[2-468]|3[78])|9[0145])|7[0-468]|8[68])|9(?:4[15]|5[138]|7[156]|8[189]|9(?:[1289]|3(?:31|4[357])|4[0178]))|(?:8294|96)[1-3]|2(?:57|93)[015-9]|(?:223|8699)[014-9]|(?:25[0468]|422|838)[01]|(?:48|8292|9[23])[1-9]|(?:47[59]|59[89]|8(?:68|9))[019]"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{4})",
					"$1-$2-$3",
					["[14]|[289][2-9]|5[3-9]|7[2-4679]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["800"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1-$2-$3",
					["[25-9]"],
					"0$1"
				]
			],
			"0",
			0,
			"(000[2569]\\d{4,6})$|(?:(?:003768)0?)|0",
			"$1"
		],
		KE: [
			"254",
			"000",
			"(?:[17]\\d\\d|900)\\d{6}|(?:2|80)0\\d{6,7}|[4-6]\\d{6,8}",
			[
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{5,7})",
					"$1 $2",
					["[24-6]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{6})",
					"$1 $2",
					["[17]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				]
			],
			"0"
		],
		KG: [
			"996",
			"00",
			"8\\d{9}|[235-9]\\d{8}",
			[9, 10],
			[
				[
					"(\\d{4})(\\d{5})",
					"$1 $2",
					["3(?:1[346]|[24-79])"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[235-79]|88"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d)(\\d{2,3})",
					"$1 $2 $3 $4",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		KH: [
			"855",
			"00[14-9]",
			"1\\d{9}|[1-9]\\d{7,8}",
			[
				8,
				9,
				10
			],
			[[
				"(\\d{2})(\\d{3})(\\d{3,4})",
				"$1 $2 $3",
				["[1-9]"],
				"0$1"
			], [
				"(\\d{4})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["1"]
			]],
			"0"
		],
		KI: [
			"686",
			"00",
			"(?:[37]\\d|6[0-79])\\d{6}|(?:[2-48]\\d|50)\\d{3}",
			[5, 8],
			0,
			"0"
		],
		KM: [
			"269",
			"00",
			"[3478]\\d{6}",
			[7],
			[[
				"(\\d{3})(\\d{2})(\\d{2})",
				"$1 $2 $3",
				["[3478]"]
			]]
		],
		KN: [
			"1",
			"011",
			"(?:[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-7]\\d{6})$|1",
			"869$1",
			0,
			"869"
		],
		KP: [
			"850",
			"00|99",
			"85\\d{6}|(?:19\\d|[2-7])\\d{7}",
			[8, 10],
			[
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[2-7]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"0$1"
				]
			],
			"0"
		],
		KR: [
			"82",
			"00(?:[125689]|3(?:[46]5|91)|7(?:00|27|3|55|6[126]))",
			"00[1-9]\\d{8,11}|(?:[12]|5\\d{3})\\d{7}|[13-6]\\d{9}|(?:[1-6]\\d|80)\\d{7}|[3-6]\\d{4,5}|(?:00|7)0\\d{8}",
			[
				5,
				6,
				8,
				9,
				10,
				11,
				12,
				13,
				14
			],
			[
				[
					"(\\d{2})(\\d{3,4})",
					"$1-$2",
					["(?:3[1-3]|[46][1-4]|5[1-5])1"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{4})",
					"$1-$2",
					["1"]
				],
				[
					"(\\d)(\\d{3,4})(\\d{4})",
					"$1-$2-$3",
					["2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1-$2-$3",
					["[36]0|8"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3,4})(\\d{4})",
					"$1-$2-$3",
					["[1346]|5[1-5]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1-$2-$3",
					["[57]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{5})(\\d{4})",
					"$1-$2-$3",
					["5"],
					"0$1"
				]
			],
			"0",
			0,
			"0(8(?:[1-46-8]|5\\d\\d))?"
		],
		KW: [
			"965",
			"00",
			"18\\d{5}|(?:[2569]\\d|41)\\d{6}",
			[7, 8],
			[[
				"(\\d{4})(\\d{3,4})",
				"$1 $2",
				["[169]|2(?:[235]|4[1-35-9])|52"]
			], [
				"(\\d{3})(\\d{5})",
				"$1 $2",
				["[245]"]
			]]
		],
		KY: [
			"1",
			"011",
			"(?:345|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"345$1",
			0,
			"345"
		],
		KZ: [
			"7",
			"810",
			"8\\d{13}|[78]\\d{9}",
			[10, 14],
			0,
			"8",
			0,
			0,
			0,
			0,
			"7",
			0,
			"8~10"
		],
		LA: [
			"856",
			"00",
			"[23]\\d{9}|3\\d{8}|(?:[235-8]\\d|41)\\d{6}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["2[13]|3[14]|[4-8]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3 $4",
					["3"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["[23]"],
					"0$1"
				]
			],
			"0"
		],
		LB: [
			"961",
			"00",
			"[27-9]\\d{7}|[13-9]\\d{6}",
			[7, 8],
			[[
				"(\\d)(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[13-69]|7(?:[2-57]|62|8[0-6]|9[04-9])|8[02-9]"],
				"0$1"
			], [
				"(\\d{2})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[27-9]"]
			]],
			"0"
		],
		LC: [
			"1",
			"011",
			"(?:[58]\\d\\d|758|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-8]\\d{6})$|1",
			"758$1",
			0,
			"758"
		],
		LI: [
			"423",
			"00",
			"[68]\\d{8}|(?:[2378]\\d|90)\\d{5}",
			[7, 9],
			[
				[
					"(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3",
					["[2379]|8(?:0[09]|7)", "[2379]|8(?:0(?:02|9)|7)"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["8"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["69"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["6"]
				]
			],
			"0",
			0,
			"(1001)|0"
		],
		LK: [
			"94",
			"00",
			"[1-9]\\d{8}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["7"],
				"0$1"
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[1-689]"],
				"0$1"
			]],
			"0"
		],
		LR: [
			"231",
			"00",
			"(?:[2457]\\d|33|88)\\d{7}|(?:2\\d|[4-6])\\d{6}",
			[
				7,
				8,
				9
			],
			[
				[
					"(\\d)(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["4[67]|[56]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[2-578]"],
					"0$1"
				]
			],
			"0"
		],
		LS: [
			"266",
			"00",
			"(?:[256]\\d\\d|800)\\d{5}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[2568]"]
			]]
		],
		LT: [
			"370",
			"00",
			"(?:[3469]\\d|52|[78]0)\\d{6}",
			[8],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["52[0-7]"],
					"(0-$1)",
					1
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["[7-9]"],
					"0 $1",
					1
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["37|4(?:[15]|6[1-8])"],
					"(0-$1)",
					1
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["[3-6]"],
					"(0-$1)",
					1
				]
			],
			"0",
			0,
			"[08]"
		],
		LU: [
			"352",
			"00",
			"35[013-9]\\d{4,8}|6\\d{8}|35\\d{2,4}|(?:[2457-9]\\d|3[0-46-9])\\d{2,9}",
			[
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{2})(\\d{3})",
					"$1 $2",
					["2(?:0[2-689]|[2-9])|[3-57]|8(?:0[2-9]|[13-9])|9(?:0[89]|[2-579])"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3",
					["2(?:0[2-689]|[2-9])|[3-57]|8(?:0[2-9]|[13-9])|9(?:0[89]|[2-579])"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["20[2-689]"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})",
					"$1 $2 $3 $4",
					["20"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{1,5})",
					"$1 $2 $3 $4",
					["[3-57]|8[13-9]|9(?:0[89]|[2-579])|(?:2|80)[2-9]"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["80[01]|90[015]"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3 $4",
					["20"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["6"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})",
					"$1 $2 $3 $4 $5",
					["20"]
				]
			],
			0,
			0,
			"(15(?:0[06]|1[12]|[35]5|4[04]|6[26]|77|88|99)\\d)"
		],
		LV: [
			"371",
			"00",
			"(?:[268]\\d|78|90)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[2679]|8[01]"]
			]]
		],
		LY: [
			"218",
			"00",
			"[2-9]\\d{8}",
			[9],
			[[
				"(\\d{2})(\\d{7})",
				"$1-$2",
				["[2-9]"],
				"0$1"
			]],
			"0"
		],
		MA: [
			"212",
			"00",
			"[5-8]\\d{8}",
			[9],
			[
				[
					"(\\d{4})(\\d{5})",
					"$1-$2",
					["892"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1-$2",
					["8(?:0[0-7]|9)"],
					"0$1"
				],
				[
					"(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4 $5",
					["[5-8]"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			"[5-8]"
		],
		MC: [
			"377",
			"00",
			"(?:[3489]|[67]\\d)\\d{7}",
			[8, 9],
			[
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["4"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[389]"]
				],
				[
					"(\\d)(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4 $5",
					["[67]"],
					"0$1"
				]
			],
			"0"
		],
		MD: [
			"373",
			"00",
			"(?:[235-7]\\d|[89]0)\\d{6}",
			[8],
			[
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["22|3"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["[25-7]"],
					"0$1"
				]
			],
			"0"
		],
		ME: [
			"382",
			"00",
			"(?:20|[3-79]\\d)\\d{6}|80\\d{6,7}",
			[8, 9],
			[[
				"(\\d{2})(\\d{3})(\\d{3,4})",
				"$1 $2 $3",
				["[2-9]"],
				"0$1"
			]],
			"0"
		],
		MF: [
			"590",
			"00",
			"7090\\d{5}|(?:[56]9|[89]\\d)\\d{7}",
			[9],
			0,
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["(?:59(?:0(?:0[079]|[14]3|[27][79]|3[03-7]|5[0-268]|87)|87\\d)|80[6-9]\\d\\d)\\d{4}"],
				["(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5]))|7090[0-4])\\d{4}"],
				["80[0-5]\\d{6}"],
				["8[129]\\d{7}"],
				0,
				0,
				0,
				0,
				["9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4}"]
			]
		],
		MG: [
			"261",
			"00",
			"[23]\\d{8}",
			[9],
			[[
				"(\\d{2})(\\d{2})(\\d{3})(\\d{2})",
				"$1 $2 $3 $4",
				["[23]"],
				"0$1"
			]],
			"0",
			0,
			"([24-9]\\d{6})$|0",
			"20$1"
		],
		MH: [
			"692",
			"011",
			"329\\d{4}|(?:[256]\\d|45)\\d{5}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1-$2",
				["[2-6]"]
			]],
			"1"
		],
		MK: [
			"389",
			"00",
			"[2-578]\\d{7}",
			[8],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["2|34[47]|4(?:[37]7|5[47]|64)"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[347]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d)(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[58]"],
					"0$1"
				]
			],
			"0"
		],
		ML: [
			"223",
			"00",
			"[24-9]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[24-9]"]
			]]
		],
		MM: [
			"95",
			"00",
			"1\\d{5,7}|95\\d{6}|(?:[4-7]|9[0-46-9])\\d{6,8}|(?:2|8\\d)\\d{5,8}",
			[
				6,
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d)(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["16|2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["4(?:[2-46]|5[3-5])|5|6(?:[1-689]|7[235-7])|7(?:[0-4]|5[2-7])|8[1-5]|(?:60|86)[23]"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[12]|452|678|86", "[12]|452|6788|86"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[4-7]|8[1-35]"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{4,6})",
					"$1 $2 $3",
					["9(?:2[0-4]|[35-9]|4[137-9])"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["92"],
					"0$1"
				],
				[
					"(\\d)(\\d{5})(\\d{4})",
					"$1 $2 $3",
					["9"],
					"0$1"
				]
			],
			"0"
		],
		MN: [
			"976",
			"001",
			"[12]\\d{7,9}|[5-9]\\d{7}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["11|2[16]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[5-9]"]
				],
				[
					"(\\d{3})(\\d{5,6})",
					"$1 $2",
					["[12]2[1-3]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{5,6})",
					"$1 $2",
					["[12](?:27|3[2-8]|4[2-68]|5[1-4689])", "[12](?:27|3[2-8]|4[2-68]|5[1-4689])[0-3]"],
					"0$1"
				],
				[
					"(\\d{5})(\\d{4,5})",
					"$1 $2",
					["[12]"],
					"0$1"
				]
			],
			"0"
		],
		MO: [
			"853",
			"00",
			"0800\\d{3}|(?:28|[68]\\d)\\d{6}",
			[7, 8],
			[[
				"(\\d{4})(\\d{3})",
				"$1 $2",
				["0"]
			], [
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[268]"]
			]]
		],
		MP: [
			"1",
			"011",
			"[58]\\d{9}|(?:67|90)0\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"670$1",
			0,
			"670"
		],
		MQ: [
			"596",
			"00",
			"7091\\d{5}|(?:[56]9|[89]\\d)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[5-79]|8(?:0[6-9]|[36])"],
				"0$1"
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"],
				"0$1"
			]],
			"0"
		],
		MR: [
			"222",
			"00",
			"(?:[2-4]\\d\\d|800)\\d{5}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[2-48]"]
			]]
		],
		MS: [
			"1",
			"011",
			"(?:[58]\\d\\d|664|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([34]\\d{6})$|1",
			"664$1",
			0,
			"664"
		],
		MT: [
			"356",
			"00",
			"3550\\d{4}|(?:[2579]\\d\\d|800)\\d{5}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[2357-9]"]
			]]
		],
		MU: [
			"230",
			"0(?:0|[24-7]0|3[03])",
			"(?:[57]|8\\d\\d)\\d{7}|[2-468]\\d{6}",
			[
				7,
				8,
				10
			],
			[
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[2-46]|8[013]"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[57]"]
				],
				[
					"(\\d{5})(\\d{5})",
					"$1 $2",
					["8"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"020"
		],
		MV: [
			"960",
			"0(?:0|19)",
			"(?:800|9[0-57-9]\\d)\\d{7}|[34679]\\d{6}",
			[7, 10],
			[[
				"(\\d{3})(\\d{4})",
				"$1-$2",
				["[34679]"]
			], [
				"(\\d{3})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[89]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		MW: [
			"265",
			"00",
			"(?:[1289]\\d|31|77)\\d{7}|1\\d{6}",
			[7, 9],
			[[
				"(\\d)(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["1[2-9]"],
				"0$1"
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[1-37-9]"],
				"0$1"
			]],
			"0"
		],
		MX: [
			"52",
			"0[09]",
			"[2-9]\\d{9}",
			[10],
			[[
				"(\\d{2})(\\d{4})(\\d{4})",
				"$1 $2 $3",
				["33|5[56]|81"]
			], [
				"(\\d{3})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[2-9]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		MY: [
			"60",
			"00",
			"1\\d{8,9}|(?:3\\d|[4-9])\\d{7}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1-$2 $3",
					["[4-79]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1-$2 $3",
					["1(?:[02469]|[378][1-9]|53)|8", "1(?:[02469]|[37][1-9]|53|8(?:[1-46-9]|5[7-9]))|8"],
					"0$1"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1-$2 $3",
					["3"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{2})(\\d{4})",
					"$1-$2-$3-$4",
					["1(?:[367]|80)"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1-$2 $3",
					["15"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1-$2 $3",
					["1"],
					"0$1"
				]
			],
			"0"
		],
		MZ: [
			"258",
			"00",
			"(?:2|8\\d)\\d{7}",
			[8, 9],
			[[
				"(\\d{2})(\\d{3})(\\d{3,4})",
				"$1 $2 $3",
				["2|8[2-9]"]
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["8"]
			]]
		],
		NA: [
			"264",
			"00",
			"[68]\\d{7,8}",
			[8, 9],
			[
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["88"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["6"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["87"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		NC: [
			"687",
			"00",
			"(?:050|[2-57-9]\\d\\d)\\d{3}",
			[6],
			[[
				"(\\d{2})(\\d{2})(\\d{2})",
				"$1.$2.$3",
				["[02-57-9]"]
			]]
		],
		NE: [
			"227",
			"00",
			"[027-9]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["08"]
			], [
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[089]|2[013]|7[0467]"]
			]]
		],
		NF: [
			"672",
			"00",
			"[13]\\d{5}",
			[6],
			[[
				"(\\d{2})(\\d{4})",
				"$1 $2",
				["1[0-3]"]
			], [
				"(\\d)(\\d{5})",
				"$1 $2",
				["[13]"]
			]],
			0,
			0,
			"([0-258]\\d{4})$",
			"3$1"
		],
		NG: [
			"234",
			"009",
			"(?:20|9\\d)\\d{8}|[78]\\d{9,13}",
			[
				10,
				11,
				12,
				13,
				14
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[7-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["20[129]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})(\\d{4,5})",
					"$1 $2 $3",
					["[78]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5})(\\d{5,6})",
					"$1 $2 $3",
					["[78]"],
					"0$1"
				]
			],
			"0"
		],
		NI: [
			"505",
			"00",
			"(?:1800|[25-8]\\d{3})\\d{4}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[125-8]"]
			]]
		],
		NL: [
			"31",
			"00",
			"(?:[124-7]\\d\\d|3(?:[02-9]\\d|1[0-8]))\\d{6}|8\\d{6,9}|9\\d{6,10}|1\\d{4,5}",
			[
				5,
				6,
				7,
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{3})(\\d{4,7})",
					"$1 $2",
					["[89]0"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1 $2",
					["66"],
					"0$1"
				],
				[
					"(\\d)(\\d{8})",
					"$1 $2",
					["6"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["1[16-8]|2[259]|3[124]|4[17-9]|5[124679]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[1-578]|91"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{5})",
					"$1 $2 $3",
					["9"],
					"0$1"
				]
			],
			"0"
		],
		NO: [
			"47",
			"00",
			"(?:0|[2-9]\\d{3})\\d{4}",
			[5, 8],
			[[
				"(\\d{3})(\\d{2})(\\d{3})",
				"$1 $2 $3",
				["8"]
			], [
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[2-79]"]
			]],
			0,
			0,
			0,
			0,
			0,
			"[02-689]|7[0-8]"
		],
		NP: [
			"977",
			"00",
			"(?:1\\d|9)\\d{9}|[1-9]\\d{7}",
			[
				8,
				10,
				11
			],
			[
				[
					"(\\d)(\\d{7})",
					"$1-$2",
					["1[2-6]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{6})",
					"$1-$2",
					["1[01]|[2-8]|9(?:[1-59]|[67][2-6])"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{7})",
					"$1-$2",
					["9"]
				]
			],
			"0"
		],
		NR: [
			"674",
			"00",
			"(?:222|444|(?:55|8\\d)\\d|666|777|999)\\d{4}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[24-9]"]
			]]
		],
		NU: [
			"683",
			"00",
			"(?:[4-7]|888\\d)\\d{3}",
			[4, 7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["8"]
			]]
		],
		NZ: [
			"64",
			"0(?:0|161)",
			"[1289]\\d{9}|50\\d{5}(?:\\d{2,3})?|[27-9]\\d{7,8}|(?:[34]\\d|6[0-35-9])\\d{6}|8\\d{4,6}",
			[
				5,
				6,
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{3,8})",
					"$1 $2",
					["8[1-79]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2,3})",
					"$1 $2 $3",
					["50[036-8]|8|90", "50(?:[0367]|88)|8|90"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["24|[346]|7[2-57-9]|9[2-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["2(?:10|74)|[589]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["1|2[028]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,5})",
					"$1 $2 $3",
					["2(?:[169]|7[0-35-9])|7"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		OM: [
			"968",
			"00",
			"(?:1505|[279]\\d{3}|500)\\d{4}|800\\d{5,6}",
			[
				7,
				8,
				9
			],
			[
				[
					"(\\d{3})(\\d{4,6})",
					"$1 $2",
					["[58]"]
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["2"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[179]"]
				]
			]
		],
		PA: [
			"507",
			"00",
			"(?:00800|8\\d{3})\\d{6}|[68]\\d{7}|[1-57-9]\\d{6}",
			[
				7,
				8,
				10,
				11
			],
			[
				[
					"(\\d{3})(\\d{4})",
					"$1-$2",
					["[1-57-9]"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1-$2",
					["[68]"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"]
				]
			]
		],
		PE: [
			"51",
			"00|19(?:1[124]|77|90)00",
			"(?:[14-8]|9\\d)\\d{7}",
			[8, 9],
			[
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["80"],
					"(0$1)"
				],
				[
					"(\\d)(\\d{7})",
					"$1 $2",
					["1"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["[4-8]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["9"]
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			"00",
			" Anexo "
		],
		PF: [
			"689",
			"00",
			"4\\d{5}(?:\\d{2})?|8\\d{7,8}",
			[
				6,
				8,
				9
			],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3",
					["44"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["4|8[7-9]"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["8"]
				]
			]
		],
		PG: [
			"675",
			"00|140[1-3]",
			"(?:180|[78]\\d{3})\\d{4}|(?:[2-589]\\d|64)\\d{5}",
			[7, 8],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["18|[2-69]|85[02-46-9]"]
			], [
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[78]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		PH: [
			"63",
			"00",
			"(?:[2-7]|9\\d)\\d{8}|2\\d{5}|(?:1800|8)\\d{7,9}",
			[
				6,
				8,
				9,
				10,
				11,
				12,
				13
			],
			[
				[
					"(\\d)(\\d{5})",
					"$1 $2",
					["2"],
					"(0$1)"
				],
				[
					"(\\d{4})(\\d{4,6})",
					"$1 $2",
					["3(?:23|39|46)|4(?:2[3-6]|[35]9|4[26]|76)|544|88[245]|(?:52|64|86)2", "3(?:230|397|461)|4(?:2(?:35|[46]4|51)|396|4(?:22|63)|59[347]|76[15])|5(?:221|446)|642[23]|8(?:622|8(?:[24]2|5[13]))"],
					"(0$1)"
				],
				[
					"(\\d{5})(\\d{4})",
					"$1 $2",
					["346|4(?:27|9[35])|883", "3469|4(?:279|9(?:30|56))|8834"],
					"(0$1)"
				],
				[
					"(\\d)(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["2"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[3-7]|8[2-8]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"]
				],
				[
					"(\\d{4})(\\d{1,2})(\\d{3})(\\d{4})",
					"$1 $2 $3 $4",
					["1"]
				]
			],
			"0"
		],
		PK: [
			"92",
			"00",
			"122\\d{6}|[24-8]\\d{10,11}|9(?:[013-9]\\d{8,10}|2(?:[01]\\d\\d|2(?:[06-8]\\d|1[01]))\\d{7})|(?:[2-8]\\d{3}|92(?:[0-7]\\d|8[1-9]))\\d{6}|[24-9]\\d{8}|[89]\\d{7}",
			[
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{2,7})",
					"$1 $2 $3",
					["[89]0"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{5})",
					"$1 $2",
					["1"]
				],
				[
					"(\\d{3})(\\d{6,7})",
					"$1 $2",
					["2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:2[2-8]|3[27-9]|4[2-6]|6[3569]|9[25-8])", "9(?:2[3-8]|98)|(?:2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:22|3[27-9]|4[2-6]|6[3569]|9[25-7]))[2-9]"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{7,8})",
					"$1 $2",
					["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]"],
					"(0$1)"
				],
				[
					"(\\d{5})(\\d{5})",
					"$1 $2",
					["58"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{7})",
					"$1 $2",
					["3"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["[24-9]"],
					"(0$1)"
				]
			],
			"0"
		],
		PL: [
			"48",
			"00",
			"(?:6|8\\d\\d)\\d{7}|[1-9]\\d{6}(?:\\d{2})?|[26]\\d{5}",
			[
				6,
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{5})",
					"$1",
					["19"]
				],
				[
					"(\\d{3})(\\d{3})",
					"$1 $2",
					["11|20|64"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["30|(?:1[2-8]|2[2-69]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])1", "30|(?:1[2-8]|2[2-69]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])19"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{2,3})",
					"$1 $2 $3",
					["64"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["21|39|45|5[0137]|6[0469]|7[02389]|8(?:0[14]|8)"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["1[2-8]|[2-7]|8[1-79]|9[145]"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["8"]
				]
			]
		],
		PM: [
			"508",
			"00",
			"[78]\\d{8}|[2-9]\\d{5}",
			[6, 9],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3",
					["[2-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["7"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		PR: [
			"1",
			"011",
			"(?:[589]\\d\\d|787)\\d{7}",
			[10],
			0,
			"1",
			0,
			0,
			0,
			0,
			"787|939"
		],
		PS: [
			"970",
			"00",
			"[2489]2\\d{6}|(?:1\\d|5)\\d{8}",
			[
				8,
				9,
				10
			],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[2489]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["5"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["1"]
				]
			],
			"0"
		],
		PT: [
			"351",
			"00",
			"1693\\d{5}|(?:[26-9]\\d|30)\\d{7}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["2[12]"]
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["16|[236-9]"]
			]]
		],
		PW: [
			"680",
			"01[12]",
			"(?:[24-8]\\d\\d|345|900)\\d{4}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[2-9]"]
			]]
		],
		PY: [
			"595",
			"00",
			"[36-8]\\d{5,8}|4\\d{6,8}|59\\d{6}|9\\d{5,10}|(?:2\\d|5[0-8])\\d{6,7}",
			[
				6,
				7,
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{3})(\\d{3,6})",
					"$1 $2",
					["[2-9]0"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["3[289]|4[246-8]|61|7[1-3]|8[1-36]"],
					"(0$1)"
				],
				[
					"(\\d{3})(\\d{4,5})",
					"$1 $2",
					["2[279]|3[13-5]|4[359]|5|6(?:[34]|7[1-46-8])|7[46-8]|85"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["2[14-68]|3[26-9]|4[1246-8]|6(?:1|75)|7[1-35]|8[1-36]"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["87"]
				],
				[
					"(\\d{3})(\\d{6})",
					"$1 $2",
					["9(?:[5-79]|8[1-7])"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[2-8]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["9"]
				]
			],
			"0"
		],
		QA: [
			"974",
			"00",
			"800\\d{4}|(?:2|800)\\d{6}|(?:0080|[3-7])\\d{7}",
			[
				7,
				8,
				9,
				11
			],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["2[136]|8"]
			], [
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[3-7]"]
			]]
		],
		RE: [
			"262",
			"00",
			"709\\d{6}|(?:26|[689]\\d)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[26-9]"],
				"0$1"
			]],
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["2631[0-6]\\d{4}|26(?:2\\d|30|88)\\d{5}"],
				["(?:69(?:2\\d\\d|3(?:[06][0-6]|1[0-3]|2[0-2]|3[0-39]|4\\d|5[0-5]|7[0-37]|8[0-8]|9[0-479]))|7092[0-3])\\d{4}"],
				["80\\d{7}"],
				["89[1-37-9]\\d{6}"],
				0,
				0,
				0,
				0,
				["9(?:399[0-3]|479[0-6]|76(?:2[278]|3[0-37]))\\d{4}"],
				["8(?:1[019]|2[0156]|84|90)\\d{6}"]
			]
		],
		RO: [
			"40",
			"00",
			"(?:[236-8]\\d|90)\\d{7}|[23]\\d{5}",
			[6, 9],
			[
				[
					"(\\d{3})(\\d{3})",
					"$1 $2",
					["2[3-6]", "2[3-6]\\d9"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})",
					"$1 $2",
					["219|31"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[23]1"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[236-9]"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			" int "
		],
		RS: [
			"381",
			"00",
			"38[02-9]\\d{6,9}|6\\d{7,9}|90\\d{4,8}|38\\d{5,6}|(?:7\\d\\d|800)\\d{3,9}|(?:[12]\\d|3[0-79])\\d{5,10}",
			[
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			[[
				"(\\d{3})(\\d{3,9})",
				"$1 $2",
				["(?:2[389]|39)0|[7-9]"],
				"0$1"
			], [
				"(\\d{2})(\\d{5,10})",
				"$1 $2",
				["[1-36]"],
				"0$1"
			]],
			"0"
		],
		RU: [
			"7",
			"810",
			"8\\d{13}|[347-9]\\d{9}",
			[10, 14],
			[
				[
					"(\\d{4})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					[
						"7(?:1[0-8]|2[1-9])",
						"7(?:1(?:[0-356]2|4[29]|7|8[27])|2(?:1[23]|[2-9]2))",
						"7(?:1(?:[0-356]2|4[29]|7|8[27])|2(?:13[03-69]|62[013-9]))|72[1-57-9]2"
					],
					"8 ($1)",
					1
				],
				[
					"(\\d{5})(\\d)(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					[
						"7(?:1[0-68]|2[1-9])",
						"7(?:1(?:[06][3-6]|[18]|2[35]|[3-5][3-5])|2(?:[13][3-5]|[24-689]|7[457]))",
						"7(?:1(?:0(?:[356]|4[023])|[18]|2(?:3[013-9]|5)|3[45]|43[013-79]|5(?:3[1-8]|4[1-7]|5)|6(?:3[0-35-9]|[4-6]))|2(?:1(?:3[178]|[45])|[24-689]|3[35]|7[457]))|7(?:14|23)4[0-8]|71(?:33|45)[1-79]"
					],
					"8 ($1)",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["7"],
					"8 ($1)",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2-$3-$4",
					["[349]|8(?:[02-7]|1[1-8])"],
					"8 ($1)",
					1
				],
				[
					"(\\d{4})(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["8"],
					"8 ($1)"
				]
			],
			"8",
			0,
			0,
			0,
			0,
			"[3489]",
			0,
			"8~10"
		],
		RW: [
			"250",
			"00",
			"(?:06|[27]\\d\\d|[89]00)\\d{6}",
			[8, 9],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["0"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["2"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[7-9]"],
					"0$1"
				]
			],
			"0"
		],
		SA: [
			"966",
			"00",
			"(?:[15]\\d|800|92)\\d{7}",
			[9, 10],
			[
				[
					"(\\d{4})(\\d{5})",
					"$1 $2",
					["9"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["5"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"]
				]
			],
			"0"
		],
		SB: [
			"677",
			"0[01]",
			"[6-9]\\d{6}|[1-6]\\d{4}",
			[5, 7],
			[[
				"(\\d{2})(\\d{5})",
				"$1 $2",
				["6[89]|7|8[4-9]|9(?:[0-8]|9[0-8])"]
			]]
		],
		SC: [
			"248",
			"010|0[0-2]",
			"(?:[2489]\\d|64)\\d{5}",
			[7],
			[[
				"(\\d)(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[246]|9[57]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		SD: [
			"249",
			"00",
			"[19]\\d{8}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{4})",
				"$1 $2 $3",
				["[19]"],
				"0$1"
			]],
			"0"
		],
		SE: [
			"46",
			"00",
			"(?:[26]\\d\\d|9)\\d{9}|[1-9]\\d{8}|[1-689]\\d{7}|[1-4689]\\d{6}|2\\d{5}",
			[
				6,
				7,
				8,
				9,
				10,
				12
			],
			[
				[
					"(\\d{2})(\\d{2,3})(\\d{2})",
					"$1-$2 $3",
					["20"],
					"0$1",
					0,
					"$1 $2 $3"
				],
				[
					"(\\d{3})(\\d{4})",
					"$1-$2",
					["9(?:00|39|44|9)"],
					"0$1",
					0,
					"$1 $2"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})",
					"$1-$2 $3",
					["[12][136]|3[356]|4[0246]|6[03]|90[1-9]"],
					"0$1",
					0,
					"$1 $2 $3"
				],
				[
					"(\\d)(\\d{2,3})(\\d{2})(\\d{2})",
					"$1-$2 $3 $4",
					["8"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d{3})(\\d{2,3})(\\d{2})",
					"$1-$2 $3",
					["1[2457]|2(?:[247-9]|5[0138])|3[0247-9]|4[1357-9]|5[0-35-9]|6(?:[125689]|4[02-57]|7[0-2])|9(?:[125-8]|3[02-5]|4[0-3])"],
					"0$1",
					0,
					"$1 $2 $3"
				],
				[
					"(\\d{3})(\\d{2,3})(\\d{3})",
					"$1-$2 $3",
					["9(?:00|39|44)"],
					"0$1",
					0,
					"$1 $2 $3"
				],
				[
					"(\\d{2})(\\d{2,3})(\\d{2})(\\d{2})",
					"$1-$2 $3 $4",
					["1[13689]|2[0136]|3[1356]|4[0246]|54|6[03]|90[1-9]"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1-$2 $3 $4",
					["10|7"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d)(\\d{3})(\\d{3})(\\d{2})",
					"$1-$2 $3 $4",
					["8"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
					"$1-$2 $3 $4",
					["[13-5]|2(?:[247-9]|5[0138])|6(?:[124-689]|7[0-2])|9(?:[125-8]|3[02-5]|4[0-3])"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d{3})(\\d{2})(\\d{2})(\\d{3})",
					"$1-$2 $3 $4",
					["9"],
					"0$1",
					0,
					"$1 $2 $3 $4"
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1-$2 $3 $4 $5",
					["[26]"],
					"0$1",
					0,
					"$1 $2 $3 $4 $5"
				]
			],
			"0"
		],
		SG: [
			"65",
			"0[0-3]\\d",
			"(?:(?:1\\d|8)\\d\\d|7000)\\d{7}|[3689]\\d{7}",
			[
				8,
				10,
				11
			],
			[
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[369]|8(?:0[1-9]|[1-9])"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"]
				],
				[
					"(\\d{4})(\\d{4})(\\d{3})",
					"$1 $2 $3",
					["7"]
				],
				[
					"(\\d{4})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["1"]
				]
			]
		],
		SH: [
			"290",
			"00",
			"(?:[256]\\d|8)\\d{3}",
			[4, 5],
			0,
			0,
			0,
			0,
			0,
			0,
			"[256]"
		],
		SI: [
			"386",
			"00|10(?:22|66|88|99)",
			"[1-7]\\d{7}|8\\d{4,7}|90\\d{4,6}",
			[
				5,
				6,
				7,
				8
			],
			[
				[
					"(\\d{2})(\\d{3,6})",
					"$1 $2",
					["8[09]|9"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["59|8"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[37][01]|4[013]|51|6"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[1-57]"],
					"(0$1)"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		SJ: [
			"47",
			"00",
			"0\\d{4}|(?:[489]\\d|79)\\d{6}",
			[5, 8],
			0,
			0,
			0,
			0,
			0,
			0,
			"79"
		],
		SK: [
			"421",
			"00",
			"[2-689]\\d{8}|[2-59]\\d{6}|[2-5]\\d{5}",
			[
				6,
				7,
				9
			],
			[
				[
					"(\\d)(\\d{2})(\\d{3,4})",
					"$1 $2 $3",
					["21"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{2,3})",
					"$1 $2 $3",
					["[3-5][1-8]1", "[3-5][1-8]1[67]"],
					"0$1"
				],
				[
					"(\\d)(\\d{3})(\\d{3})(\\d{2})",
					"$1 $2 $3 $4",
					["2"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[689]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[3-5]"],
					"0$1"
				]
			],
			"0"
		],
		SL: [
			"232",
			"00",
			"(?:[237-9]\\d|66)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{6})",
				"$1 $2",
				["[236-9]"],
				"(0$1)"
			]],
			"0"
		],
		SM: [
			"378",
			"00",
			"(?:0549|[5-7]\\d)\\d{6}",
			[8, 10],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[5-7]"]
			], [
				"(\\d{4})(\\d{6})",
				"$1 $2",
				["0"]
			]],
			0,
			0,
			"([89]\\d{5})$",
			"0549$1"
		],
		SN: [
			"221",
			"00",
			"(?:[378]\\d|93)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"]
			], [
				"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[379]"]
			]]
		],
		SO: [
			"252",
			"00",
			"[346-9]\\d{8}|[12679]\\d{7}|[1-5]\\d{6}|[1348]\\d{5}",
			[
				6,
				7,
				8,
				9
			],
			[
				[
					"(\\d{2})(\\d{4})",
					"$1 $2",
					["8[125]"]
				],
				[
					"(\\d{6})",
					"$1",
					["[134]"]
				],
				[
					"(\\d)(\\d{6})",
					"$1 $2",
					["[15]|2[0-79]|3[0-46-8]|4[0-7]"]
				],
				[
					"(\\d{2})(\\d{5,7})",
					"$1 $2",
					["1|28|9[2-9]"]
				],
				[
					"(\\d)(\\d{7})",
					"$1 $2",
					["[267]|904"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[346-9]"]
				]
			],
			"0"
		],
		SR: [
			"597",
			"00",
			"(?:[2-5]|[6-9]\\d)\\d{5}",
			[6, 7],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})",
					"$1-$2-$3",
					["56"]
				],
				[
					"(\\d{3})(\\d{3})",
					"$1-$2",
					["[2-5]"]
				],
				[
					"(\\d{3})(\\d{4})",
					"$1-$2",
					["[6-9]"]
				]
			]
		],
		SS: [
			"211",
			"00",
			"[19]\\d{8}",
			[9],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[19]"],
				"0$1"
			]],
			"0"
		],
		ST: [
			"239",
			"00",
			"(?:22|9\\d)\\d{5}",
			[7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[29]"]
			]]
		],
		SV: [
			"503",
			"00",
			"[25-7]\\d{7}|(?:80\\d|900)\\d{4}(?:\\d{4})?",
			[
				7,
				8,
				11
			],
			[
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[89]"]
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[25-7]"]
				],
				[
					"(\\d{3})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["[89]"]
				]
			]
		],
		SX: [
			"1",
			"011",
			"7215\\d{6}|(?:[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"(5\\d{6})$|1",
			"721$1",
			0,
			"721"
		],
		SY: [
			"963",
			"00",
			"[1-359]\\d{8}|[1-5]\\d{7}",
			[8, 9],
			[[
				"(\\d{2})(\\d{3})(\\d{3,4})",
				"$1 $2 $3",
				["[1-4]|5[1-3]"],
				"0$1",
				1
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[59]"],
				"0$1",
				1
			]],
			"0"
		],
		SZ: [
			"268",
			"00",
			"0800\\d{4}|(?:[237]\\d|900)\\d{6}",
			[8, 9],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[0237]"]
			], [
				"(\\d{5})(\\d{4})",
				"$1 $2",
				["9"]
			]]
		],
		TA: [
			"290",
			"00",
			"8\\d{3}",
			[4],
			0,
			0,
			0,
			0,
			0,
			0,
			"8"
		],
		TC: [
			"1",
			"011",
			"(?:[58]\\d\\d|649|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-479]\\d{6})$|1",
			"649$1",
			0,
			"649"
		],
		TD: [
			"235",
			"00|16",
			"(?:22|[3689]\\d|77)\\d{6}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[236-9]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"00"
		],
		TG: [
			"228",
			"00",
			"[279]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[279]"]
			]]
		],
		TH: [
			"66",
			"00[1-9]",
			"(?:001800|[2-57]|[689]\\d)\\d{7}|1\\d{7,9}",
			[
				8,
				9,
				10,
				13
			],
			[
				[
					"(\\d)(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["2"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[13-9]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["1"]
				]
			],
			"0"
		],
		TJ: [
			"992",
			"810",
			"(?:[0-57-9]\\d|66)\\d{7}",
			[9],
			[
				[
					"(\\d{6})(\\d)(\\d{2})",
					"$1 $2 $3",
					["331", "3317"]
				],
				[
					"(\\d{3})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["44[02-479]|[34]7"]
				],
				[
					"(\\d{4})(\\d)(\\d{4})",
					"$1 $2 $3",
					["3(?:[1245]|3[12])"]
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["\\d"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"8~10"
		],
		TK: [
			"690",
			"00",
			"[2-47]\\d{3,6}",
			[
				4,
				5,
				6,
				7
			]
		],
		TL: [
			"670",
			"00",
			"7\\d{7}|(?:[2-47]\\d|[89]0)\\d{5}",
			[7, 8],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[2-489]|70"]
			], [
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["7"]
			]]
		],
		TM: [
			"993",
			"810",
			"[1-7]\\d{7}",
			[8],
			[
				[
					"(\\d{2})(\\d{2})(\\d{2})(\\d{2})",
					"$1 $2-$3-$4",
					["12"],
					"(8 $1)"
				],
				[
					"(\\d{3})(\\d)(\\d{2})(\\d{2})",
					"$1 $2-$3-$4",
					["[1-5]"],
					"(8 $1)"
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["[67]"],
					"8 $1"
				]
			],
			"8",
			0,
			0,
			0,
			0,
			0,
			0,
			"8~10"
		],
		TN: [
			"216",
			"00",
			"[2-57-9]\\d{7}",
			[8],
			[[
				"(\\d{2})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[2-57-9]"]
			]]
		],
		TO: [
			"676",
			"00",
			"(?:0800|(?:[5-8]\\d\\d|999)\\d)\\d{3}|[2-8]\\d{4}",
			[5, 7],
			[
				[
					"(\\d{2})(\\d{3})",
					"$1-$2",
					["[2-4]|50|6[09]|7[0-24-69]|8[05]"]
				],
				[
					"(\\d{4})(\\d{3})",
					"$1 $2",
					["0"]
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[5-9]"]
				]
			]
		],
		TR: [
			"90",
			"00",
			"4\\d{6}|8\\d{11,12}|(?:[2-58]\\d\\d|900)\\d{7}",
			[
				7,
				10,
				12,
				13
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["512|8[01589]|90"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["5"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["[24][1-8]|3[1-9]"],
					"(0$1)",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{6,7})",
					"$1 $2 $3",
					["80"],
					"0$1",
					1
				]
			],
			"0"
		],
		TT: [
			"1",
			"011",
			"(?:[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-46-8]\\d{6})$|1",
			"868$1",
			0,
			"868"
		],
		TV: [
			"688",
			"00",
			"(?:2|7\\d\\d|90)\\d{4}",
			[
				5,
				6,
				7
			],
			[
				[
					"(\\d{2})(\\d{3})",
					"$1 $2",
					["2"]
				],
				[
					"(\\d{2})(\\d{4})",
					"$1 $2",
					["90"]
				],
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["7"]
				]
			]
		],
		TW: [
			"886",
			"0(?:0[25-79]|19)",
			"[2-689]\\d{8}|7\\d{9,10}|[2-8]\\d{7}|2\\d{6}",
			[
				7,
				8,
				9,
				10,
				11
			],
			[
				[
					"(\\d{2})(\\d)(\\d{4})",
					"$1 $2 $3",
					["202"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["826"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{2})(\\d{3})",
					"$1 $2 $3",
					["83"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["82"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[25]0|37|49|8[09]"],
					"0$1"
				],
				[
					"(\\d)(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["[23568]|4(?:0[02-48]|[1-478])|7[1-9]", "[23568]|4(?:0[2-48]|[1-478])|(?:400|7)[1-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[49]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{4})(\\d{4,5})",
					"$1 $2 $3",
					["7"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			"#"
		],
		TZ: [
			"255",
			"00[056]",
			"(?:[25-8]\\d|41|90)\\d{7}",
			[9],
			[
				[
					"(\\d{3})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[24]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1 $2",
					["5"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[67]"],
					"0$1"
				]
			],
			"0"
		],
		UA: [
			"380",
			"00",
			"[89]\\d{9}|[3-9]\\d{8}",
			[9, 10],
			[
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["6[12][29]|(?:3[1-8]|4[136-8]|5[12457]|6[49])2|(?:56|65)[24]", "6[12][29]|(?:35|4[1378]|5[12457]|6[49])2|(?:56|65)[24]|(?:3[1-46-8]|46)2[013-9]"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{5})",
					"$1 $2",
					["3[1-8]|4(?:[1367]|[45][6-9]|8[4-6])|5(?:[1-5]|6[0135689]|7[4-6])|6(?:[12][3-7]|[459])", "3[1-8]|4(?:[1367]|[45][6-9]|8[4-6])|5(?:[1-5]|6(?:[015689]|3[02389])|7[4-6])|6(?:[12][3-7]|[459])"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[3-7]|89|9[1-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["[89]"],
					"0$1"
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			"0~0"
		],
		UG: [
			"256",
			"00[057]",
			"800\\d{6}|(?:[29]0|[347]\\d)\\d{7}",
			[9],
			[
				[
					"(\\d{4})(\\d{5})",
					"$1 $2",
					[
						"202",
						"2024",
						"20240"
					],
					"0$1"
				],
				[
					"(\\d{3})(\\d{6})",
					"$1 $2",
					["20[0-35-7]|4(?:6[45]|[7-9])|[7-9]", "20(?:[0135-7]|2[5-9])|4(?:6[45]|[7-9])|[7-9]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1 $2",
					["[2-4]"],
					"0$1"
				]
			],
			"0"
		],
		US: [
			"1",
			"011",
			"[2-9]\\d{9}|3\\d{6}",
			[10],
			[[
				"(\\d{3})(\\d{4})",
				"$1-$2",
				["310"],
				0,
				1
			], [
				"(\\d{3})(\\d{3})(\\d{4})",
				"($1) $2-$3",
				["[2-9]"],
				0,
				1,
				"$1-$2-$3"
			]],
			"1",
			0,
			0,
			0,
			0,
			0,
			[
				["983[2-57-9]\\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[02469]|8[13])|3(?:0[1-57-9]|1[02-9]|2[013-79]|3[0-24679]|4[167]|5[0-3]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[02589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-269])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-2478]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\\d{6}"],
				[""],
				["8(?:00|33|44|55|66|77|88)[2-9]\\d{6}"],
				["900[2-9]\\d{6}"],
				["52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|5(?:00|2[125-9]|3[23]|44|66|77|88)[2-9]\\d{6}"]
			]
		],
		UY: [
			"598",
			"0(?:0|1[3-9]\\d)",
			"0004\\d{2,9}|[1249]\\d{7}|2\\d{3,4}|(?:[49]\\d|80)\\d{5}",
			[
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13
			],
			[
				[
					"(\\d{4,5})",
					"$1",
					["21"]
				],
				[
					"(\\d{3})(\\d{3,4})",
					"$1 $2",
					["0"]
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["[49]0|8"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["9"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{4})",
					"$1 $2",
					["[124]"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{2,4})",
					"$1 $2 $3",
					["0"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})(\\d{2,4})",
					"$1 $2 $3 $4",
					["0"]
				]
			],
			"0",
			0,
			0,
			0,
			0,
			0,
			0,
			"00",
			" int. "
		],
		UZ: [
			"998",
			"00",
			"(?:20|33|[5-9]\\d)\\d{7}",
			[9],
			[[
				"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["[235-9]"]
			]]
		],
		VA: [
			"39",
			"00",
			"0\\d{5,10}|3[0-8]\\d{7,10}|55\\d{8}|8\\d{5}(?:\\d{2,4})?|(?:1\\d|39)\\d{7,8}",
			[
				6,
				7,
				8,
				9,
				10,
				11,
				12
			],
			0,
			0,
			0,
			0,
			0,
			0,
			"06698"
		],
		VC: [
			"1",
			"011",
			"(?:[58]\\d\\d|784|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-7]\\d{6})$|1",
			"784$1",
			0,
			"784"
		],
		VE: [
			"58",
			"00",
			"[68]00\\d{7}|(?:[24]\\d|[59]0)\\d{8}",
			[10],
			[[
				"(\\d{3})(\\d{7})",
				"$1-$2",
				["[24-689]"],
				"0$1"
			]],
			"0"
		],
		VG: [
			"1",
			"011",
			"(?:284|[58]\\d\\d|900)\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-578]\\d{6})$|1",
			"284$1",
			0,
			"284"
		],
		VI: [
			"1",
			"011",
			"[58]\\d{9}|(?:34|90)0\\d{7}",
			[10],
			0,
			"1",
			0,
			"([2-9]\\d{6})$|1",
			"340$1",
			0,
			"340"
		],
		VN: [
			"84",
			"00",
			"[12]\\d{9}|[135-9]\\d{8}|[16]\\d{6,7}|7\\d{6}",
			[
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{4})(\\d{4,6})",
					"$1 $2",
					["1(?:2[02]|[89])"],
					0,
					1
				],
				[
					"(\\d{2})(\\d{3})(\\d{2})(\\d{2})",
					"$1 $2 $3 $4",
					["1[26]|6"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[1357-9]"],
					"0$1",
					1
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["2[48]"],
					"0$1",
					1
				],
				[
					"(\\d{3})(\\d{4})(\\d{3})",
					"$1 $2 $3",
					["2"],
					"0$1",
					1
				]
			],
			"0"
		],
		VU: [
			"678",
			"00",
			"[57-9]\\d{6}|(?:[238]\\d|48)\\d{3}",
			[5, 7],
			[[
				"(\\d{3})(\\d{4})",
				"$1 $2",
				["[57-9]"]
			]]
		],
		WF: [
			"681",
			"00",
			"(?:40|72|8\\d{4})\\d{4}|[89]\\d{5}",
			[6, 9],
			[[
				"(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3",
				["[47-9]"]
			], [
				"(\\d{3})(\\d{2})(\\d{2})(\\d{2})",
				"$1 $2 $3 $4",
				["8"]
			]]
		],
		WS: [
			"685",
			"0",
			"(?:[2-6]|8\\d{5})\\d{4}|[78]\\d{6}|[68]\\d{5}",
			[
				5,
				6,
				7,
				10
			],
			[
				[
					"(\\d{5})",
					"$1",
					["[2-5]|6[1-9]"]
				],
				[
					"(\\d{3})(\\d{3,7})",
					"$1 $2",
					["[68]"]
				],
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["7"]
				]
			]
		],
		XK: [
			"383",
			"00",
			"2\\d{7,8}|3\\d{7,11}|(?:4\\d\\d|[89]00)\\d{5}",
			[
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{3})(\\d{5})",
					"$1 $2",
					["[89]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["[2-4]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["2|39"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7,10})",
					"$1 $2",
					["3"],
					"0$1"
				]
			],
			"0"
		],
		YE: [
			"967",
			"00",
			"(?:1|7\\d)\\d{7}|[1-7]\\d{6}",
			[
				7,
				8,
				9
			],
			[[
				"(\\d)(\\d{3})(\\d{3,4})",
				"$1 $2 $3",
				["[1-6]|7(?:[24-6]|8[0-7])"],
				"0$1"
			], [
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["7"],
				"0$1"
			]],
			"0"
		],
		YT: [
			"262",
			"00",
			"(?:639\\d|7093)\\d{5}|(?:26|80|9\\d)\\d{7}",
			[9],
			0,
			"0",
			0,
			0,
			0,
			0,
			0,
			[
				["26(?:89\\d|9(?:0[0-467]|15|5[0-4]|6\\d|[78]0))\\d{4}"],
				["(?:639(?:0[0-79]|1[019]|[267]\\d|3[09]|40|5[05-9]|9[04-79])|7093[5-7])\\d{4}"],
				["80\\d{7}"],
				0,
				0,
				0,
				0,
				0,
				["9(?:(?:39|47)8[01]|769\\d)\\d{4}"]
			]
		],
		ZA: [
			"27",
			"00",
			"[1-79]\\d{8}|8\\d{4,9}",
			[
				5,
				6,
				7,
				8,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{3,4})",
					"$1 $2",
					["8[1-4]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{2,3})",
					"$1 $2 $3",
					["8[1-4]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["860"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["[1-9]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["8"],
					"0$1"
				]
			],
			"0"
		],
		ZM: [
			"260",
			"00",
			"800\\d{6}|(?:21|[579]\\d|63)\\d{7}",
			[9],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[28]"],
				"0$1"
			], [
				"(\\d{2})(\\d{7})",
				"$1 $2",
				["[579]"],
				"0$1"
			]],
			"0"
		],
		ZW: [
			"263",
			"00",
			"(?:13|8\\d{4})\\d{5}|[235-8]\\d{8}|[23568]\\d{6}",
			[
				7,
				9,
				10
			],
			[
				[
					"(\\d{2})(\\d{3,5})",
					"$1 $2",
					["1|2(?:0[0-36-9]|29|58)|67[0-46-9]|(?:55|68)[0-69]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3,5})",
					"$1 $2",
					["2(?:0[45]|[27]|48)|37|675|(?:55|68)[78]"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{4})",
					"$1 $2",
					["80"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{3,5})",
					"$1 $2",
					["548"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["29[013-9]"],
					"0$1"
				],
				[
					"(\\d{2})(\\d{7})",
					"$1 $2",
					["[256]|39|8[13-59]"],
					"(0$1)"
				],
				[
					"(\\d{2})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["7"],
					"0$1"
				],
				[
					"(\\d{3})(\\d{3})(\\d{3,4})",
					"$1 $2 $3",
					["3"],
					"0$1"
				],
				[
					"(\\d{4})(\\d{6})",
					"$1 $2",
					["8"],
					"0$1"
				]
			],
			"0"
		]
	},
	nonGeographic: {
		800: [
			"800",
			0,
			"(?:00|[1-9]\\d)\\d{6}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["\\d"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				["(?:00|[1-9]\\d)\\d{6}"]
			]
		],
		808: [
			"808",
			0,
			"[1-9]\\d{7}",
			[8],
			[[
				"(\\d{4})(\\d{4})",
				"$1 $2",
				["[1-9]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				["[1-9]\\d{7}"]
			]
		],
		870: [
			"870",
			0,
			"7\\d{11}|[235-7]\\d{8}",
			[9, 12],
			[[
				"(\\d{3})(\\d{3})(\\d{3})",
				"$1 $2 $3",
				["[235-7]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				["(?:[356]|774[45])\\d{8}|7[6-8]\\d{7}"],
				0,
				0,
				0,
				0,
				0,
				0,
				["2\\d{8}", [9]]
			]
		],
		878: [
			"878",
			0,
			"10\\d{10}",
			[12],
			[[
				"(\\d{2})(\\d{5})(\\d{5})",
				"$1 $2 $3",
				["1"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				["10\\d{10}"]
			]
		],
		881: [
			"881",
			0,
			"6\\d{9}|[0-36-9]\\d{8}",
			[9, 10],
			[[
				"(\\d)(\\d{3})(\\d{5})",
				"$1 $2 $3",
				["[0-37-9]"]
			], [
				"(\\d)(\\d{3})(\\d{5,6})",
				"$1 $2 $3",
				["6"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[0, ["6\\d{9}|[0-36-9]\\d{8}"]]
		],
		882: [
			"882",
			0,
			"[13]\\d{6}(?:\\d{2,5})?|[19]\\d{7}|(?:[25]\\d\\d|4)\\d{7}(?:\\d{2})?",
			[
				7,
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{2})(\\d{5})",
					"$1 $2",
					["16|342"]
				],
				[
					"(\\d{2})(\\d{6})",
					"$1 $2",
					["49"]
				],
				[
					"(\\d{2})(\\d{2})(\\d{4})",
					"$1 $2 $3",
					["1[36]|9"]
				],
				[
					"(\\d{2})(\\d{4})(\\d{3})",
					"$1 $2 $3",
					["3[23]"]
				],
				[
					"(\\d{2})(\\d{3,4})(\\d{4})",
					"$1 $2 $3",
					["16"]
				],
				[
					"(\\d{2})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["10|23|3(?:[15]|4[57])|4|5[12]"]
				],
				[
					"(\\d{3})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["34"]
				],
				[
					"(\\d{2})(\\d{4,5})(\\d{5})",
					"$1 $2 $3",
					["[1-35]"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				["342\\d{4}|(?:337|49)\\d{6}|(?:3(?:2|47|7\\d{3})|5(?:0\\d{3}|2[0-2]))\\d{7}", [
					7,
					8,
					9,
					10,
					12
				]],
				0,
				0,
				0,
				["348[57]\\d{7}", [11]],
				0,
				0,
				["1(?:3(?:0[0347]|[13][0139]|2[035]|4[013568]|6[0459]|7[06]|8[15-8]|9[0689])\\d{4}|6\\d{5,10})|(?:345\\d|9[89])\\d{6}|(?:10|2(?:3|85\\d)|3(?:[15]|[69]\\d\\d)|4[15-8]|51)\\d{8}"]
			]
		],
		883: [
			"883",
			0,
			"(?:[1-4]\\d|51)\\d{6,10}",
			[
				8,
				9,
				10,
				11,
				12
			],
			[
				[
					"(\\d{3})(\\d{3})(\\d{2,8})",
					"$1 $2 $3",
					["[14]|2[24-689]|3[02-689]|51[24-9]"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3",
					["510"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{4})",
					"$1 $2 $3",
					["21"]
				],
				[
					"(\\d{4})(\\d{4})(\\d{4})",
					"$1 $2 $3",
					["51[13]"]
				],
				[
					"(\\d{3})(\\d{3})(\\d{3})(\\d{3})",
					"$1 $2 $3 $4",
					["[235]"]
				]
			],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				["(?:2(?:00\\d\\d|10)|(?:370[1-9]|51\\d0)\\d)\\d{7}|51(?:00\\d{5}|[24-9]0\\d{4,7})|(?:1[0-79]|2[24-689]|3[02-689]|4[0-4])0\\d{5,9}"]
			]
		],
		888: [
			"888",
			0,
			"\\d{11}",
			[11],
			[["(\\d{3})(\\d{3})(\\d{5})", "$1 $2 $3"]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				0,
				0,
				0,
				0,
				["\\d{11}"]
			]
		],
		979: [
			"979",
			0,
			"[1359]\\d{8}",
			[9],
			[[
				"(\\d)(\\d{4})(\\d{4})",
				"$1 $2 $3",
				["[1359]"]
			]],
			0,
			0,
			0,
			0,
			0,
			0,
			[
				0,
				0,
				0,
				["[1359]\\d{8}"]
			]
		]
	}
};
//#endregion
//#region node_modules/libphonenumber-js/min/exports/withMetadataArgument.js
function Ze(e, t) {
	var n = Array.prototype.slice.call(t);
	return n.push(Xe), e.apply(this, n);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/tools/semver-compare.js
function Qe(e, t) {
	e = e.split("-"), t = t.split("-");
	for (var n = e[0].split("."), r = t[0].split("."), i = 0; i < 3; i++) {
		var a = Number(n[i]), o = Number(r[i]);
		if (a > o) return 1;
		if (o > a) return -1;
		if (!isNaN(a) && isNaN(o)) return 1;
		if (isNaN(a) && !isNaN(o)) return -1;
	}
	return e[1] && t[1] ? e[1] > t[1] ? 1 : e[1] < t[1] ? -1 : 0 : !e[1] && t[1] ? 1 : e[1] && !t[1] ? -1 : 0;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isObject.js
var $e = {}.constructor;
function et(e) {
	return e != null && e.constructor === $e;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isCallingCode.js
var tt = /^\d+$/;
function nt(e) {
	return tt.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/metadata.js
function W(e) {
	"@babel/helpers - typeof";
	return W = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, W(e);
}
function rt(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function it(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, ot(r.key), r);
	}
}
function at(e, t, n) {
	return t && it(e.prototype, t), n && it(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function ot(e) {
	var t = st(e, "string");
	return W(t) == "symbol" ? t : t + "";
}
function st(e, t) {
	if (W(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (W(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var ct = "1.2.0", lt = "1.7.35", ut = " ext. ", G = /*#__PURE__*/ function() {
	function e(t) {
		rt(this, e), gt(t), this.metadata = t, bt.call(this, t);
	}
	return at(e, [
		{
			key: "getCountries",
			value: function() {
				return Object.keys(this.metadata.countries).filter(function(e) {
					return e !== "001";
				});
			}
		},
		{
			key: "getCountryMetadata",
			value: function(e) {
				return this.metadata.countries[e];
			}
		},
		{
			key: "nonGeographic",
			value: function() {
				if (!(this.v1 || this.v2 || this.v3)) return this.metadata.nonGeographic || this.metadata.nonGeographical;
			}
		},
		{
			key: "hasCountry",
			value: function(e) {
				return this.getCountryMetadata(e) !== void 0;
			}
		},
		{
			key: "hasCallingCode",
			value: function(e) {
				if (this.getCountryCodesForCallingCode(e)) return !0;
				if (this.nonGeographic()) {
					if (this.nonGeographic()[e]) return !0;
				} else {
					var t = this.countryCallingCodes()[e];
					if (t && t.length === 1 && t[0] === "001") return !0;
				}
			}
		},
		{
			key: "isNonGeographicCallingCode",
			value: function(e) {
				return this.nonGeographic() ? !!this.nonGeographic()[e] : !this.getCountryCodesForCallingCode(e);
			}
		},
		{
			key: "country",
			value: function(e) {
				return this.selectNumberingPlan(e);
			}
		},
		{
			key: "selectNumberingPlan",
			value: function(e, t) {
				var n, r;
				if (e && (nt(e) ? r = e : n = e), t && (r = t), n && n !== "001") {
					var i = this.getCountryMetadata(n);
					if (!i) throw Error(`Unknown country: ${n}`);
					this.numberingPlan = new dt(i, this);
				} else if (r) {
					if (!this.hasCallingCode(r)) throw Error(`Unknown calling code: ${r}`);
					this.numberingPlan = new dt(this.getNumberingPlanMetadata(r), this);
				} else this.numberingPlan = void 0;
				return this;
			}
		},
		{
			key: "getCountryCodesForCallingCode",
			value: function(e) {
				var t = this.countryCallingCodes()[e];
				if (t) return t.length === 1 && t[0].length === 3 ? void 0 : t;
			}
		},
		{
			key: "getCountryCodeForCallingCode",
			value: function(e) {
				var t = this.getCountryCodesForCallingCode(e);
				if (t) return t[0];
			}
		},
		{
			key: "getNumberingPlanMetadata",
			value: function(e) {
				var t = this.getCountryCodeForCallingCode(e);
				if (t) return this.getCountryMetadata(t);
				if (this.nonGeographic()) {
					var n = this.nonGeographic()[e];
					if (n) return n;
				} else {
					var r = this.countryCallingCodes()[e];
					if (r && r.length === 1 && r[0] === "001") return this.metadata.countries["001"];
				}
			}
		},
		{
			key: "countryCallingCode",
			value: function() {
				return this.numberingPlan.callingCode();
			}
		},
		{
			key: "IDDPrefix",
			value: function() {
				return this.numberingPlan.IDDPrefix();
			}
		},
		{
			key: "defaultIDDPrefix",
			value: function() {
				return this.numberingPlan.defaultIDDPrefix();
			}
		},
		{
			key: "nationalNumberPattern",
			value: function() {
				return this.numberingPlan.nationalNumberPattern();
			}
		},
		{
			key: "possibleLengths",
			value: function() {
				return this.numberingPlan.possibleLengths();
			}
		},
		{
			key: "formats",
			value: function() {
				return this.numberingPlan.formats();
			}
		},
		{
			key: "nationalPrefixForParsing",
			value: function() {
				return this.numberingPlan.nationalPrefixForParsing();
			}
		},
		{
			key: "nationalPrefixTransformRule",
			value: function() {
				return this.numberingPlan.nationalPrefixTransformRule();
			}
		},
		{
			key: "leadingDigits",
			value: function() {
				return this.numberingPlan.leadingDigits();
			}
		},
		{
			key: "hasTypes",
			value: function() {
				return this.numberingPlan.hasTypes();
			}
		},
		{
			key: "type",
			value: function(e) {
				return this.numberingPlan.type(e);
			}
		},
		{
			key: "ext",
			value: function() {
				return this.numberingPlan.ext();
			}
		},
		{
			key: "countryCallingCodes",
			value: function() {
				return this.v1 ? this.metadata.country_phone_code_to_countries : this.metadata.country_calling_codes;
			}
		},
		{
			key: "chooseCountryByCountryCallingCode",
			value: function(e) {
				return this.selectNumberingPlan(e);
			}
		},
		{
			key: "hasSelectedNumberingPlan",
			value: function() {
				return this.numberingPlan !== void 0;
			}
		}
	]);
}(), dt = /*#__PURE__*/ function() {
	function e(t, n) {
		rt(this, e), this.globalMetadataObject = n, this.metadata = t, bt.call(this, n.metadata);
	}
	return at(e, [
		{
			key: "callingCode",
			value: function() {
				return this.metadata[0];
			}
		},
		{
			key: "_getDefaultCountryMetadataForThisCallingCode",
			value: function() {
				return this.globalMetadataObject.getNumberingPlanMetadata(this.callingCode());
			}
		},
		{
			key: "getDefaultCountryMetadataForRegion",
			value: function() {
				return this._getDefaultCountryMetadataForThisCallingCode();
			}
		},
		{
			key: "IDDPrefix",
			value: function() {
				if (!(this.v1 || this.v2)) return this.metadata[1];
			}
		},
		{
			key: "defaultIDDPrefix",
			value: function() {
				if (!(this.v1 || this.v2)) return this.metadata[12];
			}
		},
		{
			key: "nationalNumberPattern",
			value: function() {
				return this.v1 || this.v2 ? this.metadata[1] : this.metadata[2];
			}
		},
		{
			key: "possibleLengths",
			value: function() {
				if (!this.v1) return this.metadata[this.v2 ? 2 : 3];
			}
		},
		{
			key: "_getFormats",
			value: function(e) {
				return e[this.v1 ? 2 : this.v2 ? 3 : 4];
			}
		},
		{
			key: "formats",
			value: function() {
				var e = this;
				return (this._getFormats(this.metadata) || this._getFormats(this._getDefaultCountryMetadataForThisCallingCode()) || []).map(function(t) {
					return new ft(t, e);
				});
			}
		},
		{
			key: "nationalPrefix",
			value: function() {
				return this.metadata[this.v1 ? 3 : this.v2 ? 4 : 5];
			}
		},
		{
			key: "_getNationalPrefixFormattingRule",
			value: function(e) {
				return e[this.v1 ? 4 : this.v2 ? 5 : 6];
			}
		},
		{
			key: "nationalPrefixFormattingRule",
			value: function() {
				return this._getNationalPrefixFormattingRule(this.metadata) || this._getNationalPrefixFormattingRule(this._getDefaultCountryMetadataForThisCallingCode());
			}
		},
		{
			key: "_nationalPrefixForParsing",
			value: function() {
				return this.metadata[this.v1 ? 5 : this.v2 ? 6 : 7];
			}
		},
		{
			key: "nationalPrefixForParsing",
			value: function() {
				return this._nationalPrefixForParsing() || this.nationalPrefix();
			}
		},
		{
			key: "nationalPrefixTransformRule",
			value: function() {
				return this.metadata[this.v1 ? 6 : this.v2 ? 7 : 8];
			}
		},
		{
			key: "_getNationalPrefixIsOptionalWhenFormatting",
			value: function() {
				return !!this.metadata[this.v1 ? 7 : this.v2 ? 8 : 9];
			}
		},
		{
			key: "nationalPrefixIsOptionalWhenFormattingInNationalFormat",
			value: function() {
				return this._getNationalPrefixIsOptionalWhenFormatting(this.metadata) || this._getNationalPrefixIsOptionalWhenFormatting(this._getDefaultCountryMetadataForThisCallingCode());
			}
		},
		{
			key: "leadingDigits",
			value: function() {
				return this.metadata[this.v1 ? 8 : this.v2 ? 9 : 10];
			}
		},
		{
			key: "types",
			value: function() {
				return this.metadata[this.v1 ? 9 : this.v2 ? 10 : 11];
			}
		},
		{
			key: "hasTypes",
			value: function() {
				return this.types() && this.types().length === 0 ? !1 : !!this.types();
			}
		},
		{
			key: "type",
			value: function(e) {
				if (this.hasTypes() && ht(this.types(), e)) return new mt(ht(this.types(), e), this);
			}
		},
		{
			key: "ext",
			value: function() {
				return this.v1 || this.v2 ? ut : this.metadata[13] || ut;
			}
		}
	]);
}(), ft = /*#__PURE__*/ function() {
	function e(t, n) {
		rt(this, e), this._format = t, this.metadata = n;
	}
	return at(e, [
		{
			key: "pattern",
			value: function() {
				return this._format[0];
			}
		},
		{
			key: "format",
			value: function() {
				return this._format[1];
			}
		},
		{
			key: "leadingDigitsPatterns",
			value: function() {
				return this._format[2] || [];
			}
		},
		{
			key: "nationalPrefixFormattingRule",
			value: function() {
				return this._format[3] || this.metadata.nationalPrefixFormattingRule();
			}
		},
		{
			key: "nationalPrefixIsOptionalWhenFormattingInNationalFormat",
			value: function() {
				return !!this._format[4] || this.metadata.nationalPrefixIsOptionalWhenFormattingInNationalFormat();
			}
		},
		{
			key: "nationalPrefixIsMandatoryWhenFormattingInNationalFormat",
			value: function() {
				return this.usesNationalPrefix() && !this.nationalPrefixIsOptionalWhenFormattingInNationalFormat();
			}
		},
		{
			key: "usesNationalPrefix",
			value: function() {
				return !(!this.nationalPrefixFormattingRule() || pt.test(this.nationalPrefixFormattingRule()));
			}
		},
		{
			key: "internationalFormat",
			value: function() {
				return this._format[5] || this.format();
			}
		}
	]);
}(), pt = /^\(?\$1\)?$/, mt = /*#__PURE__*/ function() {
	function e(t, n) {
		rt(this, e), this.type = t, this.metadata = n;
	}
	return at(e, [{
		key: "pattern",
		value: function() {
			return this.metadata.v1 ? this.type : this.type[0];
		}
	}, {
		key: "possibleLengths",
		value: function() {
			if (!this.metadata.v1) return this.type[1] || this.metadata.possibleLengths();
		}
	}]);
}();
function ht(e, t) {
	switch (t) {
		case "FIXED_LINE": return e[0];
		case "MOBILE": return e[1];
		case "TOLL_FREE": return e[2];
		case "PREMIUM_RATE": return e[3];
		case "PERSONAL_NUMBER": return e[4];
		case "VOICEMAIL": return e[5];
		case "UAN": return e[6];
		case "PAGER": return e[7];
		case "VOIP": return e[8];
		case "SHARED_COST": return e[9];
	}
}
function gt(e) {
	if (!e) throw Error("[libphonenumber-js] `metadata` argument not passed. Check your arguments.");
	if (!et(e) || !et(e.countries)) throw Error(`[libphonenumber-js] \`metadata\` argument was passed but it's not a valid metadata. Must be an object having \`.countries\` child object property. Got ${et(e) ? "an object of shape: { " + Object.keys(e).join(", ") + " }" : "a " + _t(e) + ": " + e}.`);
}
/* istanbul ignore next */
var _t = function(e) {
	return W(e);
};
function vt(e, t) {
	var n = new G(t);
	if (n.hasCountry(e)) return n.selectNumberingPlan(e).countryCallingCode();
	throw Error(`Unknown country: ${e}`);
}
function yt(e, t) {
	return t.countries.hasOwnProperty(e);
}
function bt(e) {
	var t = e.version;
	typeof t == "number" ? (this.v1 = t === 1, this.v2 = t === 2, this.v3 = t === 3, this.v4 = t === 4) : t ? Qe(t, ct) === -1 ? this.v2 = !0 : Qe(t, lt) === -1 ? this.v3 = !0 : this.v4 = !0 : this.v1 = !0;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/mergeArrays.js
function xt(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = St(e)) || t && e && typeof e.length == "number") {
		n && (e = n);
		var r = 0;
		return function() {
			return r >= e.length ? { done: !0 } : {
				done: !1,
				value: e[r++]
			};
		};
	}
	throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function St(e, t) {
	if (e) {
		if (typeof e == "string") return Ct(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ct(e, t) : void 0;
	}
}
function Ct(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function wt(e, t) {
	for (var n = e.slice(), r = xt(t), i; !(i = r()).done;) {
		var a = i.value;
		e.indexOf(a) < 0 && n.push(a);
	}
	return n.sort(function(e, t) {
		return e - t;
	});
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/checkNumberLength.js
function Tt(e, t, n) {
	return Et(e, void 0, t, n);
}
function Et(e, t, n, r) {
	n && (r = new G(r.metadata), r.selectNumberingPlan(n));
	var i = r.type(t), a = i && i.possibleLengths() || r.possibleLengths();
	if (!a) return "IS_POSSIBLE";
	if (t === "FIXED_LINE_OR_MOBILE") {
		/* istanbul ignore next */
		if (!r.type("FIXED_LINE")) return Et(e, "MOBILE", n, r);
		var o = r.type("MOBILE");
		o && (a = wt(a, o.possibleLengths()));
	} else if (t && !i) return "INVALID_LENGTH";
	var s = e.length, c = a[0];
	return c === s ? "IS_POSSIBLE" : c > s ? "TOO_SHORT" : a[a.length - 1] < s ? "TOO_LONG" : a.indexOf(s, 1) >= 0 ? "IS_POSSIBLE" : "INVALID_LENGTH";
}
//#endregion
//#region node_modules/libphonenumber-js/es6/isPossible.js
function Dt(e, t, n) {
	/* istanbul ignore if */
	t === void 0 && (t = {});
	var r = new G(n);
	if (t.v2) {
		if (!e.countryCallingCode) throw Error("Invalid phone number object passed");
		r.selectNumberingPlan(e.country || e.countryCallingCode);
	} else {
		if (!e.phone) return !1;
		if (e.country) {
			if (!r.hasCountry(e.country)) throw Error(`Unknown country: ${e.country}`);
			r.selectNumberingPlan(e.country);
		} else {
			if (!e.countryCallingCode) throw Error("Invalid phone number object passed");
			r.selectNumberingPlan(e.countryCallingCode);
		}
	}
	if (r.possibleLengths()) return Ot(e.phone || e.nationalNumber, r);
	if (e.countryCallingCode && r.isNonGeographicCallingCode(e.countryCallingCode)) return !0;
	throw Error("Missing \"possibleLengths\" in metadata. Perhaps the metadata has been generated before v1.0.18.");
}
function Ot(e, t) {
	switch (Tt(e, void 0, t)) {
		case "IS_POSSIBLE": return !0;
		default: return !1;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/matchesEntirely.js
function K(e, t) {
	return e = e || "", RegExp("^(?:" + t + ")$").test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getNumberType.js
function kt(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = At(e)) || t && e && typeof e.length == "number") {
		n && (e = n);
		var r = 0;
		return function() {
			return r >= e.length ? { done: !0 } : {
				done: !1,
				value: e[r++]
			};
		};
	}
	throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function At(e, t) {
	if (e) {
		if (typeof e == "string") return jt(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? jt(e, t) : void 0;
	}
}
function jt(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
var Mt = [
	"MOBILE",
	"PREMIUM_RATE",
	"TOLL_FREE",
	"SHARED_COST",
	"VOIP",
	"PERSONAL_NUMBER",
	"PAGER",
	"UAN",
	"VOICEMAIL"
];
function Nt(e, t, n) {
	if (t = t || {}, e.country || e.countryCallingCode) {
		var r = new G(n);
		r.selectNumberingPlan(e.country || e.countryCallingCode);
		var i = t.v2 ? e.nationalNumber : e.phone;
		if (K(i, r.nationalNumberPattern())) {
			if (Pt(i, "FIXED_LINE", r)) return r.type("MOBILE") && r.type("MOBILE").pattern() === "" || !r.type("MOBILE") || Pt(i, "MOBILE", r) ? "FIXED_LINE_OR_MOBILE" : "FIXED_LINE";
			for (var a = kt(Mt), o; !(o = a()).done;) {
				var s = o.value;
				if (Pt(i, s, r)) return s;
			}
		}
	}
}
function Pt(e, t, n) {
	var r = n.type(t);
	return !r || !r.pattern() || r.possibleLengths() && r.possibleLengths().indexOf(e.length) < 0 ? !1 : K(e, r.pattern());
}
//#endregion
//#region node_modules/libphonenumber-js/es6/isValid.js
function Ft(e, t, n) {
	t = t || {};
	var r = new G(n);
	return r.selectNumberingPlan(e.country || e.countryCallingCode), r.hasTypes() ? Nt(e, t, r.metadata) !== void 0 : K(t.v2 ? e.nationalNumber : e.phone, r.nationalNumberPattern());
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isCountryCode.js
var It = /^[A-Z]{2}$/;
function Lt(e) {
	return It.test(e);
}
function Rt(e, t) {
	var n, r, i = new G(t);
	return Lt(e) ? (n = e, i.selectNumberingPlan(n), r = i.countryCallingCode()) : r = e, {
		country: n,
		callingCode: r
	};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getPossibleCountriesForNumber.js
function zt(e, t, n) {
	var r = new G(n).getCountryCodesForCallingCode(e);
	return r ? r.filter(function(e) {
		return Bt(t, e, n);
	}) : [];
}
function Bt(e, t, n) {
	var r = new G(n);
	return r.selectNumberingPlan(t), r.numberingPlan.possibleLengths().indexOf(e.length) >= 0;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/constants.js
var q = "0-9０-９٠-٩۰-۹", Vt = "-‐-―−ー－／/．. \xA0­​⁠　()（）［］\\[\\]~⁓∼～", Ht = "+＋", Ut = RegExp("([" + q + "])");
function Wt(e, t, n, r) {
	if (t) {
		var i = new G(r);
		i.selectNumberingPlan(t || n);
		var a = new RegExp(i.IDDPrefix());
		if (e.search(a) === 0) {
			e = e.slice(e.match(a)[0].length);
			var o = e.match(Ut);
			if (!(o && o[1] != null && o[1].length > 0 && o[1] === "0")) return e;
		}
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractNationalNumberFromPossiblyIncompleteNumber.js
function Gt(e, t) {
	if (e && t.numberingPlan.nationalPrefixForParsing()) {
		var n = RegExp("^(?:" + t.numberingPlan.nationalPrefixForParsing() + ")"), r = n.exec(e);
		if (r) {
			var i, a, o = r.length - 1, s = o > 0 && r[o];
			if (t.nationalPrefixTransformRule() && s) i = e.replace(n, t.nationalPrefixTransformRule()), o > 1 && (a = r[1]);
			else {
				var c = r[0];
				i = e.slice(c.length), s && (a = r[1]);
			}
			var l;
			if (s) {
				var u = e.indexOf(r[1]);
				e.slice(0, u) === t.numberingPlan.nationalPrefix() && (l = t.numberingPlan.nationalPrefix());
			} else l = r[0];
			return {
				nationalNumber: i,
				nationalPrefix: l,
				carrierCode: a
			};
		}
	}
	return { nationalNumber: e };
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getCountryByNationalNumber.js
function Kt(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = qt(e)) || t && e && typeof e.length == "number") {
		n && (e = n);
		var r = 0;
		return function() {
			return r >= e.length ? { done: !0 } : {
				done: !1,
				value: e[r++]
			};
		};
	}
	throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function qt(e, t) {
	if (e) {
		if (typeof e == "string") return Jt(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Jt(e, t) : void 0;
	}
}
function Jt(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Yt(e, t, n) {
	for (var r = new G(n), i = Kt(t), a; !(a = i()).done;) {
		var o = a.value;
		if (r.selectNumberingPlan(o), r.leadingDigits()) {
			if (e && e.search(r.leadingDigits()) === 0) return o;
		} else if (Nt({
			phone: e,
			country: o
		}, void 0, r.metadata)) return o;
	}
}
function Xt(e, t) {
	var n = t.nationalNumber, r = t.metadata, i = r.getCountryCodesForCallingCode(e);
	if (i) return i.length === 1 ? i[0] : Yt(n, i, r.metadata);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractNationalNumber.js
function Zt(e, t, n) {
	var r = Gt(e, n), i = r.carrierCode, a = r.nationalNumber;
	return a !== e && (!Qt(e, a, n) || n.numberingPlan.possibleLengths() && (t || (t = Xt(n.numberingPlan.callingCode(), {
		nationalNumber: a,
		metadata: n
	})), !$t(a, t, n))) ? { nationalNumber: e } : {
		nationalNumber: a,
		carrierCode: i
	};
}
function Qt(e, t, n) {
	return !(K(e, n.nationalNumberPattern()) && !K(t, n.nationalNumberPattern()));
}
function $t(e, t, n) {
	switch (Tt(e, t, n)) {
		case "TOO_SHORT":
		case "INVALID_LENGTH": return !1;
		default: return !0;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCodeFromInternationalNumberWithoutPlusSign.js
function en(e, t, n, r, i) {
	if (!(t || n || r)) return { number: e };
	var a = t || n ? vt(t || n, i) : r;
	if (e.indexOf(a) === 0) {
		var o = new G(i);
		o.selectNumberingPlan(t || n || r);
		var s = e.slice(a.length), c = Zt(s, void 0, o).nationalNumber, l = Zt(e, void 0, o).nationalNumber;
		if (!K(l, o.nationalNumberPattern()) && K(c, o.nationalNumberPattern()) || Tt(l, void 0, o) === "TOO_LONG") return {
			countryCallingCode: a,
			number: s
		};
	}
	return { number: e };
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCode.js
function tn(e, t, n, r, i) {
	if (!e) return {};
	var a;
	if (e[0] !== "+") {
		var o = Wt(e, t || n, r, i);
		if (o && o !== e) a = !0, e = "+" + o;
		else {
			if (t || n || r) {
				var s = en(e, t, n, r, i), c = s.countryCallingCode, l = s.number;
				if (c) return {
					countryCallingCodeSource: "FROM_NUMBER_WITHOUT_PLUS_SIGN",
					countryCallingCode: c,
					number: l
				};
			}
			return { number: e };
		}
	}
	if (e[1] === "0") return {};
	for (var u = new G(i), d = 2; d - 1 <= 3 && d <= e.length;) {
		var f = e.slice(1, d);
		if (u.hasCallingCode(f)) return u.selectNumberingPlan(f), {
			countryCallingCodeSource: a ? "FROM_NUMBER_WITH_IDD" : "FROM_NUMBER_WITH_PLUS_SIGN",
			countryCallingCode: f,
			number: e.slice(d)
		};
		d++;
	}
	return {};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/applyInternationalSeparatorStyle.js
function nn(e) {
	return e.replace(RegExp(`[${Vt}]+`, "g"), " ").trim();
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/formatNationalNumberUsingFormat.js
var rn = /(\$\d)/;
function an(e, t, n) {
	var r = n.useInternationalFormat, i = n.withNationalPrefix;
	n.carrierCode, n.metadata;
	var a = e.replace(new RegExp(t.pattern()), r ? t.internationalFormat() : i && t.nationalPrefixFormattingRule() ? t.format().replace(rn, t.nationalPrefixFormattingRule()) : t.format());
	return r ? nn(a) : a;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getIddPrefix.js
var on = /^[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?$/;
function sn(e, t, n) {
	var r = new G(n);
	if (r.selectNumberingPlan(e || t), r.defaultIDDPrefix()) return r.defaultIDDPrefix();
	if (on.test(r.IDDPrefix())) return r.IDDPrefix();
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extension/createExtensionPattern.js
var cn = ";ext=", J = function(e) {
	return `([${q}]{1,${e}})`;
};
function ln(e) {
	var t = "20", n = "15", r = "9", i = "6", a = "[ \xA0\\t,]*", o = "[:\\.．]?[ \xA0\\t,-]*", s = "#?", c = "(?:e?xt(?:ensi(?:ó?|ó))?n?|ｅ?ｘｔｎ?|доб|anexo)", l = "(?:[xｘ#＃~～]|int|ｉｎｔ)", u = "[- ]+", d = "[ \xA0\\t]*", f = "(?:,{2}|;)", p = cn + J(t), m = a + c + o + J(t) + s, h = a + l + o + J(r) + s, g = u + J(i) + "#", _ = d + f + o + J(n) + s, v = d + "(?:,)+" + o + J(r) + s;
	return p + "|" + m + "|" + h + "|" + g + "|" + _ + "|" + v;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isViablePhoneNumber.js
var un = "[" + q + "]{2}", dn = "[" + Ht + "]{0,1}(?:[" + Vt + "]*[" + q + "]){3,}[" + Vt + q + "]*", fn = RegExp("^[" + Ht + "]{0,1}(?:[" + Vt + "]*[" + q + "]){1,2}$", "i"), pn = dn + "(?:" + ln() + ")?", mn = RegExp("^" + un + "$|^" + pn + "$", "i");
function hn(e) {
	return e.length >= 2 && mn.test(e);
}
function gn(e) {
	return fn.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/RFC3966.js
function _n(e) {
	var t = e.number, n = e.ext;
	if (!t) return "";
	if (t[0] !== "+") throw Error("\"formatRFC3966()\" expects \"number\" to be in E.164 format.");
	return `tel:${t}${n ? ";ext=" + n : ""}`;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/format.js
var vn = { formatExtension: function(e, t, n) {
	return `${e}${n.ext()}${t}`;
} };
function yn(e, t, n, r) {
	n = n ? wn({}, vn, n) : vn;
	var i = new G(r);
	if (e.country && e.country !== "001") {
		if (!i.hasCountry(e.country)) throw Error(`Unknown country: ${e.country}`);
		i.selectNumberingPlan(e.country);
	} else if (e.countryCallingCode) i.selectNumberingPlan(e.countryCallingCode);
	else return e.phone || "";
	var a = i.countryCallingCode(), o = n.v2 ? e.nationalNumber : e.phone, s;
	switch (t) {
		case "NATIONAL": return o ? (s = bn(o, e.carrierCode, "NATIONAL", i, n), Sn(s, e.ext, i, n.formatExtension)) : "";
		case "INTERNATIONAL": return o ? (s = bn(o, null, "INTERNATIONAL", i, n), s = `+${a} ${s}`, Sn(s, e.ext, i, n.formatExtension)) : `+${a}`;
		case "E.164": return `+${a}${o}`;
		case "RFC3966": return _n({
			number: `+${a}${o}`,
			ext: e.ext
		});
		case "IDD":
			if (!n.fromCountry) return;
			var c = Cn(o, e.carrierCode, a, n.fromCountry, i);
			return c ? Sn(c, e.ext, i, n.formatExtension) : void 0;
		default: throw Error(`Unknown "format" argument passed to "formatNumber()": "${t}"`);
	}
}
function bn(e, t, n, r, i) {
	var a = xn(r.formats(), e);
	return a ? an(e, a, {
		useInternationalFormat: n === "INTERNATIONAL",
		withNationalPrefix: !(a.nationalPrefixIsOptionalWhenFormattingInNationalFormat() && i && i.nationalPrefix === !1),
		carrierCode: t,
		metadata: r
	}) : e;
}
function xn(e, t) {
	return Tn(e, function(e) {
		if (e.leadingDigitsPatterns().length > 0) {
			var n = e.leadingDigitsPatterns()[e.leadingDigitsPatterns().length - 1];
			if (t.search(n) !== 0) return !1;
		}
		return K(t, e.pattern());
	});
}
function Sn(e, t, n, r) {
	return t ? r(e, t, n) : e;
}
function Cn(e, t, n, r, i) {
	if (vt(r, i.metadata) === n) {
		var a = bn(e, t, "NATIONAL", i);
		return n === "1" ? n + " " + a : a;
	}
	var o = sn(r, void 0, i.metadata);
	if (o) return `${o} ${n} ${bn(e, null, "INTERNATIONAL", i)}`;
}
function wn() {
	for (var e = 1, t = [...arguments]; e < t.length;) {
		if (t[e]) for (var n in t[e]) t[0][n] = t[e][n];
		e++;
	}
	return t[0];
}
function Tn(e, t) {
	for (var n = 0; n < e.length;) {
		if (t(e[n])) return e[n];
		n++;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/PhoneNumber.js
function En(e) {
	"@babel/helpers - typeof";
	return En = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, En(e);
}
function Dn(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function On(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Dn(Object(n), !0).forEach(function(t) {
			kn(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Dn(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function kn(e, t, n) {
	return (t = Nn(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function An(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function jn(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Nn(r.key), r);
	}
}
function Mn(e, t, n) {
	return t && jn(e.prototype, t), n && jn(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Nn(e) {
	var t = Pn(e, "string");
	return En(t) == "symbol" ? t : t + "";
}
function Pn(e, t) {
	if (En(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (En(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Fn = /*#__PURE__*/ function() {
	function e(t, n, r) {
		if (An(this, e), !t) throw TypeError("First argument is required");
		if (typeof t != "string") throw TypeError("First argument must be a string");
		if (t[0] === "+" && !n) throw TypeError("`metadata` argument not passed");
		if (et(n) && et(n.countries)) {
			r = n;
			var i = t;
			if (!In.test(i)) throw Error("Invalid `number` argument passed: must consist of a \"+\" followed by digits");
			var a = tn(i, void 0, void 0, void 0, r), o = a.countryCallingCode;
			if (n = a.number, t = o, !n) throw Error("Invalid `number` argument passed: too short");
		}
		if (!n) throw TypeError("`nationalNumber` argument is required");
		if (typeof n != "string") throw TypeError("`nationalNumber` argument must be a string");
		gt(r);
		var s = Rt(t, r), c = s.country, l = s.callingCode;
		this.country = c, this.countryCallingCode = l, this.nationalNumber = n, this.number = "+" + this.countryCallingCode + this.nationalNumber, this.getMetadata = function() {
			return r;
		};
	}
	return Mn(e, [
		{
			key: "setExt",
			value: function(e) {
				this.ext = e;
			}
		},
		{
			key: "getPossibleCountries",
			value: function() {
				return this.country ? [this.country] : zt(this.countryCallingCode, this.nationalNumber, this.getMetadata());
			}
		},
		{
			key: "isPossible",
			value: function() {
				return Dt(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "isValid",
			value: function() {
				return Ft(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "isNonGeographic",
			value: function() {
				return new G(this.getMetadata()).isNonGeographicCallingCode(this.countryCallingCode);
			}
		},
		{
			key: "isEqual",
			value: function(e) {
				return this.number === e.number && this.ext === e.ext;
			}
		},
		{
			key: "getType",
			value: function() {
				return Nt(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "format",
			value: function(e, t) {
				return yn(this, e, t ? On(On({}, t), {}, { v2: !0 }) : { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "formatNational",
			value: function(e) {
				return this.format("NATIONAL", e);
			}
		},
		{
			key: "formatInternational",
			value: function(e) {
				return this.format("INTERNATIONAL", e);
			}
		},
		{
			key: "getURI",
			value: function(e) {
				return this.format("RFC3966", e);
			}
		}
	]);
}(), In = /^\+\d+$/;
//#endregion
//#region node_modules/libphonenumber-js/es6/ParseError.js
function Ln(e) {
	"@babel/helpers - typeof";
	return Ln = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Ln(e);
}
function Rn(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Bn(r.key), r);
	}
}
function zn(e, t, n) {
	return t && Rn(e.prototype, t), n && Rn(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Bn(e) {
	var t = Vn(e, "string");
	return Ln(t) == "symbol" ? t : t + "";
}
function Vn(e, t) {
	if (Ln(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Ln(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Hn(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Un(e, t, n) {
	return t = Qn(t), Wn(e, Yn() ? Reflect.construct(t, n || [], Qn(e).constructor) : t.apply(e, n));
}
function Wn(e, t) {
	if (t && (Ln(t) == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return Gn(e);
}
function Gn(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Kn(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Zn(e, t);
}
function qn(e) {
	var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
	return qn = function(e) {
		if (e === null || !Xn(e)) return e;
		if (typeof e != "function") throw TypeError("Super expression must either be null or a function");
		if (t !== void 0) {
			if (t.has(e)) return t.get(e);
			t.set(e, n);
		}
		function n() {
			return Jn(e, arguments, Qn(this).constructor);
		}
		return n.prototype = Object.create(e.prototype, { constructor: {
			value: n,
			enumerable: !1,
			writable: !0,
			configurable: !0
		} }), Zn(n, e);
	}, qn(e);
}
function Jn(e, t, n) {
	if (Yn()) return Reflect.construct.apply(null, arguments);
	var r = [null];
	r.push.apply(r, t);
	var i = new (e.bind.apply(e, r))();
	return n && Zn(i, n.prototype), i;
}
function Yn() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (Yn = function() {
		return !!e;
	})();
}
function Xn(e) {
	try {
		return Function.toString.call(e).indexOf("[native code]") !== -1;
	} catch {
		return typeof e == "function";
	}
}
function Zn(e, t) {
	return Zn = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Zn(e, t);
}
function Qn(e) {
	return Qn = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, Qn(e);
}
var Y = /*#__PURE__*/ function(e) {
	function t(e) {
		var n;
		return Hn(this, t), n = Un(this, t, [e]), Object.setPrototypeOf(n, t.prototype), n.name = n.constructor.name, n;
	}
	return Kn(t, e), zn(t);
}(/*#__PURE__*/ qn(Error)), $n = RegExp("(?:" + ln() + ")$", "i");
function er(e) {
	var t = e.search($n);
	if (t < 0) return {};
	for (var n = e.slice(0, t), r = e.match($n), i = 1; i < r.length;) {
		if (r[i]) return {
			number: n,
			ext: r[i]
		};
		i++;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/parseDigits.js
var tr = {
	0: "0",
	1: "1",
	2: "2",
	3: "3",
	4: "4",
	5: "5",
	6: "6",
	7: "7",
	8: "8",
	9: "9",
	"０": "0",
	"１": "1",
	"２": "2",
	"３": "3",
	"４": "4",
	"５": "5",
	"６": "6",
	"７": "7",
	"８": "8",
	"９": "9",
	"٠": "0",
	"١": "1",
	"٢": "2",
	"٣": "3",
	"٤": "4",
	"٥": "5",
	"٦": "6",
	"٧": "7",
	"٨": "8",
	"٩": "9",
	"۰": "0",
	"۱": "1",
	"۲": "2",
	"۳": "3",
	"۴": "4",
	"۵": "5",
	"۶": "6",
	"۷": "7",
	"۸": "8",
	"۹": "9"
};
function nr(e) {
	return tr[e];
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parseIncompletePhoneNumber.js
function rr(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = ir(e)) || t && e && typeof e.length == "number") {
		n && (e = n);
		var r = 0;
		return function() {
			return r >= e.length ? { done: !0 } : {
				done: !1,
				value: e[r++]
			};
		};
	}
	throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ir(e, t) {
	if (e) {
		if (typeof e == "string") return ar(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ar(e, t) : void 0;
	}
}
function ar(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function or(e) {
	for (var t = "", n = rr(e.split("")), r; !(r = n()).done;) {
		var i = r.value;
		t += sr(i, t) || "";
	}
	return t;
}
function sr(e, t, n) {
	if (e === "+") {
		if (t) {
			typeof n == "function" && n("end");
			return;
		}
		return "+";
	}
	return nr(e);
}
var cr = "([" + q + "]|[\\-\\.\\(\\)]?)", lr = "^\\+" + cr + "*[" + q + "]" + cr + "*$", ur = new RegExp(lr, "g"), dr = q, fr = "[" + dr + "]+((\\-)*[" + dr + "])*", pr = "[a-zA-Z]+((\\-)*[" + dr + "])*", mr = "^(" + fr + "\\.)*" + pr + "\\.?$", hr = new RegExp(mr, "g"), gr = "tel:", _r = ";phone-context=", vr = ";isub=";
function yr(e) {
	var t = e.indexOf(_r);
	if (t < 0) return null;
	var n = t + _r.length;
	if (n >= e.length) return "";
	var r = e.indexOf(";", n);
	return r >= 0 ? e.substring(n, r) : e.substring(n);
}
function br(e) {
	return e === null ? !0 : e.length === 0 ? !1 : ur.test(e) || hr.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractFormattedPhoneNumberFromPossibleRfc3966NumberUri.js
function xr(e, t) {
	var n = t.extractFormattedPhoneNumber, r = yr(e);
	if (!br(r)) throw new Y("NOT_A_NUMBER");
	var i;
	if (r === null) i = n(e) || "";
	else {
		i = "", r.charAt(0) === "+" && (i += r);
		var a = e.indexOf(gr), o = a >= 0 ? a + gr.length : 0, s = e.indexOf(_r);
		i += e.substring(o, s);
	}
	var c = i.indexOf(vr);
	if (c > 0 && (i = i.substring(0, c)), i !== "") return i;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parse.js
var Sr = 250, Cr = RegExp("[" + Ht + q + "]"), wr = RegExp("[^" + q + "#]+$");
function Tr(e, t, n) {
	t = t || {};
	var r = new G(n);
	if (t.defaultCountry && !r.hasCountry(t.defaultCountry)) throw t.v2 ? new Y("INVALID_COUNTRY") : Error(`Unknown country: ${t.defaultCountry}`);
	var i = Dr(e, t.v2, t.extract), a = i.number, o = i.ext, s = i.error;
	if (!a) {
		if (t.v2) throw s === "TOO_SHORT" ? new Y("TOO_SHORT") : new Y("NOT_A_NUMBER");
		return {};
	}
	var c = kr(a, t.defaultCountry, t.defaultCallingCode, r), l = c.country, u = c.nationalNumber, d = c.countryCallingCode, f = c.countryCallingCodeSource, p = c.carrierCode;
	if (!r.hasSelectedNumberingPlan()) {
		if (t.v2) throw new Y("INVALID_COUNTRY");
		return {};
	}
	if (!u || u.length < 2) {
		/* istanbul ignore if */
		if (t.v2) throw new Y("TOO_SHORT");
		return {};
	}
	if (u.length > 17) {
		if (t.v2) throw new Y("TOO_LONG");
		return {};
	}
	if (t.v2) {
		var m = new Fn(d, u, r.metadata);
		return l && (m.country = l), p && (m.carrierCode = p), o && (m.ext = o), m.__countryCallingCodeSource = f, m;
	}
	var h = (t.extended ? r.hasSelectedNumberingPlan() : l) ? K(u, r.nationalNumberPattern()) : !1;
	return t.extended ? {
		country: l,
		countryCallingCode: d,
		carrierCode: p,
		valid: h,
		possible: h ? !0 : !!(t.extended === !0 && r.possibleLengths() && Ot(u, r)),
		phone: u,
		ext: o
	} : h ? Or(l, u, o) : {};
}
function Er(e, t, n) {
	if (e) {
		if (e.length > Sr) {
			if (n) throw new Y("TOO_LONG");
		} else {
			if (t === !1) return e;
			var r = e.search(Cr);
			if (!(r < 0)) return e.slice(r).replace(wr, "");
		}
	}
}
function Dr(e, t, n) {
	var r = xr(e, { extractFormattedPhoneNumber: function(e) {
		return Er(e, n, t);
	} });
	if (!r) return {};
	if (!hn(r)) return gn(r) ? { error: "TOO_SHORT" } : {};
	var i = er(r);
	return i.ext ? i : { number: r };
}
function Or(e, t, n) {
	var r = {
		country: e,
		phone: t
	};
	return n && (r.ext = n), r;
}
function kr(e, t, n, r) {
	var i = tn(or(e), void 0, t, n, r.metadata), a = i.countryCallingCodeSource, o = i.countryCallingCode, s = i.number, c;
	if (o) r.selectNumberingPlan(o);
	else if (s && (t || n)) t ? (c = t, r.selectNumberingPlan(t), o = r.numberingPlan.callingCode()) : (r.selectNumberingPlan(n), o = n);
	else return {};
	if (!s) return {
		countryCallingCodeSource: a,
		countryCallingCode: o
	};
	var l = Zt(or(s), void 0, r), u = l.nationalNumber, d = l.carrierCode, f = Xt(o, {
		nationalNumber: u,
		metadata: r
	});
	return f && (c = f, f === "001" || r.selectNumberingPlan(c)), {
		country: c,
		countryCallingCode: o,
		countryCallingCodeSource: a,
		nationalNumber: u,
		carrierCode: d
	};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parsePhoneNumberWithError_.js
function Ar(e) {
	"@babel/helpers - typeof";
	return Ar = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Ar(e);
}
function jr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Mr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? jr(Object(n), !0).forEach(function(t) {
			Nr(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : jr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Nr(e, t, n) {
	return (t = Pr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Pr(e) {
	var t = Fr(e, "string");
	return Ar(t) == "symbol" ? t : t + "";
}
function Fr(e, t) {
	if (Ar(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Ar(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Ir(e, t, n) {
	return Tr(e, Mr(Mr({}, t), {}, { v2: !0 }), n);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/normalizeArguments.js
function Lr(e) {
	"@babel/helpers - typeof";
	return Lr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Lr(e);
}
function Rr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function zr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Rr(Object(n), !0).forEach(function(t) {
			Br(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Rr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Br(e, t, n) {
	return (t = Vr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Vr(e) {
	var t = Hr(e, "string");
	return Lr(t) == "symbol" ? t : t + "";
}
function Hr(e, t) {
	if (Lr(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Lr(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Ur(e, t) {
	return Jr(e) || qr(e, t) || Gr(e, t) || Wr();
}
function Wr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Gr(e, t) {
	if (e) {
		if (typeof e == "string") return Kr(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Kr(e, t) : void 0;
	}
}
function Kr(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function qr(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t === 0) {
				if (Object(n) !== n) return;
				c = !1;
			} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function Jr(e) {
	if (Array.isArray(e)) return e;
}
function Yr(e) {
	var t = Ur(Array.prototype.slice.call(e), 4), n = t[0], r = t[1], i = t[2], a = t[3], o, s, c;
	if (typeof n == "string") o = n;
	else throw TypeError("A text for parsing must be a string.");
	if (!r || typeof r == "string") a ? (s = i, c = a) : (s = void 0, c = i), r && (s = zr({ defaultCountry: r }, s));
	else if (et(r)) i ? (s = r, c = i) : c = r;
	else throw Error(`Invalid second argument: ${r}`);
	return {
		text: o,
		options: s,
		metadata: c
	};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parsePhoneNumber_.js
function Xr(e) {
	"@babel/helpers - typeof";
	return Xr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Xr(e);
}
function Zr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Qr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Zr(Object(n), !0).forEach(function(t) {
			$r(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Zr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function $r(e, t, n) {
	return (t = ei(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function ei(e) {
	var t = ti(e, "string");
	return Xr(t) == "symbol" ? t : t + "";
}
function ti(e, t) {
	if (Xr(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Xr(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function ni(e, t, n) {
	t && t.defaultCountry && !yt(t.defaultCountry, n) && (t = Qr(Qr({}, t), {}, { defaultCountry: void 0 }));
	try {
		return Ir(e, t, n);
	} catch (e) {
		/* istanbul ignore else */
		if (!(e instanceof Y)) throw e;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parsePhoneNumber.js
function ri() {
	var e = Yr(arguments), t = e.text, n = e.options, r = e.metadata;
	return ni(t, n, r);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/getCountries.js
function ii(e) {
	return new G(e).getCountries();
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js
function ai() {
	return Ze(ri, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/isSupportedCountry.js
function oi() {
	return Ze(yt, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/getCountries.js
function si() {
	return Ze(ii, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/getCountryCallingCode.js
function ci() {
	return Ze(vt, arguments);
}
var li = [
	"short_text",
	"long_text",
	"email",
	"phone",
	"number",
	"date",
	"single_choice",
	"multi_choice",
	"yes_no",
	"consent",
	"hidden",
	"statement",
	"summary",
	"rating",
	"scale",
	"nps",
	"slider",
	"address",
	"media",
	"file_upload"
], ui = (e) => [
	"statement",
	"summary",
	"media"
].includes(e);
function di(e, t = !1) {
	let n = e.replace(/\r\n?/g, "\n").replace(/<[^>]*>/g, "");
	return n = [...n].filter((e) => e.charCodeAt(0) >= 32 && e.charCodeAt(0) !== 127 || ["\n", "	"].includes(e)).join(""), t || (n = n.replace(/[\t\n ]+/g, " ")), n.replace(/^[ \t\n]+|[ \t\n]+$/g, "");
}
function fi(e, t) {
	let n = e.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, "");
	if (!/^(?:\+|00)?[0-9 ()\-.]+$/.test(n)) return n;
	let r = n.replace(/[ ()\-.]/g, "");
	if (r.startsWith("00") && (r = "+" + r.slice(2)), r.startsWith("+")) return r;
	if (!oi(t)) return n;
	let i = ci(t);
	if (r.startsWith("0") && t !== "IT") r = r.slice(1);
	else if (r.startsWith(i)) return "+" + r;
	return "+" + i + r;
}
function pi(e, t, n = {}) {
	switch (e.type) {
		case "single_choice": return He(t) ? {
			value: t.value,
			other: di(t.other)
		} : t;
		case "short_text":
		case "long_text":
		case "email":
		case "date": return typeof t == "string" ? di(t, e.type === "long_text") : t;
		case "phone": return typeof t == "string" ? fi(t, e.settings?.country ?? "ID") : t;
		case "number":
		case "rating":
		case "scale":
		case "nps":
		case "slider": return typeof t == "string" && /^[ \t\n\r]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r]*$/.test(t) && Number.isFinite(Number(t)) ? Number(t) : t;
		case "address": return t && typeof t == "object" && !Array.isArray(t) ? Object.fromEntries(Object.entries(t).map(([e, t]) => [e, typeof t == "string" ? di(t) : t])) : t;
		case "statement":
		case "summary":
		case "media": return null;
		default: return t;
	}
}
var mi = (e) => e.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(e) && e.split("@")[0].length <= 64 && !e.includes("..") && !e.startsWith(".") && !e.split("@")[0].endsWith(".") && e.split("@")[1].split(".").every((e) => e.length <= 63 && !e.startsWith("-") && !e.endsWith("-")), hi = (e) => /^(?:https?:\/\/)?[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:[/?#][^\s<>]*)?$/.test(e) && !e.includes("..");
function gi(e, t, n = {}) {
	let r = [], i = (t, n) => {
		r.push(B("/answers/" + V(e.key), t, n, e.key));
	};
	if (!li.includes(e.type)) return i("unsupported_type", "This field type is not supported."), r;
	if (ui(e.type)) return r;
	let a = pi(e, t, n), o = e.required === !0 || e.type === "consent";
	if (a === null) return o && i("required", "An answer is required."), r;
	if ([
		"rating",
		"scale",
		"nps",
		"slider"
	].includes(e.type)) {
		let t = e.validation ?? {}, n = e.type === "nps" ? 0 : Number(t.min ?? +!!["rating", "scale"].includes(e.type)), o = e.type === "nps" ? 10 : Number(t.max ?? (e.type === "rating" ? 5 : e.type === "scale" ? 10 : 100)), s = e.type === "slider" ? t.step ?? 1 : 1, c = H(a) ? a < n ? "min" : a > o ? "max" : s <= 0 || Math.abs((a - n) / s - Math.round((a - n) / s)) > 1e-8 || e.type !== "slider" && !Number.isInteger(a) ? "step" : null : "type_mismatch";
		return c && i(c, "Enter a configured scale value."), r;
	}
	if (e.type === "file_upload") return (typeof a != "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(a)) && i("type_mismatch", "Select an owned upload."), r;
	if (e.type === "address") {
		let t = e.settings?.addressFields ?? [
			"street",
			"city",
			"postcode",
			"country"
		], n = null;
		if (!a || typeof a != "object" || Array.isArray(a) || Object.keys(a).some((e) => !t.includes(e))) n = "type_mismatch";
		else for (let e of t) {
			let t = a[e] ?? "";
			if (typeof t != "string") {
				n = "type_mismatch";
				break;
			}
			if ([...t].length > 500) {
				n = "max_length";
				break;
			}
			if (o && t === "") {
				n = "required";
				break;
			}
		}
		return n && i(n, "Enter a valid configured address."), r;
	}
	let s = !1;
	switch (e.type) {
		case "number":
			s = H(a);
			break;
		case "yes_no":
		case "consent":
			s = typeof a == "boolean";
			break;
		case "multi_choice":
			s = Array.isArray(a) && a.every((e) => typeof e == "string");
			break;
		case "single_choice":
			s = typeof a == "string" || He(a);
			break;
		case "hidden":
			s = typeof a == "string" || typeof a == "boolean" || H(a);
			break;
		default: s = typeof a == "string";
	}
	if (!s) return i("type_mismatch", "The answer has an invalid type."), r;
	if (o && (We(a) || e.type === "consent" && a !== !0)) return i("required", "An answer is required."), r;
	if (We(a)) return r;
	let c = e.validation ?? {};
	if (typeof a == "string") {
		let t = [...a].length, r = c.maxLength ?? (e.type === "long_text" ? 1e5 : 1e4);
		if (c.minLength !== void 0 && t < c.minLength && i("min_length", "The answer is too short."), t > r && i("max_length", "The answer is too long."), c.pattern !== void 0 && (Je(c.pattern) ? Ye(a, c.pattern) || i("pattern", "The answer does not match the pattern.") : i("invalid_pattern", "The validation pattern is not supported.")), (e.type === "email" || c.format === "email") && !mi(a) && i("invalid_email", "Enter a valid email address."), c.format === "url" && !hi(a) && i("invalid_url", "Enter a valid website address."), e.type === "phone" && !/^\+[1-9][0-9]{6,14}$/.test(a) && i("invalid_phone", "Enter a valid international phone number."), e.type === "date") {
			if (!U(a)) i("invalid_date", "Enter a valid date in YYYY-MM-DD format.");
			else if (U(c.min) && a < String(c.min) && i("min", "The answer is below the minimum."), U(c.max) && a > String(c.max) && i("max", "The answer exceeds the maximum."), c.minAge !== void 0) {
				let e = Ke(a, n.now);
				e === null ? i("invalid_context", "A valid frozen UTC date is required.") : e < c.minAge && i("min_age", "The minimum age is not met.");
			}
		}
	}
	if (e.type === "number" && H(a) && (H(c.min) && a < c.min && i("min", "The answer is below the minimum."), H(c.max) && a > c.max && i("max", "The answer exceeds the maximum."), c.step !== void 0)) {
		let e = (a - (H(c.min) ? c.min : 0)) / c.step;
		Math.abs(e - Math.round(e)) > 1e-8 && i("step", "The answer does not match the allowed increment.");
	}
	if (e.type === "single_choice" || e.type === "multi_choice") {
		let t = Array.isArray(a) ? a : [Ue(a)], n = e.options ?? [];
		if (t.some((e) => !n.some((t) => t.value === e)) && i("invalid_choice", "Choose a configured option value."), e.type === "single_choice") {
			let e = n.find((e) => e.value === t[0]);
			He(a) ? (e?.isOther || i("invalid_other", "Free text is only accepted for an Other option."), a.other || i("required_other", "Enter text for the Other option."), [...a.other].length > 1e3 && i("max_length", "The answer is too long.")) : e?.isOther && i("required_other", "Enter text for the Other option.");
		}
		new Set(t).size !== t.length && i("duplicate_choice", "Choose each option only once."), t.length > 1 && n.some((e) => e.isExclusive && t.includes(e.value)) && i("exclusive_choice", "An exclusive option cannot be combined."), e.type === "multi_choice" && (c.minSelections !== void 0 && t.length < c.minSelections && i("min_selections", "Choose more options."), c.maxSelections !== void 0 && t.length > c.maxSelections && i("max_selections", "Choose fewer options."));
	}
	return r;
}
//#endregion
//#region assets/src/shared/logic/diagnostics.ts
function _i(e) {
	let t = [], n = (e, n, r) => {
		t.push(B(e, n, r));
	};
	if (!Array.isArray(e.steps) || !e.steps.length || e.steps.length > 500 || !Array.isArray(e.endings) || !e.endings.length) return n("", "invalid_schema", "The schema needs 1–500 steps and an ending."), t;
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = new Map((e.variables ?? []).map((e) => [e.key, e.type])), s = /* @__PURE__ */ new Set();
	(e.variables ?? []).forEach((e, t) => {
		s.has(e.key) && n(`/variables/${t}/key`, "duplicate_key", "Variable keys must be unique."), s.add(e.key), (e.type === "number" ? !H(e.default) : typeof e.default !== e.type) && n(`/variables/${t}/default`, "invalid_variable", "The variable default has an invalid type.");
	});
	let c = new Set(e.endings.map((e) => e.id)), l = (e, t) => {
		r.has(e) && n(t, "duplicate_id", "IDs must be globally unique."), r.add(e);
	};
	e.steps.forEach((e, t) => {
		i.has(e.key) && n(`/steps/${t}/key`, "duplicate_key", "Field keys must be unique."), i.set(e.key, t), a.set(e.id, t), l(e.id, `/steps/${t}/id`);
		let r = /* @__PURE__ */ new Set();
		(e.options ?? []).forEach((e, i) => {
			l(e.id, `/steps/${t}/options/${i}/id`), r.has(e.value) && n(`/steps/${t}/options/${i}/value`, "duplicate_value", "Option values must be unique."), r.add(e.value);
		});
	}), e.endings.forEach((e, t) => {
		l(e.id, `/endings/${t}/id`), (e.buttons ?? []).forEach((e, n) => l(e.id, `/endings/${t}/buttons/${n}/id`));
	}), (e.groups ?? []).forEach((e, t) => {
		l(e.id, `/groups/${t}/id`), e.stepIds.forEach((e, r) => {
			a.has(e) || n(`/groups/${t}/stepIds/${r}`, "missing_reference", "The referenced step does not exist.");
		});
	});
	let u = (e, t, r, a = 0) => {
		if (a > 64) {
			n(t, "condition_depth", "Conditions may nest at most 64 levels.");
			return;
		}
		if ("all" in e || "any" in e) {
			let n = "all" in e ? "all" : "any";
			("all" in e ? e.all : e.any).forEach((e, i) => u(e, `${t}/${n}/${i}`, r, a + 1));
			return;
		}
		let s = e.source ?? "answer";
		s === "answer" ? i.has(e.field) ? i.get(e.field) > r && n(t + "/field", "later_reference", "This condition references a later answer.") : n(t + "/field", "missing_reference", "The referenced answer does not exist.") : s === "variable" && !o.has(e.field) && n(t + "/field", "missing_reference", "The referenced variable does not exist."), e.op === "matches" && !Je(e.value) && n(t + "/value", "invalid_pattern", "The validation pattern is not supported.");
	}, d = (e, t) => {
		if (e.action === "set_variable") {
			let r = o.get(e.key);
			r ? (e.value !== null && typeof e.value !== r || e.operation !== "set" && (r !== "number" || typeof e.value != "number")) && n(t, "invalid_variable", "The variable action has an invalid type.") : n(t + "/key", "missing_reference", "The referenced variable does not exist.");
		} else (e.action === "end" ? c : a).has(e.to) || n(t + "/to", "missing_reference", "The navigation or visibility target does not exist.");
	}, f = /* @__PURE__ */ new Map(), p = e.steps.flatMap((e) => [...e.logic ?? [], ...(e.options ?? []).flatMap((e) => e.logic ?? [])]), m = /* @__PURE__ */ new Set([...e.steps.filter((e) => e.hiddenByDefault).map((e) => e.id), ...p.filter((e) => e.then.action === "hide").map((e) => e.then.to)]);
	e.steps.forEach((t, r) => {
		let i = `/steps/${r}`;
		li.includes(t.type) || n(i + "/type", "unsupported_type", "This field type is not supported."), t.validation?.pattern !== void 0 && !Je(t.validation.pattern) && n(i + "/validation/pattern", "invalid_pattern", "The validation pattern is not supported."), t.validation?.mxCheck && n(i + "/validation/mxCheck", "unsupported_validation", "MX checking is not enabled."), ["single_choice", "multi_choice"].includes(t.type) && !t.options?.length && n(i + "/options", "missing_options", "Choice fields need at least one option."), [...t.logic ?? [], ...(t.options ?? []).flatMap((e) => e.logic ?? [])].forEach((e) => {
			if (e.then.action === "jump") {
				let n = f.get(t.id) ?? /* @__PURE__ */ new Set();
				n.add(e.then.to), f.set(t.id, n);
			}
		});
		let a = (e, t) => {
			e.length > 100 && n(t, "invalid_schema", "A field may have at most 100 rules."), e.forEach((e, n) => {
				u(e.if, `${t}/${n}/if`, r), d(e.then, `${t}/${n}/then`);
			});
		};
		a(t.logic ?? [], i + "/logic"), (t.options ?? []).forEach((e, t) => a(e.logic ?? [], `${i}/options/${t}/logic`)), t.options && t.options.length > 200 && n(i + "/options", "invalid_schema", "A field may have at most 200 options.");
		let o = t.validation ?? {};
		for (let [e, t] of [
			[o.minLength, o.maxLength],
			[o.minSelections, o.maxSelections],
			[o.min, o.max]
		]) e !== void 0 && t !== void 0 && typeof e == typeof t && e > t && n(i + "/validation", "invalid_range", "Minimum must not exceed maximum.");
		if (o.step !== void 0 && (!H(o.step) || o.step <= 0) && n(i + "/validation/step", "invalid_range", "The numeric increment must be positive."), [
			"rating",
			"scale",
			"nps",
			"slider"
		].includes(t.type)) {
			let e = t.type === "nps" ? 0 : o.min ?? +!!["rating", "scale"].includes(t.type), r = t.type === "nps" ? 10 : o.max ?? (t.type === "rating" ? 5 : t.type === "scale" ? 10 : 100);
			(!H(e) || !H(r) || e > r || t.type !== "slider" && (!Number.isInteger(e) || !Number.isInteger(r))) && n(i + "/validation", "invalid_range", "Scale bounds and increments must be numeric and compatible.");
		}
		if (t.type !== "single_choice" && t.options?.some((e) => e.isOther) && n(i + "/options", "unsupported_other", "Other free text is only supported for single-choice fields."), e.steps[r + 1] && (m.has(t.id) || !t.logic?.some((e) => ["jump", "end"].includes(e.then.action) && "all" in e.if && !e.if.all.length))) {
			let n = f.get(t.id) ?? /* @__PURE__ */ new Set();
			n.add(e.steps[r + 1].id), f.set(t.id, n);
		}
	}), e.steps.forEach((e, r) => {
		if (t.some((e) => e.code === "duplicate_id")) return;
		let i = [...f.get(e.id) ?? []], a = /* @__PURE__ */ new Set();
		for (; i.length;) {
			let t = i.shift();
			if (t === e.id) {
				n(`/steps/${r}/logic`, "potential_loop", "Navigation rules may revisit this step.");
				break;
			}
			a.has(t) || (a.add(t), i.push(...f.get(t) ?? []));
		}
	});
	let h = /* @__PURE__ */ new Set(), g = [0];
	for (; g.length;) {
		let t = g.shift();
		if (h.has(t) || !e.steps[t]) continue;
		h.add(t);
		let n = e.steps[t], r = !0;
		for (let e of n.logic ?? []) {
			if (e.then.action === "jump") {
				let t = a.get(e.then.to);
				t !== void 0 && g.push(t);
			}
			if ((e.then.action === "jump" || e.then.action === "end") && "all" in e.if && !e.if.all.length) {
				r = !1;
				break;
			}
		}
		for (let e of n.options ?? []) for (let t of e.logic ?? []) if (t.then.action === "jump") {
			let e = a.get(t.then.to);
			e !== void 0 && g.push(e);
		}
		(r || m.has(n.id)) && g.push(t + 1);
	}
	return e.steps.forEach((e, t) => {
		h.has(t) || n(`/steps/${t}`, "unreachable_step", "No possible navigation path reaches this step.");
	}), t;
}
//#endregion
//#region assets/src/shared/logic/interpolate.ts
function vi(e) {
	return e == null ? "" : He(e) ? `${e.value}: ${e.other}` : Array.isArray(e) ? e.map(vi).join(", ") : typeof e == "object" ? Object.keys(e).sort().map((t) => `${t}: ${vi(e[t])}`).join(", ") : String(e);
}
function yi(e, t = {}, n = {}) {
	return e.replace(/\{\{([^{}]*)\}\}/g, (e, r) => {
		let i = /^[ \t\r\n]*(?:(answer|meta):)?([a-z][a-z0-9_]*)[ \t\r\n]*$/.exec(r);
		if (!i) return "";
		let a = i[1] === "meta" ? n : t, o = i[2];
		return vi(z(a, o) ? a[o] : void 0);
	});
}
//#endregion
//#region assets/src/shared/logic/operators.ts
function bi(e, t = {}, n = {}, r = {}, i = 0) {
	if (i > 64) return !1;
	if ("all" in e) return e.all.every((e) => bi(e, t, n, r, i + 1));
	if ("any" in e) return e.any.some((e) => bi(e, t, n, r, i + 1));
	let a = {
		answer: t,
		variable: n,
		hidden: r.hidden ?? {},
		url: r.url ?? {}
	}[e.source ?? "answer"], o = z(a, e.field) ? a[e.field] ?? null : null, s = (e.source ?? "answer") === "answer" ? Ue(o) : o, c = e.value ?? null, l = () => typeof s == "string" && typeof c == "string" ? s.includes(c) : Array.isArray(s) && s.some((e) => Ge(e, c)), u = () => Array.isArray(c) && c.some((e) => Ge(s, e));
	switch (e.op) {
		case "eq": return Ge(s, c);
		case "neq": return !Ge(s, c);
		case "contains": return l();
		case "not_contains": return !l();
		case "in": return u();
		case "not_in": return !u();
		case "gt": return H(s) && H(c) && s > c;
		case "gte": return H(s) && H(c) && s >= c;
		case "lt": return H(s) && H(c) && s < c;
		case "lte": return H(s) && H(c) && s <= c;
		case "between": return H(s) && Array.isArray(c) && c.length === 2 && H(c[0]) && H(c[1]) && s >= c[0] && s <= c[1];
		case "is_empty": return We(s);
		case "is_not_empty": return !We(s);
		case "starts_with": return typeof s == "string" && typeof c == "string" && s.startsWith(c);
		case "matches": return Ye(s, c);
		case "date_before": return U(s) !== null && U(c) !== null && s < c;
		case "date_after": return U(s) !== null && U(c) !== null && s > c;
		case "age_gte": {
			let e = Ke(s, r.now);
			return e !== null && H(c) && c >= 0 && e >= c;
		}
		default: return !1;
	}
}
//#endregion
//#region assets/src/shared/logic/replay.ts
function xi(e, t, n) {
	if (z(n.hidden ?? {}, e.key)) return n.hidden[e.key] ?? null;
	let r = e.settings?.source ?? "default", i = e.settings?.sourceKey ?? e.key;
	return r === "url" ? z(n.url ?? {}, i) ? n.url[i] ?? null : e.defaultValue ?? null : r === "meta" ? z(n.meta ?? {}, i) ? n.meta[i] ?? null : e.defaultValue ?? null : r === "merge" ? yi(String(e.defaultValue ?? ""), t, n.meta) : r === "cookie" ? null : e.defaultValue ?? null;
}
function Si(e, t, n = {}, r = "partial") {
	let i = {
		visited: [],
		answers: Ve(),
		variables: Ve(),
		currentStepId: null,
		endingId: null,
		progress: 0,
		errors: [],
		discardedKeys: []
	}, a = _i(e).filter((e) => ![
		"potential_loop",
		"unreachable_step",
		"later_reference"
	].includes(e.code));
	if (i.errors.push(...a), a.some((e) => e.code === "invalid_schema")) return i.discardedKeys = Object.keys(t).sort(), i;
	r !== "partial" && r !== "complete" && i.errors.push(B("/mode", "invalid_mode", "Replay mode must be partial or complete."));
	for (let t of e.variables ?? []) i.variables[t.key] = t.default;
	let o = e.steps ?? [], s = new Map(o.map((e, t) => [e.id, t])), c = new Map(o.map((e) => [e.key, e])), l = new Map(o.map((e) => [e.id, !e.hiddenByDefault])), u = new Map(o.map((e) => [e.id, e.required === !0 || e.type === "consent"])), d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set(), m = e.endings.some((e) => e.id === n.defaultEndingId) ? n.defaultEndingId : e.endings[0]?.id ?? null, h = 0, g = 0, _ = (e, t, n, r, a = i.errors) => {
		switch (e.action) {
			case "show":
			case "hide":
				n.set(e.to, e.action === "show");
				break;
			case "require":
			case "unrequire":
				r.set(e.to, e.action === "require");
				break;
			case "set_variable": {
				let n = t[e.key];
				if (e.operation === "set") t[e.key] = e.value;
				else if (H(n) && H(e.value)) {
					let r = n + (e.operation === "add" ? e.value : -e.value);
					Number.isFinite(r) ? t[e.key] = r : i.errors.push(B("/variables/" + V(e.key), "invalid_variable", "The variable value is not finite."));
				} else a.push(B("/variables/" + V(e.key), "invalid_variable", "The variable action has an invalid type."));
				break;
			}
		}
	}, v = (e) => [...e.logic ?? [], ...(e.options ?? []).filter((t) => {
		let n = Ue(i.answers[e.key]);
		return Array.isArray(n) ? n.includes(t.value) : n === t.value;
	}).flatMap((e) => e.logic ?? [])];
	if (!i.errors.length) {
		for (; h < o.length;) {
			let e = o[h];
			if (d.has(e.id) || d.size >= 1e3) {
				i.currentStepId = e.id, i.errors.push(B("/steps/" + h, "cff_logic_loop", "The logic path revisits a step."));
				break;
			}
			if (d.add(e.id), !l.get(e.id)) {
				h++;
				continue;
			}
			i.visited.push(e.id);
			let a = ui(e.type), c = e.type === "hidden";
			if (!a) {
				let a = z(t, e.key);
				if (!c && !a && (r === "partial" || u.get(e.id))) {
					i.currentStepId = e.id, r === "complete" && i.errors.push(B("/answers/" + V(e.key), "required", "An answer is required.", e.key));
					break;
				}
				let o = c ? xi(e, i.answers, n) : a ? t[e.key] ?? null : null, s = pi(e, o, n);
				f.add(e.key), c && a && !Ge(t[e.key], s) && (p.add(e.key), i.errors.push(B("/answers/" + V(e.key), "hidden_answer_tampered", "Hidden answers are server-derived.", e.key)));
				let l = gi({
					...e,
					required: u.get(e.id) === !0
				}, o, n);
				if (l.length) {
					i.errors.push(...l), i.currentStepId = e.id, a && p.add(e.key);
					break;
				}
				i.answers[e.key] = s, c || g++;
			}
			let m = h + 1;
			for (let t of v(e)) {
				if (!bi(t.if, i.answers, i.variables, n)) continue;
				let e = t.then;
				if (e.action === "jump") {
					m = s.get(e.to);
					break;
				}
				if (e.action === "end") {
					i.endingId = e.to;
					break;
				}
				_(e, i.variables, l, u);
			}
			if (i.endingId) break;
			h = m;
		}
		!i.currentStepId && !i.endingId && (i.endingId = m);
	}
	for (let e of Object.keys(t).sort()) {
		let t = c.get(e);
		t ? ui(t.type) ? (p.add(e), i.errors.push(B("/answers/" + V(e), "display_answer", "Display steps do not store answers.", e))) : f.has(e) || (p.add(e), i.errors.push(B("/answers/" + V(e), "unvisited_answer", "Answers to unvisited steps are not accepted.", e))) : (p.add(e), i.errors.push(B("/answers/" + V(e), "unknown_answer", "The answer key does not exist.", e)));
	}
	if (i.discardedKeys = [...p].sort(), i.endingId) i.progress = 100;
	else if (i.currentStepId && !i.errors.some((e) => e.code === "cff_logic_loop")) {
		let e = new Map(l), t = { ...i.variables }, r = /* @__PURE__ */ new Set(), a = 0, c = s.get(i.currentStepId), d = (e) => "all" in e ? e.all.every(d) : "any" in e ? e.any.every(d) : e.source !== void 0 && e.source !== "answer" || z(i.answers, e.field);
		for (; c < o.length;) {
			let l = o[c];
			if (r.has(l.id)) break;
			if (r.add(l.id), !e.get(l.id)) {
				c++;
				continue;
			}
			!ui(l.type) && l.type !== "hidden" && a++;
			let f = c + 1, p = !1;
			for (let r of v(l)) if (d(r.if) && bi(r.if, i.answers, t, n)) {
				if (r.then.action === "jump") {
					f = s.get(r.then.to);
					break;
				}
				if (r.then.action === "end") {
					p = !0;
					break;
				}
				_(r.then, t, e, new Map(u), []);
			}
			if (p) break;
			c = f;
		}
		i.progress = Math.min(99, Math.floor(100 * g / Math.max(1, g + a)));
	}
	return i;
}
//#endregion
//#region node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var Ci = 0;
Array.isArray;
function X(e, n, r, i, a, o) {
	n || (n = {});
	var s, c, l = n;
	if ("ref" in l) for (c in l = {}, n) c == "ref" ? s = n[c] : l[c] = n[c];
	var u = {
		type: e,
		props: l,
		key: r,
		ref: s,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: void 0,
		__v: --Ci,
		__i: -1,
		__u: 0,
		__source: a,
		__self: o
	};
	if (typeof e == "function" && (s = e.defaultProps)) for (c in s) l[c] === void 0 && (l[c] = s[c]);
	return t.vnode && t.vnode(u), u;
}
//#endregion
//#region assets/src/runtime/content.tsx
function Z(e, t = globalThis.location?.href ?? "https://localhost/") {
	try {
		let n = new URL(e, t);
		return [
			"http:",
			"https:",
			"mailto:",
			"tel:"
		].includes(n.protocol) && !n.username && !n.password ? n.href : null;
	} catch {
		return null;
	}
}
function wi(e, t, n = {}) {
	return e.replace(/\{\{[^{}]+\}\}/g, (e) => encodeURIComponent(yi(e, t, n)));
}
function Ti(e, t) {
	let n = t && typeof t == "object" && !Array.isArray(t) ? t.value : t;
	return (e.options ?? []).filter((e) => e.reaction && (Array.isArray(n) ? n.includes(e.value) : n === e.value)).map((e) => e.reaction);
}
function Ei({ text: e }) {
	let t = [], n = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g, r = 0;
	for (let i of e.matchAll(n)) {
		if (t.push(e.slice(r, i.index)), i[1] && i[2]) {
			let e = Z(i[2]);
			t.push(e ? /* @__PURE__ */ X("a", {
				href: e,
				target: "_blank",
				rel: "noopener noreferrer",
				children: i[1]
			}) : i[1]);
		} else i[3] ? t.push(/* @__PURE__ */ X("strong", { children: i[3] })) : i[4] && t.push(/* @__PURE__ */ X("em", { children: i[4] }));
		r = i.index + i[0].length;
	}
	return t.push(e.slice(r)), /* @__PURE__ */ X(S, { children: t });
}
function Di(e, t, n) {
	if (t == null || t === "") return n("empty");
	if (typeof t == "boolean") return n(t ? "yes" : "no");
	if (e.type === "file_upload") return n("uploadSaved");
	if (e.type === "address" && t && typeof t == "object" && !Array.isArray(t)) return Object.values(t).filter((e) => typeof e == "string").join(", ");
	let r = (t) => {
		if (t && typeof t == "object" && !Array.isArray(t)) {
			let n = t;
			if (typeof n.value == "string" && typeof n.other == "string") return `${e.options?.find((e) => e.value === n.value)?.label ?? n.value}: ${n.other}`;
		}
		return e.options?.find((e) => e.value === t)?.label ?? String(t);
	};
	return Array.isArray(t) ? t.map(r).join(", ") : r(t);
}
//#endregion
//#region assets/src/runtime/registry.ts
var Oi = /* @__PURE__ */ new Map();
function ki(e, t) {
	if (!/^[a-z][a-z0-9_]{0,63}$/.test(e) || typeof t != "function") throw TypeError("Invalid field renderer");
	if (Oi.has(e)) throw Error("Field renderer already registered");
	return Oi.set(e, t), () => {
		Oi.get(e) === t && Oi.delete(e);
	};
}
function Ai(e) {
	return Oi.get(e);
}
//#endregion
//#region assets/src/runtime/phase2-inputs.tsx
function ji(e) {
	let t = e.validation;
	return {
		min: e.type === "nps" ? 0 : typeof t?.min == "number" ? t.min : +!!["rating", "scale"].includes(e.type),
		max: e.type === "nps" ? 10 : typeof t?.max == "number" ? t.max : e.type === "rating" ? 5 : e.type === "scale" ? 10 : 100,
		step: e.type === "slider" ? t?.step ?? 1 : 1
	};
}
function Mi({ step: e, value: t, onAnswer: n, disabled: r, phrase: i, error: a }) {
	let o = ji(e), [s, c] = L(typeof t == "number" ? t : o.min), l = Me(null);
	return e.type !== "slider" && Number.isInteger(o.min) && Number.isInteger(o.max) && o.max >= o.min && o.max - o.min <= 100 ? /* @__PURE__ */ X("div", {
		ref: l,
		role: "group",
		"aria-label": e.label,
		className: "chips scale",
		onKeyDown: (e) => {
			if (![
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End"
			].includes(e.key)) return;
			e.preventDefault();
			let t = [...l.current.querySelectorAll("button")], n = t.indexOf(e.target);
			t[e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (n + (e.key === "ArrowLeft" ? -1 : 1) + t.length) % t.length]?.focus();
		},
		children: Array.from({ length: o.max - o.min + 1 }, (e, t) => t + o.min).map((i) => /* @__PURE__ */ X("button", {
			type: "button",
			className: "chip",
			disabled: r,
			"aria-pressed": t === i,
			"aria-label": `${i}`,
			onClick: () => n(i),
			children: e.type === "rating" ? /* @__PURE__ */ X(S, { children: [
				/* @__PURE__ */ X("span", {
					"aria-hidden": "true",
					children: "★"
				}),
				" ",
				i
			] }) : i
		}, i))
	}) : /* @__PURE__ */ X("form", {
		onSubmit: (e) => {
			e.preventDefault(), n(s);
		},
		children: [
			/* @__PURE__ */ X("label", {
				for: `input-${e.id}`,
				children: e.label
			}),
			/* @__PURE__ */ X("input", {
				id: `input-${e.id}`,
				type: e.type === "slider" ? "range" : "number",
				min: o.min,
				max: o.max,
				step: o.step,
				value: s,
				disabled: r,
				"aria-invalid": !!a,
				"aria-describedby": `help-${e.id} error-${e.id}`,
				onInput: (e) => c(Number(e.currentTarget.value))
			}),
			/* @__PURE__ */ X("output", {
				for: `input-${e.id}`,
				children: [s, e.settings?.unit ?? ""]
			}),
			/* @__PURE__ */ X("button", {
				disabled: r,
				children: i("continue")
			})
		]
	});
}
function Ni({ step: e, value: t, onAnswer: n, disabled: r, phrase: i, error: a }) {
	let o = e.settings?.addressFields ?? [
		"street",
		"city",
		"postcode",
		"country"
	], s = t && typeof t == "object" && !Array.isArray(t) ? t : {}, [c, l] = L(Object.fromEntries(o.map((e) => [e, typeof s[e] == "string" ? s[e] : ""]))), u = {
		street: "street-address",
		city: "address-level2",
		postcode: "postal-code",
		country: "country-name"
	};
	return /* @__PURE__ */ X("form", {
		onSubmit: (e) => {
			e.preventDefault(), n(c);
		},
		children: [
			/* @__PURE__ */ X("fieldset", {
				disabled: r,
				children: [/* @__PURE__ */ X("legend", { children: e.label }), o.map((t) => /* @__PURE__ */ X("label", {
					for: `input-${e.id}-${t}`,
					children: [i(`address_${t}`), /* @__PURE__ */ X("input", {
						id: `input-${e.id}-${t}`,
						value: c[t] ?? "",
						required: e.required,
						maxLength: 500,
						autoComplete: u[t],
						onInput: (e) => l({
							...c,
							[t]: e.currentTarget.value
						})
					})]
				}, t))]
			}),
			a && /* @__PURE__ */ X("p", {
				role: "alert",
				children: a
			}),
			/* @__PURE__ */ X("button", {
				disabled: r,
				children: i("continue")
			})
		]
	});
}
function Pi({ step: e, upload: t, onAnswer: n, disabled: r, phrase: i, value: a, error: o }) {
	let [s, c] = L(!1), [l, u] = L(!1), [d, f] = L(""), p = Math.min(52428800, e.validation?.maxBytes ?? 10485760);
	return /* @__PURE__ */ X("div", { children: [
		/* @__PURE__ */ X("label", {
			for: `input-${e.id}`,
			children: e.label
		}),
		/* @__PURE__ */ X("input", {
			id: `input-${e.id}`,
			type: "file",
			disabled: r || s || !t,
			accept: e.validation?.mimeTypes?.join(","),
			onChange: async (e) => {
				let r = e.currentTarget.files?.[0];
				if (r && t) {
					if (u(!1), r.size > p || r.size < 1) u(!0);
					else {
						c(!0);
						try {
							let e = await t(r);
							f(e.name), n(e.uploadId);
						} catch {
							u(!0);
						} finally {
							c(!1);
						}
					}
				}
			}
		}),
		/* @__PURE__ */ X("small", { children: [
			i("uploadLimit"),
			" ",
			Math.round(p / 1048576 * 10) / 10,
			" MB"
		] }),
		s && /* @__PURE__ */ X("p", {
			role: "status",
			children: i("uploading")
		}),
		l && /* @__PURE__ */ X("p", {
			role: "alert",
			children: i("uploadFailed")
		}),
		o && /* @__PURE__ */ X("p", {
			role: "alert",
			children: o
		}),
		!t && /* @__PURE__ */ X("p", {
			role: "alert",
			children: i("unsupported")
		}),
		(d || typeof a == "string") && /* @__PURE__ */ X("p", { children: d || i("uploadSaved") }),
		(!e.required || typeof a == "string") && /* @__PURE__ */ X("button", {
			disabled: r || s || !t,
			onClick: () => n(a ?? null),
			children: i("continue")
		})
	] });
}
function Fi({ step: e, media: t, disabled: n, onAnswer: r, phrase: i }) {
	let a = e.settings?.media, o = Z((a?.attachmentId ? t?.[a.attachmentId]?.url : a?.url) ?? "");
	return /* @__PURE__ */ X("div", { children: [o && /^https?:/.test(o) && (a?.type === "video" ? /* @__PURE__ */ X("video", {
		controls: !0,
		preload: "metadata",
		src: o,
		"aria-label": a.alt ?? e.label
	}) : /* @__PURE__ */ X("img", {
		src: o,
		alt: a?.alt ?? e.label,
		loading: "lazy"
	})), /* @__PURE__ */ X("button", {
		disabled: n,
		onClick: () => r(null),
		children: e.settings?.buttonLabel ?? i("continue")
	})] });
}
//#endregion
//#region assets/src/runtime/inputs.tsx
function Ii(e, t, n) {
	return e.includes(t) ? e.filter((e) => e !== t) : n.find((e) => e.value === t)?.isExclusive ? [t] : [...e.filter((e) => !n.find((t) => t.value === e)?.isExclusive), t];
}
function Li(e, t = "ID") {
	let n = ai(e, t);
	return n?.isValid() ? n.number : e.trim();
}
function Ri(e) {
	let { step: t, disabled: n, onAnswer: r, phrase: i } = e, a = t.type === "yes_no" ? [{
		id: "yes",
		value: !0,
		label: i("yes")
	}, {
		id: "no",
		value: !1,
		label: i("no")
	}] : t.options ?? [], [o, s] = L(Array.isArray(e.value) ? e.value : []), c = e.value && typeof e.value == "object" && !Array.isArray(e.value) ? e.value : null, [l, u] = L(typeof e.value == "string" ? e.value : typeof c?.value == "string" ? c.value : ""), [d, f] = L(typeof c?.value == "string" ? c.value : ""), [p, m] = L(typeof c?.other == "string" ? c.other : ""), h = Me(null), g = t.type === "multi_choice", _ = (e) => {
		n || (g ? s(Ii(o, String(e), t.options ?? [])) : t.options?.some((t) => t.value === e && t.isOther) ? f(String(e)) : (f(""), r(e)));
	}, v = (a) => /* @__PURE__ */ X("div", {
		className: "other-input",
		children: [/* @__PURE__ */ X("label", {
			for: `other-${t.id}`,
			children: i("other")
		}), /* @__PURE__ */ X("input", {
			id: `other-${t.id}`,
			type: "text",
			value: p,
			maxLength: 1e3,
			disabled: n,
			"aria-invalid": !!e.error,
			"aria-describedby": `help-${t.id} error-${t.id}`,
			onInput: (e) => m(e.currentTarget.value),
			onKeyDown: (e) => {
				e.key === "Enter" && (e.preventDefault(), p.trim() && r({
					value: a,
					other: p
				}));
			}
		})]
	});
	R(() => {
		d && h.current?.querySelector(`#other-${t.id}`)?.focus();
	}, [d, t.id]);
	let y = (e) => {
		if (n || e.altKey || e.ctrlKey || e.metaKey || [
			"INPUT",
			"TEXTAREA",
			"SELECT"
		].includes(e.target.tagName)) return;
		let t = Array.from(h.current?.querySelectorAll(".chip") ?? []), r = t.indexOf(e.target);
		/^[1-9]$/.test(e.key) && a[Number(e.key) - 1] ? (e.preventDefault(), _(a[Number(e.key) - 1].value)) : [
			"ArrowRight",
			"ArrowDown",
			"ArrowLeft",
			"ArrowUp",
			"Home",
			"End"
		].includes(e.key) && (e.preventDefault(), t[e.key === "Home" ? 0 : e.key === "End" ? t.length - 1 : (r + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + t.length) % t.length]?.focus());
	}, b = t.options?.some((e) => e.value === l && e.isOther) === !0;
	return t.settings?.layout === "dropdown" && !g && t.type !== "yes_no" ? /* @__PURE__ */ X("form", {
		onSubmit: (e) => {
			e.preventDefault(), r(b ? {
				value: l,
				other: p
			} : l);
		},
		children: [
			/* @__PURE__ */ X("label", {
				for: `input-${t.id}`,
				children: t.label
			}),
			/* @__PURE__ */ X("select", {
				id: `input-${t.id}`,
				disabled: n,
				value: l,
				onChange: (e) => u(e.currentTarget.value),
				"aria-describedby": `help-${t.id} error-${t.id}`,
				children: [/* @__PURE__ */ X("option", {
					value: "",
					children: t.placeholder ?? i("continue")
				}), a.map((e) => /* @__PURE__ */ X("option", {
					value: String(e.value),
					children: e.label
				}, e.id))]
			}),
			b && v(l),
			/* @__PURE__ */ X("button", {
				disabled: n || !l || b && !p.trim(),
				children: t.settings.buttonLabel ?? i("continue")
			})
		]
	}) : /* @__PURE__ */ X("div", {
		ref: h,
		role: "group",
		"aria-label": t.label,
		onKeyDown: y,
		className: t.settings?.layout === "cards" ? "chips cards" : "chips",
		children: [
			a.map((t) => /* @__PURE__ */ X("button", {
				className: "chip",
				type: "button",
				disabled: n,
				"aria-pressed": g ? o.includes(String(t.value)) : (d || e.value) === t.value,
				onClick: () => _(t.value),
				children: [
					"image" in t && typeof t.image == "number" && e.media?.[t.image] && Z(e.media[t.image].url)?.startsWith("http") && /* @__PURE__ */ X("img", {
						src: Z(e.media[t.image].url),
						alt: e.media[t.image].alt ?? "",
						loading: "lazy"
					}),
					"emoji" in t && typeof t.emoji == "string" && /* @__PURE__ */ X("span", {
						"aria-hidden": "true",
						children: [t.emoji, " "]
					}),
					t.label
				]
			}, t.id)),
			!g && d && /* @__PURE__ */ X("form", {
				onSubmit: (e) => {
					e.preventDefault(), r({
						value: d,
						other: p
					});
				},
				children: [v(d), /* @__PURE__ */ X("button", {
					disabled: n || !p.trim(),
					children: t.settings?.buttonLabel ?? i("continue")
				})]
			}),
			g && /* @__PURE__ */ X("button", {
				className: "continue",
				disabled: n,
				onClick: () => r(o),
				children: t.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function zi({ step: e, value: t, disabled: n, onAnswer: r, phrase: i, error: a }) {
	let [o, s] = L(t == null ? "" : String(t)), c = e.settings?.country ?? "ID", [l, u] = L(si().includes(c) ? c : "ID"), d = Me(null), f = () => r(e.type === "number" ? o.trim() ? Number(o) : null : e.type === "phone" ? Li(o, l) : o);
	R(() => {
		d.current && (d.current.style.height = "auto", d.current.style.height = `${Math.min(240, d.current.scrollHeight)}px`);
	}, [o]);
	let p = e.type === "email" ? "email" : e.type === "phone" ? "tel" : e.type === "number" ? "number" : e.type === "date" ? "date" : "text", m = {
		id: `input-${e.id}`,
		value: o,
		disabled: n,
		placeholder: e.placeholder,
		"aria-invalid": !!a,
		"aria-describedby": `help-${e.id} error-${e.id}`,
		maxLength: e.validation?.maxLength,
		autoComplete: e.settings?.autocomplete ?? (e.type === "email" ? "email" : e.type === "phone" ? "tel-national" : "off"),
		onInput: (e) => s(e.currentTarget.value)
	};
	return /* @__PURE__ */ X("form", {
		noValidate: !0,
		onSubmit: (e) => {
			e.preventDefault(), f();
		},
		children: [
			/* @__PURE__ */ X("label", {
				for: `input-${e.id}`,
				children: e.label
			}),
			e.type === "phone" && /* @__PURE__ */ X("label", {
				className: "country",
				children: [i("country"), /* @__PURE__ */ X("select", {
					value: l,
					disabled: n,
					onChange: (e) => u(e.currentTarget.value),
					children: si().map((e) => /* @__PURE__ */ X("option", {
						value: e,
						children: [
							e,
							" +",
							ci(e)
						]
					}, e))
				})]
			}),
			e.type === "long_text" ? /* @__PURE__ */ X(S, { children: [/* @__PURE__ */ X("textarea", {
				...m,
				ref: d,
				rows: 3,
				onKeyDown: (e) => {
					e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), f());
				}
			}), /* @__PURE__ */ X("small", { children: [
				i("longTextHint"),
				" · ",
				o.length,
				e.validation?.maxLength ? `/${e.validation.maxLength}` : "",
				" ",
				i("characters")
			] })] }) : /* @__PURE__ */ X("div", {
				className: "input-row",
				children: [/* @__PURE__ */ X("input", {
					...m,
					type: p,
					inputMode: e.settings?.inputMode ?? (e.type === "number" ? "decimal" : e.type === "email" ? "email" : e.type === "phone" ? "tel" : "text"),
					min: e.validation?.min,
					max: e.validation?.max,
					step: e.validation?.step ?? (e.type === "number" ? "any" : void 0)
				}), e.settings?.unit && /* @__PURE__ */ X("span", { children: e.settings.unit })]
			}),
			/* @__PURE__ */ X("button", {
				type: "submit",
				disabled: n,
				children: e.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function Bi({ step: e, value: t, disabled: n, onAnswer: r, phrase: i }) {
	let [a, o] = L(t === !0), s = e.settings?.privacyUrl ? Z(e.settings.privacyUrl) : null;
	return /* @__PURE__ */ X("form", {
		onSubmit: (e) => {
			e.preventDefault(), r(a);
		},
		children: [
			/* @__PURE__ */ X("label", {
				className: "consent",
				children: [/* @__PURE__ */ X("input", {
					type: "checkbox",
					disabled: n,
					checked: a,
					onChange: (e) => o(e.currentTarget.checked)
				}), /* @__PURE__ */ X("span", { children: /* @__PURE__ */ X(Ei, { text: e.settings?.consentText ?? e.label }) })]
			}),
			s && /* @__PURE__ */ X("a", {
				href: s,
				target: "_blank",
				rel: "noopener noreferrer",
				children: i("privacy")
			}),
			/* @__PURE__ */ X("button", {
				disabled: n,
				children: e.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function Vi(e) {
	let t = e.step.type, n = Ai(t);
	return n ? /* @__PURE__ */ X(n, { ...e }) : [
		"rating",
		"scale",
		"nps",
		"slider"
	].includes(t) ? /* @__PURE__ */ X(Mi, { ...e }) : t === "address" ? /* @__PURE__ */ X(Ni, { ...e }) : t === "media" ? /* @__PURE__ */ X(Fi, { ...e }) : t === "file_upload" ? /* @__PURE__ */ X(Pi, { ...e }) : [
		"single_choice",
		"multi_choice",
		"yes_no"
	].includes(t) ? /* @__PURE__ */ X(Ri, { ...e }) : t === "consent" ? /* @__PURE__ */ X(Bi, { ...e }) : [
		"short_text",
		"long_text",
		"email",
		"phone",
		"number",
		"date"
	].includes(t) ? /* @__PURE__ */ X(zi, { ...e }) : /* @__PURE__ */ X("p", {
		role: "alert",
		children: e.phrase("unsupported")
	});
}
//#endregion
//#region assets/src/runtime/i18n.ts
var Hi = {
	openChat: "Open chat",
	address_street: "Street address",
	address_city: "City",
	address_postcode: "Postal code",
	address_country: "Country",
	uploading: "Uploading…",
	uploadFailed: "Upload failed. Check file type and size, then try again.",
	uploadSaved: "Uploaded file",
	uploadLimit: "Maximum file size:",
	loading: "Loading chat…",
	continue: "Continue",
	submit: "Submit",
	back: "Back",
	edit: "Edit",
	skip: "Skip",
	yes: "Yes",
	no: "No",
	startOver: "Start over",
	confirmRestart: "Start from the beginning? Your saved answers will be cleared.",
	cancel: "Cancel",
	welcomeBack: "Welcome back. Continue where you left off?",
	newerVersion: "A new version is available. Continue your saved version or start over with the latest version.",
	continueOld: "Continue saved version",
	offline: "You are offline. Answers stay on this device; reconnect to save or submit.",
	unsaved: "Answers on this device have not yet been saved to the server.",
	saved: "Answers saved",
	storageUnavailable: "Browser storage is unavailable. Keep this page open until you finish.",
	error: "We could not save your progress. Please try again.",
	retry: "Try again",
	invalid: "Please check your answer.",
	required: "Please answer this question.",
	consentRequired: "Please agree before continuing.",
	progress: "Progress",
	summary: "Review your answers",
	empty: "Skipped",
	online: "Online",
	typing: "Typing…",
	country: "Country code",
	privacy: "Privacy policy",
	phone: "Phone number",
	longTextHint: "Enter to continue, Shift+Enter for a new line",
	other: "Please specify",
	conflict: "Your session changed in another tab. Choose which answers to keep.",
	useServer: "Use saved answers",
	useLocal: "Keep this tab’s answers",
	expired: "Your session expired. Start over to continue.",
	versionConflict: "Your saved version is unavailable. Your partial is intact; start over to use the latest form.",
	complete: "Thank you. Your response was submitted.",
	redirecting: "Taking you there…",
	close: "Close",
	review: "Review and submit",
	insecure: "This connection is not secure. Use HTTPS before entering personal information.",
	unsupported: "This field is not available in this form.",
	sessionStorage: "To resume, your answers (including personal information) are stored on this device until completion, restart or expiry.",
	submissionPending: "Submission may already have arrived. Retry to confirm; do not start a duplicate response.",
	honeypot: "Leave this field empty",
	characters: "characters",
	preview: "Preview — answers are not sent or saved",
	imageUnavailable: "Option image",
	botAvatar: "Assistant"
}, Ui = {
	openChat: "Buka percakapan",
	address_street: "Alamat jalan",
	address_city: "Kota",
	address_postcode: "Kode pos",
	address_country: "Negara",
	uploading: "Mengunggah…",
	uploadFailed: "Unggah gagal. Periksa jenis dan ukuran berkas, lalu coba lagi.",
	uploadSaved: "Berkas terunggah",
	uploadLimit: "Ukuran berkas maksimum:",
	loading: "Memuat percakapan…",
	continue: "Lanjut",
	submit: "Kirim",
	back: "Kembali",
	edit: "Ubah",
	skip: "Lewati",
	yes: "Ya",
	no: "Tidak",
	startOver: "Mulai ulang",
	confirmRestart: "Mulai dari awal? Jawaban tersimpan Anda akan dihapus.",
	cancel: "Batal",
	welcomeBack: "Selamat datang kembali. Lanjutkan dari jawaban terakhir?",
	newerVersion: "Versi baru tersedia. Lanjutkan versi tersimpan atau mulai ulang dengan versi terbaru.",
	continueOld: "Lanjutkan versi tersimpan",
	offline: "Anda sedang offline. Jawaban tersimpan di perangkat ini; sambungkan kembali untuk menyimpan atau mengirim.",
	unsaved: "Jawaban di perangkat ini belum tersimpan di server.",
	saved: "Jawaban tersimpan",
	storageUnavailable: "Penyimpanan browser tidak tersedia. Biarkan halaman terbuka sampai selesai.",
	error: "Progres belum dapat disimpan. Silakan coba lagi.",
	retry: "Coba lagi",
	invalid: "Mohon periksa jawaban Anda.",
	required: "Mohon jawab pertanyaan ini.",
	consentRequired: "Mohon setujui sebelum melanjutkan.",
	progress: "Progres",
	summary: "Periksa jawaban Anda",
	empty: "Dilewati",
	online: "Online",
	typing: "Sedang mengetik…",
	country: "Kode negara",
	privacy: "Kebijakan privasi",
	phone: "Nomor telepon",
	longTextHint: "Enter untuk lanjut, Shift+Enter untuk baris baru",
	other: "Mohon jelaskan",
	conflict: "Sesi berubah di tab lain. Pilih jawaban yang ingin dipertahankan.",
	useServer: "Gunakan jawaban tersimpan",
	useLocal: "Pertahankan jawaban tab ini",
	expired: "Sesi Anda kedaluwarsa. Mulai ulang untuk melanjutkan.",
	versionConflict: "Versi tersimpan tidak tersedia. Jawaban parsial tetap tersimpan; mulai ulang untuk versi terbaru.",
	complete: "Terima kasih. Jawaban Anda sudah terkirim.",
	redirecting: "Mengalihkan halaman…",
	close: "Tutup",
	review: "Periksa dan kirim",
	insecure: "Koneksi ini tidak aman. Gunakan HTTPS sebelum memasukkan data pribadi.",
	unsupported: "Kolom ini tidak tersedia dalam formulir.",
	sessionStorage: "Untuk melanjutkan nanti, jawaban (termasuk data pribadi) disimpan di perangkat ini hingga selesai, mulai ulang, atau kedaluwarsa.",
	submissionPending: "Jawaban mungkin sudah diterima. Coba lagi untuk memastikan; jangan buat jawaban duplikat.",
	honeypot: "Biarkan kolom ini kosong",
	characters: "karakter",
	preview: "Pratinjau — jawaban tidak dikirim atau disimpan",
	imageUnavailable: "Gambar pilihan",
	botAvatar: "Asisten"
};
function Wi(e = "en", t = {}) {
	return (n) => t[n] ?? (/^id(?:[-_]|$)/i.test(e) ? Ui[n] : void 0) ?? globalThis.window?.wp?.i18n?.__(Hi[n] ?? n, "chatflow-forms") ?? Hi[n] ?? n;
}
//#endregion
//#region assets/src/runtime/chat.tsx
function Gi(e, t = "normal", n = !1) {
	return n || t === "off" ? 0 : Math.min(1200, Math.max(400, e * (t === "fast" ? 10 : t === "slow" ? 30 : 20)));
}
function Ki({ controller: e, onClose: t }) {
	let [, n] = L(0), [r, i] = L(0), [a, o] = L(!1), [s, c] = L(""), [l, u] = L(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1), d = Me(null), f = Me(null), p = e.state, m = p.form?.form, h = Wi(e.options.locale ?? globalThis.document?.documentElement.lang ?? "en", m?.phrases), g = e.activeStep, _ = g?.messages ?? [], v = r >= _.length, y = (t) => yi(t, p.answers, e.meta);
	je(() => e.subscribe(() => n((e) => e + 1)), [e]), R(() => {
		let e = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)"), t = () => u(e?.matches ?? !1);
		return e?.addEventListener("change", t), () => e?.removeEventListener("change", t);
	}, []), R(() => {
		i(0);
	}, [p.activeId]), R(() => {
		if (p.phase !== "ready" || r >= _.length) return;
		let e = setTimeout(() => i((e) => e + 1), Gi(_[r]?.length ?? 0, m?.schema.bot.typingSpeed, l));
		return () => clearTimeout(e);
	}, [
		p.activeId,
		p.phase,
		r,
		_.length,
		l,
		m?.schema.bot.typingSpeed
	]), R(() => {
		if (v && p.phase === "ready" && ((d.current?.querySelector("input:not([type=hidden]),textarea,select,button"))?.focus({ preventScroll: !0 }), g?.type === "statement" && g.settings?.autoContinue)) {
			let t = setTimeout(() => {
				e.answer(null);
			}, l ? 0 : 250);
			return () => clearTimeout(t);
		}
	}, [
		p.activeId,
		v,
		p.phase,
		g?.settings?.autoContinue,
		l,
		e
	]), R(() => {
		f.current?.scrollIntoView?.({
			behavior: l ? "auto" : "smooth",
			block: "nearest"
		});
	}, [
		r,
		p.activeId,
		p.error,
		p.phase,
		l
	]), R(() => {
		let t = p.completion;
		if (e.options.preview || p.phase !== "done" || !t?.redirectUrl) return;
		let n = Z(t.redirectUrl);
		if (!n || !/^https?:/.test(n)) return;
		let r = m?.schema.endings.find((e) => e.id === t.ending.id), i = setTimeout(() => location.assign(n), Math.min(3e4, Math.max(0, r?.delayMs ?? 0)));
		return () => clearTimeout(i);
	}, [
		p.completion,
		p.phase,
		e,
		m
	]);
	let b = (e, t) => /* @__PURE__ */ X("div", {
		className: "bubble bot",
		children: /* @__PURE__ */ X(Ei, { text: y(e) })
	}, t), x = () => /* @__PURE__ */ X("section", {
		className: "summary",
		"aria-label": h("summary"),
		children: [/* @__PURE__ */ X("h2", { children: h("summary") }), /* @__PURE__ */ X("dl", { children: (p.path?.visited ?? []).map((e) => m?.schema.steps.find((t) => t.id === e)).filter((e) => !!e && ![
			"hidden",
			"statement",
			"summary",
			"media"
		].includes(e.type) && Object.prototype.hasOwnProperty.call(p.answers, e.key)).map((t) => /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ X("dt", { children: t.label }), /* @__PURE__ */ X("dd", { children: [
			Di(t, p.answers[t.key], h),
			" ",
			/* @__PURE__ */ X("button", {
				className: "link-button",
				disabled: p.busy,
				onClick: () => e.edit(t.id),
				"aria-label": `${h("edit")}: ${t.label}`,
				children: h("edit")
			})
		] })] }, t.id)) })]
	}), C = /* @__PURE__ */ X("button", {
		disabled: p.busy || p.error === "submissionPending",
		onClick: () => o(!0),
		children: h("startOver")
	}), w = p.error && /* @__PURE__ */ X("div", {
		className: "notice",
		role: "alert",
		children: [/* @__PURE__ */ X("p", { children: h(p.error) }), !p.conflict && /* @__PURE__ */ X("button", {
			disabled: p.busy || p.offline,
			onClick: () => void e.retry(),
			children: h("retry")
		})]
	}), T = m?.schema.bot.avatar ? m.media?.[m.schema.bot.avatar] : null, E = T ? Z(T.url) : null;
	return /* @__PURE__ */ X("section", {
		className: `chat ${e.options.mode === "fullpage" ? "fullpage" : ""}`,
		dir: globalThis.document?.documentElement.dir === "rtl" ? "rtl" : "ltr",
		"aria-label": m?.title ?? "ChatFlow",
		"aria-busy": p.busy,
		children: [
			/* @__PURE__ */ X("header", { children: [/* @__PURE__ */ X("div", {
				className: "identity",
				children: [E && /^https?:/.test(E) && /* @__PURE__ */ X("img", {
					src: E,
					alt: T?.alt ?? h("botAvatar")
				}), /* @__PURE__ */ X("div", { children: [/* @__PURE__ */ X("strong", { children: m?.schema.bot.name ?? "ChatFlow" }), /* @__PURE__ */ X("small", { children: [/* @__PURE__ */ X("span", {
					className: "online-dot",
					"aria-hidden": "true"
				}), h(p.offline ? "offline" : "online")] })] })]
			}), /* @__PURE__ */ X("nav", {
				"aria-label": h("back"),
				children: [/* @__PURE__ */ X("button", {
					disabled: p.busy || p.phase !== "ready" || !e.visibleSteps.some((e) => e.id !== p.activeId && Object.prototype.hasOwnProperty.call(p.answers, e.key)),
					onClick: () => e.back(),
					children: h("back")
				}), C]
			})] }),
			/* @__PURE__ */ X("div", {
				className: "progress",
				role: "progressbar",
				"aria-label": h("progress"),
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": Math.round(p.phase === "done" ? 100 : p.path?.progress ?? 0),
				children: /* @__PURE__ */ X("span", { style: { width: `${p.phase === "done" ? 100 : p.path?.progress ?? 0}%` } })
			}),
			e.options.preview && /* @__PURE__ */ X("p", {
				className: "notice",
				children: h("preview")
			}),
			!e.options.preview && globalThis.location?.protocol === "http:" && !["localhost", "127.0.0.1"].includes(location.hostname) && /* @__PURE__ */ X("p", {
				className: "notice",
				role: "alert",
				children: h("insecure")
			}),
			/* @__PURE__ */ X("main", {
				className: "conversation",
				children: [
					a && /* @__PURE__ */ X("section", {
						className: "notice",
						role: "alertdialog",
						"aria-modal": "false",
						"aria-label": h("confirmRestart"),
						children: [
							/* @__PURE__ */ X("p", { children: h("confirmRestart") }),
							/* @__PURE__ */ X("button", {
								disabled: p.offline || p.busy,
								onClick: () => {
									o(!1), e.restart();
								},
								children: h("startOver")
							}),
							/* @__PURE__ */ X("button", {
								onClick: () => o(!1),
								children: h("cancel")
							})
						]
					}),
					p.phase === "loading" && /* @__PURE__ */ X("p", {
						role: "status",
						children: h("loading")
					}),
					p.phase === "resume" && /* @__PURE__ */ X("section", {
						className: "notice",
						children: [
							/* @__PURE__ */ X("p", { children: h(p.newerVersion ? "newerVersion" : "welcomeBack") }),
							/* @__PURE__ */ X("button", {
								disabled: p.busy,
								onClick: () => void e.continueSaved(),
								children: h(p.newerVersion ? "continueOld" : "continue")
							}),
							C
						]
					}),
					p.phase !== "resume" && e.visibleSteps.map((t) => /* @__PURE__ */ X("section", {
						className: "step",
						"aria-label": t.label,
						children: [
							(t.id === p.activeId && p.phase === "ready" ? t.messages.slice(0, r) : t.messages).map((e, t) => b(e, t)),
							t.id !== p.activeId && Object.prototype.hasOwnProperty.call(p.answers, t.key) && /* @__PURE__ */ X("button", {
								className: "bubble user",
								disabled: p.busy || p.phase !== "ready",
								onClick: () => e.edit(t.id),
								"aria-label": `${h("edit")}: ${t.label}: ${Di(t, p.answers[t.key], h)}`,
								children: [Di(t, p.answers[t.key], h), /* @__PURE__ */ X("small", { children: h("edit") })]
							}),
							t.id !== p.activeId && Ti(t, p.answers[t.key]).map((e, t) => b(e, `reaction-${t}`))
						]
					}, t.id)),
					/* @__PURE__ */ X("div", {
						className: "sr-only",
						"aria-live": "polite",
						"aria-atomic": "true",
						children: p.phase === "ready" ? y(_[r - 1] ?? "") : p.phase === "done" ? h("complete") : ""
					}),
					p.phase === "ready" && g && /* @__PURE__ */ X("div", {
						ref: d,
						className: "active",
						children: [!v && /* @__PURE__ */ X("div", {
							className: "typing bubble bot",
							role: "status",
							"aria-label": h("typing"),
							children: [
								/* @__PURE__ */ X("i", {}),
								/* @__PURE__ */ X("i", {}),
								/* @__PURE__ */ X("i", {})
							]
						}), v && /* @__PURE__ */ X(S, { children: [
							g.helpText && /* @__PURE__ */ X("p", {
								id: `help-${g.id}`,
								className: "help",
								children: /* @__PURE__ */ X(Ei, { text: y(g.helpText) })
							}),
							p.fieldError && /* @__PURE__ */ X("p", {
								id: `error-${g.id}`,
								className: "bubble bot",
								role: "alert",
								children: h(p.fieldError)
							}),
							g.type === "summary" && x(),
							["statement", "summary"].includes(g.type) ? /* @__PURE__ */ X("button", {
								disabled: p.busy,
								onClick: async () => {
									await e.answer(null), g.type === "summary" && !e.state.activeId && await e.submit(s);
								},
								children: g.settings?.buttonLabel ?? h(g.type === "summary" ? "submit" : "continue")
							}) : /* @__PURE__ */ X(Vi, {
								step: {
									...g,
									label: y(g.label),
									settings: {
										...g.settings,
										...g.settings?.consentText ? { consentText: y(g.settings.consentText) } : {}
									}
								},
								value: e.inputValue(g),
								disabled: p.busy || p.conflict || !!p.completion,
								phrase: h,
								onAnswer: (t) => void e.answer(t),
								...p.form?.features.uploads && !e.options.preview ? { upload: (t) => e.upload(g, t) } : {},
								...p.fieldError ? { error: h(p.fieldError) } : {},
								...m?.media ? { media: m.media } : {}
							}, `${g.id}:${JSON.stringify(e.inputValue(g))}`),
							e.canSkip && /* @__PURE__ */ X("button", {
								className: "link-button",
								disabled: p.busy || p.conflict,
								onClick: () => void e.answer(null),
								children: h("skip")
							})
						] })]
					}, g.id),
					p.phase === "ready" && !g && /* @__PURE__ */ X("div", {
						ref: d,
						children: [x(), /* @__PURE__ */ X("button", {
							disabled: p.busy || p.offline || p.conflict,
							onClick: () => void e.submit(s),
							children: h(p.error === "submissionPending" ? "retry" : "submit")
						})]
					}),
					p.phase === "submitting" && /* @__PURE__ */ X("p", {
						role: "status",
						children: h("loading")
					}),
					p.phase === "done" && p.completion && /* @__PURE__ */ X("section", {
						className: "ending",
						"aria-label": h("complete"),
						children: [
							p.completion.ending.messages.map((e, t) => b(e, t)),
							p.completion.redirectUrl && !e.options.preview && /* @__PURE__ */ X("p", {
								role: "status",
								children: h("redirecting")
							}),
							p.completion.ending.buttons.map((n) => {
								let r = n.url ? Z(wi(n.url, p.answers, e.meta)) : null;
								return n.action === "restart" ? /* @__PURE__ */ X("button", {
									onClick: () => o(!0),
									children: y(n.label)
								}, n.id) : n.action === "close" ? /* @__PURE__ */ X("button", {
									onClick: t,
									children: y(n.label)
								}, n.id) : n.action === "link" && r ? /* @__PURE__ */ X("a", {
									className: "button",
									href: r,
									target: "_blank",
									rel: "noopener noreferrer",
									children: y(n.label)
								}, n.id) : null;
							})
						]
					}),
					p.conflict && /* @__PURE__ */ X("section", {
						className: "notice",
						role: "alert",
						children: [
							/* @__PURE__ */ X("p", { children: h("conflict") }),
							/* @__PURE__ */ X("button", {
								disabled: p.busy || p.offline,
								onClick: () => void e.resolveConflict(!1),
								children: h("useServer")
							}),
							/* @__PURE__ */ X("button", {
								disabled: p.busy || p.offline,
								onClick: () => void e.resolveConflict(!0),
								children: h("useLocal")
							})
						]
					}),
					w,
					/* @__PURE__ */ X("div", { ref: f })
				]
			}),
			!e.options.preview && /* @__PURE__ */ X(S, { children: [/* @__PURE__ */ X("label", {
				className: "honeypot",
				"aria-hidden": "true",
				children: [h("honeypot"), /* @__PURE__ */ X("input", {
					type: "text",
					name: "cff_website_check",
					maxLength: 255,
					autoComplete: "off",
					tabIndex: -1,
					value: s,
					onInput: (e) => c(e.currentTarget.value)
				})]
			}), /* @__PURE__ */ X("footer", {
				"aria-live": "polite",
				children: [p.offline ? h("offline") : p.storageUnavailable ? h("storageUnavailable") : p.dirty ? h("unsaved") : h("saved"), m?.session.resumeEnabled && /* @__PURE__ */ X("small", { children: h("sessionStorage") })]
			})] })
		]
	});
}
//#endregion
//#region assets/src/runtime/persistence.ts
var qi = class {
	constructor(e = Ji(), t = globalThis.document, n = globalThis.location?.protocol === "https:", r = () => Date.now()) {
		N(this, "store", void 0), N(this, "doc", void 0), N(this, "secure", void 0), N(this, "now", void 0), this.store = e, this.doc = t, this.secure = n, this.now = r;
	}
	key(e, t) {
		return `cff:session:${e}:${t}`;
	}
	read(e) {
		try {
			if (!this.store) return null;
			let t = null;
			for (let n = this.store.length - 1; n >= 0; n--) {
				let r = this.store.key(n);
				if (!r?.startsWith(`cff:session:${e}:`)) continue;
				let i = JSON.parse(this.store.getItem(r) ?? "null");
				!Yi(i) || i.formId !== e || Date.parse(i.expiresAt) <= this.now() ? this.store.removeItem(r) : (!t || i.version > t.version) && (t = i);
			}
			return t;
		} catch {
			return null;
		}
	}
	credential(e) {
		let t = this.read(e);
		if (t) return t.resumeToken;
		try {
			let t = this.doc?.cookie.split(";").map((e) => e.trim()).find((t) => t.startsWith(`cff_s_${e}=`)), n = t ? decodeURIComponent(t.slice(t.indexOf("=") + 1)) : null;
			return !n || !/^r1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+$/.test(n) ? null : Number(n.split(".")[2]) * 1e3 <= this.now() ? (this.clear(e), null) : n;
		} catch {
			return null;
		}
	}
	write(e) {
		if (Date.parse(e.expiresAt) <= this.now()) return this.clear(e.formId), !1;
		let t = !1;
		try {
			this.store?.setItem(this.key(e.formId, e.version), JSON.stringify(e)), t = !!this.store;
		} catch {}
		try {
			this.doc && (this.doc.cookie = `cff_s_${e.formId}=${encodeURIComponent(e.resumeToken)}; Path=/; Max-Age=${Math.max(0, Math.floor((Date.parse(e.expiresAt) - this.now()) / 1e3))}; SameSite=Lax${this.secure ? "; Secure" : ""}`);
		} catch {}
		return t;
	}
	clear(e) {
		try {
			if (this.store) for (let t = this.store.length - 1; t >= 0; t--) {
				let n = this.store.key(t);
				n?.startsWith(`cff:session:${e}:`) && this.store.removeItem(n);
			}
		} catch {}
		try {
			this.doc && (this.doc.cookie = `cff_s_${e}=; Path=/; Max-Age=0; SameSite=Lax${this.secure ? "; Secure" : ""}`);
		} catch {}
	}
};
function Ji() {
	try {
		return globalThis.localStorage;
	} catch {
		return;
	}
}
function Yi(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Number.isSafeInteger(t.formId) && Number.isSafeInteger(t.version) && typeof t.sessionId == "string" && typeof t.resumeToken == "string" && /^r1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+$/.test(t.resumeToken) && typeof t.expiresAt == "string" && Number.isFinite(Date.parse(t.expiresAt)) && Number.isSafeInteger(t.revision) && !!t.answers && typeof t.answers == "object" && !Array.isArray(t.answers) && Array.isArray(t.acknowledged) && t.acknowledged.every((e) => typeof e == "string") && typeof t.dirty == "boolean" && !!t.stepTimings && typeof t.stepTimings == "object";
}
//#endregion
//#region assets/src/tracking/index.ts
var Xi = "cff_ft";
function Zi(e) {
	return !!e.enabled && !(e.consentRequired && !e.consentGranted) && (e.respectDnt === !1 || globalThis.navigator?.doNotTrack !== "1");
}
var Qi = [
	"source",
	"medium",
	"campaign",
	"term",
	"content"
], $i = [
	"gclid",
	"fbclid",
	"msclkid",
	"ttclid"
];
function ea(e) {
	try {
		let t = new URL(e);
		return ["http:", "https:"].includes(t.protocol) ? `${t.origin}${t.pathname}`.slice(0, 2048) : "";
	} catch {
		return "";
	}
}
function ta(e = {}, t = Ji(), n = {
	href: globalThis.location?.href ?? "",
	referrer: globalThis.document?.referrer ?? ""
}, r = Date.now()) {
	if (!Zi(e)) return ia(t), {};
	try {
		let e = JSON.parse(t?.getItem("cff_ft") ?? "null");
		if (e && typeof e == "object" && Number(e.expiresAt) > r && Number(e.expiresAt) <= r + 7776e6) return na(e);
	} catch {}
	let i;
	try {
		i = new URL(n.href || "https://localhost/");
	} catch {
		return {};
	}
	if (!["http:", "https:"].includes(i.protocol)) return {};
	let a = {}, o = {};
	for (let e of Qi) {
		let t = i.searchParams.get(`utm_${e}`);
		t && (a[e] = t.slice(0, 255));
	}
	for (let e of $i) {
		let t = i.searchParams.get(e);
		t && (o[e] = t.slice(0, 255));
	}
	let s = {
		landingPage: ea(n.href),
		landingReferrer: ea(n.referrer),
		utm: a,
		clickIds: o,
		expiresAt: r + Math.min(90, Math.max(1, Number.isFinite(e.days) ? e.days : 30)) * 864e5
	};
	try {
		t?.setItem(Xi, JSON.stringify(s));
	} catch {}
	return na(s);
}
function na(e) {
	let t = {}, n = {};
	for (let n of Qi) typeof e.utm?.[n] == "string" && (t[n] = e.utm[n].slice(0, 255));
	for (let t of $i) typeof e.clickIds?.[t] == "string" && (n[t] = e.clickIds[t].slice(0, 255));
	return {
		landingPage: ea(e.landingPage ?? ""),
		landingReferrer: ea(e.landingReferrer ?? ""),
		utm: t,
		clickIds: n
	};
}
function ra(e = {}) {
	return Zi(e) ? {
		...ta(e),
		pageTitle: globalThis.document?.title?.slice(0, 500) ?? "",
		pageUrl: ea(globalThis.location?.href ?? ""),
		referrer: ea(globalThis.document?.referrer ?? ""),
		locale: globalThis.navigator?.language?.slice(0, 35) ?? "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		screen: globalThis.screen ? `${screen.width}x${screen.height}` : ""
	} : (ia(), {});
}
function ia(e = Ji()) {
	try {
		e?.removeItem(Xi);
	} catch {}
}
typeof window < "u" && window.cffTracking?.enabled && ta(window.cffTracking);
//#endregion
//#region assets/src/runtime/engagement.ts
function aa(e, t, n) {
	let r = globalThis.navigator;
	return e.enabled && !n && !r?.globalPrivacyControl && !(e.respectDnt && r?.doNotTrack === "1") && (!e.consentRequired || t);
}
var oa = class {
	constructor(e, t, n, r) {
		N(this, "api", void 0), N(this, "config", void 0), N(this, "consent", void 0), N(this, "optOut", void 0), N(this, "events", []), N(this, "sent", 0), N(this, "busy", !1), this.api = e, this.config = t, this.consent = n, this.optOut = r;
	}
	add(e) {
		aa(this.config, this.consent(), this.optOut()) && this.events.length + this.sent < 200 && this.events.push(e);
	}
	async flush(e) {
		if (!this.busy) {
			if (!aa(this.config, this.consent(), this.optOut())) this.events = [];
			else {
				this.busy = !0;
				try {
					for (; this.events.length;) {
						let t = this.events.splice(0, 10);
						this.sent += t.length, await this.api.request(`sessions/${e.sessionId}/events`, "POST", {
							events: t,
							consentGranted: this.consent(),
							optOut: this.optOut()
						}, { "X-CFF-Request-Token": e.requestToken });
					}
				} catch {
					this.events = [];
				} finally {
					this.busy = !1;
				}
			}
		}
	}
}, Q = (e) => [
	"statement",
	"summary",
	"media"
].includes(e.type), sa = class {
	async loadEngagement() {
		this.state.form && !this.options.preview && this.engagementVersion !== this.state.form.form.version && (this.engagement = null, this.analytics = null, this.state.form.features.engagement && (this.engagement = await this.api.request(`forms/${this.state.form.form.id}/engagement`, "GET", void 0, {}, "no-store", this.state.form.form.version), this.analytics = new oa(this.api, this.engagement.analytics, () => !!(this.options.tracking ?? globalThis.window?.cffTracking)?.consentGranted, () => {
			try {
				return this.options.analyticsOptOut === !0 || localStorage.getItem("cff_analytics_optout") === "1";
			} catch {
				return this.options.analyticsOptOut === !0;
			}
		})), this.engagementVersion = this.state.form.form.version);
	}
	constructor(e, t, n = new qi(), r = () => {}) {
		N(this, "options", void 0), N(this, "api", void 0), N(this, "storage", void 0), N(this, "emit", void 0), N(this, "state", {
			phase: "loading",
			form: null,
			answers: {},
			path: null,
			activeId: null,
			acknowledged: [],
			busy: !1,
			dirty: !1,
			offline: !1,
			error: null,
			fieldError: null,
			conflict: !1,
			newerVersion: !1,
			storageUnavailable: !1,
			completion: null
		}), N(this, "listeners", /* @__PURE__ */ new Set()), N(this, "session", null), N(this, "context", {
			hidden: {},
			url: {},
			meta: {},
			now: (/* @__PURE__ */ new Date()).toISOString()
		}), N(this, "pending", null), N(this, "pendingStart", null), N(this, "saved", null), N(this, "latest", null), N(this, "stepStarted", Date.now()), N(this, "timings", {}), N(this, "disposed", !1), N(this, "submittedOnce", !1), N(this, "editing", null), N(this, "prefill", void 0), N(this, "engagement", null), N(this, "analytics", null), N(this, "engagementVersion", 0), this.options = e, this.api = t, this.storage = n, this.emit = r, this.prefill = e.prefill ?? {}, e.preview && e.context && (this.context = e.context);
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	dispose() {
		this.disposed = !0, this.listeners.clear();
	}
	notify() {
		if (!this.disposed) for (let e of this.listeners) e();
	}
	event(e, t = {}) {
		!this.options.preview && this.state.form && (this.emit(e, {
			formId: this.state.form.form.id,
			version: this.state.form.form.version,
			...t
		}), e === "cff:step" && typeof t.stepId == "string" && this.state.form.form.session.savePartial !== !1 && this.analytics?.add({
			event: "view",
			stepId: t.stepId
		}), e === "cff:start" && (this.analytics?.add({ event: "view" }), this.session && this.analytics?.flush(this.session)));
	}
	close() {
		this.session && this.state.phase !== "done" && (this.analytics?.add({
			event: "abandon",
			...this.state.activeId && this.state.form?.form.session.savePartial !== !1 ? { stepId: this.state.activeId } : {}
		}), this.analytics?.flush(this.session));
	}
	async upload(e, t) {
		if (!this.session || !this.api || !this.state.form?.features.uploads || this.options.preview || this.state.offline || this.state.busy || this.state.conflict) throw new P("cff_upload_unavailable", 0);
		return this.api.upload(this.session, e.id, t);
	}
	async initialize() {
		try {
			let e = this.options.form?.form.id ?? this.options.formId;
			if (!this.options.preview && e && (this.saved = this.storage.read(e)), this.state.form = this.options.form ?? await this.api.form(this.options.formId), this.disposed) return;
			if (this.latest = this.state.form, this.options.preview) {
				this.state.phase = "ready", this.compute();
				return;
			}
			await this.loadEngagement();
			let t = this.state.form.form;
			this.saved = t.session.resumeEnabled ? this.storage.read(t.id) : null;
			let n = t.session.resumeEnabled ? this.storage.credential(t.id) : null;
			if (n) {
				await this.adopt(await this.api.resume(t.id, n)), this.saved?.dirty && this.saved.sessionId === this.session?.sessionId && (this.state.answers = this.saved.answers, this.state.dirty = !0, this.state.conflict = this.saved.revision !== this.session.revision, this.timings = this.saved.stepTimings), this.state.acknowledged = this.saved?.acknowledged ?? this.displayBeforeCurrent(), this.compute(), this.state.newerVersion = this.latest.form.version !== this.session?.version, this.state.phase = t.session.resumePrompt || this.state.newerVersion ? "resume" : "ready", this.state.phase === "ready" && this.state.dirty && !this.state.conflict && await this.flush();
				return;
			}
			await this.start();
		} catch (e) {
			e instanceof P && e.code === "cff_network" && this.saved?.form && this.saved.context && !this.options.preview ? (this.state.form = this.saved.form, this.context = this.saved.context, this.state.answers = this.saved.answers, this.state.acknowledged = this.saved.acknowledged, this.state.dirty = this.saved.dirty, this.timings = this.saved.stepTimings, this.state.offline = !0, this.state.phase = "resume", this.compute()) : this.handle(e);
		} finally {
			this.notify();
		}
	}
	displayBeforeCurrent() {
		let e = this.state.form.form.schema.steps;
		return (this.session?.visited ?? []).filter((t) => t !== this.session?.currentStepId && e.some((e) => e.id === t && Q(e)));
	}
	async adopt(e) {
		if (!this.disposed) {
			if (!this.state.form || e.formId !== this.state.form.form.id || !e.context?.now || !Number.isFinite(Date.parse(e.context.now))) throw new P("cff_invalid_response", 0);
			if (e.status !== "active") throw this.storage.clear(e.formId), new P("cff_session_expired", 401);
			if (e.version !== this.state.form.form.version) {
				let t = await this.api.form(e.formId, e.version);
				if (this.disposed) return;
				if (t.form.version !== e.version) throw new P("cff_version_conflict", 409);
				this.state.form = t;
			}
			await this.loadEngagement(), !this.disposed && (this.session = e, this.context = e.context ?? this.context, this.state.answers = e.answers, this.compute());
		}
	}
	async start() {
		if (!(this.state.busy || this.disposed)) {
			this.state.busy = !0, this.state.error = null, this.notify();
			try {
				let e = this.state.form.form;
				if (this.options.preview) this.compute();
				else {
					if (!this.pendingStart) {
						let t = await this.api.startToken(e.id, e.version);
						if (this.disposed) return;
						if (t.version !== e.version) throw new P("cff_version_conflict", 409);
						this.pendingStart = {
							token: t.startToken,
							key: ge(),
							meta: ra(this.options.tracking ?? globalThis.window?.cffTracking),
							prefill: {},
							version: e.version
						};
					}
					let t = this.pendingStart;
					if (await this.adopt(await this.api.start(e.id, t.version, t.meta, t.prefill, t.token, t.key)), this.disposed) return;
					this.pendingStart = null;
				}
				this.state.phase = this.state.path?.errors.length ? "error" : "ready", this.persist(), this.event("cff:start");
			} catch (e) {
				this.handle(e);
			} finally {
				this.state.busy = !1, this.notify();
			}
		}
	}
	async continueSaved() {
		this.state.phase = this.state.path?.errors.length ? "error" : "ready", this.notify(), this.event("cff:start", { resumed: !0 }), this.state.dirty && !this.state.conflict && await this.flush();
	}
	compute() {
		let e = this.state.form;
		if (!e) return;
		let t = Si(e.form.schema, this.state.answers, this.context, "partial");
		if (t.discardedKeys.length) {
			let n = { ...this.state.answers };
			for (let e of t.discardedKeys) delete n[e];
			t = Si(e.form.schema, n, this.context, "partial");
		}
		this.state.path = t, this.state.answers = t.answers, t.errors.length && (this.state.error = "invalid", this.state.phase = "error");
		let n = this.editing ?? t.visited.find((t) => e.form.schema.steps.some((e) => e.id === t && Q(e)) && !this.state.acknowledged.includes(t)) ?? t.currentStepId;
		this.state.activeId !== n && (this.state.activeId = n ?? null, this.stepStarted = Date.now(), n && this.event("cff:step", { stepId: n })), this.notify();
	}
	get activeStep() {
		return this.state.form?.form.schema.steps.find((e) => e.id === this.state.activeId);
	}
	get canSkip() {
		let e = this.activeStep;
		if (!e || e.type === "consent" || Q(e)) return !1;
		let t = Si(this.state.form.form.schema, {
			...this.state.answers,
			[e.key]: null
		}, this.context, "partial");
		return t.currentStepId !== e.id && !t.errors.some((t) => t.fieldKey === e.key);
	}
	get meta() {
		return this.context.meta ?? {};
	}
	get visibleSteps() {
		let e = this.state.form;
		if (!e || !this.state.path) return [];
		let t = this.state.path.visited.indexOf(this.state.activeId ?? "");
		return this.state.path.visited.slice(0, t < 0 ? void 0 : t + 1).map((t) => e.form.schema.steps.find((e) => e.id === t)).filter((e) => e && e.type !== "hidden");
	}
	async answer(e) {
		let t = this.activeStep;
		if (!t || this.state.busy || this.pending?.method === "POST" || this.state.conflict) return;
		if (this.state.fieldError = null, Q(t)) {
			this.timings[t.id] = (this.timings[t.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted), this.state.acknowledged = [.../* @__PURE__ */ new Set([...this.state.acknowledged, t.id])], this.compute(), this.persist();
			return;
		}
		let n = {
			...this.state.answers,
			[t.key]: e
		}, r = Si(this.state.form.form.schema, n, this.context, "partial"), i = r.errors.find((e) => e.fieldKey === t.key);
		i || r.currentStepId === t.id ? (this.state.fieldError = i?.code === "required" || i?.code === "cff_required" ? "required" : "invalid", this.notify()) : (this.timings[t.id] = (this.timings[t.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted), this.state.answers = n, this.editing = null, this.state.dirty = !0, this.compute(), this.persist(), this.state.form.form.session.savePartial !== !1 && await this.flush(), this.session && !this.state.dirty && (this.analytics?.add({
			event: "answer",
			stepId: t.id
		}), this.analytics?.flush(this.session)));
	}
	edit(e) {
		if (this.state.busy || this.state.phase !== "ready" || this.pending?.method === "POST") return;
		let t = this.state.path, n = this.state.form?.form.schema.steps.find((t) => t.id === e);
		if (!t?.visited.includes(e) || !n || Q(n) || n.type === "hidden") return;
		this.editing = e, this.state.fieldError = null;
		let r = t.visited.indexOf(e);
		this.state.acknowledged = this.state.acknowledged.filter((e) => t.visited.indexOf(e) < r), this.compute();
	}
	back() {
		let e = this.visibleSteps.filter((e) => !Q(e) && e.id !== this.state.activeId && Object.prototype.hasOwnProperty.call(this.state.answers, e.key)), t = e[e.length - 1];
		t && (this.edit(t.id), this.session && (this.analytics?.add({
			event: "back",
			stepId: t.id
		}), this.analytics?.flush(this.session)));
	}
	prefillAnswers(e) {
		this.state.phase !== "done" && this.pending?.method !== "POST" && (this.prefill = {
			...this.prefill,
			...e
		}, this.notify());
	}
	inputValue(e) {
		return this.state.answers[e.key] ?? this.prefill[e.key] ?? e.defaultValue;
	}
	inputAnswers() {
		let e = new Set(this.state.form.form.schema.steps.filter((e) => !Q(e) && e.type !== "hidden").map((e) => e.key));
		return Object.fromEntries(Object.entries(this.state.answers).filter(([t]) => e.has(t)));
	}
	persist() {
		!this.session && this.saved && this.state.offline && !this.options.preview ? (this.saved = {
			...this.saved,
			answers: this.state.answers,
			acknowledged: this.state.acknowledged,
			dirty: this.state.dirty,
			stepTimings: this.timings
		}, this.state.storageUnavailable = !this.storage.write(this.saved)) : !this.options.preview && this.state.form?.form.session.resumeEnabled && this.session?.resumeToken && this.session.resumeExpiresAt && (this.state.storageUnavailable = !this.storage.write({
			formId: this.session.formId,
			version: this.session.version,
			sessionId: this.session.sessionId,
			resumeToken: this.session.resumeToken,
			expiresAt: this.session.resumeExpiresAt,
			revision: this.session.revision,
			answers: this.state.answers,
			acknowledged: this.state.acknowledged,
			dirty: this.state.dirty,
			stepTimings: this.timings,
			form: this.state.form,
			context: this.context
		}));
	}
	async mutate(e) {
		if (!this.session) throw new P("cff_session_expired", 401);
		if (!(e.method === "POST" && this.submittedOnce) && Date.parse(this.session.requestExpiresAt) <= Date.now() + 5e3 && this.session.resumeToken) {
			let e = await this.api.resume(this.session.formId, this.session.resumeToken);
			if (this.disposed) throw new P("cff_cancelled", 0);
			this.session = {
				...e,
				answers: this.session.answers
			};
		}
		try {
			return e.method === "POST" && (this.submittedOnce = !0), await this.api.mutate(this.session, e.method, e.body, e.key);
		} catch (t) {
			if (!(t instanceof P) || t.status !== 401 || !this.session.resumeToken) throw t;
			let n = await this.api.resume(this.session.formId, this.session.resumeToken);
			if (this.disposed) throw new P("cff_cancelled", 0);
			return this.session = {
				...n,
				answers: this.session.answers
			}, this.api.mutate(this.session, e.method, e.body, e.key);
		}
	}
	async flush() {
		if (this.disposed || this.options.preview || this.state.form?.form.session.savePartial === !1 || this.state.offline || this.state.busy || this.state.conflict || this.pending?.method === "POST" || !this.session || !this.state.dirty) return;
		this.state.busy = !0, this.notify();
		let e = this.inputAnswers();
		try {
			this.pending || (this.pending = {
				method: "PATCH",
				key: ge(),
				body: {
					version: this.session.version,
					revision: this.session.revision,
					answers: e,
					stepTimings: { ...this.timings }
				}
			});
			let t = await this.mutate(this.pending);
			if (this.disposed) return;
			let n = JSON.stringify(e) !== JSON.stringify(this.pending.body.answers);
			this.pending = null, this.session = {
				...this.session,
				...t
			}, this.context = t.context ?? this.context, n || (this.state.answers = t.answers), this.state.dirty = n, this.state.error = null, this.compute(), this.persist();
		} catch (e) {
			this.handle(e);
		} finally {
			this.state.busy = !1, this.notify();
		}
		this.state.dirty && !this.state.error && !this.state.offline && await this.flush();
	}
	async submit(e = "") {
		if (this.disposed || this.state.busy || this.state.offline || this.state.conflict || this.state.phase === "done" || this.state.activeId && !this.pending) return;
		let t = Si(this.state.form.form.schema, this.state.answers, this.context, "complete");
		if (t.errors.length && !this.pending) this.state.fieldError = "invalid", this.notify();
		else if (this.options.preview) {
			let e = this.state.form.form.schema.endings.find((e) => e.id === t.endingId) ?? this.state.form.form.schema.endings[0];
			this.state.completion = {
				submission: {
					uuid: "",
					status: "completed"
				},
				ending: {
					...e,
					messages: e.messages ?? [],
					buttons: e.buttons ?? []
				}
			}, this.state.phase = "done", this.notify();
		} else if (!(this.pending?.method !== "POST" && (await this.flush(), this.state.dirty && this.state.form.form.session.savePartial !== !1))) {
			this.state.busy = !0, this.state.phase = "submitting", this.state.error = null, this.notify();
			try {
				if (!this.pending) {
					let t = this.engagement && this.engagement.captcha.provider !== "none" ? await this.options.captcha?.(this.engagement.captcha) : "";
					if (this.engagement && this.engagement.captcha.provider !== "none" && !t) throw new P("cff_captcha_required", 422);
					if (this.disposed) return;
					this.pending = {
						method: "POST",
						key: ge(),
						body: {
							version: this.session.version,
							revision: this.session.revision,
							answers: this.inputAnswers(),
							honeypot: e,
							...t ? { captchaToken: t } : {}
						}
					};
				}
				if (this.session && await this.analytics?.flush(this.session), this.state.completion = await this.mutate(this.pending), this.disposed) return;
				this.pending = null, this.state.phase = "done", this.state.dirty = !1, this.storage.clear(this.state.form.form.id), this.event("cff:complete", {
					submissionId: this.state.completion.submission.uuid,
					endingId: this.state.completion.ending.id
				});
			} catch (e) {
				this.state.phase = "ready", this.handle(e);
			} finally {
				this.state.busy = !1, this.notify();
			}
		}
	}
	async restart() {
		if (!(this.disposed || this.state.busy || this.pending?.method === "POST" || this.pendingStart || this.state.offline)) {
			this.state.busy = !0, this.notify();
			try {
				if (this.session && this.state.phase !== "done" && this.state.error !== "expired" && !this.options.preview && (this.pending?.method === "PATCH" && (this.state.busy = !1, await this.flush(), this.state.busy = !0, this.pending) || (this.pending ?? (this.pending = {
					method: "DELETE",
					key: ge(),
					body: {
						version: this.session.version,
						revision: this.session.revision
					}
				}), await this.mutate(this.pending), this.disposed))) return;
				this.options.preview || this.storage.clear(this.state.form.form.id), this.session = null, this.saved = null, this.pending = null, this.pendingStart = null, this.submittedOnce = !1, this.state.answers = {}, this.state.acknowledged = [], this.state.completion = null, this.state.conflict = !1, this.state.error = null, this.state.fieldError = null, this.state.dirty = !1, this.editing = null, this.timings = {}, this.prefill = {}, this.options.preview || (this.state.form = await this.api.form(this.state.form.form.id)), this.latest = this.state.form, this.state.newerVersion = !1, this.state.busy = !1, await this.start();
			} catch (e) {
				this.handle(e);
			} finally {
				this.state.busy = !1, this.notify();
			}
		}
	}
	async resolveConflict(e) {
		if (this.session && !this.state.busy) {
			this.state.busy = !0;
			try {
				let t = this.state.answers, n = await this.api.resume(this.session.formId, this.session.resumeToken ?? this.storage.credential(this.session.formId) ?? "");
				await this.adopt(n), e && (this.state.answers = t), this.pending = null, this.state.conflict = !1, this.state.error = null, this.state.dirty = e, this.compute(), this.persist();
			} catch (e) {
				this.handle(e);
			} finally {
				this.state.busy = !1, this.notify();
			}
			e && await this.flush();
		}
	}
	setOffline(e) {
		this.state.offline = e, this.notify(), !e && this.state.phase === "ready" && (!this.session && this.saved ? this.reconnect() : this.flush());
	}
	markConflict() {
		this.state.phase !== "done" && (this.state.conflict = !0, this.notify());
	}
	async reconnect() {
		if (this.saved && !this.state.busy) {
			this.state.busy = !0;
			try {
				let e = this.state.answers, t = this.state.dirty, n = await this.api.resume(this.saved.formId, this.saved.resumeToken);
				await this.adopt(n), t && (this.state.answers = e, this.state.dirty = !0, this.state.conflict = n.revision !== this.saved.revision, this.compute()), this.persist();
			} catch (e) {
				this.handle(e);
			} finally {
				this.state.busy = !1, this.notify();
			}
			await this.flush();
		}
	}
	async retry() {
		this.pending?.method === "POST" ? await this.submit() : this.pending?.method === "DELETE" ? await this.restart() : this.session ? await this.flush() : this.saved ? await this.reconnect() : this.state.form ? await this.start() : await this.initialize();
	}
	handle(e) {
		let t = e instanceof P ? e : new P("cff_request_failed", 0);
		if (([401, 422].includes(t.status) || t.status === 409 && !t.code.includes("pending")) && (this.pendingStart = null), (t.status === 401 || t.code === "cff_session_expired") && this.state.form && !this.options.preview && this.storage.clear(this.state.form.form.id), this.state.error = t.status === 429 ? "error" : t.code === "cff_version_conflict" ? "versionConflict" : t.status === 401 || t.code === "cff_session_expired" ? "expired" : t.status === 409 ? "conflict" : "error", t.status === 409 && t.code !== "cff_version_conflict" && !t.code.includes("pending") && !t.code.includes("idempotency") && (this.state.conflict = !0), t.status === 422) {
			this.pending = null, this.submittedOnce = !1, this.state.fieldError = "invalid";
			let e = this.state.form?.form.schema.steps.find((e) => t.issues.some((t) => t?.fieldKey === e.key));
			e && this.state.path?.visited.includes(e.id) && (this.editing = e.id, this.compute());
		}
		this.session || (this.state.phase = "error"), this.pending?.method === "POST" && (t.status === 0 || t.status >= 500 || t.code.includes("pending")) && (this.state.error = "submissionPending"), this.state.error !== "expired" && this.persist(), this.notify();
	}
}, ca = /* @__PURE__ */ new Set([
	"color",
	"background-color",
	"border-color",
	"border-radius",
	"border-width",
	"border-style",
	"padding",
	"padding-inline",
	"padding-block",
	"margin",
	"margin-inline",
	"margin-block",
	"gap",
	"font-size",
	"font-weight",
	"font-family",
	"line-height",
	"text-align",
	"text-decoration",
	"letter-spacing",
	"max-width",
	"min-height",
	"width",
	"height",
	"opacity"
]), la = /[\\@<>]|url\s*\(|expression\s*\(|image-set\s*\(|attr\s*\(|paint\s*\(|element\s*\(/i;
function ua(e) {
	if (!e || la.test(e) || /var\s*\(/i.test(e)) return;
	let t = document.createElement("span").style;
	return t.color = e, t.color || void 0;
}
function da(e) {
	return e && /^[\w\s,"'-]{1,255}$/.test(e) ? e : void 0;
}
function fa(e) {
	if (!e || e.length > 2e4 || la.test(e)) return "";
	let t = e.replace(/\/\*[\s\S]*?\*\//g, ""), n = [...t.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
	return t.replace(/([^{}]+)\{([^{}]*)\}/g, "").trim() ? "" : n.map(([, e, t]) => {
		if (!e || !t || !/^[\w\s.#,:>-]+$/.test(e) || /:(?!(?:hover|focus-visible|focus|disabled|active|checked)(?:\b|$))/i.test(e)) return "";
		let n = t.split(";").flatMap((e) => {
			let t = e.indexOf(":");
			if (t < 1) return [];
			let n = e.slice(0, t).trim().toLowerCase(), r = e.slice(t + 1).trim();
			if (!ca.has(n) || !r || la.test(r) || /var\s*\(/i.test(r)) return [];
			let i = document.createElement("span").style;
			return i.setProperty(n, r), i.getPropertyValue(n) ? [`${n}:${i.getPropertyValue(n)}`] : [];
		});
		return n.length ? `${e.trim()}{${n.join(";")}}` : "";
	}).join("\n");
}
//#endregion
//#region assets/src/runtime/overlay.ts
function pa(e, t, n, r, i, a, o) {
	let s = Wi(a), c = document.createElement("dialog");
	c.className = `overlay ${n}`, c.setAttribute("aria-label", t.dataset.title ?? "ChatFlow");
	let l = document.createElement("button");
	l.className = "overlay-close", l.type = "button", l.textContent = s("close");
	let u = document.createElement("div");
	u.className = "overlay-content", c.append(l, u), e.append(c);
	let d = n === "launcher" ? document.createElement("button") : null;
	d && (d.type = "button", d.className = `launcher ${r.position === "left" ? "left" : "right"}`, d.textContent = s("openChat"), d.setAttribute("aria-haspopup", "dialog"), d.setAttribute("aria-expanded", "false"), e.append(d)), r.position === "left" && c.classList.add("left");
	let f = null, p, m = !1;
	function h() {
		d?.setAttribute("aria-expanded", "false"), f?.isConnected && f.focus({ preventScroll: !0 });
	}
	function g() {
		c.open && (c.close(), o?.()), h();
	}
	function _() {
		if (c.open) return;
		let t = e.activeElement ?? document.activeElement;
		f = t instanceof HTMLElement ? t : null, typeof c.showModal == "function" && (c.showModal(), d?.setAttribute("aria-expanded", "true"), l.focus({ preventScroll: !0 }), i());
	}
	function v(t) {
		if (t.key === "Escape" && (t.preventDefault(), g()), t.key !== "Tab") return;
		let n = [...c.querySelectorAll("button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex=\"0\"]")].filter((e) => !e.hidden && !e.closest("[hidden]") && e.tabIndex >= 0), r = n[0] ?? l, i = n[n.length - 1] ?? l, a = e.activeElement;
		t.shiftKey && (a === r || !c.contains(a)) ? (t.preventDefault(), i.focus()) : !t.shiftKey && (a === i || !c.contains(a)) && (t.preventDefault(), r.focus());
	}
	function y() {
		m || (m = !0, _(), window.removeEventListener("scroll", b));
	}
	function b() {
		let e = document.documentElement.scrollHeight - window.innerHeight;
		(e <= 0 ? 100 : window.scrollY / e * 100) >= (r.scrollPercent ?? 101) && y();
	}
	let x = (e) => {
		(e.target instanceof Element ? e.target.closest("[data-cff-open]") : null)?.dataset.cffOpen === t.dataset.formId && (e.preventDefault(), _());
	};
	return l.addEventListener("click", g), d?.addEventListener("click", _), c.addEventListener("keydown", v), c.addEventListener("close", h), c.addEventListener("cancel", (e) => {
		e.preventDefault(), g();
	}), document.addEventListener("click", x), typeof r.autoOpenSeconds == "number" && Number.isFinite(r.autoOpenSeconds) && r.autoOpenSeconds >= 0 && (p = setTimeout(y, Math.min(86400, r.autoOpenSeconds) * 1e3)), typeof r.scrollPercent == "number" && r.scrollPercent >= 0 && r.scrollPercent <= 100 && (window.addEventListener("scroll", b, { passive: !0 }), queueMicrotask(b)), {
		content: u,
		open: _,
		close: g,
		dispose() {
			p && clearTimeout(p), window.removeEventListener("scroll", b), document.removeEventListener("click", x), g(), c.remove(), d?.remove();
		}
	};
}
//#endregion
//#region assets/src/runtime/captcha.ts
var ma = /* @__PURE__ */ new Map();
function ha(e) {
	let t = ma.get(e);
	if (t) return t;
	let n = new Promise((t, n) => {
		let r = document.createElement("script"), i = setTimeout(() => {
			r.remove(), n(/* @__PURE__ */ Error("captchaUnavailable"));
		}, 15e3);
		r.src = e, r.async = !0, r.onload = () => {
			clearTimeout(i), t();
		}, r.onerror = () => {
			clearTimeout(i), r.remove(), n(/* @__PURE__ */ Error("captchaUnavailable"));
		}, document.head.append(r);
	});
	return ma.set(e, n), n.catch(() => ma.delete(e)), n;
}
async function ga(e, t) {
	if (e.provider === "none") return "";
	if (!e.siteKey) throw Error("captchaUnavailable");
	if (e.provider === "recaptcha") return await ha(`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(e.siteKey)}`), new Promise((t, n) => {
		let r = setTimeout(() => n(/* @__PURE__ */ Error("captchaUnavailable")), 12e4);
		window.grecaptcha?.ready(() => {
			window.grecaptcha.execute(e.siteKey, { action: "cff_submit" }).then((e) => {
				clearTimeout(r), t(e);
			}, (e) => {
				clearTimeout(r), n(e);
			});
		});
	});
	let n = e.provider;
	await ha(n === "turnstile" ? "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" : "https://js.hcaptcha.com/1/api.js?render=explicit");
	let r = n === "turnstile" ? window.turnstile : window.hcaptcha;
	if (!r) throw Error("captchaUnavailable");
	return new Promise((n, i) => {
		let a, o = !1, s = (e) => {
			o || (o = !0, clearTimeout(c), a !== void 0 && r.remove(a), e ? n(e) : i(/* @__PURE__ */ Error("captchaUnavailable")));
		}, c = setTimeout(() => s(), 12e4);
		try {
			a = r.render(t, {
				sitekey: e.siteKey,
				action: "cff_submit",
				callback: (e) => s(e),
				"error-callback": () => s(),
				"expired-callback": () => s()
			});
		} catch {
			s();
		}
	});
}
//#endregion
//#region assets/src/runtime/index.tsx
var $ = /* @__PURE__ */ new Map();
function _a(e) {
	return {
		phase: e.state.phase,
		visited: [...e.state.path?.visited ?? []],
		currentStepId: e.state.activeId,
		variables: { ...e.state.path?.variables },
		progress: e.state.path?.progress ?? 0,
		errors: [...e.state.path?.errors ?? []]
	};
}
function va(e, t = {}) {
	$.get(e)?.handle.unmount();
	let n = t.form?.form.id ?? t.formId ?? Number(e.dataset.formId);
	if (!Number.isSafeInteger(n) || n <= 0) throw TypeError("Invalid form ID");
	if (t.preview && !t.form) throw TypeError("Preview requires a public form envelope");
	if (t.mode && ![
		"inline",
		"fullpage",
		"launcher",
		"popup"
	].includes(t.mode)) throw TypeError("Unsupported display mode");
	let r = t.restUrl ?? e.dataset.restUrl;
	if (!t.preview && !r) throw TypeError("Missing REST endpoint");
	let i = e.shadowRoot ?? e.attachShadow({ mode: "open" });
	e.querySelector("[data-cff-loading]")?.remove();
	let a = document.createElement("style");
	a.textContent = fe;
	let o = document.createElement("style"), s = document.createElement("div");
	i.replaceChildren(a, o, s);
	let c = t.mode ?? ([
		"fullpage",
		"launcher",
		"popup"
	].includes(e.dataset.mode ?? "") ? e.dataset.mode : "inline"), l = {
		...t,
		formId: n,
		locale: t.locale ?? e.dataset.locale ?? document.documentElement.lang ?? "en",
		mode: c
	}, u = document.createElement("div");
	u.className = "captcha", l.captcha ?? (l.captcha = (e) => ga(e, u));
	let d = new sa(l, t.preview ? null : new _e(r), void 0, (t, n) => e.dispatchEvent(new CustomEvent(t, {
		detail: n,
		bubbles: !0,
		composed: !0
	}))), f = !1, p = () => {
		f || (f = !0, v(), d.initialize().then(h));
	}, m = !t.preview && (c === "launcher" || c === "popup") ? pa(i, e, c, t.launcher ?? {}, () => {
		p();
	}, l.locale ?? "en", () => d.close()) : null;
	m && (s.remove(), m.content.append(s)), s.after(u);
	let h = () => {
		let e = d.state.form?.form.appearance;
		if (!e) return;
		let t = {
			"--cff-primary": ua(e.primary),
			"--cff-bubble-bot-bg": ua(e.botBubbleBackground),
			"--cff-user-bg": ua(e.userBubbleBackground),
			"--cff-text": ua(e.textColor),
			"--cff-font": e.inheritFont ? "inherit" : da(e.font),
			"--cff-radius": Number.isFinite(e.radius) ? `${Math.max(0, Math.min(128, e.radius))}px` : void 0,
			"--cff-width": Number.isFinite(e.width) ? `${Math.max(280, Math.min(2e3, e.width))}px` : void 0
		};
		for (let [e, n] of Object.entries(t)) n ? s.style.setProperty(e, n) : s.style.removeProperty(e);
		let n = e.theme === "dark" || e.theme === "auto" && globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches;
		s.querySelector(".chat")?.classList.toggle("dark", !!n), o.textContent = fa(e.customCss);
	}, g = d.subscribe(h), _ = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
	_?.addEventListener("change", h);
	let v = () => d.setOffline(navigator.onLine === !1), y = (e) => {
		e.key?.startsWith(`cff:session:${n}:`) && d.markConflict();
	};
	t.preview || (window.addEventListener("online", v), window.addEventListener("offline", v), window.addEventListener("storage", y)), de(/* @__PURE__ */ X(Ki, {
		controller: d,
		onClose: () => {
			m ? m.close() : t.preview || (d.close(), e.hidden = !0);
		}
	}), s);
	let b = {
		unmount: () => {
			g(), _?.removeEventListener("change", h), d.dispose(), de(null, s), m?.dispose(), i.replaceChildren(), window.removeEventListener("online", v), window.removeEventListener("offline", v), window.removeEventListener("storage", y), $.delete(e);
		},
		open: () => {
			m ? m.open() : (e.hidden = !1, p(), e.scrollIntoView?.({
				behavior: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
				block: "start"
			}), e.shadowRoot?.querySelector("input,button,textarea,select")?.focus({ preventScroll: !0 }));
		},
		prefill: (e) => d.prefillAnswers(e),
		getState: () => _a(d)
	};
	return $.set(e, {
		handle: b,
		id: n,
		controller: d
	}), m || p(), b;
}
function ya(e = document) {
	for (let t of e.querySelectorAll("cff-chat[data-form-id]")) {
		if ($.has(t)) continue;
		let e = {};
		try {
			t.dataset.launcher && (e.launcher = JSON.parse(t.dataset.launcher));
		} catch {}
		let n = t.querySelector("script[type=\"application/json\"][data-cff-schema]");
		if (n) try {
			e.form = JSON.parse(n.textContent ?? "");
		} catch {}
		try {
			va(t, e);
		} catch {
			t.textContent = "ChatFlow: configuration error";
		}
	}
}
typeof window < "u" && (window.ChatFlow = {
	optOutAnalytics(e = !0) {
		try {
			localStorage.setItem("cff_analytics_optout", e ? "1" : "0");
		} catch {}
		for (let { controller: t } of $.values()) t.options.analyticsOptOut = e;
	},
	open: (e) => {
		ya();
		let t = [...$.keys()].find((t) => $.get(t)?.id === Number(e));
		return t ? ($.get(t).handle.open(), !0) : !1;
	},
	prefill: (e, t) => {
		for (let { handle: n, id: r } of $.values()) (t === void 0 || Number(t) === r) && n.prefill(e);
	},
	registerField: ki
}, document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => ya(), { once: !0 }) : ya());
//#endregion
export { ya as autoMount, va as mountRuntime, ki as registerField };
