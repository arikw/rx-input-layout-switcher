/*
 * Copyright (C) 2023 Arik W (https://github.com/arikw)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported observable, watch */
const watchersSymbol = Symbol('watchers');

function observable(obj) {
    const watchers = {};

    const proxy = new Proxy(obj, {
        get(target, prop, receiver) {
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, val, receiver) {
            const result = Reflect.set(target, prop, val, receiver);
            watchers[prop]?.forEach(cb => cb(val));
            return result;
        },
    });

    proxy[watchersSymbol] = watchers;

    return proxy;
}

function watch(obj, prop, cb) {
    const watchers = obj[watchersSymbol];
    watchers[prop] = watchers[prop] ?? [];
    watchers[prop].push(cb);
}