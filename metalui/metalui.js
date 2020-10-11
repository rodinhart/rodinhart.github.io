import { map, sleep, createUid } from "./lang.js";
// map JSONML
const elMap = async (f, el) => {
    if (Array.isArray(el) && typeof el[0] === "string") {
        const [name, props, ...children] = el;
        const mapped = [];
        for (const child of children) {
            mapped.push(await elMap(f, child));
        }
        return [name, props, ...mapped];
    }
    return await f(el);
};
// JSONML to XML string
export const toxml = (el, gkey, ids) => {
    if (Array.isArray(el)) {
        const [name, props, ...children] = el;
        const evented = map(([key, val]) => {
            if (key.substr(0, 2) !== "on") {
                return [key, val];
            }
            else {
                const id = key + "-" + Math.random().toString(16).substr(2);
                glob[gkey] = ids;
                ids[id] = (event) => val(event);
                return [key, `glob['${gkey}']['${id}'](event)`];
            }
        }, props).reduce((r, [key, val]) => {
            r[key] = val;
            return r;
        }, {});
        const mapped = children.map((c) => toxml(c, gkey, ids));
        return `<${name} ${Object.entries(evented)
            .map(([key, val]) => (val !== undefined ? `${key}="${val}"` : key))
            .join(" ")}>${mapped.join("")}</${name}>`;
    }
    return el === null ? "" : String(el);
};
export const render = async (component) => {
    if (Array.isArray(component)) {
        const [tag, props, ...children] = component;
        const mapped = [];
        for (const child of children) {
            mapped.push(await render(child));
        }
        if (typeof tag === "function") {
            return await render(tag({ ...props, children: mapped }));
        }
        return [tag, props, ...mapped];
    }
    const proto = component &&
        !(component instanceof Date) &&
        component.__proto__ &&
        component.__proto__.toString();
    if (proto === "[object AsyncGenerator]") {
        const iterator = component;
        let id;
        const rerender = async (loop) => {
            do {
                await sleep(0);
            } while (loop && !document.getElementById(id));
            const node = document.getElementById(id);
            if (!node) {
                return;
            }
            const next = await iterator.next(node);
            if (next.done) {
                return;
            }
            const element = await render(next.value);
            Object.assign(node, element[1]);
            const ids = {};
            node.innerHTML = element
                .slice(2)
                .map((e) => toxml(e, id, ids))
                .join(" ");
            rerender();
        };
        const next = await iterator.next();
        const element = await render(next.value);
        id = element[1].id || createUid();
        element[1].id = id;
        rerender(true);
        return element;
    }
    return component;
};
