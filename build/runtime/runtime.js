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
		o.__v = n.__v + 1, t.vnode && t.vnode(o), F(e.__P, o, n, e.__n, e.__P.namespaceURI, 32 & n.__u ? [r] : null, i, r ?? w(n), !!(32 & n.__u), a), o.__v = n.__v, o.__.__k[o.__i] = o, ne(i, o, a), n.__e = n.__ = null, o.__e != r && E(o);
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
function k(e, t, n, r, i, a, o, s, c, l, u) {
	var d, f, p, g, _, v, y = r && r.__k || h, b = t.length;
	for (c = A(n, t, y, c, b), d = 0; d < b; d++) (p = n.__k[d]) != null && (f = p.__i != -1 && y[p.__i] || m, p.__i = d, v = F(e, p, f, i, a, o, s, c, l, u), g = p.__e, p.ref && f.ref != p.ref && (f.ref && I(f.ref, null, p), u.push(p.ref, p.__c || g, p)), _ == null && g != null && (_ = g), 4 & p.__u ? (c = j(p, c, e), f.__e && (f.__e = null)) : typeof p.type == "function" && v !== void 0 ? c = v : g && (c = g.nextSibling), p.__u &= -7);
	return n.__e = _, c;
}
function A(e, t, n, r, i) {
	var a, o, s, c, l, u = n.length, d = u, f = 0;
	for (e.__k = Array(i), a = 0; a < i; a++) (o = t[a]) != null && typeof o != "boolean" && typeof o != "function" ? (typeof o == "string" || typeof o == "number" || typeof o == "bigint" || o.constructor == String ? o = e.__k[a] = x(null, o, null, null, null) : _(o) ? o = e.__k[a] = x(S, { children: o }, null, null, null) : o.constructor === void 0 && o.__b > 0 ? o = e.__k[a] = x(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : e.__k[a] = o, c = a + f, o.__ = e, o.__b = e.__b + 1, s = null, (l = o.__i = ee(o, n, c, d)) != -1 && (d--, (s = n[l]) && (s.__u |= 2)), s == null || s.__v == null ? (l == -1 && (i > u ? f-- : i < u && f++), typeof o.type != "function" && (o.__u |= 4)) : l != c && (l == c - 1 ? f-- : l == c + 1 ? f++ : (l > c ? f-- : f++, o.__u |= 4))) : e.__k[a] = null;
	if (d) for (a = 0; a < u; a++) (s = n[a]) != null && !(2 & s.__u) && (s.__e == r && (r = w(s)), L(s, s));
	return r;
}
function j(e, t, n) {
	var r, i;
	if (typeof e.type == "function") {
		for (r = e.__k, i = 0; r && i < r.length; i++) r[i] && (r[i].__ = e, t = j(r[i], t, n));
		return t;
	}
	e.__e != t && (t && e.type && !t.parentNode && (t = w(e)), t = n.insertBefore(e.__e, t || null));
	do
		t = t && t.nextSibling;
	while (t != null && t.nodeType == 8);
	return t;
}
function ee(e, t, n, r) {
	var i, a, o, s = e.key, c = e.type, l = t[n], u = l != null && !(2 & l.__u);
	if (l === null && s == null || u && s == l.key && c == l.type) return n;
	if (r > +!!u) {
		for (i = n - 1, a = n + 1; i >= 0 || a < t.length;) if ((l = t[o = i >= 0 ? i-- : a++]) != null && !(2 & l.__u) && s == l.key && c == l.type) return o;
	}
	return -1;
}
function M(e, t, n) {
	t[0] == "-" ? e.setProperty(t, n ?? "") : e[t] = n == null ? "" : typeof n != "number" || g.test(t) ? n : n + "px";
}
function N(e, t, n, r, i) {
	var a, o;
	n: if (t == "style") {
		if (typeof n == "string") e.style.cssText = n;
		else {
			if (typeof r == "string" && (e.style.cssText = r = ""), r) for (t in r) n && t in n || M(e.style, t, "");
			if (n) for (t in n) r && n[t] == r[t] || M(e.style, t, n[t]);
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
function P(e) {
	return function(n) {
		if (this.l) {
			var r = this.l[n.type + e];
			if (n[c] == null) n[c] = d++;
			else if (n[c] < r[l]) return;
			return r(t.event ? t.event(n) : n);
		}
	};
}
function F(e, n, r, i, a, o, s, c, l, u) {
	var d, f, p, m, g, b, x, T, E, D, O, A, j, ee, M, N, P = n.type;
	if (n.constructor !== void 0) return null;
	128 & r.__u && (l = !!(32 & r.__u), o = [c = n.__e = r.__e]), (d = t.__b) && d(n);
	n: if (typeof P == "function") {
		f = s.length;
		try {
			if (E = n.props, D = P.prototype && P.prototype.render, O = (d = P.contextType) && i[d.__c], A = d ? O ? O.props.value : d.__ : i, r.__c ? T = (p = n.__c = r.__c).__ = p.__E : (D ? n.__c = p = new P(E, A) : (n.__c = p = new C(E, A), p.constructor = P, p.render = ae), O && O.sub(p), p.state || (p.state = {}), p.__n = i, m = p.__d = !0, p.__h = [], p._sb = []), D && p.__s == null && (p.__s = p.state), D && P.getDerivedStateFromProps != null && (p.__s == p.state && (p.__s = v({}, p.__s)), v(p.__s, P.getDerivedStateFromProps(E, p.__s))), g = p.props, b = p.state, p.__v = n, m) D && P.getDerivedStateFromProps == null && p.componentWillMount != null && p.componentWillMount(), D && p.componentDidMount != null && p.__h.push(p.componentDidMount);
			else {
				if (D && P.getDerivedStateFromProps == null && E !== g && p.componentWillReceiveProps != null && p.componentWillReceiveProps(E, A), n.__v == r.__v || !p.__e && p.shouldComponentUpdate != null && !1 === p.shouldComponentUpdate(E, p.__s, A)) {
					n.__v != r.__v && (p.props = E, p.state = p.__s, p.__d = !1), n.__e = r.__e, n.__k = r.__k, n.__k.some(function(e) {
						e && (e.__ = n);
					}), h.push.apply(p.__h, p._sb), p._sb = [], p.__h.length && s.push(p), c = w(r);
					break n;
				}
				p.componentWillUpdate != null && p.componentWillUpdate(E, p.__s, A), D && p.componentDidUpdate != null && p.__h.push(function() {
					p.componentDidUpdate(g, b, x);
				});
			}
			if (p.context = A, p.props = E, p.__P = e, p.__e = !1, j = t.__r, ee = 0, D) p.state = p.__s, p.__d = !1, j && j(n), d = p.render(p.props, p.state, p.context), h.push.apply(p.__h, p._sb), p._sb = [];
			else do
				p.__d = !1, j && j(n), d = p.render(p.props, p.state, p.context), p.state = p.__s;
			while (p.__d && ++ee < 25);
			p.state = p.__s, p.getChildContext != null && (i = v(v({}, i), p.getChildContext())), D && !m && p.getSnapshotBeforeUpdate != null && (x = p.getSnapshotBeforeUpdate(g, b)), M = d != null && d.type === S && d.key == null ? re(d.props.children) : d, c = k(e, _(M) ? M : [M], n, r, i, a, o, s, c, l, u), p.base = n.__e, n.__u &= -161, p.__h.length && s.push(p), T && (p.__E = p.__ = null);
		} catch (e) {
			if (s.length = f, n.__v = null, l || o != null) {
				if (e.then) {
					for (n.__u |= l ? 160 : 128; c && c.nodeType == 8 && c.nextSibling;) c = c.nextSibling;
					o != null && (o[o.indexOf(c)] = null), n.__e = c;
				} else if (o != null) for (N = o.length; N--;) y(o[N]);
			} else n.__e = r.__e;
			n.__k ?? (n.__k = r.__k || []), e.then || te(n), t.__e(e, n, r);
		}
	} else o == null && n.__v == r.__v ? (n.__k = r.__k, n.__e = r.__e) : c = n.__e = ie(r.__e, n, r, i, a, o, s, l, u);
	return (d = t.diffed) && d(n), 128 & n.__u ? void 0 : c;
}
function te(e) {
	e && (e.__c && (e.__c.__e = !0), e.__k && e.__k.some(te));
}
function ne(e, n, r) {
	for (var i = 0; i < r.length; i++) I(r[i], r[++i], r[++i]);
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
function re(e) {
	return typeof e != "object" || !e || e.__b > 0 ? e : _(e) ? e.map(re) : e.constructor === void 0 ? v({}, e) : null;
}
function ie(n, r, i, a, o, s, c, l, u) {
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
		for (d in x) g = x[d], d == "dangerouslySetInnerHTML" ? p = g : d == "children" || d in S || d == "value" && "defaultValue" in S || d == "checked" && "defaultChecked" in S || N(n, d, null, g, o);
		for (d in S) g = S[d], d == "children" ? h = g : d == "dangerouslySetInnerHTML" ? f = g : d == "value" ? v = g : d == "checked" ? b = g : l && typeof g != "function" || x[d] === g || N(n, d, g, x[d], o);
		if (f) l || p && (f.__html == p.__html || f.__html == n.innerHTML) || (n.innerHTML = f.__html), r.__k = [];
		else if (p && (n.innerHTML = ""), k(r.type == "template" ? n.content : n, _(h) ? h : [h], r, i, a, C == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o, s, c, s ? s[0] : i.__k && w(i, 0), l, u), s != null) for (d = s.length; d--;) y(s[d]);
		l && C != "textarea" || (d = "value", C == "progress" && v == null ? n.removeAttribute("value") : v != null && (v !== n[d] || C == "progress" && !v || C == "option" && v != x[d]) && N(n, d, v, x[d], o), d = "checked", b != null && b != n[d] && N(n, d, b, x[d], o));
	}
	return n;
}
function I(e, n, r) {
	try {
		if (typeof e == "function") {
			var i = typeof e.__u == "function";
			i && e.__u(), i && n == null || (e.__u = e(n));
		} else e.current = n;
	} catch (e) {
		t.__e(e, r);
	}
}
function L(e, n, r) {
	var i, a;
	if (t.unmount && t.unmount(e), (i = e.ref) && (i.current && i.current != e.__e || I(i, null, n)), (i = e.__c) != null) {
		if (i.componentWillUnmount) try {
			i.componentWillUnmount();
		} catch (e) {
			t.__e(e, n);
		}
		i.base = i.__P = i.__n = null;
	}
	if (i = e.__k) for (a = 0; a < i.length; a++) i[a] && L(i[a], n, r || typeof e.type != "function");
	r || y(e.__e), e.__c = e.__ = e.__e = void 0;
}
function ae(e, t, n) {
	return this.constructor(e, n);
}
function oe(n, r, i) {
	var a, o, s, c;
	r == document && (r = document.documentElement), t.__ && t.__(n, r), o = (a = typeof i == "function") ? null : i && i.__k || r.__k, s = [], c = [], F(r, n = (!a && i || r).__k = b(S, null, [n]), o || m, m, r.namespaceURI, !a && i ? [i] : o ? null : r.firstChild ? e.call(r.childNodes) : null, s, !a && i ? i : o ? o.__e : r.firstChild, a, c), ne(s, n, c), n.props.children = null;
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
}, O.__r = 0, s = Math.random().toString(8), c = "__d" + s, l = "__a" + s, u = /(PointerCapture)$|Capture$/i, d = 0, f = P(!1), p = P(!0);
//#endregion
//#region assets/src/runtime/styles.css?inline
var se = ".scale{flex-wrap:wrap}.chat video,.chat img{max-width:100%;height:auto}.chat fieldset{border:0;gap:12px;padding:0;display:grid}.chat input[type=range]{width:100%}:host{--lightningcss-light:initial;--lightningcss-dark: ;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light;--cff-primary:#171717;--cff-bubble-bot-bg:#f1f1f1;--cff-user-bg:#e5e5e5;--cff-text:#171717;--cff-radius:12px;--cff-font:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;--cff-width:720px;display:block;outline:none!important}*{box-sizing:border-box}.chat{font:16px/1.5 var(--cff-font);color:var(--cff-text);max-width:var(--cff-width);border-radius:var(--cff-radius);background:#fff;border:1px solid #dedede;margin-inline-start:auto;margin-inline-end:auto;overflow:hidden}.fullpage{border:0;border-radius:0;min-height:100svh}header{border-bottom:1px solid #dedede;justify-content:space-between;align-items:center;gap:8px;padding:16px;display:flex}.identity{align-items:center;gap:10px;display:flex}.identity img{object-fit:cover;border-radius:50%;width:42px;height:42px}.identity small{color:#555;display:block}.online-dot{background:#21713d;border-radius:50%;width:7px;height:7px;margin-inline-end:6px;display:inline-block}nav{gap:6px;display:flex}.progress{background:#e5e5e5;height:4px}.progress span{background:var(--cff-primary);height:100%;transition:width .25s;display:block}.conversation{scrollbar-gutter:stable;max-height:75svh;padding:20px;overflow-y:auto}.fullpage .conversation{max-height:none}.bubble{border-radius:var(--cff-radius);white-space:pre-wrap;overflow-wrap:anywhere;max-width:90%;margin-block-start:10px;margin-block-end:10px;padding:12px 16px;animation:.2s appear}.bot{background:var(--cff-bubble-bot-bg)}.user{background:var(--cff-user-bg);color:var(--cff-text);text-align:start;margin-inline-start:auto;display:block}.user small{opacity:.8;font-size:12px;display:block}.active{margin-block-start:16px;margin-block-end:16px}button,.button,input,textarea,select{font:inherit}button,.button{background:var(--cff-primary);color:#fff;border:1px solid var(--cff-primary);border-radius:var(--cff-radius);cursor:pointer;min-height:44px;padding:10px 16px;text-decoration:none;display:inline-block}nav button{color:var(--cff-text);background:0 0;border-color:#bbb;padding:8px}button:disabled{opacity:.55;cursor:not-allowed}button:focus-visible{outline-offset:3px;outline:3px solid #2463eb}a:focus-visible{outline-offset:3px;outline:3px solid #2463eb}input:focus-visible{outline-offset:3px;outline:3px solid #2463eb}textarea:focus-visible{outline-offset:3px;outline:3px solid #2463eb}select:focus-visible{outline-offset:3px;outline:3px solid #2463eb}a{color:inherit;text-decoration:underline}label{margin-block-start:8px;margin-block-end:8px;font-weight:600;display:block}input:not([type=checkbox]),textarea,select{border-radius:var(--cff-radius);color:#171717;background:#fff;border:1px solid #999;width:100%;min-height:44px;padding:12px}textarea{resize:vertical;min-height:100px}form button{margin-block-start:12px}small,.help{font-size:13px}.help{color:#555}.input-row{align-items:center;gap:8px;display:flex}.country select{max-width:240px}.chips{flex-wrap:wrap;gap:8px;display:flex}.chip{color:var(--cff-text);text-align:start;background:0 0;border-color:#888}.chip[aria-pressed=true]{background:var(--cff-primary);color:#fff}.continue{flex-basis:100%;margin-top:8px}.cards .chip{flex:160px}.cards img{object-fit:cover;width:100%;height:100px;margin-bottom:8px;display:block}.consent{align-items:flex-start;gap:12px;font-weight:400;display:flex}.consent input{flex-shrink:0;width:24px;height:24px}.link-button{color:var(--cff-text);background:0 0;border:0;text-decoration:underline}.summary{border-radius:var(--cff-radius);border:1px solid #bbb;padding:16px}h2{margin-top:0;font-size:18px}dl{margin:0}dl>div{border-bottom:1px solid #ddd;padding-block-start:8px;padding-block-end:8px}dt{font-weight:600}dd{overflow-wrap:anywhere;margin:0}.notice{border-radius:var(--cff-radius);color:#171717;background:#f2f2f2;margin:12px;padding:16px}.notice button,.ending .button,.ending button{margin-block-start:6px;margin-block-end:6px;margin-inline-end:8px}.typing{gap:5px;width:70px;display:flex}.typing i{background:#666;border-radius:50%;width:7px;height:7px;animation:.9s infinite dot}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}footer{color:#555;border-top:1px solid #ddd;padding:12px 20px;font-size:12px}footer small{font-size:11px;display:block}.honeypot,.sr-only{clip:rect(0,0,0,0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.chat.dark{color:#f5f5f5;--cff-text:#f5f5f5;--cff-primary:#e5e5e5;--cff-user-bg:#3a3a3a;--cff-bubble-bot-bg:#292929;background:#171717}.dark button:not(.chip):not(.link-button):not(.user):not(.close-chat){color:#171717}.dark .help,.dark footer,.dark .identity small{color:#ccc}.dark .chip[aria-pressed=true]{color:#171717}@keyframes appear{0%{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes dot{50%{opacity:.3;transform:translateY(-2px)}}@media (prefers-reduced-motion:reduce){*,:before,:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}@media (max-width:480px){header,.conversation{padding:12px}.bubble{max-width:96%}nav button{padding:8px;font-size:13px}.chat{border-inline-start:0;border-inline-end:0;border-radius:0}}:host([data-mode=launcher]){z-index:2147480000;width:min(420px,100vw - 32px);max-height:calc(100dvh - 32px);position:fixed;bottom:16px;right:16px}:host([data-mode=launcher][data-position=left]){left:16px;right:auto}.launcher-root{flex-direction:column;align-items:flex-end;gap:12px;display:flex}.launcher-root.is-left{align-items:flex-start}.launcher-toggle{color:#fff;background:#171717;border-radius:50%;place-items:center;width:60px;height:60px;min-height:60px;padding:0;transition:transform .15s;display:grid;box-shadow:0 6px 24px #0003}.launcher-toggle:hover{transform:scale(1.05)}.launcher-toggle[hidden]{display:none!important}.launcher-panel{background:#fff;border-radius:14px;flex-direction:column;width:100%;max-height:calc(100dvh - 112px);display:flex;overflow:hidden;box-shadow:0 12px 48px #0003}.launcher-panel[hidden]{display:none!important}.launcher-panel>div:first-child{flex-direction:column;flex:auto;min-height:0;display:flex}.launcher-panel .chat{border-radius:14px;flex-direction:column;flex:auto;width:100%;max-width:none;min-height:0;display:flex}.launcher-panel .chat>*{flex:none}.launcher-panel .chat>.conversation{flex:0 auto;min-height:96px}.launcher-panel footer{max-height:30dvh;overflow-y:auto}.launcher-panel .captcha{flex:none;max-height:40dvh;overflow-y:auto}.launcher-panel .captcha:empty{display:none}.launcher-panel .conversation{max-height:min(56dvh,560px)}@media (max-width:480px){:host([data-mode=launcher]){width:calc(100vw - 24px);bottom:12px;right:12px}:host([data-mode=launcher][data-position=left]){left:12px}.launcher-panel .conversation{max-height:55dvh}}:host([data-mode=popup]){z-index:2147480000;pointer-events:none;position:fixed;top:0;bottom:0;left:0;right:0;width:auto!important;max-width:none!important;margin:0!important}.popup-root{pointer-events:none;justify-content:center;align-items:center;display:flex;position:absolute;top:0;bottom:0;left:0;right:0}.popup-root .popup-backdrop{pointer-events:auto;background:#0000008c;position:absolute;top:0;bottom:0;left:0;right:0}.popup-root .popup-backdrop[hidden]{display:none!important}.popup-root .launcher-panel{z-index:1;pointer-events:auto;max-width:min(640px,100vw - 32px);max-height:calc(100dvh - 88px);position:relative}.popup-root .launcher-toggle{z-index:2;pointer-events:auto;position:fixed;bottom:16px;right:16px}.popup-root.is-left .launcher-toggle{left:16px;right:auto}.popup-root .conversation{max-height:min(65dvh,650px)}.score-input{flex-wrap:wrap;gap:.45rem;display:flex}.score-chip{text-align:center;min-width:2.75rem}.score-chip[aria-pressed=true]{outline-offset:2px;outline:2px solid}.slider-reading{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.slider-reading output{font-weight:700}.active input[type=range]{width:100%;max-width:100%;min-height:44px}.ending:focus{outline:none}.avatar{display:none}.chat[data-style=messaging]{--m-accent:var(--cff-primary);--m-header-bg:var(--cff-header-bg);--m-header-text:var(--cff-header-text);--m-chat-bg:var(--cff-chat-bg);--m-user-text:var(--cff-user-text);border:0;flex-direction:column;display:flex;box-shadow:0 12px 40px -12px #00000040,0 0 0 1px #0000000d}.chat[data-style=messaging] header{background:var(--m-header-bg);color:var(--m-header-text);z-index:1;border:0;padding:10px 14px;position:relative;box-shadow:0 1px #0000000f}.chat[data-style=messaging] .identity{gap:12px;min-width:0}.chat[data-style=messaging] .identity img,.chat[data-style=messaging] .avatar{border-radius:50%;flex-shrink:0;width:42px;height:42px}.chat[data-style=messaging] .avatar{background:linear-gradient(135deg,color-mix(in srgb,var(--m-accent) 70%,#fff),var(--m-accent));color:#fff;text-transform:uppercase;place-items:center;font-size:18px;font-weight:600;display:grid}.chat[data-style=messaging] .identity strong{font-size:16px;font-weight:600;line-height:1.2}.chat[data-style=messaging] .identity small{color:color-mix(in srgb,var(--m-header-text) 60%,transparent);font-size:13px}.chat[data-style=messaging] nav{gap:2px}.chat[data-style=messaging] nav button{color:var(--m-header-text);opacity:.75;background:0 0;border:0;border-radius:999px;min-height:36px;padding:6px 10px;font-size:13px}.chat[data-style=messaging] nav button:hover:not(:disabled){opacity:1;background:color-mix(in srgb,var(--m-header-text) 8%,transparent)}.chat[data-style=messaging] .progress{background:0 0;height:2px}.chat[data-style=messaging] .progress span{background:var(--m-accent)}.chat[data-style=messaging] .conversation{background-color:var(--m-chat-bg);flex:auto;padding:12px 12px 14px}.chat[data-style=messaging][data-wallpaper=doodle] .conversation{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='none' stroke='%23000' stroke-opacity='.07' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 22h22a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H28l-8 6v-6h-2a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6z'/%3E%3Ccircle cx='112' cy='30' r='9'/%3E%3Cpath d='M128 88l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z'/%3E%3Cpath d='M30 104c6-8 16-8 22 0s16 8 22 0'/%3E%3Cpath d='M98 130l14-14m0 14l-14-14'/%3E%3Crect x='64' y='58' width='20' height='20' rx='5'/%3E%3Cpath d='M140 146a8 8 0 1 1-8-8'/%3E%3C/svg%3E\");background-size:160px}.chat[data-style=messaging].dark[data-wallpaper=doodle] .conversation{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='none' stroke='%23fff' stroke-opacity='.06' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 22h22a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H28l-8 6v-6h-2a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6z'/%3E%3Ccircle cx='112' cy='30' r='9'/%3E%3Cpath d='M128 88l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z'/%3E%3Cpath d='M30 104c6-8 16-8 22 0s16 8 22 0'/%3E%3Cpath d='M98 130l14-14m0 14l-14-14'/%3E%3Crect x='64' y='58' width='20' height='20' rx='5'/%3E%3Cpath d='M140 146a8 8 0 1 1-8-8'/%3E%3C/svg%3E\")}.chat[data-style=messaging][data-wallpaper=dots] .conversation{background-image:radial-gradient(color-mix(in srgb,currentColor 12%,transparent) 1px,transparent 1.5px);background-size:18px 18px}.chat[data-style=messaging][data-wallpaper=gradient] .conversation{background-image:linear-gradient(160deg,color-mix(in srgb,var(--m-chat-bg) 70%,#9fd8c4) 0%,color-mix(in srgb,var(--m-chat-bg) 75%,#f2e3a6) 45%,color-mix(in srgb,var(--m-chat-bg) 70%,#b9b2ef) 100%)}.chat[data-style=messaging] .step{flex-direction:column;display:flex}.chat[data-style=messaging] .bubble{max-width:min(85%,480px);margin-block-start:2px;margin-block-end:2px;padding:7px 12px 8px;font-size:15px;line-height:1.4;animation:.18s ease-out m-pop;position:relative;box-shadow:0 1px 1px #0000001f}.chat[data-style=messaging] .bot{background:var(--cff-bubble-bot-bg);color:var(--cff-text);border-radius:var(--cff-radius);align-self:flex-start}.chat[data-style=messaging] .bot:not(:has(+.bot)){margin-bottom:8px}.chat[data-style=messaging] .user{background:var(--cff-user-bg);color:var(--m-user-text);border-radius:var(--cff-radius);text-align:start;cursor:pointer;border:0;align-self:flex-end;align-items:flex-end;gap:8px;min-height:0;margin-block-start:4px;margin-block-end:10px;display:flex}.chat[data-style=messaging] .user small{opacity:.6;flex-shrink:0;margin-bottom:1px;font-size:11px;line-height:1}.chat[data-style=messaging] .user small:after{content:\" ✓✓\";color:var(--m-accent);opacity:1;letter-spacing:-.18em;margin-inline-start:4px}.chat[data-style=messaging] .user:hover{filter:brightness(.97)}.chat[data-style=messaging] .user:disabled{opacity:1;cursor:default}.chat[data-style=messaging][data-tails=on] .bot:not(:has(+.bot)){border-bottom-left-radius:4px}.chat[data-style=messaging][data-tails=on] .user{border-bottom-right-radius:4px}.chat[data-style=messaging][data-tails=on] .user:before{content:\"\";background:inherit;filter:drop-shadow(0 1px #0000000f);width:10px;height:16px;position:absolute;bottom:0}.chat[data-style=messaging][data-tails=on] .bot:not(:has(+.bot)):before{content:\"\";background:inherit;filter:drop-shadow(0 1px #0000000f);width:10px;height:16px;position:absolute;bottom:0}.chat[data-style=messaging][data-tails=on] .bot:not(:has(+.bot)):before{left:-9px;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16'%3E%3Cpath d='M10 0v16H0c4-1 8-4 10-16z'/%3E%3C/svg%3E\") no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16'%3E%3Cpath d='M10 0v16H0c4-1 8-4 10-16z'/%3E%3C/svg%3E\") no-repeat}.chat[data-style=messaging][data-tails=on] .user:before{right:-9px;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16'%3E%3Cpath d='M0 0v16h10C6 15 2 12 0 0z'/%3E%3C/svg%3E\") no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='16'%3E%3Cpath d='M0 0v16h10C6 15 2 12 0 0z'/%3E%3C/svg%3E\") no-repeat}.chat[data-style=messaging] .active{margin-block-start:6px;margin-block-end:2px}.chat[data-style=messaging] .typing{background:var(--cff-bubble-bot-bg);border-radius:var(--cff-radius);width:auto;padding:12px 14px}.chat[data-style=messaging] .typing i{background:color-mix(in srgb,var(--cff-text) 45%,transparent)}.chat[data-style=messaging] .help{color:color-mix(in srgb,var(--cff-text) 65%,transparent);background:color-mix(in srgb,var(--cff-bubble-bot-bg) 80%,transparent);border-radius:10px;padding:6px 10px;display:inline-block}.chat[data-style=messaging] .chips{gap:6px;margin-top:4px}.chat[data-style=messaging] .chip{background:var(--cff-bubble-bot-bg);color:var(--m-accent);border:1px solid color-mix(in srgb,var(--m-accent) 35%,transparent);border-radius:999px;min-height:40px;padding:8px 16px;font-weight:500;box-shadow:0 1px 1px #00000014}.chat[data-style=messaging] .chip:hover:not(:disabled){background:color-mix(in srgb,var(--m-accent) 10%,var(--cff-bubble-bot-bg))}.chat[data-style=messaging] .chip[aria-pressed=true]{background:var(--m-accent);color:#fff;border-color:var(--m-accent)}.chat[data-style=messaging][data-choices=keyboard] .chips:not(.cards){grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:4px;max-width:480px;display:grid}.chat[data-style=messaging][data-choices=keyboard] .chip{text-align:center;color:var(--m-accent);background:color-mix(in srgb,var(--cff-bubble-bot-bg) 82%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:0;border-radius:10px;justify-content:center;font-size:14px;font-weight:600}.chat[data-style=messaging][data-choices=keyboard] .chip[aria-pressed=true]{background:var(--m-accent);color:#fff}.chat[data-style=messaging] .continue{margin-top:6px}.chat[data-style=messaging] button:not(.chip):not(.user):not(.link-button):not(nav button):not(.launcher-toggle):not(.close-chat),.chat[data-style=messaging] .button{background:var(--m-accent);border-color:var(--m-accent);color:#fff;border-radius:999px;min-height:40px;padding:9px 20px;font-weight:600}.chat[data-style=messaging] .link-button{color:color-mix(in srgb,var(--cff-text) 70%,transparent);font-size:14px}.chat[data-style=messaging] .active form:has(.input-row){grid-template-columns:1fr auto;align-items:end;gap:8px;margin-top:4px;display:grid}.chat[data-style=messaging] .active form:has(>textarea){grid-template-columns:1fr auto;align-items:end;gap:8px;margin-top:4px;display:grid}.chat[data-style=messaging] .active form:has(.input-row)>label[for]{clip:rect(0,0,0,0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.chat[data-style=messaging] .active form:has(>textarea)>label[for]{clip:rect(0,0,0,0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.chat[data-style=messaging] .active form .country{grid-column:1/-1;align-items:center;gap:8px;margin:0;font-size:13px;font-weight:400;display:flex}.chat[data-style=messaging] .active form>small{color:color-mix(in srgb,var(--cff-text) 60%,transparent);order:3;grid-column:1/-1}.chat[data-style=messaging] .active form .input-row input,.chat[data-style=messaging] .active form>textarea,.chat[data-style=messaging] .active select,.chat[data-style=messaging] .active .address input{background:var(--cff-bubble-bot-bg);color:var(--cff-text);border:0;border-radius:22px;min-height:44px;padding:11px 16px;box-shadow:0 1px 1px #0000001f}.chat[data-style=messaging] .active form>textarea{border-radius:18px}.chat[data-style=messaging] .active form:has(.input-row)>button[type=submit]{border-radius:50%;place-items:center;width:46px;height:46px;min-height:46px;margin:0;padding:0;font-size:0;display:grid}.chat[data-style=messaging] .active form:has(>textarea)>button[type=submit]{border-radius:50%;place-items:center;width:46px;height:46px;min-height:46px;margin:0;padding:0;font-size:0;display:grid}.chat[data-style=messaging] .active form:has(.input-row)>button[type=submit]:before{content:\"\";background:currentColor;width:22px;height:22px;margin-inline-start:3px;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z'/%3E%3C/svg%3E\") 50%/contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z'/%3E%3C/svg%3E\") 50%/contain no-repeat}.chat[data-style=messaging] .active form:has(>textarea)>button[type=submit]:before{content:\"\";background:currentColor;width:22px;height:22px;margin-inline-start:3px;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z'/%3E%3C/svg%3E\") 50%/contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z'/%3E%3C/svg%3E\") 50%/contain no-repeat}.chat[data-style=messaging] .summary,.chat[data-style=messaging] .notice{background:var(--cff-bubble-bot-bg);color:var(--cff-text);border:0;border-radius:16px;box-shadow:0 1px 2px #0000001f}.chat[data-style=messaging] .notice{text-align:center;max-width:92%;margin:10px auto}.chat[data-style=messaging] .summary dl>div{border-color:color-mix(in srgb,var(--cff-text) 10%,transparent)}.chat[data-style=messaging] .ending{flex-direction:column;align-items:flex-start;display:flex}.chat[data-style=messaging] footer{background:var(--m-header-bg);color:color-mix(in srgb,var(--m-header-text) 55%,transparent);border-top:1px solid color-mix(in srgb,var(--m-header-text) 8%,transparent);text-align:center;padding:8px 14px;font-size:11px}.chat[data-style=messaging] footer small{font-size:10.5px}.chat[data-style=messaging].dark{--cff-primary:#5eb5f7;--cff-bubble-bot-bg:#182533;--cff-user-bg:#2b5278;--cff-text:#f5f5f5;--cff-header-bg:#17212b;--cff-header-text:#f5f5f5;--cff-chat-bg:#0e1621;--cff-user-text:#fff}.chat[data-style=messaging].dark button:not(.chip):not(.link-button):not(.user):not(nav button):not(.close-chat),.chat[data-style=messaging].dark .chip[aria-pressed=true]{color:#fff}@keyframes m-pop{0%{opacity:0;transform:translateY(6px)scale(.98)}to{opacity:1;transform:none}}.launcher-panel .chat[data-style=messaging]{box-shadow:none}[data-style=messaging] .launcher-toggle{background:var(--cff-primary);border-color:var(--cff-primary);color:#fff;font-weight:600}.chat[data-style=messaging]>.notice{max-width:none;box-shadow:none;text-align:center;background:color-mix(in srgb,var(--m-accent) 10%,var(--m-header-bg));color:var(--m-header-text);border-radius:0;margin:0;padding:6px 14px;font-size:12px}.close-chat{width:36px;height:36px;min-height:36px;color:inherit;opacity:.7;background:0 0;border:0;border-radius:50%;flex-shrink:0;place-items:center;margin-inline-start:4px;padding:0;display:grid}.close-chat:hover{opacity:1;background:color-mix(in srgb,currentColor 10%,transparent)}header nav{margin-inline-start:auto}.status-notice{margin:0}.chat[data-style=messaging] .online-dot{background:#34c759}.contact-bar{background:var(--cff-header-bg,#fff);border-top:1px solid #0000000f;padding:10px 12px}.chat:not([data-style]) .contact-bar{background:0 0}.contact-link{border-radius:var(--cff-radius);border:1px solid var(--cff-primary);width:100%;min-height:44px;color:var(--cff-primary);background:0 0;justify-content:center;align-items:center;gap:8px;padding:10px 16px;font-size:15px;font-weight:600;text-decoration:none;display:flex}.contact-link:hover{background:color-mix(in srgb,var(--cff-primary) 8%,transparent)}.contact-link.is-whatsapp{color:#fff;background:#25d366;border-color:#25d366}.contact-link.is-whatsapp:hover{background:#1ebe5b}.chat{container-type:inline-size}header{flex-wrap:nowrap}.identity{min-width:0}.identity strong,.identity small{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}nav button{white-space:nowrap}@container (width<=520px){nav button{padding-inline-start:6px;padding-inline-end:6px}}.contact-closed{text-align:center;color:color-mix(in srgb,var(--cff-text) 70%,transparent);margin:0;font-size:13px;line-height:1.4}";
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/typeof.js
function ce(e) {
	"@babel/helpers - typeof";
	return ce = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, ce(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/toPrimitive.js
function le(e, t) {
	if (ce(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (ce(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/toPropertyKey.js
function ue(e) {
	var t = le(e, "string");
	return ce(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.153.0/helpers/esm/defineProperty.js
function R(e, t, n) {
	return (t = ue(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region assets/src/runtime/api.ts
var z = class extends Error {
	constructor(e, t, n = 0, r = []) {
		super(e), R(this, "code", void 0), R(this, "status", void 0), R(this, "retryAfter", void 0), R(this, "issues", void 0), this.code = e, this.status = t, this.retryAfter = n, this.issues = r;
	}
};
function de() {
	if ("randomUUID" in globalThis.crypto) return crypto.randomUUID();
	let e = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	e[6] = e[6] & 15 | 64, e[8] = e[8] & 63 | 128;
	let t = Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("");
	return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
}
var fe = class {
	constructor(e, t = (e, t) => globalThis.fetch(e, t), n = (e) => new Promise((t) => setTimeout(t, e))) {
		if (R(this, "fetcher", void 0), R(this, "pause", void 0), R(this, "base", void 0), this.fetcher = t, this.pause = n, this.base = new URL(e, globalThis.location?.href ?? "https://localhost/"), !["https:", "http:"].includes(this.base.protocol) || this.base.username || this.base.password || this.base.hash || [...this.base.searchParams.keys()].some((e) => e !== "rest_route") || globalThis.location && this.base.origin !== location.origin) throw new z("cff_unsafe_endpoint", 0);
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
				if (clearTimeout(c), n === 2 || globalThis.navigator?.onLine === !1) throw new z("cff_network", 0);
				await this.pause(500 * 2 ** n);
				continue;
			}
			clearTimeout(c);
			let u;
			try {
				u = await l.json();
			} catch {
				if (l.status < 500 && l.status !== 429) throw new z("cff_invalid_response", l.status);
				u = {};
			}
			if (l.ok) return u;
			let d = u && typeof u == "object" ? u : {}, f = d.data?.retryAfter ?? l.headers.get("Retry-After") ?? 0, p = Math.max(0, (Number.isFinite(Number(f)) ? Number(f) : (Date.parse(String(f)) - Date.now()) / 1e3) || 0), m = typeof d.code == "string" ? d.code : "cff_request_failed";
			if ((l.status >= 500 || l.status === 429 || m === "cff_request_pending" || m === "cff_idempotency_pending") && n < 2 && p <= 30) await this.pause(Math.max(p * 1e3, 500 * 2 ** n));
			else throw new z(m, l.status, p, Array.isArray(d.data?.errors) ? d.data.errors : []);
		}
		throw new z("cff_network", 0);
	}
	form(e, t) {
		return this.request(`forms/${e}`, "GET", void 0, {}, "default", t);
	}
	startToken(e, t) {
		return this.request(`forms/${e}/start-token`, "POST", { version: t });
	}
	view(e, t) {
		return this.request(`forms/${e}/view`, "POST", { version: t });
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
	magicResume(e, t) {
		return this.request("sessions/magic-resume", "POST", { formId: e }, { "X-CFF-Magic-Token": t });
	}
	magicLink(e, t) {
		return this.request(`sessions/${e.sessionId}/magic-link`, "POST", {
			channel: t,
			consent: !0
		}, { "X-CFF-Request-Token": e.requestToken });
	}
	get(e) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new z("cff_invalid_session", 0);
		return this.request(`sessions/${e.sessionId}`, "GET", void 0, { "X-CFF-Request-Token": e.requestToken });
	}
	mutate(e, t, n, r) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new z("cff_invalid_session", 0);
		return this.request(`sessions/${e.sessionId}${t === "POST" ? "/submit" : ""}`, t, n, {
			"X-CFF-Request-Token": e.requestToken,
			"Idempotency-Key": r
		});
	}
	submit(e, t, n) {
		return this.mutate(e, "POST", t, n);
	}
	async upload(e, t, n) {
		if (!/^[a-f0-9-]{36}$/i.test(e.sessionId)) throw new z("cff_invalid_session", 0);
		let r = new FormData();
		r.append("fieldId", t), r.append("file", n);
		let i = new AbortController(), a = setTimeout(() => i.abort(), 12e4);
		try {
			let t = await this.fetcher(this.url(`sessions/${e.sessionId}/uploads`), {
				method: "POST",
				body: r,
				headers: {
					"X-CFF-Request-Token": e.requestToken,
					"Idempotency-Key": de(),
					Accept: "application/json"
				},
				credentials: "same-origin",
				cache: "no-store",
				redirect: "error",
				signal: i.signal
			});
			if (!t.ok) throw new z("cff_upload_failed", t.status);
			return await t.json();
		} finally {
			clearTimeout(a);
		}
	}
}, pe, B, me, he, ge = 0, _e = [], V = t, ve = V.__b, ye = V.__r, be = V.diffed, xe = V.__c, Se = V.unmount, Ce = V.__;
function we(e, t) {
	V.__h && V.__h(B, e, ge || t), ge = 0;
	var n = B.__H || (B.__H = {
		__: [],
		__h: []
	});
	return e >= n.__.length && n.__.push({}), n.__[e];
}
function H(e) {
	return ge = 1, Te(Fe, e);
}
function Te(e, t, n) {
	var r = we(pe++, 2);
	if (r.t = e, !r.__c && (r.__ = [n ? n(t) : Fe(void 0, t), function(e) {
		var t = r.__N ? r.__N[0] : r.__[0], n = r.t(t, e);
		t !== n && (r.__N = [n, r.__[1]], r.__c.setState({}));
	}], r.__c = B, !B.__f)) {
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
		B.__f = !0;
		var a = B.shouldComponentUpdate, o = B.componentWillUpdate;
		B.componentWillUpdate = function(e, t, n) {
			if (this.__e) {
				var r = a;
				a = void 0, i(e, t, n), a = r;
			}
			o && o.call(this, e, t, n);
		}, B.shouldComponentUpdate = i;
	}
	return r.__N || r.__;
}
function U(e, t) {
	var n = we(pe++, 3);
	!V.__s && Pe(n.__H, t) && (n.__ = e, n.u = t, B.__H.__h.push(n));
}
function Ee(e, t) {
	var n = we(pe++, 4);
	!V.__s && Pe(n.__H, t) && (n.__ = e, n.u = t, B.__h.push(n));
}
function De(e) {
	return ge = 5, Oe(function() {
		return { current: e };
	}, []);
}
function Oe(e, t) {
	var n = we(pe++, 7);
	return Pe(n.__H, t) && (n.__ = e(), n.__H = t, n.__h = e), n.__;
}
function ke() {
	for (var e; e = _e.shift();) {
		var t = e.__H;
		if (e.__P && t) try {
			t.__h.some(Me), t.__h.some(Ne), t.__h = [];
		} catch (n) {
			t.__h = [], V.__e(n, e.__v);
		}
	}
}
V.__b = function(e) {
	B = null, ve && ve(e);
}, V.__ = function(e, t) {
	e && t.__k && t.__k.__m && (e.__m = t.__k.__m), Ce && Ce(e, t);
}, V.__r = function(e) {
	ye && ye(e), pe = 0;
	var t = (B = e.__c).__H;
	t && (me === B ? (t.__h = [], B.__h = [], t.__.some(function(e) {
		e.__N && (e.__ = e.__N), e.u = e.__N = void 0;
	})) : (t.__h.some(Me), t.__h.some(Ne), t.__h = [], pe = 0)), me = B;
}, V.diffed = function(e) {
	be && be(e);
	var t = e.__c;
	t && t.__H && (t.__H.__h.length && (_e.push(t) !== 1 && he === V.requestAnimationFrame || ((he = V.requestAnimationFrame) || je)(ke)), t.__H.__.some(function(e) {
		e.u && (e.__H = e.u, e.u = void 0);
	})), me = B = null;
}, V.__c = function(e, t) {
	t.some(function(e) {
		try {
			e.__h.some(Me), e.__h = e.__h.filter(function(e) {
				return !e.__ || Ne(e);
			});
		} catch (n) {
			t.some(function(e) {
				e.__h && (e.__h = []);
			}), t = [], V.__e(n, e.__v);
		}
	}), xe && xe(e, t);
}, V.unmount = function(e) {
	Se && Se(e);
	var t, n = e.__c;
	n && n.__H && (n.__H.__.some(function(e) {
		try {
			Me(e);
		} catch (e) {
			t = e;
		}
	}), n.__H = void 0, t && V.__e(t, n.__v));
};
var Ae = typeof requestAnimationFrame == "function";
function je(e) {
	var t, n = function() {
		clearTimeout(r), Ae && cancelAnimationFrame(t), setTimeout(e);
	}, r = setTimeout(n, 35);
	Ae && (t = requestAnimationFrame(n));
}
function Me(e) {
	var t = B, n = e.__c;
	typeof n == "function" && (e.__c = void 0, n()), B = t;
}
function Ne(e) {
	var t = B;
	e.__c = e.__(), B = t;
}
function Pe(e, t) {
	return !e || e.length !== t.length || t.some(function(t, n) {
		return t !== e[n];
	});
}
function Fe(e, t) {
	return typeof t == "function" ? t(e) : t;
}
//#endregion
//#region assets/src/shared/logic/value.ts
var Ie = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Le = () => Object.create(null), W = (e, t, n, r) => r === void 0 ? {
	path: e,
	code: t,
	message: n
} : {
	path: e,
	code: t,
	message: n,
	fieldKey: r
}, G = (e) => e.replace(/~/g, "~0").replace(/\//g, "~1"), Re = (e) => typeof e == "object" && !!e && !Array.isArray(e) && Object.keys(e).sort().join(",") === "other,value" && typeof e.value == "string" && typeof e.other == "string", ze = (e) => Re(e) ? e.value : e, Be = (e) => e == null || e === "" || Array.isArray(e) && e.length === 0 || typeof e == "object" && !!e && Object.keys(e).length === 0;
function Ve(e, t) {
	if (e === t) return !0;
	if (e === null || t === null || typeof e != "object" || typeof t != "object" || Array.isArray(e) !== Array.isArray(t)) return !1;
	let n = e, r = t, i = Object.keys(n);
	return i.length === Object.keys(r).length && i.every((e) => Ie(r, e) && Ve(n[e], r[e]));
}
var K = (e) => typeof e == "number" && Number.isFinite(e);
function q(e) {
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
function He(e, t) {
	let n = q(e);
	if (!t || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?Z$/.test(t)) return null;
	let r = q(t.slice(0, 10));
	return !n || !r || e > t.slice(0, 10) ? null : r[0] - n[0] - +(r[1] * 100 + r[2] < n[1] * 100 + n[2]);
}
function Ue(e) {
	if (typeof e != "string" || e.length > 512 || /[^\x20-\x7e]|[()|]/.test(e)) return null;
	let t = {
		d: "0-9",
		w: "A-Za-z0-9_",
		s: " \\t\\r\\n\\f\\x0b"
	}, n = (e, n) => t[e] ? n ? t[e] : `[${t[e]}]` : [
		"D",
		"W",
		"S"
	].includes(e) ? n ? null : `[^${t[e.toLowerCase()]}]` : e === "-" && !n ? "-" : "nrt\\.[]{}^$*+?-/".includes(e) ? `\\${e}` : null, r = "", i = !1, a = 0;
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
function We(e) {
	let t = Ue(e);
	if (t === null) return null;
	try {
		return new RegExp(t, "u");
	} catch {
		return null;
	}
}
var Ge = (e, t) => typeof e == "string" && [...e].length <= 4096 && (We(t)?.test(e) ?? !1), Ke = {
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
function qe(e, t) {
	var n = Array.prototype.slice.call(t);
	return n.push(Ke), e.apply(this, n);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/tools/semver-compare.js
function Je(e, t) {
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
var Ye = {}.constructor;
function Xe(e) {
	return e != null && e.constructor === Ye;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isCallingCode.js
var Ze = /^\d+$/;
function Qe(e) {
	return Ze.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/metadata.js
function $e(e) {
	"@babel/helpers - typeof";
	return $e = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, $e(e);
}
function et(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function tt(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, rt(r.key), r);
	}
}
function nt(e, t, n) {
	return t && tt(e.prototype, t), n && tt(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function rt(e) {
	var t = it(e, "string");
	return $e(t) == "symbol" ? t : t + "";
}
function it(e, t) {
	if ($e(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if ($e(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var at = "1.2.0", ot = "1.7.35", st = " ext. ", J = /*#__PURE__*/ function() {
	function e(t) {
		et(this, e), pt(t), this.metadata = t, _t.call(this, t);
	}
	return nt(e, [
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
				if (e && (Qe(e) ? r = e : n = e), t && (r = t), n && n !== "001") {
					var i = this.getCountryMetadata(n);
					if (!i) throw Error(`Unknown country: ${n}`);
					this.numberingPlan = new ct(i, this);
				} else if (r) {
					if (!this.hasCallingCode(r)) throw Error(`Unknown calling code: ${r}`);
					this.numberingPlan = new ct(this.getNumberingPlanMetadata(r), this);
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
}(), ct = /*#__PURE__*/ function() {
	function e(t, n) {
		et(this, e), this.globalMetadataObject = n, this.metadata = t, _t.call(this, n.metadata);
	}
	return nt(e, [
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
					return new lt(t, e);
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
				if (this.hasTypes() && ft(this.types(), e)) return new dt(ft(this.types(), e), this);
			}
		},
		{
			key: "ext",
			value: function() {
				return this.v1 || this.v2 ? st : this.metadata[13] || st;
			}
		}
	]);
}(), lt = /*#__PURE__*/ function() {
	function e(t, n) {
		et(this, e), this._format = t, this.metadata = n;
	}
	return nt(e, [
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
				return !(!this.nationalPrefixFormattingRule() || ut.test(this.nationalPrefixFormattingRule()));
			}
		},
		{
			key: "internationalFormat",
			value: function() {
				return this._format[5] || this.format();
			}
		}
	]);
}(), ut = /^\(?\$1\)?$/, dt = /*#__PURE__*/ function() {
	function e(t, n) {
		et(this, e), this.type = t, this.metadata = n;
	}
	return nt(e, [{
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
function ft(e, t) {
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
function pt(e) {
	if (!e) throw Error("[libphonenumber-js] `metadata` argument not passed. Check your arguments.");
	if (!Xe(e) || !Xe(e.countries)) throw Error(`[libphonenumber-js] \`metadata\` argument was passed but it's not a valid metadata. Must be an object having \`.countries\` child object property. Got ${Xe(e) ? "an object of shape: { " + Object.keys(e).join(", ") + " }" : "a " + mt(e) + ": " + e}.`);
}
/* istanbul ignore next */
var mt = function(e) {
	return $e(e);
};
function ht(e, t) {
	var n = new J(t);
	if (n.hasCountry(e)) return n.selectNumberingPlan(e).countryCallingCode();
	throw Error(`Unknown country: ${e}`);
}
function gt(e, t) {
	return t.countries.hasOwnProperty(e);
}
function _t(e) {
	var t = e.version;
	typeof t == "number" ? (this.v1 = t === 1, this.v2 = t === 2, this.v3 = t === 3, this.v4 = t === 4) : t ? Je(t, at) === -1 ? this.v2 = !0 : Je(t, ot) === -1 ? this.v3 = !0 : this.v4 = !0 : this.v1 = !0;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/mergeArrays.js
function vt(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = yt(e)) || t && e && typeof e.length == "number") {
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
function yt(e, t) {
	if (e) {
		if (typeof e == "string") return bt(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? bt(e, t) : void 0;
	}
}
function bt(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function xt(e, t) {
	for (var n = e.slice(), r = vt(t), i; !(i = r()).done;) {
		var a = i.value;
		e.indexOf(a) < 0 && n.push(a);
	}
	return n.sort(function(e, t) {
		return e - t;
	});
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/checkNumberLength.js
function St(e, t, n) {
	return Ct(e, void 0, t, n);
}
function Ct(e, t, n, r) {
	n && (r = new J(r.metadata), r.selectNumberingPlan(n));
	var i = r.type(t), a = i && i.possibleLengths() || r.possibleLengths();
	if (!a) return "IS_POSSIBLE";
	if (t === "FIXED_LINE_OR_MOBILE") {
		/* istanbul ignore next */
		if (!r.type("FIXED_LINE")) return Ct(e, "MOBILE", n, r);
		var o = r.type("MOBILE");
		o && (a = xt(a, o.possibleLengths()));
	} else if (t && !i) return "INVALID_LENGTH";
	var s = e.length, c = a[0];
	return c === s ? "IS_POSSIBLE" : c > s ? "TOO_SHORT" : a[a.length - 1] < s ? "TOO_LONG" : a.indexOf(s, 1) >= 0 ? "IS_POSSIBLE" : "INVALID_LENGTH";
}
//#endregion
//#region node_modules/libphonenumber-js/es6/isPossible.js
function wt(e, t, n) {
	/* istanbul ignore if */
	t === void 0 && (t = {});
	var r = new J(n);
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
	if (r.possibleLengths()) return Tt(e.phone || e.nationalNumber, r);
	if (e.countryCallingCode && r.isNonGeographicCallingCode(e.countryCallingCode)) return !0;
	throw Error("Missing \"possibleLengths\" in metadata. Perhaps the metadata has been generated before v1.0.18.");
}
function Tt(e, t) {
	switch (St(e, void 0, t)) {
		case "IS_POSSIBLE": return !0;
		default: return !1;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/matchesEntirely.js
function Y(e, t) {
	return e = e || "", RegExp("^(?:" + t + ")$").test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getNumberType.js
function Et(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = Dt(e)) || t && e && typeof e.length == "number") {
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
function Dt(e, t) {
	if (e) {
		if (typeof e == "string") return Ot(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Ot(e, t) : void 0;
	}
}
function Ot(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
var kt = [
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
function At(e, t, n) {
	if (t = t || {}, e.country || e.countryCallingCode) {
		var r = new J(n);
		r.selectNumberingPlan(e.country || e.countryCallingCode);
		var i = t.v2 ? e.nationalNumber : e.phone;
		if (Y(i, r.nationalNumberPattern())) {
			if (jt(i, "FIXED_LINE", r)) return r.type("MOBILE") && r.type("MOBILE").pattern() === "" || !r.type("MOBILE") || jt(i, "MOBILE", r) ? "FIXED_LINE_OR_MOBILE" : "FIXED_LINE";
			for (var a = Et(kt), o; !(o = a()).done;) {
				var s = o.value;
				if (jt(i, s, r)) return s;
			}
		}
	}
}
function jt(e, t, n) {
	var r = n.type(t);
	return !r || !r.pattern() || r.possibleLengths() && r.possibleLengths().indexOf(e.length) < 0 ? !1 : Y(e, r.pattern());
}
//#endregion
//#region node_modules/libphonenumber-js/es6/isValid.js
function Mt(e, t, n) {
	t = t || {};
	var r = new J(n);
	return r.selectNumberingPlan(e.country || e.countryCallingCode), r.hasTypes() ? At(e, t, r.metadata) !== void 0 : Y(t.v2 ? e.nationalNumber : e.phone, r.nationalNumberPattern());
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isCountryCode.js
var Nt = /^[A-Z]{2}$/;
function Pt(e) {
	return Nt.test(e);
}
function Ft(e, t) {
	var n, r, i = new J(t);
	return Pt(e) ? (n = e, i.selectNumberingPlan(n), r = i.countryCallingCode()) : r = e, {
		country: n,
		callingCode: r
	};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getPossibleCountriesForNumber.js
function It(e, t, n) {
	var r = new J(n).getCountryCodesForCallingCode(e);
	return r ? r.filter(function(e) {
		return Lt(t, e, n);
	}) : [];
}
function Lt(e, t, n) {
	var r = new J(n);
	return r.selectNumberingPlan(t), r.numberingPlan.possibleLengths().indexOf(e.length) >= 0;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/constants.js
var X = "0-9０-９٠-٩۰-۹", Rt = "-‐-―−ー－／/．. \xA0­​⁠　()（）［］\\[\\]~⁓∼～", zt = "+＋", Bt = RegExp("([" + X + "])");
function Vt(e, t, n, r) {
	if (t) {
		var i = new J(r);
		i.selectNumberingPlan(t || n);
		var a = new RegExp(i.IDDPrefix());
		if (e.search(a) === 0) {
			e = e.slice(e.match(a)[0].length);
			var o = e.match(Bt);
			if (!(o && o[1] != null && o[1].length > 0 && o[1] === "0")) return e;
		}
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractNationalNumberFromPossiblyIncompleteNumber.js
function Ht(e, t) {
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
function Ut(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = Wt(e)) || t && e && typeof e.length == "number") {
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
function Wt(e, t) {
	if (e) {
		if (typeof e == "string") return Gt(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Gt(e, t) : void 0;
	}
}
function Gt(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Kt(e, t, n) {
	for (var r = new J(n), i = Ut(t), a; !(a = i()).done;) {
		var o = a.value;
		if (r.selectNumberingPlan(o), r.leadingDigits()) {
			if (e && e.search(r.leadingDigits()) === 0) return o;
		} else if (At({
			phone: e,
			country: o
		}, void 0, r.metadata)) return o;
	}
}
function qt(e, t) {
	var n = t.nationalNumber, r = t.metadata, i = r.getCountryCodesForCallingCode(e);
	if (i) return i.length === 1 ? i[0] : Kt(n, i, r.metadata);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractNationalNumber.js
function Jt(e, t, n) {
	var r = Ht(e, n), i = r.carrierCode, a = r.nationalNumber;
	return a !== e && (!Yt(e, a, n) || n.numberingPlan.possibleLengths() && (t || (t = qt(n.numberingPlan.callingCode(), {
		nationalNumber: a,
		metadata: n
	})), !Xt(a, t, n))) ? { nationalNumber: e } : {
		nationalNumber: a,
		carrierCode: i
	};
}
function Yt(e, t, n) {
	return !(Y(e, n.nationalNumberPattern()) && !Y(t, n.nationalNumberPattern()));
}
function Xt(e, t, n) {
	switch (St(e, t, n)) {
		case "TOO_SHORT":
		case "INVALID_LENGTH": return !1;
		default: return !0;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCodeFromInternationalNumberWithoutPlusSign.js
function Zt(e, t, n, r, i) {
	if (!(t || n || r)) return { number: e };
	var a = t || n ? ht(t || n, i) : r;
	if (e.indexOf(a) === 0) {
		var o = new J(i);
		o.selectNumberingPlan(t || n || r);
		var s = e.slice(a.length), c = Jt(s, void 0, o).nationalNumber, l = Jt(e, void 0, o).nationalNumber;
		if (!Y(l, o.nationalNumberPattern()) && Y(c, o.nationalNumberPattern()) || St(l, void 0, o) === "TOO_LONG") return {
			countryCallingCode: a,
			number: s
		};
	}
	return { number: e };
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractCountryCallingCode.js
function Qt(e, t, n, r, i) {
	if (!e) return {};
	var a;
	if (e[0] !== "+") {
		var o = Vt(e, t || n, r, i);
		if (o && o !== e) a = !0, e = "+" + o;
		else {
			if (t || n || r) {
				var s = Zt(e, t, n, r, i), c = s.countryCallingCode, l = s.number;
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
	for (var u = new J(i), d = 2; d - 1 <= 3 && d <= e.length;) {
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
function $t(e) {
	return e.replace(RegExp(`[${Rt}]+`, "g"), " ").trim();
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/formatNationalNumberUsingFormat.js
var en = /(\$\d)/;
function tn(e, t, n) {
	var r = n.useInternationalFormat, i = n.withNationalPrefix;
	n.carrierCode, n.metadata;
	var a = e.replace(new RegExp(t.pattern()), r ? t.internationalFormat() : i && t.nationalPrefixFormattingRule() ? t.format().replace(en, t.nationalPrefixFormattingRule()) : t.format());
	return r ? $t(a) : a;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/getIddPrefix.js
var nn = /^[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?$/;
function rn(e, t, n) {
	var r = new J(n);
	if (r.selectNumberingPlan(e || t), r.defaultIDDPrefix()) return r.defaultIDDPrefix();
	if (nn.test(r.IDDPrefix())) return r.IDDPrefix();
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extension/createExtensionPattern.js
var an = ";ext=", on = function(e) {
	return `([${X}]{1,${e}})`;
};
function sn(e) {
	var t = "20", n = "15", r = "9", i = "6", a = "[ \xA0\\t,]*", o = "[:\\.．]?[ \xA0\\t,-]*", s = "#?", c = "(?:e?xt(?:ensi(?:ó?|ó))?n?|ｅ?ｘｔｎ?|доб|anexo)", l = "(?:[xｘ#＃~～]|int|ｉｎｔ)", u = "[- ]+", d = "[ \xA0\\t]*", f = "(?:,{2}|;)", p = an + on(t), m = a + c + o + on(t) + s, h = a + l + o + on(r) + s, g = u + on(i) + "#", _ = d + f + o + on(n) + s, v = d + "(?:,)+" + o + on(r) + s;
	return p + "|" + m + "|" + h + "|" + g + "|" + _ + "|" + v;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/isViablePhoneNumber.js
var cn = "[" + X + "]{2}", ln = "[" + zt + "]{0,1}(?:[" + Rt + "]*[" + X + "]){3,}[" + Rt + X + "]*", un = RegExp("^[" + zt + "]{0,1}(?:[" + Rt + "]*[" + X + "]){1,2}$", "i"), dn = ln + "(?:" + sn() + ")?", fn = RegExp("^" + cn + "$|^" + dn + "$", "i");
function pn(e) {
	return e.length >= 2 && fn.test(e);
}
function mn(e) {
	return un.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/RFC3966.js
function hn(e) {
	var t = e.number, n = e.ext;
	if (!t) return "";
	if (t[0] !== "+") throw Error("\"formatRFC3966()\" expects \"number\" to be in E.164 format.");
	return `tel:${t}${n ? ";ext=" + n : ""}`;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/format.js
var gn = { formatExtension: function(e, t, n) {
	return `${e}${n.ext()}${t}`;
} };
function _n(e, t, n, r) {
	n = n ? Sn({}, gn, n) : gn;
	var i = new J(r);
	if (e.country && e.country !== "001") {
		if (!i.hasCountry(e.country)) throw Error(`Unknown country: ${e.country}`);
		i.selectNumberingPlan(e.country);
	} else if (e.countryCallingCode) i.selectNumberingPlan(e.countryCallingCode);
	else return e.phone || "";
	var a = i.countryCallingCode(), o = n.v2 ? e.nationalNumber : e.phone, s;
	switch (t) {
		case "NATIONAL": return o ? (s = vn(o, e.carrierCode, "NATIONAL", i, n), bn(s, e.ext, i, n.formatExtension)) : "";
		case "INTERNATIONAL": return o ? (s = vn(o, null, "INTERNATIONAL", i, n), s = `+${a} ${s}`, bn(s, e.ext, i, n.formatExtension)) : `+${a}`;
		case "E.164": return `+${a}${o}`;
		case "RFC3966": return hn({
			number: `+${a}${o}`,
			ext: e.ext
		});
		case "IDD":
			if (!n.fromCountry) return;
			var c = xn(o, e.carrierCode, a, n.fromCountry, i);
			return c ? bn(c, e.ext, i, n.formatExtension) : void 0;
		default: throw Error(`Unknown "format" argument passed to "formatNumber()": "${t}"`);
	}
}
function vn(e, t, n, r, i) {
	var a = yn(r.formats(), e);
	return a ? tn(e, a, {
		useInternationalFormat: n === "INTERNATIONAL",
		withNationalPrefix: !(a.nationalPrefixIsOptionalWhenFormattingInNationalFormat() && i && i.nationalPrefix === !1),
		carrierCode: t,
		metadata: r
	}) : e;
}
function yn(e, t) {
	return Cn(e, function(e) {
		if (e.leadingDigitsPatterns().length > 0) {
			var n = e.leadingDigitsPatterns()[e.leadingDigitsPatterns().length - 1];
			if (t.search(n) !== 0) return !1;
		}
		return Y(t, e.pattern());
	});
}
function bn(e, t, n, r) {
	return t ? r(e, t, n) : e;
}
function xn(e, t, n, r, i) {
	if (ht(r, i.metadata) === n) {
		var a = vn(e, t, "NATIONAL", i);
		return n === "1" ? n + " " + a : a;
	}
	var o = rn(r, void 0, i.metadata);
	if (o) return `${o} ${n} ${vn(e, null, "INTERNATIONAL", i)}`;
}
function Sn() {
	for (var e = 1, t = [...arguments]; e < t.length;) {
		if (t[e]) for (var n in t[e]) t[0][n] = t[e][n];
		e++;
	}
	return t[0];
}
function Cn(e, t) {
	for (var n = 0; n < e.length;) {
		if (t(e[n])) return e[n];
		n++;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/PhoneNumber.js
function wn(e) {
	"@babel/helpers - typeof";
	return wn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, wn(e);
}
function Tn(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function En(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Tn(Object(n), !0).forEach(function(t) {
			Dn(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Tn(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Dn(e, t, n) {
	return (t = jn(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function On(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function kn(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, jn(r.key), r);
	}
}
function An(e, t, n) {
	return t && kn(e.prototype, t), n && kn(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function jn(e) {
	var t = Mn(e, "string");
	return wn(t) == "symbol" ? t : t + "";
}
function Mn(e, t) {
	if (wn(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (wn(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
var Nn = /*#__PURE__*/ function() {
	function e(t, n, r) {
		if (On(this, e), !t) throw TypeError("First argument is required");
		if (typeof t != "string") throw TypeError("First argument must be a string");
		if (t[0] === "+" && !n) throw TypeError("`metadata` argument not passed");
		if (Xe(n) && Xe(n.countries)) {
			r = n;
			var i = t;
			if (!Pn.test(i)) throw Error("Invalid `number` argument passed: must consist of a \"+\" followed by digits");
			var a = Qt(i, void 0, void 0, void 0, r), o = a.countryCallingCode;
			if (n = a.number, t = o, !n) throw Error("Invalid `number` argument passed: too short");
		}
		if (!n) throw TypeError("`nationalNumber` argument is required");
		if (typeof n != "string") throw TypeError("`nationalNumber` argument must be a string");
		pt(r);
		var s = Ft(t, r), c = s.country, l = s.callingCode;
		this.country = c, this.countryCallingCode = l, this.nationalNumber = n, this.number = "+" + this.countryCallingCode + this.nationalNumber, this.getMetadata = function() {
			return r;
		};
	}
	return An(e, [
		{
			key: "setExt",
			value: function(e) {
				this.ext = e;
			}
		},
		{
			key: "getPossibleCountries",
			value: function() {
				return this.country ? [this.country] : It(this.countryCallingCode, this.nationalNumber, this.getMetadata());
			}
		},
		{
			key: "isPossible",
			value: function() {
				return wt(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "isValid",
			value: function() {
				return Mt(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "isNonGeographic",
			value: function() {
				return new J(this.getMetadata()).isNonGeographicCallingCode(this.countryCallingCode);
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
				return At(this, { v2: !0 }, this.getMetadata());
			}
		},
		{
			key: "format",
			value: function(e, t) {
				return _n(this, e, t ? En(En({}, t), {}, { v2: !0 }) : { v2: !0 }, this.getMetadata());
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
}(), Pn = /^\+\d+$/;
//#endregion
//#region node_modules/libphonenumber-js/es6/ParseError.js
function Fn(e) {
	"@babel/helpers - typeof";
	return Fn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Fn(e);
}
function In(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Rn(r.key), r);
	}
}
function Ln(e, t, n) {
	return t && In(e.prototype, t), n && In(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Rn(e) {
	var t = zn(e, "string");
	return Fn(t) == "symbol" ? t : t + "";
}
function zn(e, t) {
	if (Fn(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Fn(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Bn(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Vn(e, t, n) {
	return t = Xn(t), Hn(e, qn() ? Reflect.construct(t, n || [], Xn(e).constructor) : t.apply(e, n));
}
function Hn(e, t) {
	if (t && (Fn(t) == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return Un(e);
}
function Un(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Wn(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Yn(e, t);
}
function Gn(e) {
	var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
	return Gn = function(e) {
		if (e === null || !Jn(e)) return e;
		if (typeof e != "function") throw TypeError("Super expression must either be null or a function");
		if (t !== void 0) {
			if (t.has(e)) return t.get(e);
			t.set(e, n);
		}
		function n() {
			return Kn(e, arguments, Xn(this).constructor);
		}
		return n.prototype = Object.create(e.prototype, { constructor: {
			value: n,
			enumerable: !1,
			writable: !0,
			configurable: !0
		} }), Yn(n, e);
	}, Gn(e);
}
function Kn(e, t, n) {
	if (qn()) return Reflect.construct.apply(null, arguments);
	var r = [null];
	r.push.apply(r, t);
	var i = new (e.bind.apply(e, r))();
	return n && Yn(i, n.prototype), i;
}
function qn() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (qn = function() {
		return !!e;
	})();
}
function Jn(e) {
	try {
		return Function.toString.call(e).indexOf("[native code]") !== -1;
	} catch {
		return typeof e == "function";
	}
}
function Yn(e, t) {
	return Yn = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Yn(e, t);
}
function Xn(e) {
	return Xn = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, Xn(e);
}
var Z = /*#__PURE__*/ function(e) {
	function t(e) {
		var n;
		return Bn(this, t), n = Vn(this, t, [e]), Object.setPrototypeOf(n, t.prototype), n.name = n.constructor.name, n;
	}
	return Wn(t, e), Ln(t);
}(/*#__PURE__*/ Gn(Error)), Zn = RegExp("(?:" + sn() + ")$", "i");
function Qn(e) {
	var t = e.search(Zn);
	if (t < 0) return {};
	for (var n = e.slice(0, t), r = e.match(Zn), i = 1; i < r.length;) {
		if (r[i]) return {
			number: n,
			ext: r[i]
		};
		i++;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/parseDigits.js
var $n = {
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
function er(e) {
	return $n[e];
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parseIncompletePhoneNumber.js
function tr(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = nr(e)) || t && e && typeof e.length == "number") {
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
function nr(e, t) {
	if (e) {
		if (typeof e == "string") return rr(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? rr(e, t) : void 0;
	}
}
function rr(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function ir(e) {
	for (var t = "", n = tr(e.split("")), r; !(r = n()).done;) {
		var i = r.value;
		t += ar(i, t) || "";
	}
	return t;
}
function ar(e, t, n) {
	if (e === "+") {
		if (t) {
			typeof n == "function" && n("end");
			return;
		}
		return "+";
	}
	return er(e);
}
var or = "([" + X + "]|[\\-\\.\\(\\)]?)", sr = "^\\+" + or + "*[" + X + "]" + or + "*$", cr = new RegExp(sr, "g"), lr = X, ur = "[" + lr + "]+((\\-)*[" + lr + "])*", dr = "[a-zA-Z]+((\\-)*[" + lr + "])*", fr = "^(" + ur + "\\.)*" + dr + "\\.?$", pr = new RegExp(fr, "g"), mr = "tel:", hr = ";phone-context=", gr = ";isub=";
function _r(e) {
	var t = e.indexOf(hr);
	if (t < 0) return null;
	var n = t + hr.length;
	if (n >= e.length) return "";
	var r = e.indexOf(";", n);
	return r >= 0 ? e.substring(n, r) : e.substring(n);
}
function vr(e) {
	return e === null ? !0 : e.length === 0 ? !1 : cr.test(e) || pr.test(e);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/helpers/extractFormattedPhoneNumberFromPossibleRfc3966NumberUri.js
function yr(e, t) {
	var n = t.extractFormattedPhoneNumber, r = _r(e);
	if (!vr(r)) throw new Z("NOT_A_NUMBER");
	var i;
	if (r === null) i = n(e) || "";
	else {
		i = "", r.charAt(0) === "+" && (i += r);
		var a = e.indexOf(mr), o = a >= 0 ? a + mr.length : 0, s = e.indexOf(hr);
		i += e.substring(o, s);
	}
	var c = i.indexOf(gr);
	if (c > 0 && (i = i.substring(0, c)), i !== "") return i;
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parse.js
var br = 250, xr = RegExp("[" + zt + X + "]"), Sr = RegExp("[^" + X + "#]+$");
function Cr(e, t, n) {
	t = t || {};
	var r = new J(n);
	if (t.defaultCountry && !r.hasCountry(t.defaultCountry)) throw t.v2 ? new Z("INVALID_COUNTRY") : Error(`Unknown country: ${t.defaultCountry}`);
	var i = Tr(e, t.v2, t.extract), a = i.number, o = i.ext, s = i.error;
	if (!a) {
		if (t.v2) throw s === "TOO_SHORT" ? new Z("TOO_SHORT") : new Z("NOT_A_NUMBER");
		return {};
	}
	var c = Dr(a, t.defaultCountry, t.defaultCallingCode, r), l = c.country, u = c.nationalNumber, d = c.countryCallingCode, f = c.countryCallingCodeSource, p = c.carrierCode;
	if (!r.hasSelectedNumberingPlan()) {
		if (t.v2) throw new Z("INVALID_COUNTRY");
		return {};
	}
	if (!u || u.length < 2) {
		/* istanbul ignore if */
		if (t.v2) throw new Z("TOO_SHORT");
		return {};
	}
	if (u.length > 17) {
		if (t.v2) throw new Z("TOO_LONG");
		return {};
	}
	if (t.v2) {
		var m = new Nn(d, u, r.metadata);
		return l && (m.country = l), p && (m.carrierCode = p), o && (m.ext = o), m.__countryCallingCodeSource = f, m;
	}
	var h = (t.extended ? r.hasSelectedNumberingPlan() : l) ? Y(u, r.nationalNumberPattern()) : !1;
	return t.extended ? {
		country: l,
		countryCallingCode: d,
		carrierCode: p,
		valid: h,
		possible: h ? !0 : !!(t.extended === !0 && r.possibleLengths() && Tt(u, r)),
		phone: u,
		ext: o
	} : h ? Er(l, u, o) : {};
}
function wr(e, t, n) {
	if (e) {
		if (e.length > br) {
			if (n) throw new Z("TOO_LONG");
		} else {
			if (t === !1) return e;
			var r = e.search(xr);
			if (!(r < 0)) return e.slice(r).replace(Sr, "");
		}
	}
}
function Tr(e, t, n) {
	var r = yr(e, { extractFormattedPhoneNumber: function(e) {
		return wr(e, n, t);
	} });
	if (!r) return {};
	if (!pn(r)) return mn(r) ? { error: "TOO_SHORT" } : {};
	var i = Qn(r);
	return i.ext ? i : { number: r };
}
function Er(e, t, n) {
	var r = {
		country: e,
		phone: t
	};
	return n && (r.ext = n), r;
}
function Dr(e, t, n, r) {
	var i = Qt(ir(e), void 0, t, n, r.metadata), a = i.countryCallingCodeSource, o = i.countryCallingCode, s = i.number, c;
	if (o) r.selectNumberingPlan(o);
	else if (s && (t || n)) t ? (c = t, r.selectNumberingPlan(t), o = r.numberingPlan.callingCode()) : (r.selectNumberingPlan(n), o = n);
	else return {};
	if (!s) return {
		countryCallingCodeSource: a,
		countryCallingCode: o
	};
	var l = Jt(ir(s), void 0, r), u = l.nationalNumber, d = l.carrierCode, f = qt(o, {
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
function Or(e) {
	"@babel/helpers - typeof";
	return Or = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Or(e);
}
function kr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Ar(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? kr(Object(n), !0).forEach(function(t) {
			jr(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : kr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function jr(e, t, n) {
	return (t = Mr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Mr(e) {
	var t = Nr(e, "string");
	return Or(t) == "symbol" ? t : t + "";
}
function Nr(e, t) {
	if (Or(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Or(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Pr(e, t, n) {
	return Cr(e, Ar(Ar({}, t), {}, { v2: !0 }), n);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/normalizeArguments.js
function Fr(e) {
	"@babel/helpers - typeof";
	return Fr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Fr(e);
}
function Ir(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Lr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Ir(Object(n), !0).forEach(function(t) {
			Rr(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ir(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Rr(e, t, n) {
	return (t = zr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function zr(e) {
	var t = Br(e, "string");
	return Fr(t) == "symbol" ? t : t + "";
}
function Br(e, t) {
	if (Fr(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Fr(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Vr(e, t) {
	return Kr(e) || Gr(e, t) || Ur(e, t) || Hr();
}
function Hr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ur(e, t) {
	if (e) {
		if (typeof e == "string") return Wr(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Wr(e, t) : void 0;
	}
}
function Wr(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Gr(e, t) {
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
function Kr(e) {
	if (Array.isArray(e)) return e;
}
function qr(e) {
	var t = Vr(Array.prototype.slice.call(e), 4), n = t[0], r = t[1], i = t[2], a = t[3], o, s, c;
	if (typeof n == "string") o = n;
	else throw TypeError("A text for parsing must be a string.");
	if (!r || typeof r == "string") a ? (s = i, c = a) : (s = void 0, c = i), r && (s = Lr({ defaultCountry: r }, s));
	else if (Xe(r)) i ? (s = r, c = i) : c = r;
	else throw Error(`Invalid second argument: ${r}`);
	return {
		text: o,
		options: s,
		metadata: c
	};
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parsePhoneNumber_.js
function Jr(e) {
	"@babel/helpers - typeof";
	return Jr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Jr(e);
}
function Yr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Xr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Yr(Object(n), !0).forEach(function(t) {
			Zr(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Yr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Zr(e, t, n) {
	return (t = Qr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Qr(e) {
	var t = $r(e, "string");
	return Jr(t) == "symbol" ? t : t + "";
}
function $r(e, t) {
	if (Jr(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Jr(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function ei(e, t, n) {
	t && t.defaultCountry && !gt(t.defaultCountry, n) && (t = Xr(Xr({}, t), {}, { defaultCountry: void 0 }));
	try {
		return Pr(e, t, n);
	} catch (e) {
		/* istanbul ignore else */
		if (!(e instanceof Z)) throw e;
	}
}
//#endregion
//#region node_modules/libphonenumber-js/es6/parsePhoneNumber.js
function ti() {
	var e = qr(arguments), t = e.text, n = e.options, r = e.metadata;
	return ei(t, n, r);
}
//#endregion
//#region node_modules/libphonenumber-js/es6/getCountries.js
function ni(e) {
	return new J(e).getCountries();
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js
function ri() {
	return qe(ti, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/isSupportedCountry.js
function ii() {
	return qe(gt, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/getCountries.js
function ai() {
	return qe(ni, arguments);
}
//#endregion
//#region node_modules/libphonenumber-js/min/exports/getCountryCallingCode.js
function oi() {
	return qe(ht, arguments);
}
var si = [
	"short_text",
	"long_text",
	"email",
	"phone",
	"number",
	"rating",
	"scale",
	"nps",
	"slider",
	"date",
	"single_choice",
	"multi_choice",
	"yes_no",
	"consent",
	"hidden",
	"statement",
	"summary",
	"address",
	"media",
	"file_upload",
	"calculated"
], ci = /* @__PURE__ */ new Set();
function li(e) {
	for (let t of e) /^[a-z][a-z0-9_]{0,63}$/.test(t) && !si.includes(t) && ci.add(t);
}
var ui = (e) => si.includes(e) || ci.has(e), di = (e) => [
	"statement",
	"summary",
	"media"
].includes(e);
function fi(e, t = !1) {
	let n = e.replace(/\r\n?/g, "\n").replace(/<[^>]*>/g, "");
	return n = [...n].filter((e) => e.charCodeAt(0) >= 32 && e.charCodeAt(0) !== 127 || ["\n", "	"].includes(e)).join(""), t || (n = n.replace(/[\t\n ]+/g, " ")), n.replace(/^[ \t\n]+|[ \t\n]+$/g, "");
}
function pi(e, t) {
	let n = e.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, "");
	if (!/^(?:\+|00)?[0-9 ()\-.]+$/.test(n)) return n;
	let r = n.replace(/[ ()\-.]/g, "");
	if (r.startsWith("00") && (r = "+" + r.slice(2)), r.startsWith("+")) return r;
	if (!ii(t)) return n;
	let i = oi(t);
	if (r.startsWith("0") && t !== "IT") r = r.slice(1);
	else if (r.startsWith(i)) return "+" + r;
	return "+" + i + r;
}
function mi(e, t, n = {}) {
	switch (e.type) {
		case "single_choice": return Re(t) ? {
			value: t.value,
			other: fi(t.other)
		} : t;
		case "short_text":
		case "long_text":
		case "email":
		case "date": return typeof t == "string" ? fi(t, e.type === "long_text") : t;
		case "phone": return typeof t == "string" ? pi(t, e.settings?.country ?? "ID") : t;
		case "number":
		case "rating":
		case "scale":
		case "nps":
		case "slider": return typeof t == "string" && /^[ \t\n\r]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r]*$/.test(t) && Number.isFinite(Number(t)) ? Number(t) : t;
		case "address": return t && typeof t == "object" && !Array.isArray(t) ? Object.fromEntries(Object.entries(t).map(([e, t]) => [e, typeof t == "string" ? fi(t) : t])) : t;
		case "statement":
		case "summary":
		case "media": return null;
		default: return t;
	}
}
var hi = (e) => e.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(e) && e.split("@")[0].length <= 64 && !e.includes("..") && !e.startsWith(".") && !e.split("@")[0].endsWith(".") && e.split("@")[1].split(".").every((e) => e.length <= 63 && !e.startsWith("-") && !e.endsWith("-")), gi = (e) => /^(?:https?:\/\/)?[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:[/?#][^\s<>]*)?$/.test(e) && !e.includes("..");
function _i(e, t, n = {}) {
	let r = [], i = (t, n) => {
		r.push(W("/answers/" + G(e.key), t, n, e.key));
	};
	if (!ui(e.type)) return i("unsupported_type", "This field type is not supported."), r;
	if (di(e.type)) return r;
	if (ci.has(e.type)) return (t == null || t === "") && e.required === !0 && i("required", "An answer is required."), r;
	let a = mi(e, t, n), o = e.required === !0 || e.type === "consent";
	if (a === null) return o && i("required", "An answer is required."), r;
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
		case "rating":
		case "scale":
		case "nps":
		case "slider":
			s = K(a);
			break;
		case "yes_no":
		case "consent":
			s = typeof a == "boolean";
			break;
		case "multi_choice":
			s = Array.isArray(a) && a.every((e) => typeof e == "string");
			break;
		case "single_choice":
			s = typeof a == "string" || Re(a);
			break;
		case "hidden":
			s = typeof a == "string" || typeof a == "boolean" || K(a);
			break;
		default: s = typeof a == "string";
	}
	if (!s) return i("type_mismatch", "The answer has an invalid type."), r;
	if (o && (Be(a) || e.type === "consent" && a !== !0)) return i("required", "An answer is required."), r;
	if (Be(a)) return r;
	let c = e.validation ?? {};
	if (typeof a == "string") {
		let t = [...a].length, r = c.maxLength ?? (e.type === "long_text" ? 1e5 : 1e4);
		if (c.minLength !== void 0 && t < c.minLength && i("min_length", "The answer is too short."), t > r && i("max_length", "The answer is too long."), c.pattern !== void 0 && (We(c.pattern) ? Ge(a, c.pattern) || i("pattern", "The answer does not match the pattern.") : i("invalid_pattern", "The validation pattern is not supported.")), (e.type === "email" || c.format === "email") && !hi(a) && i("invalid_email", "Enter a valid email address."), c.format === "url" && !gi(a) && i("invalid_url", "Enter a valid website address."), e.type === "phone" && !/^\+[1-9][0-9]{6,14}$/.test(a) && i("invalid_phone", "Enter a valid international phone number."), e.type === "date") {
			if (!q(a)) i("invalid_date", "Enter a valid date in YYYY-MM-DD format.");
			else if (q(c.min) && a < String(c.min) && i("min", "The answer is below the minimum."), q(c.max) && a > String(c.max) && i("max", "The answer exceeds the maximum."), c.minAge !== void 0) {
				let e = He(a, n.now);
				e === null ? i("invalid_context", "A valid frozen UTC date is required.") : e < c.minAge && i("min_age", "The minimum age is not met.");
			}
		}
	}
	if ([
		"number",
		"rating",
		"scale",
		"nps",
		"slider"
	].includes(e.type) && K(a)) {
		let [t, n, r] = e.type === "rating" ? [
			1,
			5,
			1
		] : e.type === "scale" ? [
			1,
			10,
			1
		] : e.type === "nps" ? [
			0,
			10,
			1
		] : e.type === "slider" ? [
			c.min ?? 0,
			c.max ?? 100,
			c.step ?? 1
		] : [
			c.min,
			c.max,
			c.step
		];
		if (K(t) && a < t && i("min", "The answer is below the minimum."), K(n) && a > n && i("max", "The answer exceeds the maximum."), K(r) && r > 0) {
			let e = (a - (K(t) ? t : 0)) / r;
			(!Number.isFinite(e) || Math.abs(e - Math.round(e)) > 1e-8) && i("step", "The answer does not match the allowed increment.");
		}
	}
	if (e.type === "single_choice" || e.type === "multi_choice") {
		let t = Array.isArray(a) ? a : [ze(a)], n = e.options ?? [];
		if (t.some((e) => !n.some((t) => t.value === e)) && i("invalid_choice", "Choose a configured option value."), e.type === "single_choice") {
			let e = n.find((e) => e.value === t[0]);
			Re(a) ? (e?.isOther || i("invalid_other", "Free text is only accepted for an Other option."), a.other || i("required_other", "Enter text for the Other option."), [...a.other].length > 1e3 && i("max_length", "The answer is too long.")) : e?.isOther && i("required_other", "Enter text for the Other option.");
		}
		new Set(t).size !== t.length && i("duplicate_choice", "Choose each option only once."), t.length > 1 && n.some((e) => e.isExclusive && t.includes(e.value)) && i("exclusive_choice", "An exclusive option cannot be combined."), e.type === "multi_choice" && (c.minSelections !== void 0 && t.length < c.minSelections && i("min_selections", "Choose more options."), c.maxSelections !== void 0 && t.length > c.maxSelections && i("max_selections", "Choose fewer options."));
	}
	return r;
}
function vi(e) {
	if (!Number.isFinite(e) || Math.abs(e) > 0xe8d4a51000) throw Error("Invalid calculation.");
	return e;
}
function yi(e, t = {}, n = {}, r = !1) {
	if (!e.length || e.length > 512 || /[^\t\n\r\f\v -~]/.test(e)) throw Error("Invalid calculation.");
	let i = e.match(/(?:answer|variable)\.[a-z][a-z0-9_]{0,63}|[0-9]+(?:\.[0-9]+)?|[()+*/-]|[^\t\n\r\f\v ]/g) ?? [];
	if (i.length > 128) throw Error("Invalid calculation.");
	let a = 0, o = (e = 0, s = 0) => {
		if (s > 16) throw Error("Invalid calculation.");
		let c = i[a++], l;
		if (c === "+" || c === "-") l = (c === "-" ? -1 : 1) * o(3, s + 1);
		else if (c === "(") {
			if (l = o(0, s + 1), i[a++] !== ")") throw Error("Invalid calculation.");
		} else if (c && /^(answer|variable)\.[a-z][a-z0-9_]{0,63}$/.test(c)) {
			let [e, r] = c.split("."), i = (e === "answer" ? t : n)[r];
			if (i != null && typeof i != "number") throw Error("Invalid calculation.");
			l = i ?? 0;
		} else if (c && /^[0-9]+(?:\.[0-9]+)?$/.test(c)) l = Number(c);
		else throw Error("Invalid calculation.");
		for (vi(l); a < i.length;) {
			let t = i[a], n = t === "+" || t === "-" ? 1 : t === "*" || t === "/" ? 2 : 0;
			if (!n || n < e) break;
			a++;
			let c = o(n + 1, s + 1);
			l = r ? 1 : vi(t === "+" ? l + c : t === "-" ? l - c : t === "*" ? l * c : l / c);
		}
		return vi(l);
	}, s = o();
	if (a !== i.length) throw Error("Invalid calculation.");
	return Math.floor(s * 1e6 + .5) / 1e6 || 0;
}
function bi(e) {
	let t = [...e.matchAll(/(answer|variable)\.([a-z][a-z0-9_]{0,63})/g)].map((e) => ({
		source: e[1],
		key: e[2]
	})), n = {}, r = {};
	for (let e of t) (e.source === "answer" ? n : r)[e.key] = 1;
	return yi(e, n, r, !0), t;
}
//#endregion
//#region assets/src/shared/logic/power.ts
function xi(e, t) {
	let n = JSON.parse(JSON.stringify(e));
	delete n.experiments;
	for (let e of t.copy ?? []) {
		let t = n.steps.find((t) => t.id === e.stepId);
		if (!t) throw Error("Invalid variant.");
		t.messages = [...e.messages];
	}
	if (t.stepOrder) {
		if (t.stepOrder.length !== n.steps.length || new Set(t.stepOrder).size !== n.steps.length) throw Error("Invalid variant.");
		n.steps = t.stepOrder.map((e) => {
			let t = n.steps.find((t) => t.id === e);
			if (!t) throw Error("Invalid variant.");
			return t;
		});
	}
	return n;
}
function Si(e) {
	let t = [], n = new Map(e.steps.map((e, t) => [e.key, {
		step: e,
		index: t
	}])), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set([...e.steps.map((e) => e.id), ...e.endings.map((e) => e.id)]), a = new Map((e.variables ?? []).map((e) => [e.key, e.type])), o = (e, n) => t.push(W(e, "invalid_power", n));
	for (let [t, n] of (e.flowPositions ?? []).entries()) (!i.has(n.id) || r.has(n.id)) && o(`/flowPositions/${t}`, "Graph positions must reference unique existing nodes."), r.add(n.id);
	for (let [t, n] of (e.variables ?? []).entries()) typeof n.default == "number" && Math.abs(n.default) > 0xe8d4a51000 && o(`/variables/${t}`, "Numeric variables are limited to +/- 1e12.");
	e.steps.forEach((e, t) => {
		for (let n of [...e.logic ?? [], ...(e.options ?? []).flatMap((e) => e.logic ?? [])]) n.then.action === "set_variable" && typeof n.then.value == "number" && Math.abs(n.then.value) > 0xe8d4a51000 && o(`/steps/${t}/logic`, "Numeric variables are limited to +/- 1e12.");
		if (e.type === "calculated") try {
			for (let r of bi(e.settings?.expression ?? "")) if (r.source === "variable") a.get(r.key) !== "number" && o(`/steps/${t}/settings/expression`, "Calculations reference numeric variables only.");
			else {
				let e = n.get(r.key);
				(!e || e.index >= t || ![
					"number",
					"rating",
					"scale",
					"nps",
					"slider",
					"calculated"
				].includes(e.step.type)) && o(`/steps/${t}/settings/expression`, "Calculations reference earlier numeric answers only.");
			}
		} catch {
			o(`/steps/${t}/settings/expression`, "Use bounded arithmetic with answer.key or variable.key.");
		}
	});
	let s = (e, t, r = 0) => {
		if (r > 16) o(t, "Outcome conditions may nest at most 16 levels.");
		else if ("all" in e || "any" in e) for (let n of "all" in e ? e.all : e.any) s(n, t, r + 1);
		else ((e.source ?? "answer") === "answer" ? !n.has(e.field) : e.source === "variable" && !a.has(e.field)) && o(t, "Outcome references a missing answer or variable.");
	};
	(e.outcomes ?? []).forEach((t, n) => {
		e.endings.some((e) => e.id === t.endingId) || o(`/outcomes/${n}`, "Outcome references a missing ending."), s(t.if, `/outcomes/${n}/if`);
	});
	let c = /* @__PURE__ */ new Set();
	return (e.experiments ?? []).forEach((t, n) => {
		c.has(t.id) && o(`/experiments/${n}`, "Experiment IDs must be unique."), c.add(t.id);
		let r = /* @__PURE__ */ new Set();
		t.variants.forEach((i, a) => {
			let s = `/experiments/${n}/variants/${a}`;
			`${t.id}:${i.id}`.length > 64 && o(s, "Combined experiment and variant identifier must fit 64 ASCII characters."), r.has(i.id) && o(s, "Variant IDs must be unique."), r.add(i.id);
			let c = /* @__PURE__ */ new Set();
			for (let t of i.copy ?? []) (!e.steps.some((e) => e.id === t.stepId) || c.has(t.stepId)) && o(s, "Copy references must be unique existing steps."), c.add(t.stepId);
			if (i.stepOrder) {
				let t = /* @__PURE__ */ new Set([
					"hidden",
					"summary",
					"calculated"
				]), n = new Set(e.steps.flatMap((e) => [...e.logic ?? [], ...(e.options ?? []).flatMap((e) => e.logic ?? [])].filter((e) => e.then.action === "jump").map((e) => "to" in e.then ? e.then.to : "")));
				e.steps.forEach((r, a) => {
					if (r.logic?.length || r.options?.some((e) => e.logic?.length) || r.hiddenByDefault || t.has(r.type) || n.has(r.id)) {
						i.stepOrder[a] !== r.id && o(s, "Order variants must keep branching, hidden, summary and calculated steps fixed.");
						let t = new Set(e.steps.slice(0, a).map((e) => e.id));
						i.stepOrder.slice(0, a).some((e) => !t.has(e)) && o(s, "Order variants cannot cross a dependency boundary.");
					}
				});
				try {
					xi(e, i);
				} catch {
					o(s, "Step order must be an exact permutation of all steps.");
				}
			}
		});
	}), t;
}
//#endregion
//#region assets/src/shared/cookies.ts
var Ci = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_term",
	"utm_content",
	"campaign",
	"tracking",
	"cff_locale",
	"cff_theme"
], wi = "Cookie sources are restricted to supported attribution/preference cookies.";
function Ti(e) {
	return Ci.some((t) => t === e);
}
//#endregion
//#region assets/src/shared/logic/diagnostics.ts
function Ei(e) {
	let t = [], n = (e, n, r) => {
		t.push(W(e, n, r));
	};
	if (!Array.isArray(e.steps) || !e.steps.length || e.steps.length > 500 || !Array.isArray(e.endings) || !e.endings.length) return n("", "invalid_schema", "The schema needs 1–500 steps and an ending."), t;
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = new Map((e.variables ?? []).map((e) => [e.key, e.type])), s = /* @__PURE__ */ new Set();
	(e.variables ?? []).forEach((e, t) => {
		s.has(e.key) && n(`/variables/${t}/key`, "duplicate_key", "Variable keys must be unique."), s.add(e.key), (e.type === "number" ? !K(e.default) : typeof e.default !== e.type) && n(`/variables/${t}/default`, "invalid_variable", "The variable default has an invalid type.");
	});
	let c = new Set(e.endings.map((e) => e.id)), l = (e, t) => {
		r.has(e) && n(t, "duplicate_id", "IDs must be globally unique."), r.add(e);
	};
	e.steps.forEach((e, t) => {
		e.type === "hidden" && e.settings?.source === "cookie" && !Ti(e.settings.sourceKey ?? e.key) && n(`/steps/${t}/settings/sourceKey`, "restricted_cookie", wi), i.has(e.key) && n(`/steps/${t}/key`, "duplicate_key", "Field keys must be unique."), i.set(e.key, t), a.set(e.id, t), l(e.id, `/steps/${t}/id`);
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
		s === "answer" ? i.has(e.field) ? i.get(e.field) > r && n(t + "/field", "later_reference", "This condition references a later answer.") : n(t + "/field", "missing_reference", "The referenced answer does not exist.") : s === "variable" && !o.has(e.field) && n(t + "/field", "missing_reference", "The referenced variable does not exist."), e.op === "matches" && !We(e.value) && n(t + "/value", "invalid_pattern", "The validation pattern is not supported.");
	}, d = (e, t) => {
		if (e.action === "set_variable") {
			let r = o.get(e.key);
			r ? (e.value !== null && typeof e.value !== r || e.operation !== "set" && (r !== "number" || typeof e.value != "number")) && n(t, "invalid_variable", "The variable action has an invalid type.") : n(t + "/key", "missing_reference", "The referenced variable does not exist.");
		} else (e.action === "end" ? c : a).has(e.to) || n(t + "/to", "missing_reference", "The navigation or visibility target does not exist.");
	}, f = /* @__PURE__ */ new Map(), p = e.steps.flatMap((e) => [...e.logic ?? [], ...(e.options ?? []).flatMap((e) => e.logic ?? [])]), m = /* @__PURE__ */ new Set([...e.steps.filter((e) => e.hiddenByDefault).map((e) => e.id), ...p.filter((e) => e.then.action === "hide").map((e) => e.then.to)]);
	e.steps.forEach((t, r) => {
		let i = `/steps/${r}`;
		ui(t.type) || n(i + "/type", "unsupported_type", "This field type is not supported."), t.validation?.pattern !== void 0 && !We(t.validation.pattern) && n(i + "/validation/pattern", "invalid_pattern", "The validation pattern is not supported."), t.validation?.mxCheck && n(i + "/validation/mxCheck", "unsupported_validation", "MX checking is not enabled."), ["single_choice", "multi_choice"].includes(t.type) && !t.options?.length && n(i + "/options", "missing_options", "Choice fields need at least one option."), [...t.logic ?? [], ...(t.options ?? []).flatMap((e) => e.logic ?? [])].forEach((e) => {
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
		if ([
			"rating",
			"scale",
			"nps"
		].includes(t.type) && (o.min !== void 0 || o.max !== void 0 || o.step !== void 0) && n(i + "/validation", "unsupported_validation", "Score fields use a fixed numeric range."), t.type === "slider") {
			let e = o.min ?? 0, t = o.max ?? 100, r = o.step ?? 1;
			(!K(e) || !K(t) || !K(r) || Math.abs(Number(e)) > 1e4 || Math.abs(Number(t)) > 1e4 || Number(e) >= Number(t) || Number(r) <= 0 || Number(r) > Number(t) - Number(e)) && n(i + "/validation", "invalid_range", "Slider bounds and increment must form a valid finite range.");
		}
		for (let [e, t] of [
			[o.minLength, o.maxLength],
			[o.minSelections, o.maxSelections],
			[o.min, o.max]
		]) e !== void 0 && t !== void 0 && typeof e == typeof t && e > t && n(i + "/validation", "invalid_range", "Minimum must not exceed maximum.");
		if (o.step !== void 0 && (!K(o.step) || o.step <= 0) && n(i + "/validation/step", "invalid_range", "The numeric increment must be positive."), t.type !== "single_choice" && t.options?.some((e) => e.isOther) && n(i + "/options", "unsupported_other", "Other free text is only supported for single-choice fields."), e.steps[r + 1] && (m.has(t.id) || !t.logic?.some((e) => ["jump", "end"].includes(e.then.action) && "all" in e.if && !e.if.all.length))) {
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
	}), [...t, ...Si(e)];
}
//#endregion
//#region assets/src/shared/logic/interpolate.ts
function Di(e) {
	return e == null ? "" : Re(e) ? `${e.value}: ${e.other}` : Array.isArray(e) ? e.map(Di).join(", ") : typeof e == "object" ? Object.keys(e).sort().map((t) => `${t}: ${Di(e[t])}`).join(", ") : String(e);
}
function Oi(e, t = {}, n = {}) {
	return e.replace(/\{\{([^{}]*)\}\}/g, (e, r) => {
		let i = /^[ \t\r\n]*(?:(answer|meta):)?([a-z][a-z0-9_]*)[ \t\r\n]*$/.exec(r);
		if (!i) return "";
		let a = i[1] === "meta" ? n : t, o = i[2];
		return Di(Ie(a, o) ? a[o] : void 0);
	});
}
//#endregion
//#region assets/src/shared/logic/operators.ts
function ki(e, t = {}, n = {}, r = {}, i = 0) {
	if (i > 64) return !1;
	if ("all" in e) return e.all.every((e) => ki(e, t, n, r, i + 1));
	if ("any" in e) return e.any.some((e) => ki(e, t, n, r, i + 1));
	let a = {
		answer: t,
		variable: n,
		hidden: r.hidden ?? {},
		url: r.url ?? {}
	}[e.source ?? "answer"], o = Ie(a, e.field) ? a[e.field] ?? null : null, s = (e.source ?? "answer") === "answer" ? ze(o) : o, c = e.value ?? null, l = () => typeof s == "string" && typeof c == "string" ? s.includes(c) : Array.isArray(s) && s.some((e) => Ve(e, c)), u = () => Array.isArray(c) && c.some((e) => Ve(s, e));
	switch (e.op) {
		case "eq": return Ve(s, c);
		case "neq": return !Ve(s, c);
		case "contains": return l();
		case "not_contains": return !l();
		case "in": return u();
		case "not_in": return !u();
		case "gt": return K(s) && K(c) && s > c;
		case "gte": return K(s) && K(c) && s >= c;
		case "lt": return K(s) && K(c) && s < c;
		case "lte": return K(s) && K(c) && s <= c;
		case "between": return K(s) && Array.isArray(c) && c.length === 2 && K(c[0]) && K(c[1]) && s >= c[0] && s <= c[1];
		case "is_empty": return Be(s);
		case "is_not_empty": return !Be(s);
		case "starts_with": return typeof s == "string" && typeof c == "string" && s.startsWith(c);
		case "matches": return Ge(s, c);
		case "date_before": return q(s) !== null && q(c) !== null && s < c;
		case "date_after": return q(s) !== null && q(c) !== null && s > c;
		case "age_gte": {
			let e = He(s, r.now);
			return e !== null && K(c) && c >= 0 && e >= c;
		}
		default: return !1;
	}
}
//#endregion
//#region assets/src/shared/logic/replay.ts
function Ai(e, t, n) {
	if (Ie(n.hidden ?? {}, e.key)) return n.hidden[e.key] ?? null;
	let r = e.settings?.source ?? "default", i = e.settings?.sourceKey ?? e.key;
	return r === "url" ? Ie(n.url ?? {}, i) ? n.url[i] ?? null : e.defaultValue ?? null : r === "meta" ? Ie(n.meta ?? {}, i) ? n.meta[i] ?? null : e.defaultValue ?? null : r === "merge" ? Oi(String(e.defaultValue ?? ""), t, n.meta) : r === "cookie" ? null : e.defaultValue ?? null;
}
function ji(e, t, n = {}, r = "partial") {
	let i = {
		visited: [],
		answers: Le(),
		variables: Le(),
		currentStepId: null,
		endingId: null,
		progress: 0,
		errors: [],
		discardedKeys: []
	}, a = Ei(e).filter((e) => ![
		"potential_loop",
		"unreachable_step",
		"later_reference"
	].includes(e.code));
	if (i.errors.push(...a), a.some((e) => e.code === "invalid_schema")) return i.discardedKeys = Object.keys(t).sort(), i;
	r !== "partial" && r !== "complete" && i.errors.push(W("/mode", "invalid_mode", "Replay mode must be partial or complete."));
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
				else if (K(n) && K(e.value)) {
					let r = n + (e.operation === "add" ? e.value : -e.value);
					try {
						t[e.key] = vi(r);
					} catch {
						a.push(W("/variables/" + G(e.key), "invalid_variable", "The variable value exceeds the finite calculation limit."));
					}
				} else a.push(W("/variables/" + G(e.key), "invalid_variable", "The variable action has an invalid type."));
				break;
			}
		}
	}, v = (e) => [...e.logic ?? [], ...(e.options ?? []).filter((t) => {
		let n = ze(i.answers[e.key]);
		return Array.isArray(n) ? n.includes(t.value) : n === t.value;
	}).flatMap((e) => e.logic ?? [])];
	if (!i.errors.length) {
		for (; h < o.length;) {
			let e = o[h];
			if (d.has(e.id) || d.size >= 1e3) {
				i.currentStepId = e.id, i.errors.push(W("/steps/" + h, "cff_logic_loop", "The logic path revisits a step."));
				break;
			}
			if (d.add(e.id), !l.get(e.id)) {
				h++;
				continue;
			}
			i.visited.push(e.id);
			let a = di(e.type), c = e.type === "hidden", m = e.type === "calculated";
			if (!a) {
				let a = Ie(t, e.key);
				if (!c && !m && !a && (r === "partial" || u.get(e.id))) {
					i.currentStepId = e.id, r === "complete" && i.errors.push(W("/answers/" + G(e.key), "required", "An answer is required.", e.key));
					break;
				}
				let o;
				try {
					o = m ? yi(e.settings?.expression ?? "", i.answers, i.variables) : c ? Ai(e, i.answers, n) : a ? t[e.key] ?? null : null;
				} catch {
					i.currentStepId = e.id, i.errors.push(W("/answers/" + G(e.key), "calculation_error", "The calculation is invalid or outside its limits.", e.key));
					break;
				}
				let s = mi(e, o, n);
				f.add(e.key), m && a && (p.add(e.key), i.errors.push(W("/answers/" + G(e.key), "computed_answer_tampered", "Calculated answers cannot be supplied by visitors.", e.key))), c && a && !Ve(t[e.key], s) && (p.add(e.key), i.errors.push(W("/answers/" + G(e.key), "hidden_answer_tampered", "Hidden answers are server-derived.", e.key)));
				let l = m ? [] : _i({
					...e,
					required: u.get(e.id) === !0
				}, o, n);
				if (l.length) {
					i.errors.push(...l), i.currentStepId = e.id, a && p.add(e.key);
					break;
				}
				i.answers[e.key] = s, !c && !m && g++;
			}
			let y = h + 1;
			for (let t of v(e)) {
				if (!ki(t.if, i.answers, i.variables, n)) continue;
				let e = t.then;
				if (e.action === "jump") {
					y = s.get(e.to);
					break;
				}
				if (e.action === "end") {
					i.endingId = e.to;
					break;
				}
				_(e, i.variables, l, u);
			}
			if (i.endingId) break;
			h = y;
		}
		if (!i.currentStepId && !i.endingId && (i.endingId = m), i.endingId && !i.errors.length) {
			let t = e.outcomes?.find((e) => ki(e.if, i.answers, i.variables, n));
			t && (i.endingId = t.endingId);
		}
	}
	for (let e of Object.keys(t).sort()) {
		let t = c.get(e);
		t ? di(t.type) ? (p.add(e), i.errors.push(W("/answers/" + G(e), "display_answer", "Display steps do not store answers.", e))) : f.has(e) || (p.add(e), i.errors.push(W("/answers/" + G(e), "unvisited_answer", "Answers to unvisited steps are not accepted.", e))) : (p.add(e), i.errors.push(W("/answers/" + G(e), "unknown_answer", "The answer key does not exist.", e)));
	}
	if (i.discardedKeys = [...p].sort(), i.endingId) i.progress = 100;
	else if (i.currentStepId && !i.errors.some((e) => e.code === "cff_logic_loop")) {
		let e = new Map(l), t = { ...i.variables }, r = /* @__PURE__ */ new Set(), a = 0, c = s.get(i.currentStepId), d = (e) => "all" in e ? e.all.every(d) : "any" in e ? e.any.every(d) : e.source !== void 0 && e.source !== "answer" || Ie(i.answers, e.field);
		for (; c < o.length;) {
			let l = o[c];
			if (r.has(l.id)) break;
			if (r.add(l.id), !e.get(l.id)) {
				c++;
				continue;
			}
			!di(l.type) && l.type !== "hidden" && l.type !== "calculated" && a++;
			let f = c + 1, p = !1;
			for (let r of v(l)) if (d(r.if) && ki(r.if, i.answers, t, n)) {
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
var Mi = 0;
Array.isArray;
function Q(e, n, r, i, a, o) {
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
		__v: --Mi,
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
function $(e, t = globalThis.location?.href ?? "https://localhost/") {
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
function Ni(e, t, n = {}) {
	return e.replace(/\{\{[^{}]+\}\}/g, (e) => encodeURIComponent(Oi(e, t, n)));
}
function Pi(e, t) {
	let n = t && typeof t == "object" && !Array.isArray(t) ? t.value : t;
	return (e.options ?? []).filter((e) => e.reaction && (Array.isArray(n) ? n.includes(e.value) : n === e.value)).map((e) => e.reaction);
}
function Fi(e) {
	return e.replace(/[\\[\]()*]/g, "\\$&");
}
function Ii(e) {
	return typeof e == "string" ? Fi(e) : Array.isArray(e) ? e.map(Ii) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, Ii(t)])) : e;
}
function Li(e, t, n = {}) {
	return Oi(e, Ii(t), Ii(n));
}
function Ri(e) {
	return e.replace(/\\([\\[\]()*])|\[((?:\\.|[^\]\\\n])+)\]\(([^\s)]+)\)|\*\*((?:\\.|[^*\\\n])+)\*\*|\*((?:\\.|[^*\\\n])+)\*/g, (e, t, n, r, i, a) => t ?? Ri(n ?? i ?? a ?? ""));
}
function zi({ text: e }) {
	let t = [], n = /\\([\\[\]()*])|\[((?:\\.|[^\]\\\n])+)\]\(([^\s)]+)\)|\*\*((?:\\.|[^*\\\n])+)\*\*|\*((?:\\.|[^*\\\n])+)\*/g, r = 0;
	for (let i of e.matchAll(n)) {
		if (t.push(e.slice(r, i.index)), i[1]) t.push(i[1]);
		else if (i[2] && i[3]) {
			let e = $(i[3]), n = Ri(i[2]);
			t.push(e ? /* @__PURE__ */ Q("a", {
				href: e,
				target: "_blank",
				rel: "noopener noreferrer",
				children: n
			}) : n);
		} else i[4] ? t.push(/* @__PURE__ */ Q("strong", { children: Ri(i[4]) })) : i[5] && t.push(/* @__PURE__ */ Q("em", { children: Ri(i[5]) }));
		r = i.index + i[0].length;
	}
	return t.push(e.slice(r)), /* @__PURE__ */ Q(S, { children: t });
}
function Bi(e, t, n) {
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
var Vi = /* @__PURE__ */ new Map(), Hi = new Set(si);
function Ui(e, t) {
	if (!/^[a-z][a-z0-9_]{0,63}$/.test(e) || typeof t != "function") throw TypeError("Invalid field renderer");
	if (Hi.has(e)) throw Error("Built-in field types cannot be replaced");
	if (Vi.has(e)) throw Error("Field renderer already registered");
	return Vi.set(e, t), () => {
		Vi.get(e) === t && Vi.delete(e);
	};
}
function Wi(e) {
	return Vi.get(e);
}
//#endregion
//#region assets/src/runtime/phase2-inputs.tsx
function Gi({ step: e, value: t, onAnswer: n, disabled: r, phrase: i, error: a }) {
	let o = e.settings?.addressFields ?? [
		"street",
		"city",
		"postcode",
		"country"
	], s = t && typeof t == "object" && !Array.isArray(t) ? t : {}, [c, l] = H(Object.fromEntries(o.map((e) => [e, typeof s[e] == "string" ? s[e] : ""]))), u = {
		street: "street-address",
		city: "address-level2",
		postcode: "postal-code",
		country: "country-name"
	};
	return /* @__PURE__ */ Q("form", {
		onSubmit: (e) => {
			e.preventDefault(), n(c);
		},
		children: [
			/* @__PURE__ */ Q("fieldset", {
				disabled: r,
				children: [/* @__PURE__ */ Q("legend", { children: e.label }), o.map((t) => /* @__PURE__ */ Q("label", {
					for: `input-${e.id}-${t}`,
					children: [i(`address_${t}`), /* @__PURE__ */ Q("input", {
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
			a && /* @__PURE__ */ Q("p", {
				role: "alert",
				children: a
			}),
			/* @__PURE__ */ Q("button", {
				disabled: r,
				children: i("continue")
			})
		]
	});
}
function Ki({ step: e, upload: t, onAnswer: n, disabled: r, phrase: i, value: a, error: o }) {
	let [s, c] = H(!1), [l, u] = H(!1), [d, f] = H(""), p = Math.min(52428800, e.validation?.maxBytes ?? 10485760);
	return /* @__PURE__ */ Q("div", { children: [
		/* @__PURE__ */ Q("label", {
			for: `input-${e.id}`,
			children: e.label
		}),
		/* @__PURE__ */ Q("input", {
			id: `input-${e.id}`,
			type: "file",
			disabled: r || s || !t,
			accept: e.validation?.mimeTypes?.join(","),
			onChange: async (e) => {
				let r = e.currentTarget, i = r.files?.[0];
				if (i && t) {
					if (u(!1), i.size > p || i.size < 1) u(!0), r.value = "";
					else {
						c(!0);
						try {
							let e = await t(i);
							f(e.name), n(e.uploadId);
						} catch {
							u(!0), r.value = "";
						} finally {
							c(!1);
						}
					}
				}
			}
		}),
		/* @__PURE__ */ Q("small", { children: [
			i("uploadLimit"),
			" ",
			Math.round(p / 1048576 * 10) / 10,
			" MB"
		] }),
		s && /* @__PURE__ */ Q("p", {
			role: "status",
			children: i("uploading")
		}),
		l && /* @__PURE__ */ Q("p", {
			role: "alert",
			children: i("uploadFailed")
		}),
		o && /* @__PURE__ */ Q("p", {
			role: "alert",
			children: o
		}),
		!t && /* @__PURE__ */ Q("p", {
			role: "alert",
			children: i("unsupported")
		}),
		(d || typeof a == "string") && /* @__PURE__ */ Q("p", { children: d || i("uploadSaved") }),
		(!e.required || typeof a == "string") && /* @__PURE__ */ Q("button", {
			disabled: r || s || !t,
			onClick: () => n(a ?? null),
			children: i("continue")
		})
	] });
}
function qi({ step: e, media: t, disabled: n, onAnswer: r, phrase: i }) {
	let a = e.settings?.media, o = $((a?.attachmentId ? t?.[a.attachmentId]?.url : a?.url) ?? "");
	return /* @__PURE__ */ Q("div", { children: [o && /^https?:/.test(o) && (a?.type === "video" ? /* @__PURE__ */ Q("video", {
		controls: !0,
		preload: "metadata",
		src: o,
		"aria-label": a.alt ?? e.label
	}) : /* @__PURE__ */ Q("img", {
		src: o,
		alt: a?.alt ?? e.label,
		loading: "lazy"
	})), /* @__PURE__ */ Q("button", {
		disabled: n,
		onClick: () => r(null),
		children: e.settings?.buttonLabel ?? i("continue")
	})] });
}
//#endregion
//#region assets/src/runtime/inputs.tsx
function Ji(e, t, n) {
	return e.includes(t) ? e.filter((e) => e !== t) : n.find((e) => e.value === t)?.isExclusive ? [t] : [...e.filter((e) => !n.find((t) => t.value === e)?.isExclusive), t];
}
function Yi(e, t = "ID") {
	let n = ri(e, t);
	return n?.isValid() ? n.number : e.trim();
}
function Xi(e) {
	let { step: t, disabled: n, onAnswer: r, phrase: i } = e, a = t.type === "yes_no" ? [{
		id: "yes",
		value: !0,
		label: i("yes")
	}, {
		id: "no",
		value: !1,
		label: i("no")
	}] : t.options ?? [], [o, s] = H(Array.isArray(e.value) ? e.value : []), c = e.value && typeof e.value == "object" && !Array.isArray(e.value) ? e.value : null, [l, u] = H(typeof e.value == "string" ? e.value : typeof c?.value == "string" ? c.value : ""), [d, f] = H(typeof c?.value == "string" ? c.value : ""), [p, m] = H(typeof c?.other == "string" ? c.other : ""), h = De(null), g = t.type === "multi_choice", _ = (e) => {
		n || (g ? s(Ji(o, String(e), t.options ?? [])) : t.options?.some((t) => t.value === e && t.isOther) ? f(String(e)) : (f(""), r(e)));
	}, v = (a) => /* @__PURE__ */ Q("div", {
		className: "other-input",
		children: [/* @__PURE__ */ Q("label", {
			for: `other-${t.id}`,
			children: i("other")
		}), /* @__PURE__ */ Q("input", {
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
	U(() => {
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
	return t.settings?.layout === "dropdown" && !g && t.type !== "yes_no" ? /* @__PURE__ */ Q("form", {
		onSubmit: (e) => {
			e.preventDefault(), r(b ? {
				value: l,
				other: p
			} : l);
		},
		children: [
			/* @__PURE__ */ Q("label", {
				for: `input-${t.id}`,
				children: t.label
			}),
			/* @__PURE__ */ Q("select", {
				id: `input-${t.id}`,
				disabled: n,
				value: l,
				onChange: (e) => u(e.currentTarget.value),
				"aria-describedby": `help-${t.id} error-${t.id}`,
				children: [/* @__PURE__ */ Q("option", {
					value: "",
					children: t.placeholder ?? i("select")
				}), a.map((e) => /* @__PURE__ */ Q("option", {
					value: String(e.value),
					children: e.label
				}, e.id))]
			}),
			b && v(l),
			/* @__PURE__ */ Q("button", {
				disabled: n || !l || b && !p.trim(),
				children: t.settings.buttonLabel ?? i("continue")
			})
		]
	}) : /* @__PURE__ */ Q("div", {
		ref: h,
		role: "group",
		"aria-label": t.label,
		onKeyDown: y,
		className: t.settings?.layout === "cards" ? "chips cards" : "chips",
		children: [
			a.map((t) => /* @__PURE__ */ Q("button", {
				className: "chip",
				type: "button",
				disabled: n,
				"aria-pressed": g ? o.includes(String(t.value)) : (d || e.value) === t.value,
				onClick: () => _(t.value),
				children: [
					"image" in t && typeof t.image == "number" && e.media?.[t.image] && $(e.media[t.image].url)?.startsWith("http") && /* @__PURE__ */ Q("img", {
						src: $(e.media[t.image].url),
						alt: e.media[t.image].alt ?? "",
						loading: "lazy"
					}),
					"emoji" in t && typeof t.emoji == "string" && /* @__PURE__ */ Q("span", {
						"aria-hidden": "true",
						children: [t.emoji, " "]
					}),
					t.label
				]
			}, t.id)),
			!g && d && /* @__PURE__ */ Q("form", {
				onSubmit: (e) => {
					e.preventDefault(), r({
						value: d,
						other: p
					});
				},
				children: [v(d), /* @__PURE__ */ Q("button", {
					disabled: n || !p.trim(),
					children: t.settings?.buttonLabel ?? i("continue")
				})]
			}),
			g && /* @__PURE__ */ Q("button", {
				className: "continue",
				disabled: n,
				onClick: () => r(o),
				children: t.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function Zi({ step: e, value: t, disabled: n, onAnswer: r, phrase: i, error: a }) {
	let [o, s] = H(t == null ? "" : String(t)), c = e.settings?.country ?? "ID", [l, u] = H(ai().includes(c) ? c : "ID"), d = De(null), f = () => r(e.type === "number" ? o.trim() ? Number(o) : null : e.type === "phone" ? Yi(o, l) : o);
	U(() => {
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
	return /* @__PURE__ */ Q("form", {
		noValidate: !0,
		onSubmit: (e) => {
			e.preventDefault(), f();
		},
		children: [
			/* @__PURE__ */ Q("label", {
				for: `input-${e.id}`,
				children: e.label
			}),
			e.type === "phone" && /* @__PURE__ */ Q("label", {
				className: "country",
				children: [i("country"), /* @__PURE__ */ Q("select", {
					value: l,
					disabled: n,
					onChange: (e) => u(e.currentTarget.value),
					children: ai().map((e) => /* @__PURE__ */ Q("option", {
						value: e,
						children: [
							e,
							" +",
							oi(e)
						]
					}, e))
				})]
			}),
			e.type === "long_text" ? /* @__PURE__ */ Q(S, { children: [/* @__PURE__ */ Q("textarea", {
				...m,
				ref: d,
				rows: 3,
				onKeyDown: (e) => {
					e.key === "Enter" && !e.shiftKey && !e.isComposing && (e.preventDefault(), f());
				}
			}), /* @__PURE__ */ Q("small", { children: [
				i("longTextHint"),
				" · ",
				o.length,
				e.validation?.maxLength ? `/${e.validation.maxLength}` : "",
				" ",
				i("characters")
			] })] }) : /* @__PURE__ */ Q("div", {
				className: "input-row",
				children: [/* @__PURE__ */ Q("input", {
					...m,
					type: p,
					inputMode: e.settings?.inputMode ?? (e.type === "number" ? "decimal" : e.type === "email" ? "email" : e.type === "phone" ? "tel" : "text"),
					min: e.validation?.min,
					max: e.validation?.max,
					step: e.validation?.step ?? (e.type === "number" ? "any" : void 0)
				}), e.settings?.unit && /* @__PURE__ */ Q("span", { children: e.settings.unit })]
			}),
			/* @__PURE__ */ Q("button", {
				type: "submit",
				disabled: n,
				children: e.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function Qi({ step: e, value: t, disabled: n, onAnswer: r }) {
	let i = e.type === "nps" ? 0 : 1, a = e.type === "rating" ? 5 : 10, o = typeof t == "number" ? t : null, s = Array.from({ length: a - i + 1 }, (e, t) => t + i);
	return /* @__PURE__ */ Q("div", {
		role: "group",
		"aria-label": e.label,
		className: "score-input",
		children: s.map((t) => /* @__PURE__ */ Q("button", {
			type: "button",
			className: "chip score-chip",
			disabled: n,
			"aria-label": `${t} / ${a}`,
			"aria-pressed": o === t,
			onClick: () => r(t),
			children: e.type === "rating" ? /* @__PURE__ */ Q(S, { children: [
				/* @__PURE__ */ Q("span", {
					"aria-hidden": "true",
					children: "★"
				}),
				" ",
				t
			] }) : t
		}, t))
	});
}
function $i({ step: e, value: t, disabled: n, onAnswer: r, phrase: i }) {
	let a = typeof e.validation?.min == "number" ? e.validation.min : 0, o = typeof e.validation?.max == "number" ? e.validation.max : 100, s = e.validation?.step ?? 1, [c, l] = H(typeof t == "number" ? t : a);
	return /* @__PURE__ */ Q("form", {
		onSubmit: (e) => {
			e.preventDefault(), r(c);
		},
		children: [
			/* @__PURE__ */ Q("label", {
				for: `input-${e.id}`,
				children: e.label
			}),
			/* @__PURE__ */ Q("div", {
				className: "slider-reading",
				children: [
					/* @__PURE__ */ Q("span", { children: a }),
					/* @__PURE__ */ Q("output", {
						for: `input-${e.id}`,
						children: [c, e.settings?.unit ? ` ${e.settings.unit}` : ""]
					}),
					/* @__PURE__ */ Q("span", { children: o })
				]
			}),
			/* @__PURE__ */ Q("input", {
				id: `input-${e.id}`,
				type: "range",
				min: a,
				max: o,
				step: s,
				value: c,
				disabled: n,
				onInput: (e) => l(Number(e.currentTarget.value))
			}),
			/* @__PURE__ */ Q("button", {
				type: "submit",
				disabled: n,
				children: e.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function ea({ step: e, value: t, disabled: n, onAnswer: r, phrase: i }) {
	let [a, o] = H(t === !0), s = e.settings?.privacyUrl ? $(e.settings.privacyUrl) : null;
	return /* @__PURE__ */ Q("form", {
		onSubmit: (e) => {
			e.preventDefault(), r(a);
		},
		children: [
			/* @__PURE__ */ Q("label", {
				className: "consent",
				children: [/* @__PURE__ */ Q("input", {
					type: "checkbox",
					disabled: n,
					checked: a,
					onChange: (e) => o(e.currentTarget.checked)
				}), /* @__PURE__ */ Q("span", { children: /* @__PURE__ */ Q(zi, { text: e.settings?.consentText ?? e.label }) })]
			}),
			s && /* @__PURE__ */ Q("a", {
				href: s,
				target: "_blank",
				rel: "noopener noreferrer",
				children: i("privacy")
			}),
			/* @__PURE__ */ Q("button", {
				disabled: n,
				children: e.settings?.buttonLabel ?? i("continue")
			})
		]
	});
}
function ta(e) {
	let t = e.step.type, n = Wi(t);
	return n ? /* @__PURE__ */ Q(n, { ...e }) : t === "address" ? /* @__PURE__ */ Q(Gi, { ...e }) : t === "media" ? /* @__PURE__ */ Q(qi, { ...e }) : t === "file_upload" ? /* @__PURE__ */ Q(Ki, { ...e }) : [
		"single_choice",
		"multi_choice",
		"yes_no"
	].includes(t) ? /* @__PURE__ */ Q(Xi, { ...e }) : [
		"rating",
		"scale",
		"nps"
	].includes(t) ? /* @__PURE__ */ Q(Qi, { ...e }) : t === "slider" ? /* @__PURE__ */ Q($i, { ...e }) : t === "consent" ? /* @__PURE__ */ Q(ea, { ...e }) : [
		"short_text",
		"long_text",
		"email",
		"phone",
		"number",
		"date"
	].includes(t) ? /* @__PURE__ */ Q(Zi, { ...e }) : /* @__PURE__ */ Q("p", {
		role: "alert",
		children: e.phrase("unsupported")
	});
}
//#endregion
//#region assets/src/shared/whatsapp.ts
var na = /* @__PURE__ */ new Set([
	"wa.me",
	"api.whatsapp.com",
	"web.whatsapp.com",
	"whatsapp.com",
	"www.whatsapp.com"
]);
function ra(e) {
	try {
		return na.has(new URL(e).hostname.toLowerCase());
	} catch {
		return !1;
	}
}
//#endregion
//#region assets/src/shared/hours.ts
var ia = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun"
], aa = /^([01]\d|2[0-3]):([0-5]\d)$/, oa = (e) => {
	let t = aa.exec(e);
	return t ? Number(t[1]) * 60 + Number(t[2]) : null;
};
function sa(e, t) {
	let n = /^([+-])(\d{2}):(\d{2})$/.exec(t);
	if (n) {
		let t = (n[1] === "-" ? -1 : 1) * (Number(n[2]) * 60 + Number(n[3])), r = new Date(e.getTime() + t * 6e4);
		return {
			day: ia[(r.getUTCDay() + 6) % 7],
			minute: r.getUTCHours() * 60 + r.getUTCMinutes()
		};
	}
	try {
		let n = new Intl.DateTimeFormat("en-US", {
			timeZone: t,
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23"
		}).formatToParts(e), r = (e) => n.find((t) => t.type === e)?.value ?? "", i = r("weekday").toLowerCase().slice(0, 3);
		return ia.includes(i) ? {
			day: i,
			minute: Number(r("hour")) * 60 + Number(r("minute"))
		} : null;
	} catch {
		return null;
	}
}
function ca(e, t) {
	if (!e?.enabled) return !0;
	let n = sa(t, e.timezone || "UTC");
	if (!n) return !0;
	let r = ia.indexOf(n.day), i = (t, r) => {
		let i = e.days?.[t], a = i ? oa(i.from) : null, o = i ? oa(i.to) : null;
		return a === null || o === null ? !1 : a === o ? !r : a < o ? !r && n.minute >= a && n.minute < o : r ? n.minute < o : n.minute >= a;
	};
	return i(n.day, !1) || i(ia[(r + 6) % 7], !0);
}
//#endregion
//#region assets/src/runtime/appearance.ts
var la = /* @__PURE__ */ new Set([
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
]), ua = /[\\@<>]|url\s*\(|expression\s*\(|image-set\s*\(|attr\s*\(|paint\s*\(|element\s*\(/i;
function da(e) {
	if (!e || ua.test(e) || /var\s*\(/i.test(e)) return;
	let t = document.createElement("span").style;
	return t.color = e, t.color || void 0;
}
function fa(e) {
	return e && /^[\w\s,"'-]{1,255}$/.test(e) ? e : void 0;
}
function pa(e) {
	if (!e || e.length > 2e4 || ua.test(e)) return "";
	let t = e.replace(/\/\*[\s\S]*?\*\//g, ""), n = [...t.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
	return t.replace(/([^{}]+)\{([^{}]*)\}/g, "").trim() ? "" : n.map(([, e, t]) => {
		if (!e || !t || !/^[\w\s.#,:>-]+$/.test(e) || /:(?!(?:hover|focus-visible|focus|disabled|active|checked)(?:\b|$))/i.test(e)) return "";
		let n = t.split(";").flatMap((e) => {
			let t = e.indexOf(":");
			if (t < 1) return [];
			let n = e.slice(0, t).trim().toLowerCase(), r = e.slice(t + 1).trim();
			if (!la.has(n) || !r || ua.test(r) || /var\s*\(/i.test(r)) return [];
			let i = document.createElement("span").style;
			return i.setProperty(n, r), i.getPropertyValue(n) ? [`${n}:${i.getPropertyValue(n)}`] : [];
		});
		return n.length ? `${e.trim()}{${n.join(";")}}` : "";
	}).join("\n");
}
//#endregion
//#region assets/src/runtime/i18n.ts
var ma = {
	openChat: "Open chat",
	closeChat: "Close chat",
	formDialog: "Chat form",
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
	botAvatar: "Assistant",
	magicEmailConfirm: "Send a one-time resume link to the email already provided in this form?",
	magicEmailAccepted: "If an eligible email was provided, a resume link will be sent.",
	magicEmailError: "Unable to request a resume link right now.",
	magicEmail: "Email me a resume link",
	magicShareConfirm: "Create a single-use link to share yourself? Anyone with the link can resume your form.",
	magicShareError: "Unable to create a link right now.",
	magicCopied: "Link copied. Paste it into WhatsApp yourself.",
	magicCancelled: "Share cancelled or unavailable. Request a new link to retry.",
	magicShare: "Share resume link (choose WhatsApp)",
	address_street: "Street address",
	address_city: "City",
	address_postcode: "Postal code",
	address_country: "Country",
	uploading: "Uploading…",
	uploadFailed: "Upload failed. Check file type and size, then try again.",
	uploadSaved: "Uploaded file",
	uploadLimit: "Maximum file size:",
	whatsapp: "Chat on WhatsApp",
	contactUs: "Contact us",
	opensNewTab: "opens in a new tab",
	select: "Select…",
	captchaFailed: "The spam check did not complete. Try again to submit."
}, ha = {
	openChat: "Buka chat",
	closeChat: "Tutup chat",
	formDialog: "Formulir chat",
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
	botAvatar: "Asisten",
	magicEmailConfirm: "Kirim tautan sekali pakai untuk melanjutkan ke email yang sudah Anda isi?",
	magicEmailAccepted: "Jika email yang memenuhi syarat sudah diisi, tautan untuk melanjutkan akan dikirim.",
	magicEmailError: "Belum dapat meminta tautan untuk melanjutkan.",
	magicEmail: "Kirim tautan untuk melanjutkan via email",
	magicShareConfirm: "Buat tautan sekali pakai untuk Anda bagikan? Siapa pun yang memiliki tautan dapat melanjutkan formulir Anda.",
	magicShareError: "Belum dapat membuat tautan.",
	magicCopied: "Tautan disalin. Tempelkan ke WhatsApp sendiri.",
	magicCancelled: "Berbagi dibatalkan atau tidak tersedia. Minta tautan baru untuk mencoba lagi.",
	magicShare: "Bagikan tautan untuk melanjutkan (pilih WhatsApp)",
	address_street: "Alamat jalan",
	address_city: "Kota",
	address_postcode: "Kode pos",
	address_country: "Negara",
	uploading: "Mengunggah…",
	uploadFailed: "Unggah gagal. Periksa jenis dan ukuran berkas, lalu coba lagi.",
	uploadSaved: "Berkas terunggah",
	uploadLimit: "Ukuran berkas maksimum:",
	whatsapp: "Chat lewat WhatsApp",
	contactUs: "Hubungi kami",
	opensNewTab: "terbuka di tab baru",
	select: "Pilih…",
	captchaFailed: "Pemeriksaan spam belum selesai. Coba lagi untuk mengirim."
};
function ga(e = "en", t = {}) {
	return (n) => t[n] ?? (/^id(?:[-_]|$)/i.test(e) ? ha[n] : void 0) ?? globalThis.window?.wp?.i18n?.__(ma[n] ?? n, "chatflow-forms") ?? ma[n] ?? n;
}
//#endregion
//#region assets/src/runtime/chat.tsx
function _a(e, t = "normal", n = !1) {
	return n || t === "off" ? 0 : Math.min(1200, Math.max(400, e * (t === "fast" ? 10 : t === "slow" ? 30 : 20)));
}
function va(e, t) {
	return e.stepId === t ? e.count : 0;
}
var ya = {
	whatsapp: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z",
	chat: "M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4.2 22l4.5-2.2c1 .3 2.1.5 3.3.5 5.5 0 10-3.9 10-8.6S17.5 3 12 3z",
	phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z",
	email: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3zM5.2 7l6.8 4.2L18.8 7z"
};
function ba(e, t) {
	return t && t !== "auto" ? t : ra(e) ? "whatsapp" : e.startsWith("tel:") ? "phone" : e.startsWith("mailto:") ? "email" : "chat";
}
function xa(e) {
	return e.type !== "statement" || e.settings?.autoContinue === !1;
}
function Sa(e, t) {
	e && ((!t || t === "summary" || t === "statement" ? e.querySelector(":scope > button:not(.link-button)") : e.querySelector("input:not([type=hidden]):not([type=file]),textarea") ?? e.querySelector("select,input[type=file],button:not(.link-button)")) ?? e.querySelector("button"))?.focus({ preventScroll: !0 });
}
function Ca({ controller: e, onClose: t, closable: n = !1 }) {
	let [, r] = H(0), [i, a] = H({
		stepId: null,
		count: 0
	}), [o, s] = H(!1), [c, l] = H(""), [u, d] = H(""), [f, p] = H(() => Date.now()), [m, h] = H(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1), g = De(null), _ = De(null), v = De(null), y = De(null), b = e.state, x = b.form?.form, C = ga(e.options.locale ?? globalThis.document?.documentElement.lang ?? "en", x?.phrases), w = e.activeStep, T = w?.messages ?? [], E = va(i, b.activeId), D = E >= T.length, O = (t) => Oi(t, b.answers, e.meta), k = (t) => Li(t, b.answers, e.meta);
	Ee(() => e.subscribe(() => r((e) => e + 1)), [e]);
	let A = !!e.state.form?.form.schema.bot.contact?.hours?.enabled;
	U(() => {
		if (!A) return;
		let e = setInterval(() => p(Date.now()), 6e4);
		return () => clearInterval(e);
	}, [A]), U(() => {
		let e = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)"), t = () => h(e?.matches ?? !1);
		return e?.addEventListener("change", t), () => e?.removeEventListener("change", t);
	}, []), U(() => {
		a({
			stepId: b.activeId,
			count: 0
		});
	}, [b.activeId]), U(() => {
		if (b.phase !== "ready" || E >= T.length) return;
		let e = b.activeId, t = setTimeout(() => a((t) => t.stepId === e ? {
			...t,
			count: t.count + 1
		} : t), _a(T[E]?.length ?? 0, x?.schema.bot.typingSpeed, m));
		return () => clearTimeout(t);
	}, [
		b.activeId,
		b.phase,
		E,
		T.length,
		m,
		x?.schema.bot.typingSpeed
	]), U(() => {
		if (D && b.phase === "ready" && (Sa(g.current, w?.type), w?.type === "statement" && xa(w) === !1)) {
			let t = setTimeout(() => {
				e.answer(null);
			}, m ? 0 : 600);
			return () => clearTimeout(t);
		}
	}, [
		b.activeId,
		D,
		b.phase,
		w?.settings?.autoContinue,
		m,
		e
	]), U(() => {
		b.phase === "done" && v.current?.focus({ preventScroll: !0 });
	}, [b.phase]), U(() => {
		o && y.current?.querySelector("button:not([disabled])")?.focus({ preventScroll: !0 });
	}, [o]);
	let j = () => {
		s(!1), requestAnimationFrame(() => Sa(g.current, w?.type));
	};
	U(() => {
		_.current?.scrollIntoView?.({
			behavior: m ? "auto" : "smooth",
			block: "nearest"
		});
	}, [
		E,
		b.activeId,
		b.error,
		b.phase,
		m
	]), U(() => {
		let t = b.completion;
		if (e.options.preview || b.phase !== "done" || !t?.redirectUrl) return;
		let n = $(t.redirectUrl);
		if (!n || !/^https?:/.test(n)) return;
		let r = x?.schema.endings.find((e) => e.id === t.ending.id), i = setTimeout(() => location.assign(n), Math.min(3e4, Math.max(0, r?.delayMs ?? 0)));
		return () => clearTimeout(i);
	}, [
		b.completion,
		b.phase,
		e,
		x
	]);
	let ee = (e, t) => /* @__PURE__ */ Q("div", {
		className: "bubble bot",
		children: /* @__PURE__ */ Q(zi, { text: k(e) })
	}, t), M = () => /* @__PURE__ */ Q("section", {
		className: "summary",
		"aria-label": C("summary"),
		children: [/* @__PURE__ */ Q("h2", { children: C("summary") }), /* @__PURE__ */ Q("dl", { children: (b.path?.visited ?? []).map((e) => x?.schema.steps.find((t) => t.id === e)).filter((e) => !!e && ![
			"hidden",
			"statement",
			"summary",
			"media",
			"calculated"
		].includes(e.type) && Object.prototype.hasOwnProperty.call(b.answers, e.key)).map((t) => /* @__PURE__ */ Q("div", { children: [/* @__PURE__ */ Q("dt", { children: t.label }), /* @__PURE__ */ Q("dd", { children: [
			Bi(t, b.answers[t.key], C),
			" ",
			/* @__PURE__ */ Q("button", {
				className: "link-button",
				disabled: b.busy,
				onClick: () => e.edit(t.id),
				"aria-label": `${C("edit")}: ${t.label}`,
				children: C("edit")
			})
		] })] }, t.id)) })]
	}), N = /* @__PURE__ */ Q("button", {
		disabled: b.busy || b.error === "submissionPending",
		onClick: () => s(!0),
		children: C("startOver")
	}), P = b.error && /* @__PURE__ */ Q("div", {
		className: "notice",
		role: "alert",
		children: [/* @__PURE__ */ Q("p", { children: C(b.error) }), !b.conflict && /* @__PURE__ */ Q("button", {
			disabled: b.busy || b.offline,
			onClick: () => void e.retry(),
			children: C("retry")
		})]
	}), F = x?.schema.bot.avatar ? x.media?.[x.schema.bot.avatar] : null, te = F ? $(F.url) : null, ne = x?.appearance ?? {}, re = ne.style === "messaging" ? {
		"data-style": "messaging",
		"data-wallpaper": ne.wallpaper ?? "doodle",
		"data-choices": ne.choiceStyle ?? "keyboard",
		"data-tails": ne.bubbleTails === !1 ? "off" : "on"
	} : {}, ie = x?.schema.bot.name ?? "ChatFlow", I = x?.schema.bot.contact, L = I?.url ? $(Ni(I.url, b.answers, e.meta)) : null, ae = L ? ba(L, I?.icon) : "none", oe = I?.label || C(L && ra(L) ? "whatsapp" : "contactUs"), se = da(I?.color), ce = da(I?.textColor), le = ca(I?.hours, new Date(f)), ue = !le && I?.hours?.outside === "message" && I.hours.message ? O(I.hours.message) : "", R = L && le && /* @__PURE__ */ Q("a", {
		className: `contact-link${ra(L) ? " is-whatsapp" : ""}`,
		href: L,
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": `${oe} (${C("opensNewTab")})`,
		onClick: () => e.contactClicked(),
		style: {
			...se ? {
				background: se,
				borderColor: se
			} : {},
			...ce ? { color: ce } : {}
		},
		children: [ae !== "none" && /* @__PURE__ */ Q("svg", {
			viewBox: "0 0 24 24",
			width: "18",
			height: "18",
			"aria-hidden": "true",
			children: /* @__PURE__ */ Q("path", {
				fill: "currentColor",
				d: ya[ae]
			})
		}), /* @__PURE__ */ Q("span", { children: oe })]
	});
	return /* @__PURE__ */ Q("section", {
		className: `chat ${e.options.mode === "fullpage" ? "fullpage" : ""}`,
		...re,
		dir: globalThis.document?.documentElement.dir === "rtl" ? "rtl" : "ltr",
		"aria-label": x?.title ?? "ChatFlow",
		"aria-busy": b.busy,
		children: [
			/* @__PURE__ */ Q("header", { children: [
				/* @__PURE__ */ Q("div", {
					className: "identity",
					children: [te && /^https?:/.test(te) ? /* @__PURE__ */ Q("img", {
						src: te,
						alt: F?.alt ?? C("botAvatar")
					}) : /* @__PURE__ */ Q("span", {
						className: "avatar",
						"aria-hidden": "true",
						children: [...ie.trim()][0] ?? ""
					}), /* @__PURE__ */ Q("div", { children: [/* @__PURE__ */ Q("strong", { children: ie }), /* @__PURE__ */ Q("small", { children: [/* @__PURE__ */ Q("span", {
						className: "online-dot",
						"aria-hidden": "true"
					}), C(b.offline ? "offline" : "online")] })] })]
				}),
				/* @__PURE__ */ Q("nav", {
					"aria-label": C("back"),
					children: [/* @__PURE__ */ Q("button", {
						disabled: b.busy || b.phase !== "ready" || !e.visibleSteps.some((e) => e.id !== b.activeId && Object.prototype.hasOwnProperty.call(b.answers, e.key)),
						onClick: () => e.back(),
						children: C("back")
					}), N]
				}),
				n && /* @__PURE__ */ Q("button", {
					type: "button",
					className: "close-chat",
					"aria-label": C("closeChat"),
					onClick: t,
					children: /* @__PURE__ */ Q("svg", {
						viewBox: "0 0 24 24",
						width: "20",
						height: "20",
						"aria-hidden": "true",
						children: /* @__PURE__ */ Q("path", {
							d: "M6 6l12 12M18 6L6 18",
							stroke: "currentColor",
							"stroke-width": "2.2",
							"stroke-linecap": "round",
							fill: "none"
						})
					})
				})
			] }),
			/* @__PURE__ */ Q("div", {
				className: "progress",
				role: "progressbar",
				"aria-label": C("progress"),
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": Math.round(b.phase === "done" ? 100 : b.path?.progress ?? 0),
				children: /* @__PURE__ */ Q("span", { style: { width: `${b.phase === "done" ? 100 : b.path?.progress ?? 0}%` } })
			}),
			e.options.preview && /* @__PURE__ */ Q("p", {
				className: "notice",
				children: C("preview")
			}),
			!e.options.preview && globalThis.location?.protocol === "http:" && !["localhost", "127.0.0.1"].includes(location.hostname) && /* @__PURE__ */ Q("p", {
				className: "notice",
				role: "alert",
				children: C("insecure")
			}),
			/* @__PURE__ */ Q("main", {
				className: "conversation",
				children: [
					o && /* @__PURE__ */ Q("section", {
						ref: y,
						className: "notice",
						role: "alertdialog",
						"aria-modal": "false",
						"aria-label": C("confirmRestart"),
						onKeyDown: (e) => {
							e.key === "Escape" && (e.stopPropagation(), j());
						},
						children: [
							/* @__PURE__ */ Q("p", { children: C("confirmRestart") }),
							/* @__PURE__ */ Q("button", {
								disabled: b.offline || b.busy,
								onClick: () => {
									s(!1), e.restart();
								},
								children: C("startOver")
							}),
							/* @__PURE__ */ Q("button", {
								onClick: j,
								children: C("cancel")
							})
						]
					}),
					b.phase === "loading" && /* @__PURE__ */ Q("p", {
						role: "status",
						children: C("loading")
					}),
					b.phase === "resume" && /* @__PURE__ */ Q("section", {
						className: "notice",
						children: [
							/* @__PURE__ */ Q("p", { children: C(b.newerVersion ? "newerVersion" : "welcomeBack") }),
							/* @__PURE__ */ Q("button", {
								disabled: b.busy,
								onClick: () => void e.continueSaved(),
								children: C(b.newerVersion ? "continueOld" : "continue")
							}),
							N
						]
					}),
					b.phase !== "resume" && e.visibleSteps.map((t) => /* @__PURE__ */ Q("section", {
						className: "step",
						"aria-label": t.label,
						children: [
							(t.id === b.activeId && b.phase === "ready" ? t.messages.slice(0, E) : t.messages).map((e, t) => ee(e, t)),
							t.id !== b.activeId && Object.prototype.hasOwnProperty.call(b.answers, t.key) && /* @__PURE__ */ Q("button", {
								className: "bubble user",
								disabled: b.busy || b.phase !== "ready",
								onClick: () => e.edit(t.id),
								"aria-label": `${C("edit")}: ${t.label}: ${Bi(t, b.answers[t.key], C)}`,
								children: [Bi(t, b.answers[t.key], C), /* @__PURE__ */ Q("small", { children: C("edit") })]
							}),
							t.id !== b.activeId && Pi(t, b.answers[t.key]).map((e, t) => ee(e, `reaction-${t}`))
						]
					}, t.id)),
					/* @__PURE__ */ Q("div", {
						className: "sr-only",
						"aria-live": "polite",
						"aria-atomic": "false",
						children: b.phase === "ready" ? T.slice(0, E).map((e, t) => /* @__PURE__ */ Q("p", { children: Ri(k(e)) }, `${b.activeId}-${t}`)) : b.phase === "done" ? /* @__PURE__ */ Q("p", { children: C("complete") }) : null
					}),
					b.phase === "ready" && w && /* @__PURE__ */ Q("div", {
						ref: g,
						className: "active",
						children: [!D && /* @__PURE__ */ Q("div", {
							className: "typing bubble bot",
							role: "status",
							"aria-label": C("typing"),
							children: [
								/* @__PURE__ */ Q("i", {}),
								/* @__PURE__ */ Q("i", {}),
								/* @__PURE__ */ Q("i", {})
							]
						}), D && /* @__PURE__ */ Q(S, { children: [
							w.helpText && /* @__PURE__ */ Q("p", {
								id: `help-${w.id}`,
								className: "help",
								children: /* @__PURE__ */ Q(zi, { text: k(w.helpText) })
							}),
							b.fieldError && /* @__PURE__ */ Q("p", {
								id: `error-${w.id}`,
								className: "bubble bot",
								role: "alert",
								children: C(b.fieldError)
							}),
							w.type === "summary" && M(),
							w.type === "statement" && !xa(w) ? null : ["statement", "summary"].includes(w.type) ? /* @__PURE__ */ Q("button", {
								disabled: b.busy,
								onClick: async () => {
									await e.answer(null), w.type === "summary" && !e.state.activeId && await e.submit(c);
								},
								children: w.settings?.buttonLabel ?? C(w.type === "summary" ? "submit" : "continue")
							}) : /* @__PURE__ */ Q(ta, {
								step: {
									...w,
									label: O(w.label),
									settings: {
										...w.settings,
										...w.settings?.consentText ? { consentText: k(w.settings.consentText) } : {}
									}
								},
								value: e.inputValue(w),
								disabled: b.busy || b.conflict || !!b.completion,
								phrase: C,
								onAnswer: (t) => void e.answer(t),
								...b.form?.features.uploads && !e.options.preview ? { upload: (t) => e.upload(w, t) } : {},
								...b.fieldError ? { error: C(b.fieldError) } : {},
								...x?.media ? { media: x.media } : {}
							}, `${w.id}:${JSON.stringify(e.inputValue(w))}`),
							e.canSkip && /* @__PURE__ */ Q("button", {
								className: "link-button",
								disabled: b.busy || b.conflict,
								onClick: () => void e.answer(null),
								children: C("skip")
							})
						] })]
					}, w.id),
					b.phase === "ready" && !w && /* @__PURE__ */ Q("div", {
						ref: g,
						children: [M(), /* @__PURE__ */ Q("button", {
							disabled: b.busy || b.offline || b.conflict,
							onClick: () => void e.submit(c),
							children: C(b.error === "submissionPending" ? "retry" : "submit")
						})]
					}),
					b.phase === "submitting" && /* @__PURE__ */ Q("p", {
						role: "status",
						children: C("loading")
					}),
					b.phase === "done" && b.completion && /* @__PURE__ */ Q("section", {
						ref: v,
						tabIndex: -1,
						className: "ending",
						"aria-label": C("complete"),
						children: [
							b.completion.ending.messages.map((e, t) => ee(e, t)),
							b.completion.redirectUrl && !e.options.preview && /* @__PURE__ */ Q("p", {
								role: "status",
								children: C("redirecting")
							}),
							b.completion.ending.buttons.map((n) => {
								let r = n.url ? $(Ni(n.url, b.answers, e.meta)) : null;
								return n.action === "restart" ? /* @__PURE__ */ Q("button", {
									onClick: () => s(!0),
									children: O(n.label)
								}, n.id) : n.action === "close" ? /* @__PURE__ */ Q("button", {
									onClick: t,
									children: O(n.label)
								}, n.id) : n.action === "link" && r ? /* @__PURE__ */ Q("a", {
									className: "button",
									href: r,
									target: "_blank",
									rel: "noopener noreferrer",
									children: O(n.label)
								}, n.id) : null;
							})
						]
					}),
					b.conflict && /* @__PURE__ */ Q("section", {
						className: "notice",
						role: "alert",
						children: [
							/* @__PURE__ */ Q("p", { children: C("conflict") }),
							/* @__PURE__ */ Q("button", {
								disabled: b.busy || b.offline,
								onClick: () => void e.resolveConflict(!1),
								children: C("useServer")
							}),
							/* @__PURE__ */ Q("button", {
								disabled: b.busy || b.offline,
								onClick: () => void e.resolveConflict(!0),
								children: C("useLocal")
							})
						]
					}),
					P,
					/* @__PURE__ */ Q("div", { ref: _ })
				]
			}),
			(R || ue) && /* @__PURE__ */ Q("div", {
				className: "contact-bar",
				children: R || /* @__PURE__ */ Q("p", {
					className: "contact-closed",
					children: ue
				})
			}),
			!e.options.preview && /* @__PURE__ */ Q(S, { children: [
				/* @__PURE__ */ Q("label", {
					className: "honeypot",
					"aria-hidden": "true",
					children: [C("honeypot"), /* @__PURE__ */ Q("input", {
						type: "text",
						name: "cff_website_check",
						maxLength: 255,
						autoComplete: "off",
						tabIndex: -1,
						value: c,
						onInput: (e) => l(e.currentTarget.value)
					})]
				}),
				/* @__PURE__ */ Q("span", {
					className: "sr-only",
					role: "status",
					children: b.offline ? C("offline") : b.storageUnavailable ? C("storageUnavailable") : ""
				}),
				(b.offline || b.storageUnavailable || x?.session.magicLinks?.enabled && b.phase === "ready") && /* @__PURE__ */ Q("footer", { children: [(b.offline || b.storageUnavailable) && /* @__PURE__ */ Q("p", {
					className: "status-notice",
					children: C(b.offline ? "offline" : "storageUnavailable")
				}), x?.session.magicLinks?.enabled && b.phase === "ready" && /* @__PURE__ */ Q("div", {
					className: "cff-magic",
					children: [
						/* @__PURE__ */ Q("button", {
							disabled: b.busy || b.offline || b.conflict,
							onClick: () => {
								window.confirm(C("magicEmailConfirm")) && e.magicLink("email").then(() => d(C("magicEmailAccepted"))).catch(() => d(C("magicEmailError")));
							},
							children: C("magicEmail")
						}),
						x.session.magicLinks.whatsapp && /* @__PURE__ */ Q("button", {
							disabled: b.busy || b.offline || b.conflict,
							onClick: () => {
								window.confirm(C("magicShareConfirm")) && e.magicLink("whatsapp").then(async (e) => {
									if (!e.link) d(C("magicShareError"));
									else try {
										navigator.share ? await navigator.share({ text: e.link }) : (await navigator.clipboard.writeText(e.link), d(C("magicCopied")));
									} catch {
										d(C("magicCancelled"));
									}
								}).catch(() => d(C("magicShareError")));
							},
							children: C("magicShare")
						}),
						/* @__PURE__ */ Q("small", {
							role: "status",
							children: u
						})
					]
				})] })
			] })
		]
	});
}
//#endregion
//#region assets/src/shared/prefill.ts
function wa(e, t) {
	let n = new URLSearchParams(e), r = {};
	for (let e of t.steps) {
		if ([
			"hidden",
			"calculated",
			"file_upload",
			"consent",
			"statement",
			"summary",
			"media"
		].includes(e.type)) continue;
		let t = n.get(`cff_prefill[${e.key}]`);
		t === null || t.length > 2e3 || (e.type === "yes_no" ? (t === "true" || t === "false") && (r[e.key] = t === "true") : [
			"number",
			"rating",
			"scale",
			"nps",
			"slider"
		].includes(e.type) ? t.trim() && Number.isFinite(Number(t)) && (r[e.key] = Number(t)) : e.type === "multi_choice" ? r[e.key] = t.split(",").map((e) => e.trim()).filter((t) => e.options?.some((e) => e.value === t)) : e.type !== "address" && (r[e.key] = t));
	}
	return r;
}
//#endregion
//#region assets/src/runtime/persistence.ts
var Ta = class {
	constructor(e = Ea(), t = globalThis.document, n = globalThis.location?.protocol === "https:", r = () => Date.now()) {
		R(this, "store", void 0), R(this, "doc", void 0), R(this, "secure", void 0), R(this, "now", void 0), this.store = e, this.doc = t, this.secure = n, this.now = r;
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
				!Da(i) || i.formId !== e || Date.parse(i.expiresAt) <= this.now() ? this.store.removeItem(r) : (!t || i.version > t.version) && (t = i);
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
function Ea() {
	try {
		return globalThis.localStorage;
	} catch {
		return;
	}
}
function Da(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return Number.isSafeInteger(t.formId) && Number.isSafeInteger(t.version) && typeof t.sessionId == "string" && typeof t.resumeToken == "string" && /^r1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+$/.test(t.resumeToken) && typeof t.expiresAt == "string" && Number.isFinite(Date.parse(t.expiresAt)) && Number.isSafeInteger(t.revision) && !!t.answers && typeof t.answers == "object" && !Array.isArray(t.answers) && Array.isArray(t.acknowledged) && t.acknowledged.every((e) => typeof e == "string") && typeof t.dirty == "boolean" && !!t.stepTimings && typeof t.stepTimings == "object";
}
//#endregion
//#region assets/src/tracking/index.ts
var Oa = "cff_ft";
function ka(e) {
	return !!e.enabled && !(e.consentRequired && !e.consentGranted) && (e.respectDnt === !1 || globalThis.navigator?.doNotTrack !== "1");
}
var Aa = [
	"source",
	"medium",
	"campaign",
	"term",
	"content"
], ja = [
	"gclid",
	"fbclid",
	"msclkid",
	"ttclid"
];
function Ma(e) {
	try {
		let t = new URL(e);
		return ["http:", "https:"].includes(t.protocol) ? `${t.origin}${t.pathname}`.slice(0, 2048) : "";
	} catch {
		return "";
	}
}
function Na(e = {}, t = Ea(), n = {
	href: globalThis.location?.href ?? "",
	referrer: globalThis.document?.referrer ?? ""
}, r = Date.now()) {
	if (!ka(e)) return Ia(t), {};
	try {
		let e = JSON.parse(t?.getItem("cff_ft") ?? "null");
		if (e && typeof e == "object" && Number(e.expiresAt) > r && Number(e.expiresAt) <= r + 7776e6) return Pa(e);
	} catch {}
	let i;
	try {
		i = new URL(n.href || "https://localhost/");
	} catch {
		return {};
	}
	if (!["http:", "https:"].includes(i.protocol)) return {};
	let a = {}, o = {};
	for (let e of Aa) {
		let t = i.searchParams.get(`utm_${e}`);
		t && (a[e] = t.slice(0, 255));
	}
	for (let e of ja) {
		let t = i.searchParams.get(e);
		t && (o[e] = t.slice(0, 255));
	}
	let s = {
		landingPage: Ma(n.href),
		landingReferrer: Ma(n.referrer),
		utm: a,
		clickIds: o,
		expiresAt: r + Math.min(90, Math.max(1, Number.isFinite(e.days) ? e.days : 30)) * 864e5
	};
	try {
		t?.setItem(Oa, JSON.stringify(s));
	} catch {}
	return Pa(s);
}
function Pa(e) {
	let t = {}, n = {};
	for (let n of Aa) typeof e.utm?.[n] == "string" && (t[n] = e.utm[n].slice(0, 255));
	for (let t of ja) typeof e.clickIds?.[t] == "string" && (n[t] = e.clickIds[t].slice(0, 255));
	return {
		landingPage: Ma(e.landingPage ?? ""),
		landingReferrer: Ma(e.landingReferrer ?? ""),
		utm: t,
		clickIds: n
	};
}
function Fa(e = {}) {
	return ka(e) ? {
		...Na(e),
		pageTitle: globalThis.document?.title?.slice(0, 500) ?? "",
		pageUrl: Ma(globalThis.location?.href ?? ""),
		referrer: Ma(globalThis.document?.referrer ?? ""),
		locale: globalThis.navigator?.language?.slice(0, 35) ?? "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		screen: globalThis.screen ? `${screen.width}x${screen.height}` : ""
	} : (Ia(), {});
}
function Ia(e = Ea()) {
	try {
		e?.removeItem(Oa);
	} catch {}
}
typeof window < "u" && window.cffTracking?.enabled && Na(window.cffTracking);
//#endregion
//#region assets/src/runtime/engagement.ts
function La(e, t, n) {
	let r = globalThis.navigator;
	return e.enabled && !n && !r?.globalPrivacyControl && !(e.respectDnt && r?.doNotTrack === "1") && (!e.consentRequired || t);
}
var Ra = class {
	constructor(e, t, n, r) {
		R(this, "api", void 0), R(this, "config", void 0), R(this, "consent", void 0), R(this, "optOut", void 0), R(this, "events", []), R(this, "sent", 0), R(this, "busy", !1), this.api = e, this.config = t, this.consent = n, this.optOut = r;
	}
	add(e) {
		La(this.config, this.consent(), this.optOut()) && this.events.length + this.sent < 200 && this.events.push(e);
	}
	async flush(e) {
		if (!this.busy) {
			if (!La(this.config, this.consent(), this.optOut())) this.events = [];
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
}, za = (e) => [
	"statement",
	"summary",
	"media"
].includes(e.type), Ba = class {
	async loadEngagement() {
		this.state.form && !this.options.preview && this.engagementVersion !== this.state.form.form.version && (this.engagement = null, this.analytics = null, this.state.form.features.engagement && (this.engagement = await this.api.request(`forms/${this.state.form.form.id}/engagement`, "GET", void 0, {}, "no-store", this.state.form.form.version), this.analytics = new Ra(this.api, this.engagement.analytics, () => !!(this.options.tracking ?? globalThis.window?.cffTracking)?.consentGranted, () => {
			try {
				return this.options.analyticsOptOut === !0 || localStorage.getItem("cff_analytics_optout") === "1";
			} catch {
				return this.options.analyticsOptOut === !0;
			}
		})), this.engagementVersion = this.state.form.form.version);
	}
	constructor(e, t, n = new Ta(), r = () => {}) {
		R(this, "options", void 0), R(this, "api", void 0), R(this, "storage", void 0), R(this, "emit", void 0), R(this, "state", {
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
		}), R(this, "listeners", /* @__PURE__ */ new Set()), R(this, "renewal", null), R(this, "session", null), R(this, "context", {
			hidden: {},
			url: {},
			meta: {},
			now: (/* @__PURE__ */ new Date()).toISOString()
		}), R(this, "pending", null), R(this, "pendingStart", null), R(this, "saved", null), R(this, "latest", null), R(this, "stepStarted", Date.now()), R(this, "timings", {}), R(this, "disposed", !1), R(this, "submittedOnce", !1), R(this, "editing", null), R(this, "prefill", void 0), R(this, "engagement", null), R(this, "analytics", null), R(this, "engagementVersion", 0), this.options = e, this.api = t, this.storage = n, this.emit = r, this.prefill = e.prefill ?? {}, e.preview && e.context && (this.context = e.context);
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
	contactClicked() {
		this.event("cff:contact", this.state.activeId ? { stepId: this.state.activeId } : {});
	}
	close() {
		this.session && this.state.phase !== "done" && (this.analytics?.add({
			event: "abandon",
			...this.state.activeId && this.state.form?.form.session.savePartial !== !1 ? { stepId: this.state.activeId } : {}
		}), this.analytics?.flush(this.session));
	}
	async upload(e, t) {
		if (!this.session || !this.api || !this.state.form?.features.uploads || this.options.preview || this.state.offline || this.state.busy || this.state.conflict) throw new z("cff_upload_unavailable", 0);
		return this.ownerOperation(() => this.api.upload(this.session, e.id, t));
	}
	async initialize() {
		let e = (this.options.preview ? null : globalThis.location?.hash.match(/^#cff-magic=([A-Za-z0-9_-]{43})$/))?.[1];
		globalThis.location?.hash.startsWith("#cff-magic=") && globalThis.history.replaceState(globalThis.history.state, "", globalThis.location.pathname + globalThis.location.search);
		try {
			let t = this.options.form?.form.id ?? this.options.formId;
			if (!this.options.preview && t && (this.saved = this.storage.read(t)), this.state.form = this.options.form ?? await this.api.form(this.options.formId), this.disposed) return;
			if (this.latest = this.state.form, li(this.state.form.features?.fieldTypes ?? []), this.options.preview) {
				this.options.previewAnswers && (this.state.answers = { ...this.options.previewAnswers }), this.state.phase = "ready", this.compute();
				return;
			}
			this.prefill = {
				...wa(globalThis.location?.search ?? "", this.state.form.form.schema),
				...this.prefill
			}, await this.loadEngagement();
			let n = this.state.form.form;
			if (e) {
				await this.adopt(await this.api.magicResume(n.id, e)), this.state.acknowledged = this.displayBeforeCurrent(), this.compute(), this.state.phase = "ready", this.persist();
				return;
			}
			this.saved = n.session.resumeEnabled ? this.storage.read(n.id) : null;
			let r = n.session.resumeEnabled ? this.storage.credential(n.id) : null;
			if (r) {
				await this.adopt(await this.api.resume(n.id, r)), this.saved?.dirty && this.saved.sessionId === this.session?.sessionId && (this.state.answers = this.saved.answers, this.state.dirty = !0, this.state.conflict = this.saved.revision !== this.session.revision, this.timings = this.saved.stepTimings), this.state.acknowledged = this.saved?.acknowledged ?? this.displayBeforeCurrent(), this.compute(), this.state.newerVersion = this.latest.form.version !== this.session?.version, this.state.phase = n.session.resumePrompt || this.state.newerVersion ? "resume" : "ready", this.state.phase === "ready" && this.state.dirty && !this.state.conflict && await this.flush();
				return;
			}
			await this.start();
		} catch (e) {
			e instanceof z && e.code === "cff_network" && this.saved?.form && this.saved.context && !this.options.preview ? (this.state.form = this.saved.form, this.context = this.saved.context, this.state.answers = this.saved.answers, this.state.acknowledged = this.saved.acknowledged, this.state.dirty = this.saved.dirty, this.timings = this.saved.stepTimings, this.state.offline = !0, this.state.phase = "resume", this.compute()) : this.handle(e);
		} finally {
			this.notify();
		}
	}
	displayBeforeCurrent() {
		let e = this.state.form.form.schema.steps;
		return (this.session?.visited ?? []).filter((t) => t !== this.session?.currentStepId && e.some((e) => e.id === t && za(e)));
	}
	async adopt(e) {
		if (!this.disposed) {
			if (!this.state.form || e.formId !== this.state.form.form.id || !e.context?.now || !Number.isFinite(Date.parse(e.context.now))) throw new z("cff_invalid_response", 0);
			if (e.status !== "active") throw this.storage.clear(e.formId), new z("cff_session_expired", 401);
			if (e.version !== this.state.form.form.version) {
				let t = await this.api.form(e.formId, e.version);
				if (this.disposed) return;
				if (t.form.version !== e.version) throw new z("cff_version_conflict", 409);
				this.state.form = t;
			}
			e.schema && (this.state.form = {
				...this.state.form,
				form: {
					...this.state.form.form,
					schema: e.schema
				}
			}), await this.loadEngagement(), !this.disposed && (this.session = e, this.context = e.context ?? this.context, this.state.answers = e.answers, this.compute());
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
						if (t.version !== e.version) throw new z("cff_version_conflict", 409);
						this.pendingStart = {
							token: t.startToken,
							key: de(),
							meta: Fa(this.options.tracking ?? globalThis.window?.cffTracking),
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
		let t = ji(e.form.schema, this.state.answers, this.context, "partial");
		if (t.discardedKeys.length) {
			let n = { ...this.state.answers };
			for (let e of t.discardedKeys) delete n[e];
			t = ji(e.form.schema, n, this.context, "partial");
		}
		this.state.path = t, this.state.answers = t.answers, t.errors.length && (this.state.error = "invalid", this.state.phase = "error");
		let n = this.editing ?? t.visited.find((t) => e.form.schema.steps.some((e) => e.id === t && za(e)) && !this.state.acknowledged.includes(t)) ?? t.currentStepId;
		this.state.activeId !== n && (this.state.activeId = n ?? null, this.stepStarted = Date.now(), n && this.event("cff:step", { stepId: n })), this.notify();
	}
	get activeStep() {
		return this.state.form?.form.schema.steps.find((e) => e.id === this.state.activeId);
	}
	get canSkip() {
		let e = this.activeStep;
		if (!e || e.type === "consent" || za(e)) return !1;
		let t = ji(this.state.form.form.schema, {
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
		return this.state.path.visited.slice(0, t < 0 ? void 0 : t + 1).map((t) => e.form.schema.steps.find((e) => e.id === t)).filter((e) => e && e.type !== "hidden" && e.type !== "calculated");
	}
	async answer(e) {
		let t = this.activeStep;
		if (!t || this.state.busy || this.pending?.method === "POST" || this.state.conflict) return;
		if (this.state.fieldError = null, za(t)) {
			this.timings[t.id] = (this.timings[t.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted), this.state.acknowledged = [.../* @__PURE__ */ new Set([...this.state.acknowledged, t.id])], this.compute(), this.persist();
			return;
		}
		let n = {
			...this.state.answers,
			[t.key]: e
		}, r = ji(this.state.form.form.schema, n, this.context, "partial"), i = r.errors.find((e) => e.fieldKey === t.key);
		i || r.currentStepId === t.id ? (this.state.fieldError = i?.code === "required" || i?.code === "cff_required" ? "required" : "invalid", this.notify()) : (this.timings[t.id] = (this.timings[t.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted), this.state.answers = n, this.editing = null, this.state.dirty = !0, this.compute(), this.persist(), this.state.form.form.session.savePartial !== !1 && await this.flush(), this.session && !this.state.dirty && (this.analytics?.add({
			event: "answer",
			stepId: t.id
		}), this.analytics?.flush(this.session)));
	}
	edit(e) {
		if (this.state.busy || this.state.phase !== "ready" || this.pending?.method === "POST") return;
		let t = this.state.path, n = this.state.form?.form.schema.steps.find((t) => t.id === e);
		if (!t?.visited.includes(e) || !n || za(n) || n.type === "hidden" || n.type === "calculated") return;
		this.editing = e, this.state.fieldError = null;
		let r = t.visited.indexOf(e);
		this.state.acknowledged = this.state.acknowledged.filter((e) => t.visited.indexOf(e) < r), this.compute();
	}
	back() {
		let e = this.visibleSteps.filter((e) => !za(e) && e.id !== this.state.activeId && Object.prototype.hasOwnProperty.call(this.state.answers, e.key)), t = e[e.length - 1];
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
	setAppearance(e) {
		this.options.preview && this.state.form && (this.state.form = {
			...this.state.form,
			form: {
				...this.state.form.form,
				appearance: e
			}
		}, this.notify());
	}
	jumpToStep(e) {
		let t = this.state.form?.form.schema.steps.find((t) => t.id === e);
		return !this.options.preview || !t || t.type === "hidden" || t.type === "calculated" ? !1 : (this.editing = e, this.state.activeId = e, this.state.phase = "ready", this.state.error = null, this.state.fieldError = null, this.notify(), !0);
	}
	inputValue(e) {
		return this.state.answers[e.key] ?? ([
			"hidden",
			"calculated",
			"file_upload",
			"consent",
			"statement",
			"summary",
			"media"
		].includes(e.type) ? void 0 : this.prefill[e.key]) ?? e.defaultValue;
	}
	inputAnswers() {
		let e = new Set(this.state.form.form.schema.steps.filter((e) => !za(e) && e.type !== "hidden" && e.type !== "calculated").map((e) => e.key));
		return Object.fromEntries(Object.entries(this.state.answers).filter(([t]) => e.has(t)));
	}
	async magicLink(e) {
		if (!this.api || !this.session || !this.state.form?.form.session.magicLinks?.enabled || this.options.preview || this.state.offline || this.state.conflict || this.state.busy) throw new z("cff_magic_unavailable", 0);
		return this.state.dirty && await this.flush(), this.ownerOperation(() => this.api.magicLink(this.session, e));
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
		if (!this.session) throw new z("cff_session_expired", 401);
		e.method === "POST" && this.submittedOnce || await this.renewCredential();
		try {
			return e.method === "POST" && (this.submittedOnce = !0), await this.api.mutate(this.session, e.method, e.body, e.key);
		} catch (t) {
			if (!(t instanceof z) || t.status !== 401 || !this.session.resumeToken) throw t;
			return await this.renewCredential(!0), this.api.mutate(this.session, e.method, e.body, e.key);
		}
	}
	async renewCredential(e = !1) {
		if (!this.session || !this.api) throw new z("cff_session_expired", 401);
		if (!(!e && Date.parse(this.session.requestExpiresAt) > Date.now() + 5e3)) {
			if (!this.session.resumeToken) throw new z("cff_session_expired", 401);
			if (!this.renewal) {
				let e = this.session;
				this.renewal = this.api.resume(e.formId, e.resumeToken).then((t) => {
					if (this.disposed) throw new z("cff_cancelled", 0);
					if (t.status !== "active") throw new z("cff_session_expired", 401);
					this.session = {
						...t,
						answers: e.answers
					}, this.persist();
				}).finally(() => {
					this.renewal = null;
				});
			}
			await this.renewal;
		}
	}
	async ownerOperation(e) {
		await this.renewCredential();
		try {
			return await e();
		} catch (t) {
			if (!(t instanceof z) || t.status !== 401 || !this.session?.resumeToken) throw t;
			return await this.renewCredential(!0), e();
		}
	}
	pathTimings(e) {
		let t = new Set(ji(this.state.form.form.schema, e, this.context, "partial").visited);
		return Object.fromEntries(Object.entries(this.timings).filter(([e]) => t.has(e)));
	}
	async flush() {
		if (this.disposed || this.options.preview || this.state.form?.form.session.savePartial === !1 || this.state.offline || this.state.busy || this.state.conflict || this.pending?.method === "POST" || !this.session || !this.state.dirty) return;
		this.state.busy = !0, this.notify();
		let e = this.inputAnswers();
		try {
			this.pending || (this.pending = {
				method: "PATCH",
				key: de(),
				body: {
					version: this.session.version,
					revision: this.session.revision,
					answers: e,
					stepTimings: this.pathTimings(e)
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
		let t = ji(this.state.form.form.schema, this.inputAnswers(), this.context, "complete");
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
					let t = "";
					if (this.engagement && this.engagement.captcha.provider !== "none") {
						try {
							t = await this.options.captcha?.(this.engagement.captcha) ?? "";
						} catch {
							t = "";
						}
						if (this.disposed) return;
						if (!t) {
							this.state.phase = "ready", this.state.error = "captchaFailed";
							return;
						}
					}
					if (this.disposed) return;
					this.pending = {
						method: "POST",
						key: de(),
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
					key: de(),
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
		this.pending?.method === "POST" ? await this.submit() : this.pending?.method === "DELETE" ? await this.restart() : this.state.error === "captchaFailed" ? await this.submit() : this.session ? await this.flush() : this.saved ? await this.reconnect() : this.state.form ? await this.start() : await this.initialize();
	}
	handle(e) {
		let t = e instanceof z ? e : new z("cff_request_failed", 0);
		if (([401, 422].includes(t.status) || t.status === 409 && !t.code.includes("pending")) && (this.pendingStart = null), (t.status === 401 || t.code === "cff_session_expired") && this.state.form && !this.options.preview && this.storage.clear(this.state.form.form.id), this.state.error = t.status === 429 ? "error" : t.code === "cff_version_conflict" ? "versionConflict" : t.status === 401 || t.code === "cff_session_expired" ? "expired" : t.status === 409 ? "conflict" : "error", t.status === 409 && t.code !== "cff_version_conflict" && !t.code.includes("pending") && !t.code.includes("idempotency") && (this.state.conflict = !0), t.status === 422) {
			this.pending = null, this.submittedOnce = !1, this.state.fieldError = "invalid";
			let e = this.state.form?.form.schema.steps.find((e) => t.issues.some((t) => t?.fieldKey === e.key));
			e && this.state.path?.visited.includes(e.id) && (this.editing = e.id, this.compute());
		}
		this.session || (this.state.phase = "error"), this.pending?.method === "POST" && (t.status === 0 || t.status >= 500 || t.code.includes("pending")) && (this.state.error = "submissionPending"), this.state.error !== "expired" && this.persist(), this.notify();
	}
}, Va = [
	"Inter",
	"Roboto",
	"Open Sans"
];
function Ha(e) {
	return Va.find((t) => t === e);
}
function Ua(e) {
	if (!Ha(e)) throw TypeError("Unsupported Google font.");
	let t = new URL("https://fonts.googleapis.com/css2");
	return t.searchParams.set("family", `${e}:wght@400;600`), t.searchParams.set("display", "swap"), t.href;
}
//#endregion
//#region assets/src/runtime/fonts.ts
var Wa = 65536, Ga = /* @__PURE__ */ new WeakMap();
function Ka(e, t) {
	if (!Ha(t) || e.length > Wa) throw Error("Invalid font stylesheet.");
	let n = e.replace(/\/\*[\s\S]*?\*\//g, "");
	if (/[\\<>]/.test(n)) throw Error("Invalid font stylesheet.");
	let r = [...n.matchAll(/@font-face\s*\{([^{}]+)\}/g)];
	if (!r.length || r.length > 64 || n.replace(/@font-face\s*\{[^{}]+\}/g, "").trim()) throw Error("Invalid font stylesheet.");
	return r.map(([, e]) => {
		let n = /* @__PURE__ */ new Map();
		for (let t of e.split(";").filter((e) => e.trim())) {
			let e = t.indexOf(":"), r = t.slice(0, e).trim(), i = t.slice(e + 1).trim();
			if (e < 1 || n.has(r)) throw Error("Invalid font descriptor.");
			n.set(r, i);
		}
		if ([...n.keys()].some((e) => ![
			"font-family",
			"font-style",
			"font-weight",
			"font-display",
			"font-stretch",
			"src",
			"unicode-range"
		].includes(e)) || ![`'${t}'`, `"${t}"`].includes(n.get("font-family") ?? "") || n.get("font-style") !== "normal" || !["400", "600"].includes(n.get("font-weight") ?? "") || n.get("font-display") !== "swap" || n.has("font-stretch") && !["normal", "100%"].includes(n.get("font-stretch"))) throw Error("Invalid font descriptor.");
		let r = n.get("src")?.match(/^url\((?:['"])?(https:\/\/fonts\.gstatic\.com\/s\/[A-Za-z0-9/_-]+\.(woff2|woff|ttf))(?:['"])?\)\s+format\(['"](woff2|woff|truetype)['"]\)$/);
		if (!r || r[3] !== (r[2] === "ttf" ? "truetype" : r[2])) throw Error("Invalid font source.");
		let i = n.get("unicode-range");
		if (i && (i.length > 2048 || !/^U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?(?:\s*,\s*U\+[0-9A-F?]{1,6}(?:-[0-9A-F]{1,6})?)*$/i.test(i))) throw Error("Invalid font range.");
		return `@font-face{font-family:"${t}";font-style:normal;font-weight:${n.get("font-weight")};font-display:swap;src:url("${r[1]}") format("${r[3]}");${i ? `unicode-range:${i};` : ""}}`;
	}).join("\n");
}
async function qa(e, t) {
	let n = await fetch(Ua(e), {
		credentials: "omit",
		referrerPolicy: "no-referrer",
		redirect: "error",
		mode: "cors",
		signal: t
	});
	if (!n.ok || n.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "text/css" || Number(n.headers.get("content-length") ?? 0) > Wa || !n.body) throw Error("Font stylesheet unavailable.");
	let r = n.body.getReader(), i = new TextDecoder(), a = "", o = 0;
	try {
		for (;;) {
			let { done: e, value: t } = await r.read();
			if (e) break;
			if (o += t.byteLength, o > Wa) throw await r.cancel(), Error("Font stylesheet too large.");
			a += i.decode(t, { stream: !0 });
		}
		return Ka(a + i.decode(), e);
	} finally {
		r.releaseLock();
	}
}
function Ja(e, t) {
	if (!Ha(t)) return () => {};
	let n = Ga.get(e);
	n || (n = /* @__PURE__ */ new Map(), Ga.set(e, n));
	let r = n.get(t);
	if (!r) {
		r = {
			refs: 0,
			style: e.createElement("style"),
			abort: new AbortController()
		}, r.style.dataset.cffGoogleFont = t, n.set(t, r);
		let i = r, a = setTimeout(() => i.abort.abort(), 5e3);
		qa(t, i.abort.signal).then((t) => {
			!i.abort.signal.aborted && i.refs && (i.style.textContent = t, e.head.append(i.style));
		}).catch(() => {}).finally(() => clearTimeout(a));
	}
	r.refs++;
	let i = r, a = !1;
	return () => {
		a || (a = !0, --i.refs === 0 && (i.abort.abort(), i.style.remove(), n.delete(t)));
	};
}
//#endregion
//#region assets/src/runtime/captcha.ts
var Ya = /* @__PURE__ */ new Map();
function Xa(e) {
	let t = Ya.get(e);
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
	return Ya.set(e, n), n.catch(() => Ya.delete(e)), n;
}
async function Za(e, t) {
	if (e.provider === "none") return "";
	if (!e.siteKey) throw Error("captchaUnavailable");
	if (e.provider === "recaptcha") return await Xa(`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(e.siteKey)}`), new Promise((t, n) => {
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
	await Xa(n === "turnstile" ? "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" : "https://js.hcaptcha.com/1/api.js?render=explicit");
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
var Qa = {
	primary: void 0,
	botBubbleBackground: void 0,
	userBubbleBackground: void 0,
	textColor: void 0,
	headerBackground: "#ffffff",
	headerText: "#171717",
	chatBackground: "#ffffff",
	userTextColor: "#171717"
}, $a = {
	primary: "#3390ec",
	botBubbleBackground: "#ffffff",
	userBubbleBackground: "#e1fec6",
	textColor: "#000000",
	headerBackground: "#ffffff",
	headerText: "#000000",
	chatBackground: "#dbe6ee",
	userTextColor: "#000000"
}, eo = /* @__PURE__ */ new Map(), to = 0;
function no(e) {
	return {
		phase: e.state.phase,
		visited: [...e.state.path?.visited ?? []],
		currentStepId: e.state.activeId,
		variables: { ...e.state.path?.variables },
		progress: e.state.path?.progress ?? 0,
		errors: [...e.state.path?.errors ?? []]
	};
}
function ro(e) {
	return e.mode === "launcher" || e.mode === "popup";
}
function io(e, t = {}) {
	eo.get(e)?.handle.unmount();
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
	a.textContent = se;
	let o = document.createElement("style"), s = document.createElement("div");
	i.replaceChildren(a, o, s);
	let c = {
		...t,
		formId: n,
		locale: t.locale ?? e.dataset.locale ?? document.documentElement.lang ?? "en",
		mode: t.mode ?? ([
			"fullpage",
			"launcher",
			"popup"
		].includes(e.dataset.mode ?? "") ? e.dataset.mode : "inline")
	}, l = document.createElement("div");
	l.className = "captcha", c.captcha ?? (c.captcha = (e) => Za(e, l));
	let u = t.preview ? null : new fe(r), d = new Ba(c, u, void 0, (t, n) => e.dispatchEvent(new CustomEvent(t, {
		detail: n,
		bubbles: !0,
		composed: !0
	}))), f, p = () => {}, m = (t = !1) => {
		let n = (d.state.form ?? c.form)?.form.appearance;
		if (!n) return;
		let r = n.inheritFont || t ? void 0 : Ha(n.googleFont);
		r !== f && (p(), f = r, p = r ? Ja(e.ownerDocument, r) : () => {});
		let i = n.style === "messaging" ? $a : Qa, a = (e) => da(n[e]) ?? i[e], l = {
			"--cff-primary": a("primary"),
			"--cff-bubble-bot-bg": a("botBubbleBackground"),
			"--cff-user-bg": a("userBubbleBackground"),
			"--cff-text": a("textColor"),
			"--cff-header-bg": a("headerBackground"),
			"--cff-header-text": a("headerText"),
			"--cff-chat-bg": a("chatBackground"),
			"--cff-user-text": a("userTextColor"),
			"--cff-font": n.inheritFont ? "inherit" : r ? `"${r}", ${fa(n.font) ?? "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"}` : fa(n.font),
			"--cff-radius": Number.isFinite(n.radius) ? `${Math.max(0, Math.min(128, n.radius))}px` : void 0,
			"--cff-width": Number.isFinite(n.width) ? `${Math.max(280, Math.min(2e3, n.width))}px` : void 0
		};
		for (let [e, t] of Object.entries(l)) t ? s.style.setProperty(e, t) : s.style.removeProperty(e);
		let u = n.theme === "dark" || n.theme === "auto" && globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches;
		s.querySelector(".chat")?.classList.toggle("dark", !!u), n.style === "messaging" ? s.dataset.style = "messaging" : delete s.dataset.style, o.textContent = pa(n.customCss);
	}, h = () => m(), g = d.subscribe(h);
	ro(c) && m(!0);
	let _ = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
	_?.addEventListener("change", h);
	let v = () => d.setOffline(navigator.onLine === !1), y = (e) => {
		e.key?.startsWith(`cff:session:${n}:`) && d.markConflict();
	};
	t.preview || (window.addEventListener("online", v), window.addEventListener("offline", v), window.addEventListener("storage", y));
	let b = c.mode === "popup", x = c.mode === "launcher" || b, S = `cff-overlay-${++to}`, C = !1, w = null, T = null, E = null, D = null, O = s, k = null, A = null, j = !1, ee = !1, M = () => {
		j || (j = !0, v(), d.initialize().then(() => {
			m(), N();
		}));
	}, N = () => {
		if (t.preview || ee || !u || e.hidden || d.state.phase === "error") return;
		let r = d.state.form?.form.version;
		r && (ee = !0, u.view(n, r).catch(() => void 0));
	}, P = ga(c.locale), F = (t) => {
		if (k && A) {
			if (!t && !A.hidden && d.close(), e.hidden = !1, A.hidden = !t, b) {
				let e = s.querySelector(".popup-backdrop");
				e && (e.hidden = !t);
			}
			t && (C = !0), k.hidden = t, k.setAttribute("aria-expanded", String(t)), t ? (M(), A.focus({ preventScroll: !0 })) : k.focus({ preventScroll: !0 });
		}
	};
	if (x) {
		let t = document.createElement("div");
		t.className = b ? "launcher-root popup-root" : "launcher-root", e.dataset.position === "left" && t.classList.add("is-left"), k = document.createElement("button"), k.type = "button", k.className = "launcher-toggle", k.innerHTML = "<svg viewBox=\"0 0 24 24\" width=\"28\" height=\"28\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4.2 22l4.5-2.2c1 .3 2.1.5 3.3.5 5.5 0 10-3.9 10-8.6S17.5 3 12 3z\"/></svg>";
		let n = document.createElement("span");
		if (n.className = "sr-only", n.textContent = P("openChat"), k.append(n), k.setAttribute("aria-controls", S), k.setAttribute("aria-expanded", "false"), A = document.createElement("div"), A.className = "launcher-panel", A.id = S, A.role = "dialog", A.setAttribute("aria-label", P("formDialog")), b && A.setAttribute("aria-modal", "true"), A.tabIndex = -1, A.hidden = !0, b) {
			let e = document.createElement("div");
			e.className = "popup-backdrop", e.hidden = !0, e.addEventListener("click", () => F(!1)), t.append(e);
		}
		t.append(A, k), s.append(t), O = document.createElement("div"), A.append(O, l), k.addEventListener("click", () => F(A.hidden));
		let r = (e) => {
			if (!A || A.hidden) return;
			let t = e.composedPath().includes(A);
			if (e.key === "Escape" && (t || b) && (e.preventDefault(), F(!1)), b && e.key === "Tab") {
				let t = [...A.querySelectorAll("button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]")].filter((e) => e.tabIndex >= 0 && !e.closest(".honeypot,[hidden],[aria-hidden=\"true\"]")), n = t[0], r = t.at(-1), a = i.activeElement;
				!n || !r ? (e.preventDefault(), A.focus()) : e.shiftKey && (!A.contains(a) || a === n || a === A) ? (e.preventDefault(), r.focus()) : !e.shiftKey && (a === r || !A.contains(a)) && (e.preventDefault(), n.focus());
			}
		};
		s.addEventListener("keydown", r), D = (e) => {
			e.composedPath().includes(s) || r(e);
		}, document.addEventListener("keydown", D);
	}
	x || s.after(l), oe(/* @__PURE__ */ Q(Ca, {
		controller: d,
		closable: x,
		onClose: () => {
			x ? F(!1) : t.preview || (d.close(), e.hidden = !0);
		}
	}), O);
	let te = {
		unmount: () => {
			w && clearTimeout(w), T && window.removeEventListener("scroll", T), E && document.removeEventListener("click", E), D && document.removeEventListener("keydown", D), g(), p(), _?.removeEventListener("change", h), d.dispose(), oe(null, O), i.replaceChildren(), window.removeEventListener("online", v), window.removeEventListener("offline", v), window.removeEventListener("storage", y), eo.delete(e);
		},
		prefill: (e) => d.prefillAnswers(e),
		getState: () => no(d),
		jumpToStep: (e) => d.jumpToStep(e),
		setAppearance: (e) => {
			t.preview && d.setAppearance(e);
		},
		open: () => {
			x ? F(!0) : (e.hidden = !1, M(), e.scrollIntoView?.({
				behavior: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
				block: "start"
			}), (e.shadowRoot?.querySelector(".active input:not([type=hidden]),.active textarea,.active select,.active button") ?? e.shadowRoot?.querySelector(".chat"))?.focus({ preventScroll: !0 }));
		}
	};
	if (eo.set(e, {
		handle: te,
		id: n,
		controller: d
	}), x && !t.preview) {
		E = (e) => {
			(e.target instanceof Element ? e.target.closest("[data-cff-open]") : null)?.dataset.cffOpen === String(n) && (e.preventDefault(), F(!0));
		}, document.addEventListener("click", E);
		let t = e.dataset.autoOpen;
		t !== void 0 && t !== "" && /^\d+$/.test(t) && (w = setTimeout(() => {
			!C && !e.hidden && F(!0);
		}, Math.min(3600, Number(t)) * 1e3));
		let r = e.dataset.scrollPercent;
		r !== void 0 && r !== "" && /^\d+$/.test(r) && (T = () => {
			let t = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
			!C && !e.hidden && t > 0 && window.scrollY / t * 100 >= Number(r) && (F(!0), T && window.removeEventListener("scroll", T));
		}, window.addEventListener("scroll", T, { passive: !0 }));
	}
	return x || M(), te;
}
function ao(e = document) {
	for (let t of e.querySelectorAll("cff-chat[data-form-id]")) {
		if (eo.has(t)) continue;
		let e = {}, n = t.querySelector("script[type=\"application/json\"][data-cff-schema]");
		if (n) try {
			e.form = JSON.parse(n.textContent ?? "");
		} catch {}
		try {
			io(t, e);
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
		for (let { controller: t } of eo.values()) t.options.analyticsOptOut = e;
	},
	open: (e) => {
		ao();
		let t = [...eo.keys()].find((t) => eo.get(t)?.id === Number(e));
		return t ? (eo.get(t).handle.open(), !0) : !1;
	},
	prefill: (e, t) => {
		for (let { handle: n, id: r } of eo.values()) (t === void 0 || Number(t) === r) && n.prefill(e);
	},
	registerField: Ui
}, document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => ao(), { once: !0 }) : ao());
//#endregion
export { ao as autoMount, io as mountRuntime, Ui as registerField };
