var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@modelcontextprotocol/client/dist/chunk-Br0eD_fh.mjs
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __exportAll = (all, symbols) => {
  let target = {};
  for (var name in all) {
    __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
  }
  if (symbols) {
    __defProp2(target, Symbol.toStringTag, { value: "Module" });
  }
  return target;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except) {
        __defProp2(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
    }
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod));

// node_modules/@modelcontextprotocol/client/dist/dialects-BOhdv1Fc.mjs
var DRAFT_2020_12_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft/2020-12/schema", "http://json-schema.org/draft/2020-12/schema"]);
var DRAFT_2019_09_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft/2019-09/schema", "http://json-schema.org/draft/2019-09/schema"]);
var DRAFT_07_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft-07/schema", "http://json-schema.org/draft-07/schema"]);
var DRAFT_06_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft-06/schema", "http://json-schema.org/draft-06/schema"]);
function declares2019Dialect($schema) {
  return typeof $schema === "string" && DRAFT_2019_09_URIS.has($schema.replace(/#$/, ""));
}
function declaredDialect(schema, remedy) {
  if (!("$schema" in schema) || typeof schema.$schema !== "string") return "2020-12";
  const declared = schema.$schema.replace(/#$/, "");
  if (DRAFT_2020_12_URIS.has(declared)) return "2020-12";
  if (DRAFT_2019_09_URIS.has(declared)) return "2019-09";
  if (DRAFT_07_URIS.has(declared) || DRAFT_06_URIS.has(declared)) return "draft-7";
  throw new Error(`JSON Schema declares an unsupported dialect ("$schema": "${schema.$schema.slice(0, 200)}"). The default validator supports JSON Schema 2020-12, 2019-09, draft-07, and draft-06; ${remedy}`);
}

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  CONSTANT_CATCH: () => CONSTANT_CATCH,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  attachSchema: () => attachSchema,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  codePointLength: () => codePointLength,
  constantCatch: () => constantCatch,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  defineLazyInternal: () => defineLazyInternal,
  derived: () => derived,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  hide: () => hide,
  installLazyProp: () => installLazyProp,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  members: () => members,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  own: () => own,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  rawShape: () => rawShape,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  toZod: () => toZod,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function toZod() {
  return (schema) => schema;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class2 && ((value, key) => selected && !selected.has(key) ? value : new Class2({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class2, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => (
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class2({ type: "nonoptional", innerType: value })
  ));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a3;
  for (let i = start; i < issues.length; i++) {
    (_a3 = issues[i]).schema ?? (_a3.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a3;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a3 = iss).schema ?? (_a3.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base642) {
  const binaryString = atob(base642);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url2) {
  const base642 = base64url2.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base642.length % 4) % 4);
  return base64ToUint8Array(base642 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
// @__NO_SIDE_EFFECTS__
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}

// node_modules/zod/v4/core/core.js
var _a;
var NEVER = /* @__PURE__ */ Object.freeze({
  status: "aborted"
});
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error3, path = []) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue2));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node2 = curr[el];
            if (terminal) {
              node2._errors.push(mapper(issue2));
            }
            curr = node2;
            i++;
          }
        }
      }
    }
  };
  processError(error2);
  return fieldErrors;
}

// node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
function failure(Err, issues, ctx) {
  let error2;
  return {
    success: false,
    get error() {
      if (!error2) {
        error2 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error2;
    },
    set error(e) {
      error2 = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = ((schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== void 0) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === void 0)
      return false;
  }
  return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse2 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse2(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decode = (_Err) => {
  const parse2 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse2(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _encodeAsync = (_Err) => {
  const parseAsync2 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync2(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decodeAsync = (_Err) => {
  const parseAsync2 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync2(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};

// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex2 = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex2;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? (
      // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
      def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
    ) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  // the compiler catches a child's throw and keeps writing into this doc, so the indent has to unwind with it
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join("\n")}
};`);
    return factory(...Object.values(this.closed));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 5
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url2, hostname) {
  hostname.lastIndex = 0;
  return hostname.test(url2.hostname);
}
function urlProtocolOk(url2, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url2 = validateURL(trimmed, def);
      if (url2 === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url2, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url2, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url2.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo3 ? memo3.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo3 = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo3, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo3 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== void 0;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map = /* @__PURE__ */ new Map();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== void 0)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(void 0))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, /* @__PURE__ */ new Set());
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(void 0);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== void 0 || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value2) => disc.value.get(value2) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  const keyIssues = /* @__PURE__ */ new Map();
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleCatchResult(payload, result2, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
  defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
  defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
};
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap();
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached2 = recursive.get(inst);
  if (cached2 !== void 0)
    return cached2 ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge2 = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge2(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    // `$ZodLazy` caches its inner on the def, so a resolved edge is followed exactly
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
      merge2(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    // a leaf by choice: `parts` are regex fragments, not data positions
    case "template_literal":
    // leaves
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      kind;
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check(value);
        else if (Array.isArray(value))
          for (const el of value)
            check(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = /* @__PURE__ */ new WeakMap();
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = void 0;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a3;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError();
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a3;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === void 0) {
          const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: /* @__PURE__ */ new WeakMap(), backEdges: void 0 };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = void 0;
        const entry = open.length > depth ? open.pop() : void 0;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}

// node_modules/zod/v4/locales/en.js
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = getTypeName(issue2.expected);
        const receivedType = parsedType(issue2.input);
        const received = getTypeName(receivedType, issue2.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue2.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/core/registries.js
var _a2;
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta2 = _meta[0];
    this._map.set(schema, meta2);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.set(meta2.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta2 = this._map.get(schema);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.delete(meta2.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2(snapshotChecks({ type: "string", coerce: true, ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2(snapshotChecks({ type: "number", coerce: true, checks: [], ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}

// node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    sharedDefsExtractedFor: void 0,
    sharedEmitDoneFor: void 0,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? void 0
  };
}
function handleUnrepresentable(schema, ctx, json, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === void 0 || result === "throw")
    throw new Error(message);
  Object.assign(json, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = void 0;
  ctx.sharedEmitDoneFor = void 0;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta2 = ctx.metadataRegistry.get(schema);
  if (meta2)
    assignProps(result.schema, meta2);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = /* @__PURE__ */ new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members2) {
  const objects = [];
  for (const member of members2) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required2 = /* @__PURE__ */ new Set();
  for (const object2 of objects) {
    for (const key in object2.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === void 0)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties, key, merged);
    }
    for (const key of object2.required ?? [])
      required2.add(key);
  }
  const folded = { type: "object", properties };
  if (required2.size)
    folded.required = [...required2];
  if (objects.every((object2) => object2.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object2 of objects) {
      const constraint = undeclaredConstraint(object2);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json) {
  const allOf = json.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union2 = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
    if (Object.keys(union2).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union2);
    const branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json.allOf;
  assignProps(json, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        assignProps(schema2, refSchema);
      }
      assignProps(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = /* @__PURE__ */ new Map();
      for (const seen of ctx.seen.values()) {
        for (const json of [seen.schema, seen.def]) {
          const allOf = json?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json);
          else
            carriers.set(allOf, [json]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json of carriers.get(allOf) ?? [])
          foldIntersection(json);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};

// node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
  if (agg[key] === void 0 || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === void 0 || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format2) => {
  agg.format = format2;
  if (format2.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== void 0)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== void 0)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== void 0)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== void 0)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== void 0)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== void 0) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var exactPatterns = /* @__PURE__ */ new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format: format2, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format2) {
    json.format = formatMap[format2] ?? format2;
    if (json.format === "")
      delete json.format;
    if (format2 === "time" || laxFormat) {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json.allOf = [
        ...patternList.map((regex2) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex2.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = /* @__PURE__ */ new Set();
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== void 0)
      json.multipleOf = first;
    if (rest.length)
      json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var bigintProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "BigInt cannot be represented in JSON Schema");
};
var symbolProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Symbols cannot be represented in JSON Schema");
};
var nullProcessor = (_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
var undefinedProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Undefined cannot be represented in JSON Schema");
};
var voidProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Void cannot be represented in JSON Schema");
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var dateProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Date cannot be represented in JSON Schema");
};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var nanProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "NaN cannot be represented in JSON Schema");
};
var templateLiteralProcessor = (schema, _ctx, json, _params) => {
  const _json = json;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json, _params) => {
  const _json = json;
  _json.type = "string";
  _json.format = "binary";
  _json.contentEncoding = "binary";
  const { minimum, maximum, mime } = aggregateChecks(schema);
  if (minimum !== void 0)
    _json.minLength = minimum;
  if (maximum !== void 0)
    _json.maxLength = maximum;
  if (!mime)
    return;
  if (mime.length === 0)
    _json.not = {};
  else if (mime.length === 1)
    _json.contentMediaType = mime[0];
  else
    _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
};
var successProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var customProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var functionProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Function types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var mapProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Map cannot be represented in JSON Schema");
};
var setProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Set cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json.type = "object";
  json.properties = {};
  for (const key in shape) {
    assignProp(json.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
  ctx.intersections.push(allOf);
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? processSchema(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  let minItems = def.items.length;
  while (minItems > 0) {
    const item = def.items[minItems - 1];
    const optional2 = ctx.io === "input" ? inputOptin(item) !== void 0 : item._zod.optout === "optional";
    if (!optional2)
      break;
    minItems--;
  }
  const maxItems = def.items.length;
  const isClosed = !def.rest;
  if (ctx.target === "draft-2020-12") {
    json.prefixItems = prefixItems;
    if (isClosed) {
      json.items = false;
    } else if (rest) {
      json.items = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else if (ctx.target === "openapi-3.0") {
    json.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json.items.anyOf.push(rest);
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else {
    json.items = prefixItems;
    if (isClosed) {
      json.additionalItems = false;
    } else if (rest) {
      json.additionalItems = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  }
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
};
function stringifyKeyNames(bySchema, json, visited) {
  if (json.$ref) {
    if (visited.has(json))
      return json;
    visited.add(json);
    const def = bySchema.get(json)?.def;
    if (!def)
      return json;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json = { ...json, [keyword]: mapped };
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json.enum ?? (json.const !== void 0 ? [json.const] : void 0);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format: format2, id, ...rest } = json;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
  const bySchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = /* @__PURE__ */ new Map();
  for (const record2 of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record2);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = /* @__PURE__ */ Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      processSchema(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      assignProp(schemas, key, finalize(ctx2, schema));
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  processSchema(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}

// node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self2) => (mapper) => formatError(self2, mapper));
  _lazyMethod(proto, "flatten", (self2) => (mapper) => flattenError(self2, mapper));
  _lazyMethod(proto, "addIssue", (self2) => (issue2) => {
    self2.issues.push(issue2);
    self2.message = JSON.stringify(self2.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self2) => (issues2) => {
    self2.issues.push(...issues2);
    self2.message = JSON.stringify(self2.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, void 0, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(util_exports.mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta2) {
    reg.add(this, meta2);
    return this;
  },
  refine(check, params) {
    return this.check(refine(check, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(void 0).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
  get "~standard"() {
    return util_exports.hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    util_exports.own(this, "~standard", value);
  },
  parse: function _parse2(data, params) {
    return parse(this, data, params, { callee: _parse2 });
  },
  parseAsync: async function _parseAsync2(data, params) {
    return await parseAsync(this, data, params, { callee: _parseAsync2 });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  // `spa` is an alias: same function object as `safeParseAsync`, as before.
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    util_exports.own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode2(data, params) {
    return encode(this, data, params, { callee: _encode2 });
  },
  decode: function _decode2(data, params) {
    return decode(this, data, params, { callee: _decode2 });
  },
  encodeAsync: async function _encodeAsync2(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync2 });
  },
  decodeAsync: async function _decodeAsync2(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync2 });
  },
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  // Reads through to the registry on every access, so it must not cache.
  get description() {
    return globalRegistry.get(this)?.description;
  },
  // No setter: `schema._def = x` throws, as it did when `_def` was a non-writable own property.
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor(
  "_ZodString",
  (inst, def) => {
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
  },
  /* @__PURE__ */ util_exports.derived({
    format: (inst) => aggregateChecks(inst).format ?? null,
    minLength: (inst) => aggregateChecks(inst).minimum ?? null,
    maxLength: (inst) => aggregateChecks(inst).maximum ?? null
  }, {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  })
);
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor(
  "ZodNumber",
  (inst, def) => {
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
    inst.isFinite = true;
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => {
      const { minimum, exclusiveMinimum } = aggregateChecks(inst);
      return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    },
    maxValue: (inst) => {
      const { maximum, exclusiveMaximum } = aggregateChecks(inst);
      return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    },
    isInt: (inst) => {
      const { isInt, multipleOf } = aggregateChecks(inst);
      return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  })
);
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor(
  "ZodBigInt",
  (inst, def) => {
    $ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => bigintProcessor(inst, ctx, json, params);
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => aggregateChecks(inst).minimum ?? null,
    maxValue: (inst) => aggregateChecks(inst).maximum ?? null,
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    positive(params) {
      return this.check(_gt(BigInt(0), params));
    },
    negative(params) {
      return this.check(_lt(BigInt(0), params));
    },
    nonpositive(params) {
      return this.check(_lte(BigInt(0), params));
    },
    nonnegative(params) {
      return this.check(_gte(BigInt(0), params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    }
  })
);
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => anyProcessor(inst, ctx, json, params);
});
function any() {
  return _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodDate = /* @__PURE__ */ $constructor(
  "ZodDate",
  (inst, def) => {
    $ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => dateProcessor(inst, ctx, json, params);
    inst.min = (value, params) => inst.check(_gte(value, params));
    inst.max = (value, params) => inst.check(_lte(value, params));
  },
  /* @__PURE__ */ util_exports.derived({
    minDate: (inst) => {
      const { minimum } = aggregateChecks(inst);
      return minimum ? new Date(minimum) : null;
    },
    maxDate: (inst) => {
      const { maximum } = aggregateChecks(inst);
      return maximum ? new Date(maximum) : null;
    }
  }, {})
);
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  util_exports.installLazyProp(inst, "shape", (self2) => self2._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: void 0 }));
  },
  extend(incoming) {
    return util_exports.extend(this, incoming);
  },
  safeExtend(incoming) {
    return util_exports.safeExtend(this, incoming);
  },
  merge(other) {
    return util_exports.merge(this, other);
  },
  pick(mask) {
    return util_exports.pick(this, mask);
  },
  omit(mask) {
    return util_exports.omit(this, mask);
  },
  partial(...args) {
    return util_exports.partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return util_exports.partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return util_exports.required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : util_exports.constantCatch(catchValue)
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}

// node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
function date2(params) {
  return _isoDate(ZodISODate, params);
}
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint2,
  boolean: () => boolean3,
  date: () => date3,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint2(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date3(params) {
  return _coercedDate(ZodDate, params);
}

// node_modules/@modelcontextprotocol/core/dist/auth-BNDyLTqp.mjs
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var SUPPORTED_PROTOCOL_VERSIONS = [
  LATEST_PROTOCOL_VERSION,
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
  "2024-10-07"
];
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var PROTOCOL_VERSION_META_KEY = "io.modelcontextprotocol/protocolVersion";
var CLIENT_INFO_META_KEY = "io.modelcontextprotocol/clientInfo";
var SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";
var CLIENT_CAPABILITIES_META_KEY = "io.modelcontextprotocol/clientCapabilities";
var SUBSCRIPTION_ID_META_KEY = "io.modelcontextprotocol/subscriptionId";
var LOG_LEVEL_META_KEY = "io.modelcontextprotocol/logLevel";
var JSONRPC_VERSION = "2.0";
var JSONValueSchema = lazy(() => union([
  string2(),
  number2(),
  boolean2(),
  _null3(),
  record(string2(), JSONValueSchema),
  array(JSONValueSchema)
]));
var JSONObjectSchema = record(string2(), JSONValueSchema);
var JSONArraySchema = array(JSONValueSchema);
var ProgressTokenSchema = union([string2(), number2().int()]);
var CursorSchema = string2();
var TaskMetadataSchema = object({ ttl: number2().optional() });
var RelatedTaskMetadataSchema = object({ taskId: string2() });
var RequestMetaSchema = looseObject({
  progressToken: ProgressTokenSchema.optional(),
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = object({ _meta: RequestMetaSchema.optional() });
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({ task: TaskMetadataSchema.optional() });
var RequestSchema = object({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = object({ _meta: RequestMetaSchema.optional() });
var NotificationSchema = object({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultMetaObjectSchema = looseObject({ get [SERVER_INFO_META_KEY]() {
  return ImplementationSchema.optional().catch(void 0);
} });
var ResultSchema = looseObject({ _meta: ResultMetaObjectSchema.optional() });
var RequestIdSchema = union([string2(), number2().int()]);
var JSONRPCRequestSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var JSONRPCNotificationSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var JSONRPCResultResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var JSONRPCErrorResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object({
    code: number2().int(),
    message: string2(),
    data: unknown().optional()
  })
}).strict();
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  requestId: RequestIdSchema.optional(),
  reason: string2().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = object({
  src: string2(),
  mimeType: string2().optional(),
  sizes: array(string2()).optional(),
  theme: _enum(["light", "dark"]).optional()
});
var IconsSchema = object({ icons: array(IconSchema).optional() });
var BaseMetadataSchema = object({
  name: string2(),
  title: string2().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  websiteUrl: string2().optional(),
  description: string2().optional()
});
var FormElicitationCapabilitySchema = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema);
var ElicitationCapabilitySchema = preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
  return value;
}, intersection(object({
  form: FormElicitationCapabilitySchema.optional(),
  url: JSONObjectSchema.optional()
}), JSONObjectSchema.optional()));
var ClientTasksCapabilitySchema = looseObject({
  list: JSONObjectSchema.optional(),
  cancel: JSONObjectSchema.optional(),
  requests: looseObject({
    sampling: looseObject({ createMessage: JSONObjectSchema.optional() }).optional(),
    elicitation: looseObject({ create: JSONObjectSchema.optional() }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = looseObject({
  list: JSONObjectSchema.optional(),
  cancel: JSONObjectSchema.optional(),
  requests: looseObject({ tools: looseObject({ call: JSONObjectSchema.optional() }).optional() }).optional()
});
var ClientCapabilitiesSchema = object({
  experimental: record(string2(), JSONObjectSchema).optional(),
  sampling: object({
    context: JSONObjectSchema.optional(),
    tools: JSONObjectSchema.optional()
  }).optional(),
  elicitation: ElicitationCapabilitySchema.optional(),
  roots: object({ listChanged: boolean2().optional() }).optional(),
  tasks: ClientTasksCapabilitySchema.optional(),
  extensions: record(string2(), JSONObjectSchema).optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object({
  experimental: record(string2(), JSONObjectSchema).optional(),
  logging: JSONObjectSchema.optional(),
  completions: JSONObjectSchema.optional(),
  prompts: object({ listChanged: boolean2().optional() }).optional(),
  resources: object({
    subscribe: boolean2().optional(),
    listChanged: boolean2().optional()
  }).optional(),
  tools: object({ listChanged: boolean2().optional() }).optional(),
  tasks: ServerTasksCapabilitySchema.optional(),
  extensions: record(string2(), JSONObjectSchema).optional()
});
var InitializeResultSchema = ResultSchema.extend({
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  instructions: string2().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var DiscoverRequestSchema = RequestSchema.extend({
  method: literal("server/discover"),
  params: BaseRequestParamsSchema.optional()
});
var DiscoverResultSchema = ResultSchema.extend({
  supportedVersions: array(string2()),
  capabilities: ServerCapabilitiesSchema,
  instructions: string2().optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = object({
  progress: number2(),
  total: optional(number2()),
  message: optional(string2())
});
var ProgressNotificationParamsSchema = object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({ cursor: CursorSchema.optional() });
var PaginatedRequestSchema = RequestSchema.extend({ params: PaginatedRequestParamsSchema.optional() });
var PaginatedResultSchema = ResultSchema.extend({ nextCursor: CursorSchema.optional() });
var ResourceContentsSchema = object({
  uri: string2(),
  mimeType: optional(string2()),
  _meta: record(string2(), unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({ text: string2() });
var Base64Schema = string2().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({ blob: Base64Schema });
var RoleSchema = _enum(["user", "assistant"]);
var AnnotationsSchema = object({
  audience: array(RoleSchema).optional(),
  priority: number2().min(0).max(1).optional(),
  lastModified: iso_exports.datetime({ offset: true }).optional()
});
var ResourceSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uri: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  size: optional(number2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ResourceTemplateSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uriTemplate: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({ method: literal("resources/list") });
var ListResourcesResultSchema = PaginatedResultSchema.extend({ resources: array(ResourceSchema) });
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({ method: literal("resources/templates/list") });
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({ resourceTemplates: array(ResourceTemplateSchema) });
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({ uri: string2() });
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({ contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema])) });
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var SubscriptionFilterSchema = object({
  toolsListChanged: boolean2().optional(),
  promptsListChanged: boolean2().optional(),
  resourcesListChanged: boolean2().optional(),
  resourceSubscriptions: array(string2()).optional()
});
var SubscriptionsListenRequestParamsSchema = BaseRequestParamsSchema.extend({ notifications: SubscriptionFilterSchema });
var SubscriptionsListenRequestSchema = RequestSchema.extend({
  method: literal("subscriptions/listen"),
  params: SubscriptionsListenRequestParamsSchema
});
var SubscriptionsAcknowledgedNotificationParamsSchema = NotificationsParamsSchema.extend({ notifications: SubscriptionFilterSchema });
var SubscriptionsAcknowledgedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/subscriptions/acknowledged"),
  params: SubscriptionsAcknowledgedNotificationParamsSchema
});
var SubscriptionsListenResultMetaSchema = ResultMetaObjectSchema.extend({ [SUBSCRIPTION_ID_META_KEY]: RequestIdSchema });
var SubscriptionsListenResultSchema = ResultSchema.extend({ _meta: SubscriptionsListenResultMetaSchema });
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({ uri: string2() });
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = object({
  name: string2(),
  description: optional(string2()),
  required: optional(boolean2())
});
var PromptSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: optional(string2()),
  arguments: optional(array(PromptArgumentSchema)),
  _meta: optional(looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({ method: literal("prompts/list") });
var ListPromptsResultSchema = PaginatedResultSchema.extend({ prompts: array(PromptSchema) });
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), string2()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = object({
  type: literal("text"),
  text: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ImageContentSchema = object({
  type: literal("image"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var AudioContentSchema = object({
  type: literal("audio"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ToolUseContentSchema = object({
  type: literal("tool_use"),
  name: string2(),
  id: string2(),
  input: record(string2(), unknown()),
  _meta: record(string2(), unknown()).optional()
});
var EmbeddedResourceSchema = object({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({ type: literal("resource_link") });
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  description: string2().optional(),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = object({
  title: string2().optional(),
  readOnlyHint: boolean2().optional(),
  destructiveHint: boolean2().optional(),
  idempotentHint: boolean2().optional(),
  openWorldHint: boolean2().optional()
});
var ToolExecutionSchema = object({ taskSupport: _enum([
  "required",
  "optional",
  "forbidden"
]).optional() });
var ToolSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: string2().optional(),
  inputSchema: object({
    type: literal("object"),
    properties: record(string2(), JSONValueSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  outputSchema: looseObject({ $schema: string2().optional() }).optional(),
  annotations: ToolAnnotationsSchema.optional(),
  execution: ToolExecutionSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({ method: literal("tools/list") });
var ListToolsResultSchema = PaginatedResultSchema.extend({ tools: array(ToolSchema) });
var CallToolResultSchema = ResultSchema.extend({
  content: array(ContentBlockSchema).default([]),
  structuredContent: unknown().optional(),
  isError: boolean2().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({ toolResult: unknown() }));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = object({
  autoRefresh: boolean2().default(true),
  debounceMs: number2().int().nonnegative().default(300)
});
var LoggingLevelSchema = _enum([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency"
]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({ level: LoggingLevelSchema });
var SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  level: LoggingLevelSchema,
  logger: string2().optional(),
  data: unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = object({ name: string2().optional() });
var ModelPreferencesSchema = object({
  hints: array(ModelHintSchema).optional(),
  costPriority: number2().min(0).max(1).optional(),
  speedPriority: number2().min(0).max(1).optional(),
  intelligencePriority: number2().min(0).max(1).optional()
});
var ToolChoiceSchema = object({ mode: _enum([
  "auto",
  "required",
  "none"
]).optional() });
var ToolResultContentSchema = object({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema),
  structuredContent: unknown().optional(),
  isError: boolean2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var SamplingContentSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema
]);
var SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = object({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  _meta: record(string2(), unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  modelPreferences: ModelPreferencesSchema.optional(),
  systemPrompt: string2().optional(),
  includeContext: _enum([
    "none",
    "thisServer",
    "allServers"
  ]).optional(),
  temperature: number2().optional(),
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  metadata: JSONObjectSchema.optional(),
  tools: array(ToolSchema).optional(),
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum([
    "endTurn",
    "stopSequence",
    "maxTokens"
  ]).or(string2())),
  role: RoleSchema,
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum([
    "endTurn",
    "stopSequence",
    "maxTokens",
    "toolUse"
  ]).or(string2())),
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = object({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
});
var StringSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum([
    "email",
    "uri",
    "date",
    "date-time"
  ]).optional(),
  default: string2().optional()
});
var NumberSchemaSchema = object({
  type: _enum(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
});
var UntitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
});
var TitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
});
var LegacyTitledEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
});
var SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
});
var TitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({ anyOf: array(object({
    const: string2(),
    title: string2()
  })) }),
  default: array(string2()).optional()
});
var MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = union([
  LegacyTitledEnumSchemaSchema,
  SingleSelectEnumSchemaSchema,
  MultiSelectEnumSchemaSchema
]);
var PrimitiveSchemaDefinitionSchema = union([
  EnumSchemaSchema,
  BooleanSchemaSchema,
  StringSchemaSchema,
  NumberSchemaSchema
]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("form").optional(),
  message: string2(),
  requestedSchema: object({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  }).catchall(unknown())
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("url"),
  message: string2(),
  elicitationId: string2(),
  url: string2().url()
});
var ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({ elicitationId: string2() });
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  action: _enum([
    "accept",
    "decline",
    "cancel"
  ]),
  content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([
    string2(),
    number2(),
    boolean2(),
    array(string2())
  ])).optional())
});
var ResourceTemplateReferenceSchema = object({
  type: literal("ref/resource"),
  uri: string2()
});
var PromptReferenceSchema = object({
  type: literal("ref/prompt"),
  name: string2()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  argument: object({
    name: string2(),
    value: string2()
  }),
  context: object({ arguments: record(string2(), string2()).optional() }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({ completion: looseObject({
  values: array(string2()).max(100),
  total: optional(number2().int()),
  hasMore: optional(boolean2())
}) });
var RootSchema = object({
  uri: string2().startsWith("file://"),
  name: string2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({ roots: array(RootSchema) });
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var TaskCreationParamsSchema = looseObject({
  ttl: number2().optional(),
  pollInterval: number2().optional()
});
var TaskStatusSchema = _enum([
  "working",
  "input_required",
  "completed",
  "failed",
  "cancelled"
]);
var TaskSchema = object({
  taskId: string2(),
  status: TaskStatusSchema,
  ttl: union([number2(), _null3()]),
  createdAt: string2(),
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  statusMessage: optional(string2())
});
var CreateTaskResultSchema = ResultSchema.extend({ task: TaskSchema });
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({ method: literal("tasks/list") });
var ListTasksResultSchema = PaginatedResultSchema.extend({ tasks: array(TaskSchema) });
var CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  DiscoverRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  SubscriptionsListenRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  SubscriptionsAcknowledgedNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  DiscoverResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  SubscriptionsListenResultSchema
]);
var SafeUrlSchema = url().superRefine((val, ctx) => {
  if (!URL.canParse(val)) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: "URL must be parseable",
      fatal: true
    });
    return NEVER;
  }
}).refine((url2) => {
  const u = new URL(url2);
  return u.protocol !== "javascript:" && u.protocol !== "data:" && u.protocol !== "vbscript:";
}, { message: "URL cannot use javascript:, data:, or vbscript: scheme" });
var OAuthProtectedResourceMetadataSchema = looseObject({
  resource: string2().url(),
  authorization_servers: array(SafeUrlSchema).optional(),
  jwks_uri: string2().url().optional(),
  scopes_supported: array(string2()).optional(),
  bearer_methods_supported: array(string2()).optional(),
  resource_signing_alg_values_supported: array(string2()).optional(),
  resource_name: string2().optional(),
  resource_documentation: string2().optional(),
  resource_policy_uri: string2().url().optional(),
  resource_tos_uri: string2().url().optional(),
  tls_client_certificate_bound_access_tokens: boolean2().optional(),
  authorization_details_types_supported: array(string2()).optional(),
  dpop_signing_alg_values_supported: array(string2()).optional(),
  dpop_bound_access_tokens_required: boolean2().optional()
});
var OAuthMetadataSchema = looseObject({
  issuer: string2(),
  authorization_endpoint: SafeUrlSchema,
  token_endpoint: SafeUrlSchema,
  registration_endpoint: SafeUrlSchema.optional(),
  scopes_supported: array(string2()).optional(),
  response_types_supported: array(string2()),
  response_modes_supported: array(string2()).optional(),
  grant_types_supported: array(string2()).optional(),
  token_endpoint_auth_methods_supported: array(string2()).optional(),
  token_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  service_documentation: SafeUrlSchema.optional(),
  revocation_endpoint: SafeUrlSchema.optional(),
  revocation_endpoint_auth_methods_supported: array(string2()).optional(),
  revocation_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  introspection_endpoint: string2().optional(),
  introspection_endpoint_auth_methods_supported: array(string2()).optional(),
  introspection_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  code_challenge_methods_supported: array(string2()).optional(),
  client_id_metadata_document_supported: boolean2().optional(),
  authorization_response_iss_parameter_supported: boolean2().optional().catch(void 0),
  dpop_signing_alg_values_supported: array(string2()).optional()
});
var OpenIdProviderMetadataSchema = looseObject({
  issuer: string2(),
  authorization_endpoint: SafeUrlSchema,
  token_endpoint: SafeUrlSchema,
  userinfo_endpoint: SafeUrlSchema.optional(),
  jwks_uri: SafeUrlSchema,
  registration_endpoint: SafeUrlSchema.optional(),
  scopes_supported: array(string2()).optional(),
  response_types_supported: array(string2()),
  response_modes_supported: array(string2()).optional(),
  grant_types_supported: array(string2()).optional(),
  acr_values_supported: array(string2()).optional(),
  subject_types_supported: array(string2()),
  id_token_signing_alg_values_supported: array(string2()),
  id_token_encryption_alg_values_supported: array(string2()).optional(),
  id_token_encryption_enc_values_supported: array(string2()).optional(),
  userinfo_signing_alg_values_supported: array(string2()).optional(),
  userinfo_encryption_alg_values_supported: array(string2()).optional(),
  userinfo_encryption_enc_values_supported: array(string2()).optional(),
  request_object_signing_alg_values_supported: array(string2()).optional(),
  request_object_encryption_alg_values_supported: array(string2()).optional(),
  request_object_encryption_enc_values_supported: array(string2()).optional(),
  token_endpoint_auth_methods_supported: array(string2()).optional(),
  token_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  display_values_supported: array(string2()).optional(),
  claim_types_supported: array(string2()).optional(),
  claims_supported: array(string2()).optional(),
  service_documentation: string2().optional(),
  claims_locales_supported: array(string2()).optional(),
  ui_locales_supported: array(string2()).optional(),
  claims_parameter_supported: boolean2().optional(),
  request_parameter_supported: boolean2().optional(),
  request_uri_parameter_supported: boolean2().optional(),
  require_request_uri_registration: boolean2().optional(),
  op_policy_uri: SafeUrlSchema.optional(),
  op_tos_uri: SafeUrlSchema.optional(),
  client_id_metadata_document_supported: boolean2().optional(),
  authorization_response_iss_parameter_supported: boolean2().optional().catch(void 0)
});
var OpenIdProviderDiscoveryMetadataSchema = object({
  ...OpenIdProviderMetadataSchema.shape,
  ...OAuthMetadataSchema.pick({ code_challenge_methods_supported: true }).shape
});
var OAuthTokensSchema = object({
  access_token: string2(),
  id_token: string2().optional(),
  token_type: string2(),
  expires_in: coerce_exports.number().optional(),
  scope: string2().optional(),
  refresh_token: string2().optional(),
  issuer: string2().optional().catch(void 0)
}).strip();
var IdJagTokenExchangeResponseSchema = object({
  issued_token_type: literal("urn:ietf:params:oauth:token-type:id-jag"),
  access_token: string2(),
  token_type: string2().optional(),
  expires_in: number2().optional(),
  scope: string2().optional()
}).strip();
var OAuthErrorResponseSchema = object({
  error: string2(),
  error_description: string2().optional(),
  error_uri: string2().optional()
});
var OptionalSafeUrlSchema = SafeUrlSchema.optional().or(literal("").transform(() => void 0));
var OAuthClientMetadataSchema = object({
  redirect_uris: array(SafeUrlSchema),
  token_endpoint_auth_method: string2().optional(),
  grant_types: array(string2()).optional(),
  response_types: array(string2()).optional(),
  application_type: string2().optional(),
  client_name: string2().optional(),
  client_uri: SafeUrlSchema.optional(),
  logo_uri: OptionalSafeUrlSchema,
  scope: string2().optional(),
  contacts: array(string2()).optional(),
  tos_uri: OptionalSafeUrlSchema,
  policy_uri: string2().optional(),
  jwks_uri: SafeUrlSchema.optional(),
  jwks: any().optional(),
  software_id: string2().optional(),
  software_version: string2().optional(),
  software_statement: string2().optional()
}).strip();
var OAuthClientInformationSchema = object({
  client_id: string2(),
  client_secret: string2().optional(),
  client_id_issued_at: number2().optional(),
  client_secret_expires_at: number2().optional(),
  issuer: string2().optional().catch(void 0)
}).strip();
var OAuthClientInformationFullSchema = OAuthClientMetadataSchema.merge(OAuthClientInformationSchema);
var OAuthClientRegistrationErrorSchema = object({
  error: string2(),
  error_description: string2().optional()
}).strip();
var OAuthTokenRevocationRequestSchema = object({
  token: string2(),
  token_type_hint: string2().optional()
}).strip();

// node_modules/@modelcontextprotocol/client/dist/src-WCy6ifGf.mjs
var BRANDS = /* @__PURE__ */ Symbol.for("mcp.sdk.errorBrands");
function stampErrorBrands(instance, ctor) {
  const brands = /* @__PURE__ */ new Set();
  let current = ctor;
  while (typeof current === "function") {
    const brand = current.mcpBrand;
    if (Object.prototype.hasOwnProperty.call(current, "mcpBrand") && typeof brand === "string") brands.add(brand);
    current = Object.getPrototypeOf(current);
  }
  if (brands.size === 0) return;
  Object.defineProperty(instance, BRANDS, {
    value: brands,
    enumerable: false,
    configurable: true
  });
}
function brandedHasInstance(cls, value) {
  try {
    if (typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(cls, "mcpBrand") && typeof cls.mcpBrand === "string" && Object.prototype.hasOwnProperty.call(value, BRANDS)) {
      const carried = value[BRANDS];
      if (carried && typeof carried.has === "function" && carried.has(cls.mcpBrand)) return true;
    }
  } catch {
  }
  return Function.prototype[Symbol.hasInstance].call(cls, value);
}
var OAuthErrorCode = /* @__PURE__ */ (function(OAuthErrorCode$1) {
  OAuthErrorCode$1["InvalidRequest"] = "invalid_request";
  OAuthErrorCode$1["InvalidClient"] = "invalid_client";
  OAuthErrorCode$1["InvalidGrant"] = "invalid_grant";
  OAuthErrorCode$1["UnauthorizedClient"] = "unauthorized_client";
  OAuthErrorCode$1["UnsupportedGrantType"] = "unsupported_grant_type";
  OAuthErrorCode$1["InvalidScope"] = "invalid_scope";
  OAuthErrorCode$1["AccessDenied"] = "access_denied";
  OAuthErrorCode$1["ServerError"] = "server_error";
  OAuthErrorCode$1["TemporarilyUnavailable"] = "temporarily_unavailable";
  OAuthErrorCode$1["UnsupportedResponseType"] = "unsupported_response_type";
  OAuthErrorCode$1["UnsupportedTokenType"] = "unsupported_token_type";
  OAuthErrorCode$1["InvalidToken"] = "invalid_token";
  OAuthErrorCode$1["MethodNotAllowed"] = "method_not_allowed";
  OAuthErrorCode$1["TooManyRequests"] = "too_many_requests";
  OAuthErrorCode$1["InvalidClientMetadata"] = "invalid_client_metadata";
  OAuthErrorCode$1["InvalidRedirectUri"] = "invalid_redirect_uri";
  OAuthErrorCode$1["InsufficientScope"] = "insufficient_scope";
  OAuthErrorCode$1["InvalidTarget"] = "invalid_target";
  OAuthErrorCode$1["InvalidDpopProof"] = "invalid_dpop_proof";
  OAuthErrorCode$1["UseDpopNonce"] = "use_dpop_nonce";
  return OAuthErrorCode$1;
})({});
var OAuthError = class OAuthError2 extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.OAuthError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(code, message, errorUri) {
    super(message);
    this.code = code;
    this.errorUri = errorUri;
    this.name = "OAuthError";
    stampErrorBrands(this, new.target);
  }
  /**
  * Converts the error to a standard OAuth error response object.
  */
  toResponseObject() {
    const response = {
      error: this.code,
      error_description: this.message
    };
    if (this.errorUri) response.error_uri = this.errorUri;
    return response;
  }
  /**
  * Creates an {@linkcode OAuthError} from an OAuth error response.
  */
  static fromResponse(response) {
    return new OAuthError2(response.error, response.error_description ?? response.error, response.error_uri);
  }
};
var SdkErrorCode = /* @__PURE__ */ (function(SdkErrorCode$1) {
  SdkErrorCode$1["NotConnected"] = "NOT_CONNECTED";
  SdkErrorCode$1["AlreadyConnected"] = "ALREADY_CONNECTED";
  SdkErrorCode$1["NotInitialized"] = "NOT_INITIALIZED";
  SdkErrorCode$1["CapabilityNotSupported"] = "CAPABILITY_NOT_SUPPORTED";
  SdkErrorCode$1["RequestTimeout"] = "REQUEST_TIMEOUT";
  SdkErrorCode$1["ConnectionClosed"] = "CONNECTION_CLOSED";
  SdkErrorCode$1["SendFailed"] = "SEND_FAILED";
  SdkErrorCode$1["InvalidResult"] = "INVALID_RESULT";
  SdkErrorCode$1["UnsupportedResultType"] = "UNSUPPORTED_RESULT_TYPE";
  SdkErrorCode$1["InputRequiredRoundsExceeded"] = "INPUT_REQUIRED_ROUNDS_EXCEEDED";
  SdkErrorCode$1["ListPaginationExceeded"] = "LIST_PAGINATION_EXCEEDED";
  SdkErrorCode$1["MethodNotSupportedByProtocolVersion"] = "METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION";
  SdkErrorCode$1["EraNegotiationFailed"] = "ERA_NEGOTIATION_FAILED";
  SdkErrorCode$1["ClientHttpNotImplemented"] = "CLIENT_HTTP_NOT_IMPLEMENTED";
  SdkErrorCode$1["ClientHttpAuthentication"] = "CLIENT_HTTP_AUTHENTICATION";
  SdkErrorCode$1["ClientHttpForbidden"] = "CLIENT_HTTP_FORBIDDEN";
  SdkErrorCode$1["ClientHttpUnexpectedContent"] = "CLIENT_HTTP_UNEXPECTED_CONTENT";
  SdkErrorCode$1["ClientHttpFailedToOpenStream"] = "CLIENT_HTTP_FAILED_TO_OPEN_STREAM";
  SdkErrorCode$1["ClientHttpFailedToTerminateSession"] = "CLIENT_HTTP_FAILED_TO_TERMINATE_SESSION";
  return SdkErrorCode$1;
})({});
var SdkError = class extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.SdkError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  /**
  * @param code - Stable string code identifying the failure ({@linkcode SdkErrorCode}).
  * @param message - Human-readable description.
  * @param data - Optional structured payload (for example the HTTP status carried by
  * {@linkcode SdkHttpError}). Opaque to the SDK: a `cause` key inside `data` is not
  * promoted to `Error.cause`.
  * @param options - Standard `ErrorOptions`, forwarded to `Error`. Pass the underlying
  * failure as `{ cause }` so it is reachable through the `Error.cause` chain that
  * loggers and error trackers walk.
  */
  constructor(code, message, data, options) {
    super(message, options);
    this.code = code;
    this.data = data;
    this.name = "SdkError";
    stampErrorBrands(this, new.target);
  }
};
var SdkHttpError = class extends SdkError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.SdkHttpError" });
  }
  /**
  * @param options - Standard `ErrorOptions`, forwarded to `Error` (see {@linkcode SdkError}).
  */
  constructor(code, message, data, options) {
    super(code, message, data, options);
    this.name = "SdkHttpError";
  }
  get status() {
    return this.data.status;
  }
  get statusText() {
    return this.data.statusText;
  }
};
function resourceUrlFromServerUrl(url2) {
  const resourceURL = typeof url2 === "string" ? new URL(url2) : new URL(url2.href);
  resourceURL.hash = "";
  return resourceURL;
}
function withoutIssuer(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return body;
  const copy = { ...body };
  delete copy.issuer;
  return copy;
}
function checkResourceAllowed({ requestedResource, configuredResource }) {
  const requested = typeof requestedResource === "string" ? new URL(requestedResource) : new URL(requestedResource.href);
  const configured = typeof configuredResource === "string" ? new URL(configuredResource) : new URL(configuredResource.href);
  if (requested.origin !== configured.origin) return false;
  if (requested.pathname.length < configured.pathname.length) return false;
  const requestedPath = requested.pathname.endsWith("/") ? requested.pathname : requested.pathname + "/";
  const configuredPath = configured.pathname.endsWith("/") ? configured.pathname : configured.pathname + "/";
  return requestedPath.startsWith(configuredPath);
}
var FIRST_MODERN_PROTOCOL_VERSION = "2026-07-28";
var SUPPORTED_MODERN_PROTOCOL_VERSIONS = [FIRST_MODERN_PROTOCOL_VERSION];
function isModernProtocolVersion(version2) {
  return version2 >= FIRST_MODERN_PROTOCOL_VERSION;
}
function legacyProtocolVersions(versions) {
  return versions.filter((version2) => !isModernProtocolVersion(version2));
}
function modernProtocolVersions(versions) {
  return versions.filter((version2) => isModernProtocolVersion(version2));
}
function appendTextFallbackForNonObject(result) {
  const sc = result.structuredContent;
  if (sc === void 0) return result;
  if (!(typeof sc !== "object" || sc === null || Array.isArray(sc))) return result;
  if (result.content?.some((c) => c.type === "text") ?? false) return result;
  return {
    ...result,
    content: [...result.content ?? [], {
      type: "text",
      text: JSON.stringify(sc)
    }]
  };
}
var TOOL_RESULT_FOREIGN_FAMILY_KEYS = [
  "task",
  "inputRequests",
  "requestState"
];
function normalizeContentlessToolResult(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value) || value.content !== void 0 || TOOL_RESULT_FOREIGN_FAMILY_KEYS.some((key) => key in value)) return value;
  return {
    ...value,
    content: []
  };
}
function build$1() {
  const JSONValueSchema$1 = lazy(() => union([
    string2(),
    number2(),
    boolean2(),
    _null3(),
    record(string2(), JSONValueSchema$1),
    array(JSONValueSchema$1)
  ]));
  const JSONObjectSchema$1 = record(string2(), JSONValueSchema$1);
  const ProgressTokenSchema$1 = union([string2(), number2().int()]);
  const CursorSchema$1 = string2();
  const TaskMetadataSchema$1 = object({ ttl: number2().optional() });
  const RelatedTaskMetadataSchema$1 = object({ taskId: string2() });
  const RequestMetaSchema$1 = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    "io.modelcontextprotocol/related-task": RelatedTaskMetadataSchema$1.optional()
  });
  const BaseRequestParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const TaskAugmentedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ task: TaskMetadataSchema$1.optional() });
  const RequestSchema$1 = object({
    method: string2(),
    params: BaseRequestParamsSchema$1.loose().optional()
  });
  const NotificationsParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const NotificationSchema$1 = object({
    method: string2(),
    params: NotificationsParamsSchema$1.loose().optional()
  });
  const ResultSchema$1 = looseObject({ _meta: RequestMetaSchema$1.optional() });
  const RequestIdSchema$1 = union([string2(), number2().int()]);
  const EmptyResultSchema$1 = ResultSchema$1.strict();
  const CancelledNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    requestId: RequestIdSchema$1.optional(),
    reason: string2().optional()
  });
  const CancelledNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/cancelled"),
    params: CancelledNotificationParamsSchema$1
  });
  const IconSchema$1 = object({
    src: string2(),
    mimeType: string2().optional(),
    sizes: array(string2()).optional(),
    theme: _enum(["light", "dark"]).optional()
  });
  const IconsSchema$1 = object({ icons: array(IconSchema$1).optional() });
  const BaseMetadataSchema$1 = object({
    name: string2(),
    title: string2().optional()
  });
  const ImplementationSchema$1 = BaseMetadataSchema$1.extend({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    version: string2(),
    websiteUrl: string2().optional(),
    description: string2().optional()
  });
  const FormElicitationCapabilitySchema2 = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema$1);
  const ElicitationCapabilitySchema2 = preprocess((value) => {
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
    return value;
  }, intersection(object({
    form: FormElicitationCapabilitySchema2.optional(),
    url: JSONObjectSchema$1.optional()
  }), JSONObjectSchema$1.optional()));
  const ClientTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({
      sampling: looseObject({ createMessage: JSONObjectSchema$1.optional() }).optional(),
      elicitation: looseObject({ create: JSONObjectSchema$1.optional() }).optional()
    }).optional()
  });
  const ServerTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({ tools: looseObject({ call: JSONObjectSchema$1.optional() }).optional() }).optional()
  });
  const ClientCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    sampling: object({
      context: JSONObjectSchema$1.optional(),
      tools: JSONObjectSchema$1.optional()
    }).optional(),
    elicitation: ElicitationCapabilitySchema2.optional(),
    roots: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ClientTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const InitializeRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    protocolVersion: string2(),
    capabilities: ClientCapabilitiesSchema$1,
    clientInfo: ImplementationSchema$1
  });
  const InitializeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("initialize"),
    params: InitializeRequestParamsSchema$1
  });
  const ServerCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    logging: JSONObjectSchema$1.optional(),
    completions: JSONObjectSchema$1.optional(),
    prompts: object({ listChanged: boolean2().optional() }).optional(),
    resources: object({
      subscribe: boolean2().optional(),
      listChanged: boolean2().optional()
    }).optional(),
    tools: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ServerTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const InitializeResultSchema$1 = ResultSchema$1.extend({
    protocolVersion: string2(),
    capabilities: ServerCapabilitiesSchema$1,
    serverInfo: ImplementationSchema$1,
    instructions: string2().optional()
  });
  const InitializedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/initialized"),
    params: NotificationsParamsSchema$1.optional()
  });
  const PingRequestSchema$1 = RequestSchema$1.extend({
    method: literal("ping"),
    params: BaseRequestParamsSchema$1.optional()
  });
  const ProgressSchema$1 = object({
    progress: number2(),
    total: optional(number2()),
    message: optional(string2())
  });
  const ProgressNotificationParamsSchema$1 = object({
    ...NotificationsParamsSchema$1.shape,
    ...ProgressSchema$1.shape,
    progressToken: ProgressTokenSchema$1
  });
  const ProgressNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/progress"),
    params: ProgressNotificationParamsSchema$1
  });
  const PaginatedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ cursor: CursorSchema$1.optional() });
  const PaginatedRequestSchema$1 = RequestSchema$1.extend({ params: PaginatedRequestParamsSchema$1.optional() });
  const PaginatedResultSchema$1 = ResultSchema$1.extend({ nextCursor: CursorSchema$1.optional() });
  const ResourceContentsSchema$1 = object({
    uri: string2(),
    mimeType: optional(string2()),
    _meta: record(string2(), unknown()).optional()
  });
  const TextResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ text: string2() });
  const Base64Schema2 = string2().refine((val) => {
    try {
      atob(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid Base64 string" });
  const BlobResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ blob: Base64Schema2 });
  const RoleSchema$1 = _enum(["user", "assistant"]);
  const AnnotationsSchema$1 = object({
    audience: array(RoleSchema$1).optional(),
    priority: number2().min(0).max(1).optional(),
    lastModified: iso_exports.datetime({ offset: true }).optional()
  });
  const ResourceSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uri: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    size: optional(number2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceTemplateSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uriTemplate: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ListResourcesRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("resources/list") });
  const ListResourcesResultSchema$1 = PaginatedResultSchema$1.extend({ resources: array(ResourceSchema$1) });
  const ListResourceTemplatesRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("resources/templates/list") });
  const ListResourceTemplatesResultSchema$1 = PaginatedResultSchema$1.extend({ resourceTemplates: array(ResourceTemplateSchema$1) });
  const ResourceRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ uri: string2() });
  const ReadResourceRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const ReadResourceRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/read"),
    params: ReadResourceRequestParamsSchema$1
  });
  const ReadResourceResultSchema$1 = ResultSchema$1.extend({ contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1])) });
  const ResourceListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const SubscribeRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const SubscribeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/subscribe"),
    params: SubscribeRequestParamsSchema$1
  });
  const UnsubscribeRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const UnsubscribeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/unsubscribe"),
    params: UnsubscribeRequestParamsSchema$1
  });
  const ResourceUpdatedNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ uri: string2() });
  const ResourceUpdatedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/updated"),
    params: ResourceUpdatedNotificationParamsSchema$1
  });
  const PromptArgumentSchema$1 = object({
    name: string2(),
    description: optional(string2()),
    required: optional(boolean2())
  });
  const PromptSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: optional(string2()),
    arguments: optional(array(PromptArgumentSchema$1)),
    _meta: optional(looseObject({}))
  });
  const ListPromptsRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("prompts/list") });
  const ListPromptsResultSchema$1 = PaginatedResultSchema$1.extend({ prompts: array(PromptSchema$1) });
  const GetPromptRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    name: string2(),
    arguments: record(string2(), string2()).optional()
  });
  const GetPromptRequestSchema$1 = RequestSchema$1.extend({
    method: literal("prompts/get"),
    params: GetPromptRequestParamsSchema$1
  });
  const TextContentSchema$1 = object({
    type: literal("text"),
    text: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ImageContentSchema$1 = object({
    type: literal("image"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const AudioContentSchema$1 = object({
    type: literal("audio"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolUseContentSchema$1 = object({
    type: literal("tool_use"),
    name: string2(),
    id: string2(),
    input: record(string2(), unknown()),
    _meta: record(string2(), unknown()).optional()
  });
  const EmbeddedResourceSchema$1 = object({
    type: literal("resource"),
    resource: union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ResourceLinkSchema$1 = ResourceSchema$1.extend({ type: literal("resource_link") });
  const ContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ResourceLinkSchema$1,
    EmbeddedResourceSchema$1
  ]);
  const PromptMessageSchema$1 = object({
    role: RoleSchema$1,
    content: ContentBlockSchema$1
  });
  const GetPromptResultSchema$1 = ResultSchema$1.extend({
    description: string2().optional(),
    messages: array(PromptMessageSchema$1)
  });
  const PromptListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/prompts/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ToolAnnotationsSchema$1 = object({
    title: string2().optional(),
    readOnlyHint: boolean2().optional(),
    destructiveHint: boolean2().optional(),
    idempotentHint: boolean2().optional(),
    openWorldHint: boolean2().optional()
  });
  const ToolExecutionSchema$1 = object({ taskSupport: _enum([
    "required",
    "optional",
    "forbidden"
  ]).optional() });
  const ToolSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: string2().optional(),
    inputSchema: object({
      type: literal("object"),
      properties: record(string2(), JSONValueSchema$1).optional(),
      required: array(string2()).optional()
    }).catchall(unknown()),
    outputSchema: object({
      type: literal("object"),
      properties: record(string2(), JSONValueSchema$1).optional(),
      required: array(string2()).optional()
    }).catchall(unknown()).optional(),
    annotations: ToolAnnotationsSchema$1.optional(),
    execution: ToolExecutionSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ListToolsRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("tools/list") });
  const ListToolsResultSchema$1 = PaginatedResultSchema$1.extend({ tools: array(ToolSchema$1) });
  const CallToolResultSchema$1 = ResultSchema$1.extend({
    content: array(ContentBlockSchema$1),
    structuredContent: record(string2(), unknown()).optional(),
    isError: boolean2().optional()
  });
  const CallToolRequestParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    name: string2(),
    arguments: record(string2(), unknown()).optional()
  });
  const CallToolRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tools/call"),
    params: CallToolRequestParamsSchema$1
  });
  const ToolListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tools/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const LoggingLevelSchema$1 = _enum([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency"
  ]);
  const SetLevelRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ level: LoggingLevelSchema$1 });
  const SetLevelRequestSchema$1 = RequestSchema$1.extend({
    method: literal("logging/setLevel"),
    params: SetLevelRequestParamsSchema$1
  });
  const LoggingMessageNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    level: LoggingLevelSchema$1,
    logger: string2().optional(),
    data: unknown()
  });
  const LoggingMessageNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/message"),
    params: LoggingMessageNotificationParamsSchema$1
  });
  const ModelHintSchema$1 = object({ name: string2().optional() });
  const ModelPreferencesSchema$1 = object({
    hints: array(ModelHintSchema$1).optional(),
    costPriority: number2().min(0).max(1).optional(),
    speedPriority: number2().min(0).max(1).optional(),
    intelligencePriority: number2().min(0).max(1).optional()
  });
  const ToolChoiceSchema$1 = object({ mode: _enum([
    "auto",
    "required",
    "none"
  ]).optional() });
  const ToolResultContentSchema$1 = object({
    type: literal("tool_result"),
    toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
    content: array(ContentBlockSchema$1),
    structuredContent: object({}).loose().optional(),
    isError: boolean2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const SamplingContentSchema$1 = discriminatedUnion("type", [
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1
  ]);
  const SamplingMessageContentBlockSchema$1 = discriminatedUnion("type", [
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ToolUseContentSchema$1,
    ToolResultContentSchema$1
  ]);
  const SamplingMessageSchema$1 = object({
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)]),
    _meta: record(string2(), unknown()).optional()
  });
  const CreateMessageRequestParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    messages: array(SamplingMessageSchema$1),
    modelPreferences: ModelPreferencesSchema$1.optional(),
    systemPrompt: string2().optional(),
    includeContext: _enum([
      "none",
      "thisServer",
      "allServers"
    ]).optional(),
    temperature: number2().optional(),
    maxTokens: number2().int(),
    stopSequences: array(string2()).optional(),
    metadata: JSONObjectSchema$1.optional(),
    tools: array(ToolSchema$1).optional(),
    toolChoice: ToolChoiceSchema$1.optional()
  });
  const CreateMessageRequestSchema$1 = RequestSchema$1.extend({
    method: literal("sampling/createMessage"),
    params: CreateMessageRequestParamsSchema$1
  });
  const CreateMessageResultSchema$1 = ResultSchema$1.extend({
    model: string2(),
    stopReason: optional(_enum([
      "endTurn",
      "stopSequence",
      "maxTokens"
    ]).or(string2())),
    role: RoleSchema$1,
    content: SamplingContentSchema$1
  });
  const CreateMessageResultWithToolsSchema$1 = ResultSchema$1.extend({
    model: string2(),
    stopReason: optional(_enum([
      "endTurn",
      "stopSequence",
      "maxTokens",
      "toolUse"
    ]).or(string2())),
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)])
  });
  const BooleanSchemaSchema$1 = object({
    type: literal("boolean"),
    title: string2().optional(),
    description: string2().optional(),
    default: boolean2().optional()
  });
  const StringSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    minLength: number2().optional(),
    maxLength: number2().optional(),
    format: _enum([
      "email",
      "uri",
      "date",
      "date-time"
    ]).optional(),
    default: string2().optional()
  });
  const NumberSchemaSchema$1 = object({
    type: _enum(["number", "integer"]),
    title: string2().optional(),
    description: string2().optional(),
    minimum: number2().optional(),
    maximum: number2().optional(),
    default: number2().optional()
  });
  const UntitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    default: string2().optional()
  });
  const TitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    oneOf: array(object({
      const: string2(),
      title: string2()
    })),
    default: string2().optional()
  });
  const LegacyTitledEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    enumNames: array(string2()).optional(),
    default: string2().optional()
  });
  const SingleSelectEnumSchemaSchema$1 = union([UntitledSingleSelectEnumSchemaSchema$1, TitledSingleSelectEnumSchemaSchema$1]);
  const UntitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({
      type: literal("string"),
      enum: array(string2())
    }),
    default: array(string2()).optional()
  });
  const TitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({ anyOf: array(object({
      const: string2(),
      title: string2()
    })) }),
    default: array(string2()).optional()
  });
  const MultiSelectEnumSchemaSchema$1 = union([UntitledMultiSelectEnumSchemaSchema$1, TitledMultiSelectEnumSchemaSchema$1]);
  const EnumSchemaSchema$1 = union([
    LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema$1
  ]);
  const PrimitiveSchemaDefinitionSchema$1 = union([
    EnumSchemaSchema$1,
    BooleanSchemaSchema$1,
    StringSchemaSchema$1,
    NumberSchemaSchema$1
  ]);
  const ElicitRequestFormParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("form").optional(),
    message: string2(),
    requestedSchema: object({
      type: literal("object"),
      properties: record(string2(), PrimitiveSchemaDefinitionSchema$1),
      required: array(string2()).optional()
    }).catchall(unknown())
  });
  const ElicitRequestURLParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("url"),
    message: string2(),
    elicitationId: string2(),
    url: string2().url()
  });
  const ElicitRequestParamsSchema$1 = union([ElicitRequestFormParamsSchema$1, ElicitRequestURLParamsSchema$1]);
  const ElicitRequestSchema$1 = RequestSchema$1.extend({
    method: literal("elicitation/create"),
    params: ElicitRequestParamsSchema$1
  });
  const ElicitationCompleteNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ elicitationId: string2() });
  const ElicitationCompleteNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/elicitation/complete"),
    params: ElicitationCompleteNotificationParamsSchema$1
  });
  const ElicitResultSchema$1 = ResultSchema$1.extend({
    action: _enum([
      "accept",
      "decline",
      "cancel"
    ]),
    content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([
      string2(),
      number2(),
      boolean2(),
      array(string2())
    ])).optional())
  });
  const ResourceTemplateReferenceSchema$1 = object({
    type: literal("ref/resource"),
    uri: string2()
  });
  const PromptReferenceSchema$1 = object({
    type: literal("ref/prompt"),
    name: string2()
  });
  const CompleteRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    ref: union([PromptReferenceSchema$1, ResourceTemplateReferenceSchema$1]),
    argument: object({
      name: string2(),
      value: string2()
    }),
    context: object({ arguments: record(string2(), string2()).optional() }).optional()
  });
  const CompleteRequestSchema$1 = RequestSchema$1.extend({
    method: literal("completion/complete"),
    params: CompleteRequestParamsSchema$1
  });
  const CompleteResultSchema$1 = ResultSchema$1.extend({ completion: looseObject({
    values: array(string2()).max(100),
    total: optional(number2().int()),
    hasMore: optional(boolean2())
  }) });
  const RootSchema$1 = object({
    uri: string2().startsWith("file://"),
    name: string2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ListRootsRequestSchema$1 = RequestSchema$1.extend({
    method: literal("roots/list"),
    params: BaseRequestParamsSchema$1.optional()
  });
  const ListRootsResultSchema$1 = ResultSchema$1.extend({ roots: array(RootSchema$1) });
  const RootsListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/roots/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const TaskCreationParamsSchema$1 = looseObject({
    ttl: number2().optional(),
    pollInterval: number2().optional()
  });
  const TaskStatusSchema$1 = _enum([
    "working",
    "input_required",
    "completed",
    "failed",
    "cancelled"
  ]);
  const TaskSchema$1 = object({
    taskId: string2(),
    status: TaskStatusSchema$1,
    ttl: union([number2(), _null3()]),
    createdAt: string2(),
    lastUpdatedAt: string2(),
    pollInterval: optional(number2()),
    statusMessage: optional(string2())
  });
  const CreateTaskResultSchema$1 = ResultSchema$1.extend({ task: TaskSchema$1 });
  const TaskStatusNotificationParamsSchema$1 = NotificationsParamsSchema$1.merge(TaskSchema$1);
  const TaskStatusNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tasks/status"),
    params: TaskStatusNotificationParamsSchema$1
  });
  const GetTaskRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/get"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  const GetTaskResultSchema$1 = ResultSchema$1.merge(TaskSchema$1);
  const GetTaskPayloadRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/result"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  const GetTaskPayloadResultSchema$1 = ResultSchema$1.loose();
  const ListTasksRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("tasks/list") });
  const ListTasksResultSchema$1 = PaginatedResultSchema$1.extend({ tasks: array(TaskSchema$1) });
  const CancelTaskRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/cancel"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  return {
    JSONValueSchema: JSONValueSchema$1,
    JSONObjectSchema: JSONObjectSchema$1,
    ProgressTokenSchema: ProgressTokenSchema$1,
    CursorSchema: CursorSchema$1,
    TaskMetadataSchema: TaskMetadataSchema$1,
    RelatedTaskMetadataSchema: RelatedTaskMetadataSchema$1,
    RequestMetaSchema: RequestMetaSchema$1,
    BaseRequestParamsSchema: BaseRequestParamsSchema$1,
    TaskAugmentedRequestParamsSchema: TaskAugmentedRequestParamsSchema$1,
    RequestSchema: RequestSchema$1,
    NotificationsParamsSchema: NotificationsParamsSchema$1,
    NotificationSchema: NotificationSchema$1,
    ResultSchema: ResultSchema$1,
    RequestIdSchema: RequestIdSchema$1,
    EmptyResultSchema: EmptyResultSchema$1,
    CancelledNotificationParamsSchema: CancelledNotificationParamsSchema$1,
    CancelledNotificationSchema: CancelledNotificationSchema$1,
    IconSchema: IconSchema$1,
    IconsSchema: IconsSchema$1,
    BaseMetadataSchema: BaseMetadataSchema$1,
    ImplementationSchema: ImplementationSchema$1,
    ClientTasksCapabilitySchema: ClientTasksCapabilitySchema$1,
    ServerTasksCapabilitySchema: ServerTasksCapabilitySchema$1,
    ClientCapabilitiesSchema: ClientCapabilitiesSchema$1,
    InitializeRequestParamsSchema: InitializeRequestParamsSchema$1,
    InitializeRequestSchema: InitializeRequestSchema$1,
    ServerCapabilitiesSchema: ServerCapabilitiesSchema$1,
    InitializeResultSchema: InitializeResultSchema$1,
    InitializedNotificationSchema: InitializedNotificationSchema$1,
    PingRequestSchema: PingRequestSchema$1,
    ProgressSchema: ProgressSchema$1,
    ProgressNotificationParamsSchema: ProgressNotificationParamsSchema$1,
    ProgressNotificationSchema: ProgressNotificationSchema$1,
    PaginatedRequestParamsSchema: PaginatedRequestParamsSchema$1,
    PaginatedRequestSchema: PaginatedRequestSchema$1,
    PaginatedResultSchema: PaginatedResultSchema$1,
    ResourceContentsSchema: ResourceContentsSchema$1,
    TextResourceContentsSchema: TextResourceContentsSchema$1,
    BlobResourceContentsSchema: BlobResourceContentsSchema$1,
    RoleSchema: RoleSchema$1,
    AnnotationsSchema: AnnotationsSchema$1,
    ResourceSchema: ResourceSchema$1,
    ResourceTemplateSchema: ResourceTemplateSchema$1,
    ListResourcesRequestSchema: ListResourcesRequestSchema$1,
    ListResourcesResultSchema: ListResourcesResultSchema$1,
    ListResourceTemplatesRequestSchema: ListResourceTemplatesRequestSchema$1,
    ListResourceTemplatesResultSchema: ListResourceTemplatesResultSchema$1,
    ResourceRequestParamsSchema: ResourceRequestParamsSchema$1,
    ReadResourceRequestParamsSchema: ReadResourceRequestParamsSchema$1,
    ReadResourceRequestSchema: ReadResourceRequestSchema$1,
    ReadResourceResultSchema: ReadResourceResultSchema$1,
    ResourceListChangedNotificationSchema: ResourceListChangedNotificationSchema$1,
    SubscribeRequestParamsSchema: SubscribeRequestParamsSchema$1,
    SubscribeRequestSchema: SubscribeRequestSchema$1,
    UnsubscribeRequestParamsSchema: UnsubscribeRequestParamsSchema$1,
    UnsubscribeRequestSchema: UnsubscribeRequestSchema$1,
    ResourceUpdatedNotificationParamsSchema: ResourceUpdatedNotificationParamsSchema$1,
    ResourceUpdatedNotificationSchema: ResourceUpdatedNotificationSchema$1,
    PromptArgumentSchema: PromptArgumentSchema$1,
    PromptSchema: PromptSchema$1,
    ListPromptsRequestSchema: ListPromptsRequestSchema$1,
    ListPromptsResultSchema: ListPromptsResultSchema$1,
    GetPromptRequestParamsSchema: GetPromptRequestParamsSchema$1,
    GetPromptRequestSchema: GetPromptRequestSchema$1,
    TextContentSchema: TextContentSchema$1,
    ImageContentSchema: ImageContentSchema$1,
    AudioContentSchema: AudioContentSchema$1,
    ToolUseContentSchema: ToolUseContentSchema$1,
    EmbeddedResourceSchema: EmbeddedResourceSchema$1,
    ResourceLinkSchema: ResourceLinkSchema$1,
    ContentBlockSchema: ContentBlockSchema$1,
    PromptMessageSchema: PromptMessageSchema$1,
    GetPromptResultSchema: GetPromptResultSchema$1,
    PromptListChangedNotificationSchema: PromptListChangedNotificationSchema$1,
    ToolAnnotationsSchema: ToolAnnotationsSchema$1,
    ToolExecutionSchema: ToolExecutionSchema$1,
    ToolSchema: ToolSchema$1,
    ListToolsRequestSchema: ListToolsRequestSchema$1,
    ListToolsResultSchema: ListToolsResultSchema$1,
    CallToolResultSchema: CallToolResultSchema$1,
    CallToolRequestParamsSchema: CallToolRequestParamsSchema$1,
    CallToolRequestSchema: CallToolRequestSchema$1,
    ToolListChangedNotificationSchema: ToolListChangedNotificationSchema$1,
    LoggingLevelSchema: LoggingLevelSchema$1,
    SetLevelRequestParamsSchema: SetLevelRequestParamsSchema$1,
    SetLevelRequestSchema: SetLevelRequestSchema$1,
    LoggingMessageNotificationParamsSchema: LoggingMessageNotificationParamsSchema$1,
    LoggingMessageNotificationSchema: LoggingMessageNotificationSchema$1,
    ModelHintSchema: ModelHintSchema$1,
    ModelPreferencesSchema: ModelPreferencesSchema$1,
    ToolChoiceSchema: ToolChoiceSchema$1,
    ToolResultContentSchema: ToolResultContentSchema$1,
    SamplingContentSchema: SamplingContentSchema$1,
    SamplingMessageContentBlockSchema: SamplingMessageContentBlockSchema$1,
    SamplingMessageSchema: SamplingMessageSchema$1,
    CreateMessageRequestParamsSchema: CreateMessageRequestParamsSchema$1,
    CreateMessageRequestSchema: CreateMessageRequestSchema$1,
    CreateMessageResultSchema: CreateMessageResultSchema$1,
    CreateMessageResultWithToolsSchema: CreateMessageResultWithToolsSchema$1,
    BooleanSchemaSchema: BooleanSchemaSchema$1,
    StringSchemaSchema: StringSchemaSchema$1,
    NumberSchemaSchema: NumberSchemaSchema$1,
    UntitledSingleSelectEnumSchemaSchema: UntitledSingleSelectEnumSchemaSchema$1,
    TitledSingleSelectEnumSchemaSchema: TitledSingleSelectEnumSchemaSchema$1,
    LegacyTitledEnumSchemaSchema: LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema: SingleSelectEnumSchemaSchema$1,
    UntitledMultiSelectEnumSchemaSchema: UntitledMultiSelectEnumSchemaSchema$1,
    TitledMultiSelectEnumSchemaSchema: TitledMultiSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema: MultiSelectEnumSchemaSchema$1,
    EnumSchemaSchema: EnumSchemaSchema$1,
    PrimitiveSchemaDefinitionSchema: PrimitiveSchemaDefinitionSchema$1,
    ElicitRequestFormParamsSchema: ElicitRequestFormParamsSchema$1,
    ElicitRequestURLParamsSchema: ElicitRequestURLParamsSchema$1,
    ElicitRequestParamsSchema: ElicitRequestParamsSchema$1,
    ElicitRequestSchema: ElicitRequestSchema$1,
    ElicitationCompleteNotificationParamsSchema: ElicitationCompleteNotificationParamsSchema$1,
    ElicitationCompleteNotificationSchema: ElicitationCompleteNotificationSchema$1,
    ElicitResultSchema: ElicitResultSchema$1,
    ResourceTemplateReferenceSchema: ResourceTemplateReferenceSchema$1,
    PromptReferenceSchema: PromptReferenceSchema$1,
    CompleteRequestParamsSchema: CompleteRequestParamsSchema$1,
    CompleteRequestSchema: CompleteRequestSchema$1,
    CompleteResultSchema: CompleteResultSchema$1,
    RootSchema: RootSchema$1,
    ListRootsRequestSchema: ListRootsRequestSchema$1,
    ListRootsResultSchema: ListRootsResultSchema$1,
    RootsListChangedNotificationSchema: RootsListChangedNotificationSchema$1,
    TaskCreationParamsSchema: TaskCreationParamsSchema$1,
    TaskStatusSchema: TaskStatusSchema$1,
    TaskSchema: TaskSchema$1,
    CreateTaskResultSchema: CreateTaskResultSchema$1,
    TaskStatusNotificationParamsSchema: TaskStatusNotificationParamsSchema$1,
    TaskStatusNotificationSchema: TaskStatusNotificationSchema$1,
    GetTaskRequestSchema: GetTaskRequestSchema$1,
    GetTaskResultSchema: GetTaskResultSchema$1,
    GetTaskPayloadRequestSchema: GetTaskPayloadRequestSchema$1,
    GetTaskPayloadResultSchema: GetTaskPayloadResultSchema$1,
    ListTasksRequestSchema: ListTasksRequestSchema$1,
    ListTasksResultSchema: ListTasksResultSchema$1,
    CancelTaskRequestSchema: CancelTaskRequestSchema$1,
    CancelTaskResultSchema: ResultSchema$1.merge(TaskSchema$1),
    ClientRequestSchema: union([
      PingRequestSchema$1,
      InitializeRequestSchema$1,
      CompleteRequestSchema$1,
      SetLevelRequestSchema$1,
      GetPromptRequestSchema$1,
      ListPromptsRequestSchema$1,
      ListResourcesRequestSchema$1,
      ListResourceTemplatesRequestSchema$1,
      ReadResourceRequestSchema$1,
      SubscribeRequestSchema$1,
      UnsubscribeRequestSchema$1,
      CallToolRequestSchema$1,
      ListToolsRequestSchema$1,
      GetTaskRequestSchema$1,
      GetTaskPayloadRequestSchema$1,
      ListTasksRequestSchema$1,
      CancelTaskRequestSchema$1
    ]),
    ClientNotificationSchema: union([
      CancelledNotificationSchema$1,
      ProgressNotificationSchema$1,
      InitializedNotificationSchema$1,
      RootsListChangedNotificationSchema$1,
      TaskStatusNotificationSchema$1
    ]),
    ClientResultSchema: union([
      EmptyResultSchema$1,
      CreateMessageResultSchema$1,
      CreateMessageResultWithToolsSchema$1,
      ElicitResultSchema$1,
      ListRootsResultSchema$1,
      GetTaskResultSchema$1,
      ListTasksResultSchema$1,
      CreateTaskResultSchema$1
    ]),
    ServerRequestSchema: union([
      PingRequestSchema$1,
      CreateMessageRequestSchema$1,
      ElicitRequestSchema$1,
      ListRootsRequestSchema$1,
      GetTaskRequestSchema$1,
      GetTaskPayloadRequestSchema$1,
      ListTasksRequestSchema$1,
      CancelTaskRequestSchema$1
    ]),
    ServerNotificationSchema: union([
      CancelledNotificationSchema$1,
      ProgressNotificationSchema$1,
      LoggingMessageNotificationSchema$1,
      ResourceUpdatedNotificationSchema$1,
      ResourceListChangedNotificationSchema$1,
      ToolListChangedNotificationSchema$1,
      PromptListChangedNotificationSchema$1,
      TaskStatusNotificationSchema$1,
      ElicitationCompleteNotificationSchema$1
    ]),
    ServerResultSchema: union([
      EmptyResultSchema$1,
      InitializeResultSchema$1,
      CompleteResultSchema$1,
      GetPromptResultSchema$1,
      ListPromptsResultSchema$1,
      ListResourcesResultSchema$1,
      ListResourceTemplatesResultSchema$1,
      ReadResourceResultSchema$1,
      CallToolResultSchema$1,
      ListToolsResultSchema$1,
      GetTaskResultSchema$1,
      ListTasksResultSchema$1,
      CreateTaskResultSchema$1
    ]),
    CallToolResultWireSchema: unknown().superRefine((value, ctx) => {
      if (typeof value !== "object" || value === null || Array.isArray(value) || value.content !== void 0) return;
      for (const key of TOOL_RESULT_FOREIGN_FAMILY_KEYS) if (key in value) {
        ctx.addIssue({
          code: "custom",
          message: `content is required when the body carries '${key}' \u2014 another result family cannot default into an empty tools/call success`
        });
        return;
      }
    }).transform(normalizeContentlessToolResult).pipe(CallToolResultSchema$1)
  };
}
var memo$1;
function buildSchemas2025() {
  return memo$1 ??= build$1();
}
function isNonObjectJsonSchemaRoot(json) {
  return json["type"] !== "object";
}
var REF_REWRITE_DATA_POSITION_KEYS = /* @__PURE__ */ new Set([
  "const",
  "enum",
  "default",
  "examples"
]);
var REF_REWRITE_NAME_MAP_KEYS = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
  "dependencies"
]);
function establishesNewBase(id) {
  return id !== void 0 && !(typeof id === "string" && id.startsWith("#"));
}
function wrapOutputSchemaForLegacy(natural) {
  const $schema = typeof natural["$schema"] === "string" ? natural["$schema"] : void 0;
  if (establishesNewBase(natural["$id"])) return {
    ...$schema !== void 0 && { $schema },
    type: "object",
    properties: { result: natural },
    required: ["result"]
  };
  const convertRecursiveRefs = declares2019Dialect(natural["$schema"]) && natural["$recursiveAnchor"] !== true;
  const rewriteRefs = (node2, parentIsNameMap) => {
    if (Array.isArray(node2)) return node2.map((item) => rewriteRefs(item, false));
    if (node2 === null || typeof node2 !== "object") return node2;
    if (!parentIsNameMap && establishesNewBase(node2["$id"])) return node2;
    const out = {};
    let convertedRecursion = false;
    for (const [k, v] of Object.entries(node2)) if (parentIsNameMap) out[k] = rewriteRefs(v, false);
    else if ((k === "$ref" || k === "$dynamicRef") && typeof v === "string") out[k] = v === "#" ? "#/properties/result" : v.startsWith("#/") ? `#/properties/result${v.slice(1)}` : v;
    else if (k === "$recursiveRef" && v === "#" && convertRecursiveRefs) convertedRecursion = true;
    else if (REF_REWRITE_DATA_POSITION_KEYS.has(k)) out[k] = v;
    else if (REF_REWRITE_NAME_MAP_KEYS.has(k)) out[k] = rewriteRefs(v, true);
    else out[k] = rewriteRefs(v, false);
    if (convertedRecursion) if ("$ref" in out) out["allOf"] = [...Array.isArray(out["allOf"]) ? out["allOf"] : [], { $ref: "#/properties/result" }];
    else out["$ref"] = "#/properties/result";
    return out;
  };
  return {
    ...$schema !== void 0 && { $schema },
    type: "object",
    properties: { result: rewriteRefs(natural, false) },
    required: ["result"]
  };
}
var requestMethodKeys$1 = {
  ping: null,
  initialize: null,
  "completion/complete": null,
  "logging/setLevel": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "resources/subscribe": null,
  "resources/unsubscribe": null,
  "tools/call": null,
  "tools/list": null,
  "tasks/get": null,
  "tasks/result": null,
  "tasks/list": null,
  "tasks/cancel": null,
  "sampling/createMessage": null,
  "elicitation/create": null,
  "roots/list": null
};
var notificationMethodKeys$1 = {
  "notifications/cancelled": null,
  "notifications/progress": null,
  "notifications/initialized": null,
  "notifications/roots/list_changed": null,
  "notifications/tasks/status": null,
  "notifications/message": null,
  "notifications/resources/updated": null,
  "notifications/resources/list_changed": null,
  "notifications/tools/list_changed": null,
  "notifications/prompts/list_changed": null,
  "notifications/elicitation/complete": null
};
var resultMethodKeys = {
  ping: null,
  initialize: null,
  "completion/complete": null,
  "logging/setLevel": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "resources/subscribe": null,
  "resources/unsubscribe": null,
  "tools/call": null,
  "tools/list": null,
  "sampling/createMessage": null,
  "elicitation/create": null,
  "roots/list": null
};
var maps$1;
function registryMaps() {
  if (maps$1) return maps$1;
  const s = buildSchemas2025();
  maps$1 = {
    requestSchemas: {
      ping: s.PingRequestSchema,
      initialize: s.InitializeRequestSchema,
      "completion/complete": s.CompleteRequestSchema,
      "logging/setLevel": s.SetLevelRequestSchema,
      "prompts/get": s.GetPromptRequestSchema,
      "prompts/list": s.ListPromptsRequestSchema,
      "resources/list": s.ListResourcesRequestSchema,
      "resources/templates/list": s.ListResourceTemplatesRequestSchema,
      "resources/read": s.ReadResourceRequestSchema,
      "resources/subscribe": s.SubscribeRequestSchema,
      "resources/unsubscribe": s.UnsubscribeRequestSchema,
      "tools/call": s.CallToolRequestSchema,
      "tools/list": s.ListToolsRequestSchema,
      "tasks/get": s.GetTaskRequestSchema,
      "tasks/result": s.GetTaskPayloadRequestSchema,
      "tasks/list": s.ListTasksRequestSchema,
      "tasks/cancel": s.CancelTaskRequestSchema,
      "sampling/createMessage": s.CreateMessageRequestSchema,
      "elicitation/create": s.ElicitRequestSchema,
      "roots/list": s.ListRootsRequestSchema
    },
    notificationSchemas: {
      "notifications/cancelled": s.CancelledNotificationSchema,
      "notifications/progress": s.ProgressNotificationSchema,
      "notifications/initialized": s.InitializedNotificationSchema,
      "notifications/roots/list_changed": s.RootsListChangedNotificationSchema,
      "notifications/tasks/status": s.TaskStatusNotificationSchema,
      "notifications/message": s.LoggingMessageNotificationSchema,
      "notifications/resources/updated": s.ResourceUpdatedNotificationSchema,
      "notifications/resources/list_changed": s.ResourceListChangedNotificationSchema,
      "notifications/tools/list_changed": s.ToolListChangedNotificationSchema,
      "notifications/prompts/list_changed": s.PromptListChangedNotificationSchema,
      "notifications/elicitation/complete": s.ElicitationCompleteNotificationSchema
    },
    resultSchemas: {
      ping: s.EmptyResultSchema,
      initialize: s.InitializeResultSchema,
      "completion/complete": s.CompleteResultSchema,
      "logging/setLevel": s.EmptyResultSchema,
      "prompts/get": s.GetPromptResultSchema,
      "prompts/list": s.ListPromptsResultSchema,
      "resources/list": s.ListResourcesResultSchema,
      "resources/templates/list": s.ListResourceTemplatesResultSchema,
      "resources/read": s.ReadResourceResultSchema,
      "resources/subscribe": s.EmptyResultSchema,
      "resources/unsubscribe": s.EmptyResultSchema,
      "tools/call": s.CallToolResultWireSchema,
      "tools/list": s.ListToolsResultSchema,
      "sampling/createMessage": s.CreateMessageResultWithToolsSchema,
      "elicitation/create": s.ElicitResultSchema,
      "roots/list": s.ListRootsResultSchema
    }
  };
  return maps$1;
}
function hasRequestMethod2025(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys$1, method);
}
function hasNotificationMethod2025(method) {
  return Object.prototype.hasOwnProperty.call(notificationMethodKeys$1, method);
}
function hasResultMethod(method) {
  return Object.prototype.hasOwnProperty.call(resultMethodKeys, method);
}
function getResultSchema(method) {
  return hasResultMethod(method) ? registryMaps().resultSchemas[method] : void 0;
}
function getRequestSchema(method) {
  return hasRequestMethod2025(method) ? registryMaps().requestSchemas[method] : void 0;
}
function getNotificationSchema(method) {
  return hasNotificationMethod2025(method) ? registryMaps().notificationSchemas[method] : void 0;
}
var rev2025RequestMethods = Object.keys(requestMethodKeys$1);
var rev2025NotificationMethods = Object.keys(notificationMethodKeys$1);
function isPlainObject$5(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function triState$1(schema, raw) {
  if (schema === void 0) return {
    ok: false,
    reason: "not-in-era"
  };
  const parsed = schema.safeParse(raw);
  return parsed.success ? {
    ok: true,
    value: parsed.data
  } : {
    ok: false,
    reason: "invalid",
    message: String(parsed.error)
  };
}
var NOT_IN_ERA$1 = {
  ok: false,
  reason: "not-in-era"
};
function toolNeedsLegacyWrap(t) {
  return isPlainObject$5(t) && isPlainObject$5(t["outputSchema"]) && isNonObjectJsonSchemaRoot(t["outputSchema"]);
}
function toNeutralResult(value) {
  return value;
}
var rev2025Codec = {
  era: "2025-11-25",
  hasRequestMethod: hasRequestMethod2025,
  hasNotificationMethod: hasNotificationMethod2025,
  validateRequest: (method, raw) => triState$1(getRequestSchema(method), raw),
  validateResult: (method, raw) => triState$1(getResultSchema(method), raw),
  validateNotification: (method, raw) => triState$1(getNotificationSchema(method), raw),
  hasInputRequestMethod: () => false,
  validateInputRequest: () => NOT_IN_ERA$1,
  validateInputResponse: () => NOT_IN_ERA$1,
  samplingResultVariant: ((hasTools, raw) => {
    const s = buildSchemas2025();
    return triState$1(hasTools ? s.CreateMessageResultWithToolsSchema : s.CreateMessageResultSchema, raw);
  }),
  outboundEnvelope: (_material) => void 0,
  validateEnvelopeMeta: (_meta) => [],
  projectCallToolResult(result, advertisedOutputSchema) {
    const withText = appendTextFallbackForNonObject(result);
    const sc = withText.structuredContent;
    if (sc === void 0) return withText;
    const valueIsNonObject = typeof sc !== "object" || sc === null || Array.isArray(sc);
    const schemaWrapped = advertisedOutputSchema !== void 0 && isNonObjectJsonSchemaRoot(advertisedOutputSchema);
    if (!valueIsNonObject && !schemaWrapped) return withText;
    return {
      ...withText,
      structuredContent: { result: sc }
    };
  },
  decodeResult(_method, raw) {
    if (isPlainObject$5(raw) && "resultType" in raw) {
      const stripped = { ...raw };
      delete stripped["resultType"];
      return {
        kind: "complete",
        result: toNeutralResult(stripped)
      };
    }
    return {
      kind: "complete",
      result: toNeutralResult(raw)
    };
  },
  encodeResult(method, result) {
    if (method !== "tools/list") return result;
    const tools = result.tools;
    if (!Array.isArray(tools) || !tools.some((t) => toolNeedsLegacyWrap(t))) return result;
    return {
      ...result,
      tools: tools.map((t) => toolNeedsLegacyWrap(t) ? {
        ...t,
        outputSchema: wrapOutputSchemaForLegacy(t.outputSchema)
      } : t)
    };
  },
  encodeErrorCode: (code) => code === -32002 ? -32602 : code,
  checkInboundEnvelope: (_material) => void 0
};
function build() {
  const JSONValueSchema$1 = lazy(() => union([
    string2(),
    number2(),
    boolean2(),
    _null3(),
    record(string2(), JSONValueSchema$1),
    array(JSONValueSchema$1)
  ]));
  const JSONObjectSchema$1 = record(string2(), JSONValueSchema$1);
  const ProgressTokenSchema$1 = union([string2(), number2().int()]);
  const CursorSchema$1 = string2();
  const RequestIdSchema$1 = union([string2(), number2().int()]);
  const RoleSchema$1 = _enum(["user", "assistant"]);
  const LoggingLevelSchema$1 = _enum([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency"
  ]);
  const Base64Schema2 = string2().refine((val) => {
    try {
      atob(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid Base64 string" });
  const TaskMetadataSchema$1 = object({ ttl: number2().optional() });
  const RelatedTaskMetadataSchema$1 = object({ taskId: string2() });
  const RequestMetaSchema$1 = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    "io.modelcontextprotocol/related-task": RelatedTaskMetadataSchema$1.optional()
  });
  const BaseRequestParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const TaskAugmentedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ task: TaskMetadataSchema$1.optional() });
  const NotificationsParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const NotificationSchema$1 = object({
    method: string2(),
    params: NotificationsParamsSchema$1.loose().optional()
  });
  const IconSchema$1 = object({
    src: string2(),
    mimeType: string2().optional(),
    sizes: array(string2()).optional(),
    theme: _enum(["light", "dark"]).optional()
  });
  const IconsSchema$1 = object({ icons: array(IconSchema$1).optional() });
  const BaseMetadataSchema$1 = object({
    name: string2(),
    title: string2().optional()
  });
  const ImplementationSchema$1 = BaseMetadataSchema$1.extend({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    version: string2(),
    websiteUrl: string2().optional(),
    description: string2().optional()
  });
  const FormElicitationCapabilitySchema2 = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema$1);
  const ElicitationCapabilitySchema2 = preprocess((value) => {
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
    return value;
  }, intersection(object({
    form: FormElicitationCapabilitySchema2.optional(),
    url: JSONObjectSchema$1.optional()
  }), JSONObjectSchema$1.optional()));
  const ClientTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({
      sampling: looseObject({ createMessage: JSONObjectSchema$1.optional() }).optional(),
      elicitation: looseObject({ create: JSONObjectSchema$1.optional() }).optional()
    }).optional()
  });
  const ServerTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({ tools: looseObject({ call: JSONObjectSchema$1.optional() }).optional() }).optional()
  });
  const ClientCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    sampling: object({
      context: JSONObjectSchema$1.optional(),
      tools: JSONObjectSchema$1.optional()
    }).optional(),
    elicitation: ElicitationCapabilitySchema2.optional(),
    roots: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ClientTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const ServerCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    logging: JSONObjectSchema$1.optional(),
    completions: JSONObjectSchema$1.optional(),
    prompts: object({ listChanged: boolean2().optional() }).optional(),
    resources: object({
      subscribe: boolean2().optional(),
      listChanged: boolean2().optional()
    }).optional(),
    tools: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ServerTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const ProgressSchema$1 = object({
    progress: number2(),
    total: optional(number2()),
    message: optional(string2())
  });
  const ProgressNotificationParamsSchema$1 = object({
    ...NotificationsParamsSchema$1.shape,
    ...ProgressSchema$1.shape,
    progressToken: ProgressTokenSchema$1
  });
  const ProgressNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/progress"),
    params: ProgressNotificationParamsSchema$1
  });
  const LoggingMessageNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    level: LoggingLevelSchema$1,
    logger: string2().optional(),
    data: unknown()
  });
  const LoggingMessageNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/message"),
    params: LoggingMessageNotificationParamsSchema$1
  });
  const ResourceContentsSchema$1 = object({
    uri: string2(),
    mimeType: optional(string2()),
    _meta: record(string2(), unknown()).optional()
  });
  const TextResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ text: string2() });
  const BlobResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ blob: Base64Schema2 });
  const AnnotationsSchema$1 = object({
    audience: array(RoleSchema$1).optional(),
    priority: number2().min(0).max(1).optional(),
    lastModified: iso_exports.datetime({ offset: true }).optional()
  });
  const ResourceSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uri: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    size: optional(number2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceTemplateSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uriTemplate: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ResourceUpdatedNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ uri: string2() });
  const ResourceUpdatedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/updated"),
    params: ResourceUpdatedNotificationParamsSchema$1
  });
  const PromptArgumentSchema$1 = object({
    name: string2(),
    description: optional(string2()),
    required: optional(boolean2())
  });
  const PromptSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: optional(string2()),
    arguments: optional(array(PromptArgumentSchema$1)),
    _meta: optional(looseObject({}))
  });
  const PromptListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/prompts/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const TextContentSchema$1 = object({
    type: literal("text"),
    text: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ImageContentSchema$1 = object({
    type: literal("image"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const AudioContentSchema$1 = object({
    type: literal("audio"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolUseContentSchema$1 = object({
    type: literal("tool_use"),
    name: string2(),
    id: string2(),
    input: record(string2(), unknown()),
    _meta: record(string2(), unknown()).optional()
  });
  const EmbeddedResourceSchema$1 = object({
    type: literal("resource"),
    resource: union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ResourceLinkSchema$1 = ResourceSchema$1.extend({ type: literal("resource_link") });
  const ContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ResourceLinkSchema$1,
    EmbeddedResourceSchema$1
  ]);
  const PromptMessageSchema$1 = object({
    role: RoleSchema$1,
    content: ContentBlockSchema$1
  });
  const ToolAnnotationsSchema$1 = object({
    title: string2().optional(),
    readOnlyHint: boolean2().optional(),
    destructiveHint: boolean2().optional(),
    idempotentHint: boolean2().optional(),
    openWorldHint: boolean2().optional()
  });
  const ToolListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tools/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ModelHintSchema$1 = object({ name: string2().optional() });
  const ModelPreferencesSchema$1 = object({
    hints: array(ModelHintSchema$1).optional(),
    costPriority: number2().min(0).max(1).optional(),
    speedPriority: number2().min(0).max(1).optional(),
    intelligencePriority: number2().min(0).max(1).optional()
  });
  const ToolChoiceSchema$1 = object({ mode: _enum([
    "auto",
    "required",
    "none"
  ]).optional() });
  const BooleanSchemaSchema$1 = object({
    type: literal("boolean"),
    title: string2().optional(),
    description: string2().optional(),
    default: boolean2().optional()
  });
  const StringSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    minLength: number2().optional(),
    maxLength: number2().optional(),
    format: _enum([
      "email",
      "uri",
      "date",
      "date-time"
    ]).optional(),
    default: string2().optional()
  });
  const NumberSchemaSchema$1 = object({
    type: _enum(["number", "integer"]),
    title: string2().optional(),
    description: string2().optional(),
    minimum: number2().optional(),
    maximum: number2().optional(),
    default: number2().optional()
  });
  const UntitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    default: string2().optional()
  });
  const TitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    oneOf: array(object({
      const: string2(),
      title: string2()
    })),
    default: string2().optional()
  });
  const LegacyTitledEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    enumNames: array(string2()).optional(),
    default: string2().optional()
  });
  const SingleSelectEnumSchemaSchema$1 = union([UntitledSingleSelectEnumSchemaSchema$1, TitledSingleSelectEnumSchemaSchema$1]);
  const UntitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({
      type: literal("string"),
      enum: array(string2())
    }),
    default: array(string2()).optional()
  });
  const TitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({ anyOf: array(object({
      const: string2(),
      title: string2()
    })) }),
    default: array(string2()).optional()
  });
  const MultiSelectEnumSchemaSchema$1 = union([UntitledMultiSelectEnumSchemaSchema$1, TitledMultiSelectEnumSchemaSchema$1]);
  const EnumSchemaSchema$1 = union([
    LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema$1
  ]);
  const PrimitiveSchemaDefinitionSchema$1 = union([
    EnumSchemaSchema$1,
    BooleanSchemaSchema$1,
    StringSchemaSchema$1,
    NumberSchemaSchema$1
  ]);
  const ElicitRequestFormParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("form").optional(),
    message: string2(),
    requestedSchema: object({
      type: literal("object"),
      properties: record(string2(), PrimitiveSchemaDefinitionSchema$1),
      required: array(string2()).optional()
    }).catchall(unknown())
  });
  const ResourceTemplateReferenceSchema$1 = object({
    type: literal("ref/resource"),
    uri: string2()
  });
  const PromptReferenceSchema$1 = object({
    type: literal("ref/prompt"),
    name: string2()
  });
  const RootSchema$1 = object({
    uri: string2().startsWith("file://"),
    name: string2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const sharedClientCapabilityShape = ClientCapabilitiesSchema$1.shape;
  const ClientCapabilities2026Schema = object({
    experimental: sharedClientCapabilityShape.experimental,
    sampling: sharedClientCapabilityShape.sampling,
    elicitation: sharedClientCapabilityShape.elicitation,
    roots: sharedClientCapabilityShape.roots,
    extensions: sharedClientCapabilityShape.extensions
  });
  const sharedServerCapabilityShape = ServerCapabilitiesSchema$1.shape;
  const ServerCapabilities2026Schema = object({
    experimental: sharedServerCapabilityShape.experimental,
    logging: sharedServerCapabilityShape.logging,
    completions: sharedServerCapabilityShape.completions,
    prompts: sharedServerCapabilityShape.prompts,
    resources: sharedServerCapabilityShape.resources,
    tools: sharedServerCapabilityShape.tools,
    extensions: sharedServerCapabilityShape.extensions
  });
  const RequestMetaEnvelopeSchema = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    [PROTOCOL_VERSION_META_KEY]: string2(),
    [CLIENT_INFO_META_KEY]: ImplementationSchema$1.optional(),
    [CLIENT_CAPABILITIES_META_KEY]: ClientCapabilities2026Schema,
    [LOG_LEVEL_META_KEY]: LoggingLevelSchema$1.optional()
  });
  const ToolSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: string2().optional(),
    inputSchema: looseObject({
      $schema: string2().optional(),
      type: literal("object")
    }),
    outputSchema: looseObject({ $schema: string2().optional() }).optional(),
    annotations: ToolAnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolResultContentSchema$1 = object({
    type: literal("tool_result"),
    toolUseId: string2(),
    content: array(ContentBlockSchema$1),
    structuredContent: unknown().optional(),
    isError: boolean2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const SamplingMessageContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ToolUseContentSchema$1,
    ToolResultContentSchema$1
  ]);
  const SamplingMessageSchema$1 = object({
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)]),
    _meta: record(string2(), unknown()).optional()
  });
  const ResultTypeSchema = string2();
  const ResultMetaSchema = looseObject({ [SERVER_INFO_META_KEY]: ImplementationSchema$1.optional().catch(void 0) });
  const wireMeta = ResultMetaSchema.optional();
  function wireResult(shape) {
    return looseObject({
      _meta: wireMeta,
      resultType: ResultTypeSchema.default("complete"),
      ...shape
    });
  }
  const ResultSchema$1 = wireResult({});
  const PaginatedResultSchema$1 = wireResult({ nextCursor: CursorSchema$1.optional() });
  const CallToolResultSchema$1 = wireResult({
    content: array(ContentBlockSchema$1),
    structuredContent: unknown().optional(),
    isError: boolean2().optional()
  });
  const ListToolsResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    tools: array(ToolSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ListPromptsResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    prompts: array(PromptSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const GetPromptResultSchema$1 = wireResult({
    description: string2().optional(),
    messages: array(PromptMessageSchema$1)
  });
  const ListResourcesResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    resources: array(ResourceSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ListResourceTemplatesResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    resourceTemplates: array(ResourceTemplateSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ReadResourceResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]))
  });
  const CompleteResultSchema$1 = wireResult({ completion: object({
    values: array(string2()).max(100),
    total: number2().int().optional(),
    hasMore: boolean2().optional()
  }).loose() });
  const CacheableResultSchema = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"])
  });
  const DiscoverResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0).catch(0),
    cacheScope: _enum(["public", "private"]).catch("private"),
    supportedVersions: array(string2()),
    capabilities: ServerCapabilities2026Schema,
    instructions: string2().optional()
  });
  const CreateMessageRequestParamsSchema$1 = object({
    messages: array(SamplingMessageSchema$1),
    modelPreferences: ModelPreferencesSchema$1.optional(),
    systemPrompt: string2().optional(),
    includeContext: _enum([
      "none",
      "thisServer",
      "allServers"
    ]).optional(),
    temperature: number2().optional(),
    maxTokens: number2().int(),
    stopSequences: array(string2()).optional(),
    metadata: JSONObjectSchema$1.optional(),
    tools: array(ToolSchema$1).optional(),
    toolChoice: ToolChoiceSchema$1.optional()
  });
  const CreateMessageRequestSchema$1 = object({
    method: literal("sampling/createMessage"),
    params: CreateMessageRequestParamsSchema$1
  });
  const ListRootsRequestSchema$1 = object({
    method: literal("roots/list"),
    params: object({ _meta: record(string2(), unknown()).optional() }).optional()
  });
  const CreateMessageResultSchema$1 = object({
    ...SamplingMessageSchema$1.shape,
    model: string2(),
    stopReason: string2().optional()
  });
  const ListRootsResultSchema$1 = object({ roots: array(RootSchema$1) });
  const ElicitResultSchema$1 = object({
    action: _enum([
      "accept",
      "decline",
      "cancel"
    ]),
    content: record(string2(), union([
      string2(),
      number2(),
      boolean2(),
      array(string2())
    ])).optional()
  });
  const ElicitRequestURLParamsSchema$1 = object({
    mode: literal("url"),
    message: string2(),
    url: string2().url()
  });
  const ElicitRequestParamsSchema$1 = union([ElicitRequestFormParamsSchema$1, ElicitRequestURLParamsSchema$1]);
  const ElicitRequestSchema$1 = object({
    method: literal("elicitation/create"),
    params: ElicitRequestParamsSchema$1
  });
  const InputRequestSchema = union([
    CreateMessageRequestSchema$1,
    ListRootsRequestSchema$1,
    ElicitRequestSchema$1
  ]);
  const InputResponseSchema = union([
    CreateMessageResultSchema$1,
    ListRootsResultSchema$1,
    ElicitResultSchema$1
  ]);
  const InputRequestsSchema = record(string2(), InputRequestSchema);
  const InputResponsesSchema = record(string2(), InputResponseSchema);
  const InputRequiredResultSchema = wireResult({
    inputRequests: InputRequestsSchema.optional(),
    requestState: string2().optional()
  });
  const retryParamsShape = {
    inputResponses: InputResponsesSchema.optional(),
    requestState: string2().optional()
  };
  const InputResponseRequestParamsSchema = object({
    _meta: RequestMetaEnvelopeSchema,
    ...retryParamsShape
  });
  const DispatchRequestMetaSchema = looseObject({ progressToken: ProgressTokenSchema$1.optional() });
  function wireRequest(method, paramsShape) {
    return object({
      method: literal(method),
      params: object({
        _meta: RequestMetaEnvelopeSchema,
        ...paramsShape
      })
    });
  }
  function dispatchRequest(method, paramsShape) {
    return object({
      method: literal(method),
      params: object({
        _meta: DispatchRequestMetaSchema.optional(),
        ...paramsShape
      }).optional()
    });
  }
  const callToolParamsShape = {
    name: string2(),
    arguments: record(string2(), unknown()).optional(),
    ...retryParamsShape
  };
  const paginatedParamsShape = { cursor: CursorSchema$1.optional() };
  const CallToolRequestSchema$1 = wireRequest("tools/call", callToolParamsShape);
  const ListToolsRequestSchema$1 = wireRequest("tools/list", paginatedParamsShape);
  const ListPromptsRequestSchema$1 = wireRequest("prompts/list", paginatedParamsShape);
  const GetPromptRequestSchema$1 = wireRequest("prompts/get", {
    name: string2(),
    arguments: record(string2(), string2()).optional(),
    ...retryParamsShape
  });
  const ListResourcesRequestSchema$1 = wireRequest("resources/list", paginatedParamsShape);
  const ListResourceTemplatesRequestSchema$1 = wireRequest("resources/templates/list", paginatedParamsShape);
  const ReadResourceRequestSchema$1 = wireRequest("resources/read", {
    uri: string2(),
    ...retryParamsShape
  });
  const completeParamsShape = {
    ref: union([PromptReferenceSchema$1, ResourceTemplateReferenceSchema$1]),
    argument: object({
      name: string2(),
      value: string2()
    }),
    context: object({ arguments: record(string2(), string2()).optional() }).optional()
  };
  const CompleteRequestSchema$1 = wireRequest("completion/complete", completeParamsShape);
  const DiscoverRequestSchema$1 = wireRequest("server/discover", {});
  const SubscriptionFilterSchema$1 = object({
    toolsListChanged: boolean2().optional(),
    promptsListChanged: boolean2().optional(),
    resourcesListChanged: boolean2().optional(),
    resourceSubscriptions: array(string2()).optional()
  });
  const subscriptionsListenParamsShape = { notifications: SubscriptionFilterSchema$1 };
  const SubscriptionsListenRequestSchema$1 = wireRequest("subscriptions/listen", subscriptionsListenParamsShape);
  const SubscriptionsListenResultMetaSchema$1 = ResultMetaSchema.extend({ "io.modelcontextprotocol/subscriptionId": RequestIdSchema$1 });
  const SubscriptionsListenResultSchema$1 = looseObject({
    _meta: SubscriptionsListenResultMetaSchema$1,
    resultType: ResultTypeSchema.default("complete")
  });
  const dispatchRequestSchemas = {
    "tools/call": dispatchRequest("tools/call", callToolParamsShape),
    "tools/list": dispatchRequest("tools/list", paginatedParamsShape),
    "prompts/get": dispatchRequest("prompts/get", {
      name: string2(),
      arguments: record(string2(), string2()).optional()
    }),
    "prompts/list": dispatchRequest("prompts/list", paginatedParamsShape),
    "resources/list": dispatchRequest("resources/list", paginatedParamsShape),
    "resources/templates/list": dispatchRequest("resources/templates/list", paginatedParamsShape),
    "resources/read": dispatchRequest("resources/read", { uri: string2() }),
    "completion/complete": dispatchRequest("completion/complete", completeParamsShape),
    "server/discover": dispatchRequest("server/discover", {}),
    "subscriptions/listen": dispatchRequest("subscriptions/listen", subscriptionsListenParamsShape)
  };
  function liftedResult(shape) {
    return looseObject({
      _meta: wireMeta,
      ...shape
    });
  }
  const dispatchResultSchemas = {
    "tools/call": liftedResult({
      content: array(ContentBlockSchema$1),
      structuredContent: unknown().optional(),
      isError: boolean2().optional()
    }),
    "tools/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      tools: array(ToolSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "prompts/get": liftedResult({
      description: string2().optional(),
      messages: array(PromptMessageSchema$1)
    }),
    "prompts/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      prompts: array(PromptSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      resources: array(ResourceSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/templates/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      resourceTemplates: array(ResourceTemplateSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/read": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]))
    }),
    "completion/complete": liftedResult({ completion: object({
      values: array(string2()).max(100),
      total: number2().int().optional(),
      hasMore: boolean2().optional()
    }).loose() }),
    "server/discover": liftedResult({
      ttlMs: number2().int().min(0).catch(0),
      cacheScope: _enum(["public", "private"]).catch("private"),
      supportedVersions: array(string2()),
      capabilities: ServerCapabilities2026Schema,
      instructions: string2().optional()
    }),
    "subscriptions/listen": liftedResult({})
  };
  const NotificationMetaSchema = looseObject({ "io.modelcontextprotocol/subscriptionId": RequestIdSchema$1.optional() });
  const SubscriptionsAcknowledgedNotificationSchema$1 = object({
    method: literal("notifications/subscriptions/acknowledged"),
    params: object({
      _meta: NotificationMetaSchema.optional(),
      notifications: SubscriptionFilterSchema$1
    })
  });
  const CancelledNotificationParamsSchema$1 = object({
    _meta: NotificationMetaSchema.optional(),
    requestId: RequestIdSchema$1,
    reason: string2().optional()
  });
  const CancelledNotificationSchema$1 = object({
    method: literal("notifications/cancelled"),
    params: CancelledNotificationParamsSchema$1
  });
  const notificationSchemas2026 = {
    "notifications/cancelled": CancelledNotificationSchema$1,
    "notifications/progress": ProgressNotificationSchema$1,
    "notifications/message": LoggingMessageNotificationSchema$1,
    "notifications/resources/updated": ResourceUpdatedNotificationSchema$1,
    "notifications/resources/list_changed": ResourceListChangedNotificationSchema$1,
    "notifications/tools/list_changed": ToolListChangedNotificationSchema$1,
    "notifications/prompts/list_changed": PromptListChangedNotificationSchema$1,
    "notifications/subscriptions/acknowledged": SubscriptionsAcknowledgedNotificationSchema$1
  };
  const wireResultResponse = (result) => object({
    jsonrpc: literal("2.0"),
    id: union([string2(), number2().int()]),
    result
  }).strict();
  return {
    JSONValueSchema: JSONValueSchema$1,
    JSONObjectSchema: JSONObjectSchema$1,
    ProgressTokenSchema: ProgressTokenSchema$1,
    CursorSchema: CursorSchema$1,
    RequestIdSchema: RequestIdSchema$1,
    RoleSchema: RoleSchema$1,
    LoggingLevelSchema: LoggingLevelSchema$1,
    TaskMetadataSchema: TaskMetadataSchema$1,
    RelatedTaskMetadataSchema: RelatedTaskMetadataSchema$1,
    RequestMetaSchema: RequestMetaSchema$1,
    BaseRequestParamsSchema: BaseRequestParamsSchema$1,
    TaskAugmentedRequestParamsSchema: TaskAugmentedRequestParamsSchema$1,
    NotificationsParamsSchema: NotificationsParamsSchema$1,
    NotificationSchema: NotificationSchema$1,
    IconSchema: IconSchema$1,
    IconsSchema: IconsSchema$1,
    BaseMetadataSchema: BaseMetadataSchema$1,
    ImplementationSchema: ImplementationSchema$1,
    ClientTasksCapabilitySchema: ClientTasksCapabilitySchema$1,
    ServerTasksCapabilitySchema: ServerTasksCapabilitySchema$1,
    ClientCapabilitiesSchema: ClientCapabilitiesSchema$1,
    ServerCapabilitiesSchema: ServerCapabilitiesSchema$1,
    ProgressSchema: ProgressSchema$1,
    ProgressNotificationParamsSchema: ProgressNotificationParamsSchema$1,
    ProgressNotificationSchema: ProgressNotificationSchema$1,
    LoggingMessageNotificationParamsSchema: LoggingMessageNotificationParamsSchema$1,
    LoggingMessageNotificationSchema: LoggingMessageNotificationSchema$1,
    ResourceContentsSchema: ResourceContentsSchema$1,
    TextResourceContentsSchema: TextResourceContentsSchema$1,
    BlobResourceContentsSchema: BlobResourceContentsSchema$1,
    AnnotationsSchema: AnnotationsSchema$1,
    ResourceSchema: ResourceSchema$1,
    ResourceTemplateSchema: ResourceTemplateSchema$1,
    ResourceListChangedNotificationSchema: ResourceListChangedNotificationSchema$1,
    ResourceUpdatedNotificationParamsSchema: ResourceUpdatedNotificationParamsSchema$1,
    ResourceUpdatedNotificationSchema: ResourceUpdatedNotificationSchema$1,
    PromptArgumentSchema: PromptArgumentSchema$1,
    PromptSchema: PromptSchema$1,
    PromptListChangedNotificationSchema: PromptListChangedNotificationSchema$1,
    TextContentSchema: TextContentSchema$1,
    ImageContentSchema: ImageContentSchema$1,
    AudioContentSchema: AudioContentSchema$1,
    ToolUseContentSchema: ToolUseContentSchema$1,
    EmbeddedResourceSchema: EmbeddedResourceSchema$1,
    ResourceLinkSchema: ResourceLinkSchema$1,
    ContentBlockSchema: ContentBlockSchema$1,
    PromptMessageSchema: PromptMessageSchema$1,
    ToolAnnotationsSchema: ToolAnnotationsSchema$1,
    ToolListChangedNotificationSchema: ToolListChangedNotificationSchema$1,
    ModelHintSchema: ModelHintSchema$1,
    ModelPreferencesSchema: ModelPreferencesSchema$1,
    ToolChoiceSchema: ToolChoiceSchema$1,
    BooleanSchemaSchema: BooleanSchemaSchema$1,
    StringSchemaSchema: StringSchemaSchema$1,
    NumberSchemaSchema: NumberSchemaSchema$1,
    UntitledSingleSelectEnumSchemaSchema: UntitledSingleSelectEnumSchemaSchema$1,
    TitledSingleSelectEnumSchemaSchema: TitledSingleSelectEnumSchemaSchema$1,
    LegacyTitledEnumSchemaSchema: LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema: SingleSelectEnumSchemaSchema$1,
    UntitledMultiSelectEnumSchemaSchema: UntitledMultiSelectEnumSchemaSchema$1,
    TitledMultiSelectEnumSchemaSchema: TitledMultiSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema: MultiSelectEnumSchemaSchema$1,
    EnumSchemaSchema: EnumSchemaSchema$1,
    PrimitiveSchemaDefinitionSchema: PrimitiveSchemaDefinitionSchema$1,
    ElicitRequestFormParamsSchema: ElicitRequestFormParamsSchema$1,
    ResourceTemplateReferenceSchema: ResourceTemplateReferenceSchema$1,
    PromptReferenceSchema: PromptReferenceSchema$1,
    RootSchema: RootSchema$1,
    ClientCapabilities2026Schema,
    ServerCapabilities2026Schema,
    RequestMetaEnvelopeSchema,
    ToolSchema: ToolSchema$1,
    ToolResultContentSchema: ToolResultContentSchema$1,
    SamplingMessageContentBlockSchema: SamplingMessageContentBlockSchema$1,
    SamplingMessageSchema: SamplingMessageSchema$1,
    ResultTypeSchema,
    ResultMetaSchema,
    ResultSchema: ResultSchema$1,
    PaginatedResultSchema: PaginatedResultSchema$1,
    CallToolResultSchema: CallToolResultSchema$1,
    ListToolsResultSchema: ListToolsResultSchema$1,
    ListPromptsResultSchema: ListPromptsResultSchema$1,
    GetPromptResultSchema: GetPromptResultSchema$1,
    ListResourcesResultSchema: ListResourcesResultSchema$1,
    ListResourceTemplatesResultSchema: ListResourceTemplatesResultSchema$1,
    ReadResourceResultSchema: ReadResourceResultSchema$1,
    CompleteResultSchema: CompleteResultSchema$1,
    CacheableResultSchema,
    DiscoverResultSchema: DiscoverResultSchema$1,
    CreateMessageRequestParamsSchema: CreateMessageRequestParamsSchema$1,
    CreateMessageRequestSchema: CreateMessageRequestSchema$1,
    ListRootsRequestSchema: ListRootsRequestSchema$1,
    CreateMessageResultSchema: CreateMessageResultSchema$1,
    ListRootsResultSchema: ListRootsResultSchema$1,
    ElicitResultSchema: ElicitResultSchema$1,
    ElicitRequestURLParamsSchema: ElicitRequestURLParamsSchema$1,
    ElicitRequestParamsSchema: ElicitRequestParamsSchema$1,
    ElicitRequestSchema: ElicitRequestSchema$1,
    InputRequestSchema,
    InputResponseSchema,
    InputRequestsSchema,
    InputResponsesSchema,
    InputRequiredResultSchema,
    InputResponseRequestParamsSchema,
    CallToolRequestSchema: CallToolRequestSchema$1,
    ListToolsRequestSchema: ListToolsRequestSchema$1,
    ListPromptsRequestSchema: ListPromptsRequestSchema$1,
    GetPromptRequestSchema: GetPromptRequestSchema$1,
    ListResourcesRequestSchema: ListResourcesRequestSchema$1,
    ListResourceTemplatesRequestSchema: ListResourceTemplatesRequestSchema$1,
    ReadResourceRequestSchema: ReadResourceRequestSchema$1,
    CompleteRequestSchema: CompleteRequestSchema$1,
    DiscoverRequestSchema: DiscoverRequestSchema$1,
    SubscriptionFilterSchema: SubscriptionFilterSchema$1,
    SubscriptionsListenRequestSchema: SubscriptionsListenRequestSchema$1,
    SubscriptionsListenResultMetaSchema: SubscriptionsListenResultMetaSchema$1,
    SubscriptionsListenResultSchema: SubscriptionsListenResultSchema$1,
    dispatchRequestSchemas,
    dispatchResultSchemas,
    NotificationMetaSchema,
    SubscriptionsAcknowledgedNotificationSchema: SubscriptionsAcknowledgedNotificationSchema$1,
    CancelledNotificationParamsSchema: CancelledNotificationParamsSchema$1,
    CancelledNotificationSchema: CancelledNotificationSchema$1,
    notificationSchemas2026,
    JSONRPCResultResponseSchema: wireResultResponse(ResultSchema$1),
    CallToolResultResponseSchema: wireResultResponse(union([CallToolResultSchema$1, InputRequiredResultSchema])),
    ListToolsResultResponseSchema: wireResultResponse(ListToolsResultSchema$1),
    ListPromptsResultResponseSchema: wireResultResponse(ListPromptsResultSchema$1),
    GetPromptResultResponseSchema: wireResultResponse(union([GetPromptResultSchema$1, InputRequiredResultSchema])),
    ListResourcesResultResponseSchema: wireResultResponse(ListResourcesResultSchema$1),
    ListResourceTemplatesResultResponseSchema: wireResultResponse(ListResourceTemplatesResultSchema$1),
    ReadResourceResultResponseSchema: wireResultResponse(union([ReadResourceResultSchema$1, InputRequiredResultSchema])),
    CompleteResultResponseSchema: wireResultResponse(CompleteResultSchema$1),
    DiscoverResultResponseSchema: wireResultResponse(DiscoverResultSchema$1),
    SubscriptionsListenResultResponseSchema: wireResultResponse(SubscriptionsListenResultSchema$1)
  };
}
var memo2;
function buildSchemas2026() {
  return memo2 ??= build();
}
var CACHEABLE_RESULT_METHODS = [
  "tools/list",
  "prompts/list",
  "resources/list",
  "resources/templates/list",
  "resources/read",
  "server/discover"
];
function isCacheableResultMethod(method) {
  return CACHEABLE_RESULT_METHODS.includes(method);
}
var RESULT_CACHE_HINT_FALLBACK = /* @__PURE__ */ Symbol("modelcontextprotocol.resultCacheHintFallback");
function cacheHintFallbackOf(result) {
  return result[RESULT_CACHE_HINT_FALLBACK];
}
function isValidCacheTtlMs(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isValidCacheScope(value) {
  return value === "public" || value === "private";
}
var ProtocolErrorCode = /* @__PURE__ */ (function(ProtocolErrorCode$1) {
  ProtocolErrorCode$1[ProtocolErrorCode$1["ParseError"] = -32700] = "ParseError";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InvalidRequest"] = -32600] = "InvalidRequest";
  ProtocolErrorCode$1[ProtocolErrorCode$1["MethodNotFound"] = -32601] = "MethodNotFound";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InvalidParams"] = -32602] = "InvalidParams";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InternalError"] = -32603] = "InternalError";
  ProtocolErrorCode$1[ProtocolErrorCode$1["ResourceNotFound"] = -32002] = "ResourceNotFound";
  ProtocolErrorCode$1[ProtocolErrorCode$1["MissingRequiredClientCapability"] = -32021] = "MissingRequiredClientCapability";
  ProtocolErrorCode$1[ProtocolErrorCode$1["UnsupportedProtocolVersion"] = -32022] = "UnsupportedProtocolVersion";
  ProtocolErrorCode$1[ProtocolErrorCode$1["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
  return ProtocolErrorCode$1;
})({});
var ProtocolError = class ProtocolError2 extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.ProtocolError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "ProtocolError";
    stampErrorBrands(this, new.target);
  }
  /**
  * Factory method to create the appropriate error type based on the error code and data
  */
  static fromError(code, message, data) {
    if (code === ProtocolErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) return new UrlElicitationRequiredError(errorData.elicitations, message);
    }
    if (code === ProtocolErrorCode.UnsupportedProtocolVersion && data) {
      const errorData = data;
      if (Array.isArray(errorData.supported) && typeof errorData.requested === "string") return new UnsupportedProtocolVersionError({
        supported: errorData.supported,
        requested: errorData.requested
      }, message);
    }
    if (code === ProtocolErrorCode.InvalidParams || code === ProtocolErrorCode.ResourceNotFound) {
      const errorData = data;
      if (typeof errorData?.uri === "string" && (code === ProtocolErrorCode.ResourceNotFound || Object.keys(errorData).length === 1)) return new ResourceNotFoundError(errorData.uri, message);
    }
    if (code === ProtocolErrorCode.MissingRequiredClientCapability && data) {
      const errorData = data;
      if (errorData.requiredCapabilities !== null && typeof errorData.requiredCapabilities === "object" && !Array.isArray(errorData.requiredCapabilities)) return new MissingRequiredClientCapabilityError({ requiredCapabilities: errorData.requiredCapabilities }, message);
    }
    return new ProtocolError2(code, message, data);
  }
};
var ResourceNotFoundError = class extends ProtocolError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.ResourceNotFoundError" });
  }
  constructor(uri2, message = `Resource not found: ${uri2}`) {
    super(ProtocolErrorCode.InvalidParams, message, { uri: uri2 });
  }
  /** The URI that was requested and not found. */
  get uri() {
    return this.data.uri;
  }
};
var UrlElicitationRequiredError = class extends ProtocolError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.UrlElicitationRequiredError" });
  }
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ProtocolErrorCode.UrlElicitationRequired, message, { elicitations });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
};
var UnsupportedProtocolVersionError = class extends ProtocolError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.UnsupportedProtocolVersionError" });
  }
  constructor(data, message = `Unsupported protocol version: ${data.requested}`) {
    super(ProtocolErrorCode.UnsupportedProtocolVersion, message, data);
  }
  /**
  * Protocol versions the receiver supports.
  */
  get supported() {
    return this.data.supported;
  }
  /**
  * The protocol version that was requested.
  */
  get requested() {
    return this.data.requested;
  }
};
var MissingRequiredClientCapabilityError = class extends ProtocolError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.MissingRequiredClientCapabilityError" });
  }
  constructor(data, message = `Missing required client capabilities: ${Object.keys(data.requiredCapabilities).join(", ")}`) {
    super(ProtocolErrorCode.MissingRequiredClientCapability, message, data);
  }
  /**
  * The capabilities the server requires from the client to process the
  * request (only the missing capabilities are listed).
  */
  get requiredCapabilities() {
    return this.data.requiredCapabilities;
  }
};
var DEFAULT_CACHE_TTL_MS = 0;
var DEFAULT_CACHE_SCOPE = "private";
var EXTENDED_RESULT_TYPE_METHODS = [
  "tools/call",
  "prompts/get",
  "resources/read"
];
function stampResultType(method, result) {
  const provided = result["resultType"];
  if (provided === void 0) return {
    ...result,
    resultType: "complete"
  };
  if (provided === "complete") return result;
  if (EXTENDED_RESULT_TYPE_METHODS.includes(method)) return result;
  throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned resultType '${String(provided)}', but results of ${method} only support 'complete' on protocol revision 2026-07-28`);
}
function fillCacheFields(method, result) {
  const fallback = cacheHintFallbackOf(result);
  if (result["resultType"] !== "complete" || !isCacheableResultMethod(method)) return fallback === void 0 ? result : stripCacheHintFallback(result);
  const provided = result;
  const ttlMs = isValidCacheTtlMs(provided["ttlMs"]) ? provided["ttlMs"] : resolveTtlMs(fallback);
  const cacheScope = isValidCacheScope(provided["cacheScope"]) ? provided["cacheScope"] : resolveCacheScope(fallback);
  const filled = {
    ...provided,
    ttlMs,
    cacheScope
  };
  delete filled[RESULT_CACHE_HINT_FALLBACK];
  return filled;
}
function isPlainObject$4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function stampServerInfoMeta(result, serverInfo) {
  if (serverInfo === void 0) return result;
  const meta2 = result["_meta"];
  if (meta2 === void 0) return {
    ...result,
    _meta: { [SERVER_INFO_META_KEY]: serverInfo }
  };
  if (!isPlainObject$4(meta2)) return result;
  if (meta2[SERVER_INFO_META_KEY] !== void 0) return result;
  return {
    ...result,
    _meta: {
      ...meta2,
      [SERVER_INFO_META_KEY]: serverInfo
    }
  };
}
function resolveTtlMs(fallback) {
  return fallback !== void 0 && isValidCacheTtlMs(fallback.ttlMs) ? fallback.ttlMs : DEFAULT_CACHE_TTL_MS;
}
function resolveCacheScope(fallback) {
  return fallback !== void 0 && isValidCacheScope(fallback.cacheScope) ? fallback.cacheScope : DEFAULT_CACHE_SCOPE;
}
function stripCacheHintFallback(result) {
  const copy = { ...result };
  delete copy[RESULT_CACHE_HINT_FALLBACK];
  return copy;
}
var INPUT_REQUEST_METHODS_2026 = [
  "elicitation/create",
  "sampling/createMessage",
  "roots/list"
];
var maps;
function inputSchemaMaps() {
  if (maps) return maps;
  const s = buildSchemas2026();
  maps = {
    request: {
      "elicitation/create": object({
        method: literal("elicitation/create"),
        params: s.ElicitRequestParamsSchema
      }),
      "sampling/createMessage": object({
        method: literal("sampling/createMessage"),
        params: s.CreateMessageRequestParamsSchema
      }),
      "roots/list": object({
        method: literal("roots/list"),
        params: looseObject({}).optional()
      })
    },
    response: {
      "elicitation/create": s.ElicitResultSchema,
      "sampling/createMessage": s.CreateMessageResultSchema,
      "roots/list": s.ListRootsResultSchema
    }
  };
  return maps;
}
function isInputRequestMethod2026(method) {
  return INPUT_REQUEST_METHODS_2026.includes(method);
}
function getInputRequestSchema2026(method) {
  return isInputRequestMethod2026(method) ? inputSchemaMaps().request[method] : void 0;
}
function getInputResponseSchema2026(method) {
  return isInputRequestMethod2026(method) ? inputSchemaMaps().response[method] : void 0;
}
var requestMethodKeys = {
  "tools/call": null,
  "tools/list": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "completion/complete": null,
  "server/discover": null,
  "subscriptions/listen": null
};
var notificationMethodKeys = {
  "notifications/cancelled": null,
  "notifications/progress": null,
  "notifications/message": null,
  "notifications/resources/updated": null,
  "notifications/resources/list_changed": null,
  "notifications/tools/list_changed": null,
  "notifications/prompts/list_changed": null,
  "notifications/subscriptions/acknowledged": null
};
function hasRequestMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys, method);
}
function hasNotificationMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(notificationMethodKeys, method);
}
function hasResultMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys, method);
}
function getRequestSchema2026(method) {
  return hasRequestMethod2026(method) ? buildSchemas2026().dispatchRequestSchemas[method] : void 0;
}
function getResultSchema2026(method) {
  return hasResultMethod2026(method) ? buildSchemas2026().dispatchResultSchemas[method] : void 0;
}
function getNotificationSchema2026(method) {
  return hasNotificationMethod2026(method) ? buildSchemas2026().notificationSchemas2026[method] : void 0;
}
var rev2026RequestMethods = Object.keys(requestMethodKeys);
var rev2026NotificationMethods = Object.keys(notificationMethodKeys);
function isPlainObject$3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function triState(schema, raw) {
  if (schema === void 0) return {
    ok: false,
    reason: "not-in-era"
  };
  const parsed = schema.safeParse(raw);
  return parsed.success ? {
    ok: true,
    value: parsed.data
  } : {
    ok: false,
    reason: "invalid",
    message: String(parsed.error)
  };
}
var NOT_IN_ERA = {
  ok: false,
  reason: "not-in-era"
};
var REQUIRED_ENVELOPE_KEYS = [PROTOCOL_VERSION_META_KEY, CLIENT_CAPABILITIES_META_KEY];
function enforceDeletedFields(method, result) {
  let next = result;
  let copied = false;
  const copy = () => {
    if (!copied) {
      next = { ...next };
      copied = true;
    }
    return next;
  };
  const tools = result.tools;
  if (method === "tools/list" && Array.isArray(tools) && tools.some((tool) => isPlainObject$3(tool) && "execution" in tool)) copy().tools = tools.map((tool) => {
    if (!isPlainObject$3(tool) || !("execution" in tool)) return tool;
    const rest = { ...tool };
    delete rest["execution"];
    return rest;
  });
  const capabilities = result.capabilities;
  if (isPlainObject$3(capabilities) && "tasks" in capabilities) {
    const rest = { ...capabilities };
    delete rest["tasks"];
    copy().capabilities = rest;
  }
  return next;
}
var rev2026Codec = {
  era: "2026-07-28",
  hasRequestMethod: hasRequestMethod2026,
  hasNotificationMethod: hasNotificationMethod2026,
  hasInputRequestMethod: (method) => getInputRequestSchema2026(method) !== void 0,
  validateRequest: (method, raw) => triState(getRequestSchema2026(method), raw),
  validateResult: (method, raw) => triState(getResultSchema2026(method), raw),
  validateNotification: (method, raw) => triState(getNotificationSchema2026(method), raw),
  validateInputRequest: (method, raw) => triState(getInputRequestSchema2026(method), raw),
  validateInputResponse: (method, raw) => triState(getInputResponseSchema2026(method), raw),
  samplingResultVariant: () => NOT_IN_ERA,
  outboundEnvelope(material) {
    return {
      [PROTOCOL_VERSION_META_KEY]: material.protocolVersion,
      [CLIENT_INFO_META_KEY]: material.clientInfo,
      [CLIENT_CAPABILITIES_META_KEY]: material.clientCapabilities,
      ...material.logLevel !== void 0 && { [LOG_LEVEL_META_KEY]: material.logLevel }
    };
  },
  validateEnvelopeMeta(meta2) {
    const issues = [];
    for (const key of REQUIRED_ENVELOPE_KEYS) if (!(key in meta2)) issues.push({
      key,
      problem: "missing"
    });
    const parsed = buildSchemas2026().RequestMetaEnvelopeSchema.safeParse(meta2);
    if (!parsed.success) for (const issue2 of parsed.error.issues) {
      const path = issue2.path.map(String);
      const key = path.length > 0 ? path.join(".") : "_meta";
      if (path.length === 1 && issues.some((existing) => existing.key === key && existing.problem === "missing")) continue;
      issues.push({
        key,
        problem: issue2.message
      });
    }
    return issues;
  },
  projectCallToolResult: (result) => appendTextFallbackForNonObject(result),
  inputRequestSchema: getInputRequestSchema2026,
  decodeResult(method, raw) {
    if (!isPlainObject$3(raw)) return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: not an object`, { method })
    };
    const rawResultType = raw["resultType"];
    if (rawResultType === void 0) return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: missing required resultType \u2014 servers implementing protocol revision 2026-07-28 MUST include it (the absent-means-complete bridge applies only to earlier-revision servers)`, {
        method,
        violation: "missing-resultType"
      })
    };
    if (typeof rawResultType !== "string") return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: non-string resultType`, {
        method,
        resultType: rawResultType
      })
    };
    if (rawResultType === "input_required") {
      const rawInputRequests = raw["inputRequests"];
      const inputRequests = isPlainObject$3(rawInputRequests) ? rawInputRequests : {};
      const requestState = raw["requestState"];
      const metaParse = raw["_meta"] === void 0 ? void 0 : buildSchemas2026().ResultMetaSchema.safeParse(raw["_meta"]);
      const meta2 = metaParse?.success ? metaParse.data : void 0;
      if (Object.keys(inputRequests).length === 0 && typeof requestState !== "string") return {
        kind: "invalid",
        error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: input_required carries neither inputRequests nor requestState (every input_required result must include at least one of the two)`, {
          method,
          violation: "input-required-missing-both"
        })
      };
      return {
        kind: "input_required",
        inputRequests,
        ...typeof requestState === "string" && { requestState },
        ...meta2 !== void 0 && { _meta: meta2 }
      };
    }
    if (rawResultType !== "complete") return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.UnsupportedResultType, `Unsupported result type '${rawResultType}' for ${method}`, {
        resultType: rawResultType,
        method
      })
    };
    const wireResultSchemas = getWireResultSchemas();
    const wireSchema = Object.hasOwn(wireResultSchemas, method) ? wireResultSchemas[method] : void 0;
    if (wireSchema !== void 0) {
      const parsed = wireSchema.safeParse(raw);
      if (!parsed.success) return {
        kind: "invalid",
        error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: ${parsed.error}`, { method })
      };
    }
    const lifted = { ...raw };
    delete lifted["resultType"];
    return {
      kind: "complete",
      result: lifted
    };
  },
  encodeResult(method, result, serverInfo) {
    return stampServerInfoMeta(fillCacheFields(method, stampResultType(method, enforceDeletedFields(method, result))), serverInfo);
  },
  encodeErrorCode: (code) => code === -32002 ? -32602 : code,
  checkInboundEnvelope(material) {
    if (material.envelope === void 0) return "Request is missing the required _meta envelope for protocol revision 2026-07-28 (io.modelcontextprotocol/protocolVersion, io.modelcontextprotocol/clientCapabilities)";
    const parsed = buildSchemas2026().RequestMetaEnvelopeSchema.safeParse(material.envelope);
    if (!parsed.success) return `Invalid _meta envelope for protocol revision 2026-07-28: ${parsed.error.issues.map((issue2) => issue2.message).join("; ")}`;
  }
};
var wireResultSchemasMemo;
function getWireResultSchemas() {
  if (wireResultSchemasMemo) return wireResultSchemasMemo;
  const s = buildSchemas2026();
  wireResultSchemasMemo = {
    "tools/call": s.CallToolResultSchema,
    "tools/list": s.ListToolsResultSchema,
    "prompts/get": s.GetPromptResultSchema,
    "prompts/list": s.ListPromptsResultSchema,
    "resources/list": s.ListResourcesResultSchema,
    "resources/templates/list": s.ListResourceTemplatesResultSchema,
    "resources/read": s.ReadResourceResultSchema,
    "completion/complete": s.CompleteResultSchema,
    "server/discover": s.DiscoverResultSchema
  };
  return wireResultSchemasMemo;
}
var MODERN_WIRE_REVISION = "2026-07-28";
function codecForVersion(version2) {
  return version2 !== void 0 && isModernProtocolVersion(version2) ? rev2026Codec : rev2025Codec;
}
function classifiedWireEra(classification) {
  if (classification.revision !== void 0) return codecForVersion(classification.revision).era;
  return classification.era === "modern" ? rev2026Codec.era : rev2025Codec.era;
}
function isSpecRequestMethod(method) {
  return ALL_CODECS.some((codec) => codec.hasRequestMethod(method));
}
function isSpecNotificationMethod(method) {
  return ALL_CODECS.some((codec) => codec.hasNotificationMethod(method));
}
function isExtensionReusedRequestMethod(method) {
  return method === "tasks/get" || method === "tasks/cancel";
}
var ALL_CODECS = [rev2025Codec, rev2026Codec];
var schemas_exports2 = /* @__PURE__ */ __exportAll({
  AnnotationsSchema: () => AnnotationsSchema,
  AudioContentSchema: () => AudioContentSchema,
  BaseMetadataSchema: () => BaseMetadataSchema,
  BaseRequestParamsSchema: () => BaseRequestParamsSchema,
  BlobResourceContentsSchema: () => BlobResourceContentsSchema,
  BooleanSchemaSchema: () => BooleanSchemaSchema,
  CallToolRequestParamsSchema: () => CallToolRequestParamsSchema,
  CallToolRequestSchema: () => CallToolRequestSchema,
  CallToolResultSchema: () => CallToolResultSchema,
  CancelTaskRequestSchema: () => CancelTaskRequestSchema,
  CancelTaskResultSchema: () => CancelTaskResultSchema,
  CancelledNotificationParamsSchema: () => CancelledNotificationParamsSchema,
  CancelledNotificationSchema: () => CancelledNotificationSchema,
  ClientCapabilitiesSchema: () => ClientCapabilitiesSchema,
  ClientNotificationSchema: () => ClientNotificationSchema,
  ClientRequestSchema: () => ClientRequestSchema,
  ClientResultSchema: () => ClientResultSchema,
  ClientTasksCapabilitySchema: () => ClientTasksCapabilitySchema,
  CompatibilityCallToolResultSchema: () => CompatibilityCallToolResultSchema,
  CompleteRequestParamsSchema: () => CompleteRequestParamsSchema,
  CompleteRequestSchema: () => CompleteRequestSchema,
  CompleteResultSchema: () => CompleteResultSchema,
  ContentBlockSchema: () => ContentBlockSchema,
  CreateMessageRequestParamsSchema: () => CreateMessageRequestParamsSchema,
  CreateMessageRequestSchema: () => CreateMessageRequestSchema,
  CreateMessageResultSchema: () => CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema: () => CreateMessageResultWithToolsSchema,
  CreateTaskResultSchema: () => CreateTaskResultSchema,
  CursorSchema: () => CursorSchema,
  DiscoverRequestSchema: () => DiscoverRequestSchema,
  DiscoverResultSchema: () => DiscoverResultSchema,
  ElicitRequestFormParamsSchema: () => ElicitRequestFormParamsSchema,
  ElicitRequestParamsSchema: () => ElicitRequestParamsSchema,
  ElicitRequestSchema: () => ElicitRequestSchema,
  ElicitRequestURLParamsSchema: () => ElicitRequestURLParamsSchema,
  ElicitResultSchema: () => ElicitResultSchema,
  ElicitationCompleteNotificationParamsSchema: () => ElicitationCompleteNotificationParamsSchema,
  ElicitationCompleteNotificationSchema: () => ElicitationCompleteNotificationSchema,
  EmbeddedResourceSchema: () => EmbeddedResourceSchema,
  EmptyResultSchema: () => EmptyResultSchema,
  EnumSchemaSchema: () => EnumSchemaSchema,
  GetPromptRequestParamsSchema: () => GetPromptRequestParamsSchema,
  GetPromptRequestSchema: () => GetPromptRequestSchema,
  GetPromptResultSchema: () => GetPromptResultSchema,
  GetTaskPayloadRequestSchema: () => GetTaskPayloadRequestSchema,
  GetTaskPayloadResultSchema: () => GetTaskPayloadResultSchema,
  GetTaskRequestSchema: () => GetTaskRequestSchema,
  GetTaskResultSchema: () => GetTaskResultSchema,
  IconSchema: () => IconSchema,
  IconsSchema: () => IconsSchema,
  ImageContentSchema: () => ImageContentSchema,
  ImplementationSchema: () => ImplementationSchema,
  InitializeRequestParamsSchema: () => InitializeRequestParamsSchema,
  InitializeRequestSchema: () => InitializeRequestSchema,
  InitializeResultSchema: () => InitializeResultSchema,
  InitializedNotificationSchema: () => InitializedNotificationSchema,
  JSONArraySchema: () => JSONArraySchema,
  JSONObjectSchema: () => JSONObjectSchema,
  JSONRPCErrorResponseSchema: () => JSONRPCErrorResponseSchema,
  JSONRPCMessageSchema: () => JSONRPCMessageSchema,
  JSONRPCNotificationSchema: () => JSONRPCNotificationSchema,
  JSONRPCRequestSchema: () => JSONRPCRequestSchema,
  JSONRPCResponseSchema: () => JSONRPCResponseSchema,
  JSONRPCResultResponseSchema: () => JSONRPCResultResponseSchema,
  JSONValueSchema: () => JSONValueSchema,
  LegacyTitledEnumSchemaSchema: () => LegacyTitledEnumSchemaSchema,
  ListChangedOptionsBaseSchema: () => ListChangedOptionsBaseSchema,
  ListPromptsRequestSchema: () => ListPromptsRequestSchema,
  ListPromptsResultSchema: () => ListPromptsResultSchema,
  ListResourceTemplatesRequestSchema: () => ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema: () => ListResourceTemplatesResultSchema,
  ListResourcesRequestSchema: () => ListResourcesRequestSchema,
  ListResourcesResultSchema: () => ListResourcesResultSchema,
  ListRootsRequestSchema: () => ListRootsRequestSchema,
  ListRootsResultSchema: () => ListRootsResultSchema,
  ListTasksRequestSchema: () => ListTasksRequestSchema,
  ListTasksResultSchema: () => ListTasksResultSchema,
  ListToolsRequestSchema: () => ListToolsRequestSchema,
  ListToolsResultSchema: () => ListToolsResultSchema,
  LoggingLevelSchema: () => LoggingLevelSchema,
  LoggingMessageNotificationParamsSchema: () => LoggingMessageNotificationParamsSchema,
  LoggingMessageNotificationSchema: () => LoggingMessageNotificationSchema,
  ModelHintSchema: () => ModelHintSchema,
  ModelPreferencesSchema: () => ModelPreferencesSchema,
  MultiSelectEnumSchemaSchema: () => MultiSelectEnumSchemaSchema,
  NotificationSchema: () => NotificationSchema,
  NotificationsParamsSchema: () => NotificationsParamsSchema,
  NumberSchemaSchema: () => NumberSchemaSchema,
  PaginatedRequestParamsSchema: () => PaginatedRequestParamsSchema,
  PaginatedRequestSchema: () => PaginatedRequestSchema,
  PaginatedResultSchema: () => PaginatedResultSchema,
  PingRequestSchema: () => PingRequestSchema,
  PrimitiveSchemaDefinitionSchema: () => PrimitiveSchemaDefinitionSchema,
  ProgressNotificationParamsSchema: () => ProgressNotificationParamsSchema,
  ProgressNotificationSchema: () => ProgressNotificationSchema,
  ProgressSchema: () => ProgressSchema,
  ProgressTokenSchema: () => ProgressTokenSchema,
  PromptArgumentSchema: () => PromptArgumentSchema,
  PromptListChangedNotificationSchema: () => PromptListChangedNotificationSchema,
  PromptMessageSchema: () => PromptMessageSchema,
  PromptReferenceSchema: () => PromptReferenceSchema,
  PromptSchema: () => PromptSchema,
  ReadResourceRequestParamsSchema: () => ReadResourceRequestParamsSchema,
  ReadResourceRequestSchema: () => ReadResourceRequestSchema,
  ReadResourceResultSchema: () => ReadResourceResultSchema,
  RelatedTaskMetadataSchema: () => RelatedTaskMetadataSchema,
  RequestIdSchema: () => RequestIdSchema,
  RequestMetaSchema: () => RequestMetaSchema,
  RequestSchema: () => RequestSchema,
  ResourceContentsSchema: () => ResourceContentsSchema,
  ResourceLinkSchema: () => ResourceLinkSchema,
  ResourceListChangedNotificationSchema: () => ResourceListChangedNotificationSchema,
  ResourceRequestParamsSchema: () => ResourceRequestParamsSchema,
  ResourceSchema: () => ResourceSchema,
  ResourceTemplateReferenceSchema: () => ResourceTemplateReferenceSchema,
  ResourceTemplateSchema: () => ResourceTemplateSchema,
  ResourceUpdatedNotificationParamsSchema: () => ResourceUpdatedNotificationParamsSchema,
  ResourceUpdatedNotificationSchema: () => ResourceUpdatedNotificationSchema,
  ResultMetaObjectSchema: () => ResultMetaObjectSchema,
  ResultSchema: () => ResultSchema,
  RoleSchema: () => RoleSchema,
  RootSchema: () => RootSchema,
  RootsListChangedNotificationSchema: () => RootsListChangedNotificationSchema,
  SamplingContentSchema: () => SamplingContentSchema,
  SamplingMessageContentBlockSchema: () => SamplingMessageContentBlockSchema,
  SamplingMessageSchema: () => SamplingMessageSchema,
  ServerCapabilitiesSchema: () => ServerCapabilitiesSchema,
  ServerNotificationSchema: () => ServerNotificationSchema,
  ServerRequestSchema: () => ServerRequestSchema,
  ServerResultSchema: () => ServerResultSchema,
  ServerTasksCapabilitySchema: () => ServerTasksCapabilitySchema,
  SetLevelRequestParamsSchema: () => SetLevelRequestParamsSchema,
  SetLevelRequestSchema: () => SetLevelRequestSchema,
  SingleSelectEnumSchemaSchema: () => SingleSelectEnumSchemaSchema,
  StringSchemaSchema: () => StringSchemaSchema,
  SubscribeRequestParamsSchema: () => SubscribeRequestParamsSchema,
  SubscribeRequestSchema: () => SubscribeRequestSchema,
  SubscriptionFilterSchema: () => SubscriptionFilterSchema,
  SubscriptionsAcknowledgedNotificationParamsSchema: () => SubscriptionsAcknowledgedNotificationParamsSchema,
  SubscriptionsAcknowledgedNotificationSchema: () => SubscriptionsAcknowledgedNotificationSchema,
  SubscriptionsListenRequestParamsSchema: () => SubscriptionsListenRequestParamsSchema,
  SubscriptionsListenRequestSchema: () => SubscriptionsListenRequestSchema,
  SubscriptionsListenResultMetaSchema: () => SubscriptionsListenResultMetaSchema,
  SubscriptionsListenResultSchema: () => SubscriptionsListenResultSchema,
  TaskAugmentedRequestParamsSchema: () => TaskAugmentedRequestParamsSchema,
  TaskCreationParamsSchema: () => TaskCreationParamsSchema,
  TaskMetadataSchema: () => TaskMetadataSchema,
  TaskSchema: () => TaskSchema,
  TaskStatusNotificationParamsSchema: () => TaskStatusNotificationParamsSchema,
  TaskStatusNotificationSchema: () => TaskStatusNotificationSchema,
  TaskStatusSchema: () => TaskStatusSchema,
  TextContentSchema: () => TextContentSchema,
  TextResourceContentsSchema: () => TextResourceContentsSchema,
  TitledMultiSelectEnumSchemaSchema: () => TitledMultiSelectEnumSchemaSchema,
  TitledSingleSelectEnumSchemaSchema: () => TitledSingleSelectEnumSchemaSchema,
  ToolAnnotationsSchema: () => ToolAnnotationsSchema,
  ToolChoiceSchema: () => ToolChoiceSchema,
  ToolExecutionSchema: () => ToolExecutionSchema,
  ToolListChangedNotificationSchema: () => ToolListChangedNotificationSchema,
  ToolResultContentSchema: () => ToolResultContentSchema,
  ToolSchema: () => ToolSchema,
  ToolUseContentSchema: () => ToolUseContentSchema,
  UnsubscribeRequestParamsSchema: () => UnsubscribeRequestParamsSchema,
  UnsubscribeRequestSchema: () => UnsubscribeRequestSchema,
  UntitledMultiSelectEnumSchemaSchema: () => UntitledMultiSelectEnumSchemaSchema,
  UntitledSingleSelectEnumSchemaSchema: () => UntitledSingleSelectEnumSchemaSchema
});
var isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
var isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
var isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var isInputRequiredResult = (value) => typeof value === "object" && value !== null && !Array.isArray(value) && value.resultType === "input_required";
var isInitializeRequest = (value) => InitializeRequestSchema.safeParse(value).success;
var isInitializedNotification = (value) => InitializedNotificationSchema.safeParse(value).success;
var MCP_PARAM_HEADER_PREFIX = "Mcp-Param-";
var X_MCP_HEADER_KEY = "x-mcp-header";
var RFC9110_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PERMITTED_X_MCP_HEADER_TYPES = /* @__PURE__ */ new Set([
  "string",
  "integer",
  "boolean",
  "number"
]);
function scanXMcpHeaderDeclarations(inputSchema) {
  const declarations = [];
  const seenLower = /* @__PURE__ */ new Map();
  const visit = (node2, path, reachable) => {
    if (node2 === null || typeof node2 !== "object") return void 0;
    const schema = node2;
    if (X_MCP_HEADER_KEY in schema) {
      if (!reachable || path.length === 0) return `${pathName(path)}: x-mcp-header is only permitted on properties statically reachable via a chain of 'properties' keys (not under items, additionalProperties, oneOf/anyOf/allOf/not, if/then/else, or $ref)`;
      const raw = schema[X_MCP_HEADER_KEY];
      if (typeof raw !== "string" || raw.length === 0) return `${pathName(path)}: x-mcp-header MUST be a non-empty string`;
      if (!RFC9110_TOKEN.test(raw)) return `${pathName(path)}: x-mcp-header '${raw}' is not a valid RFC 9110 token (no spaces, control characters or HTTP delimiters)`;
      const type = typeof schema.type === "string" ? schema.type : void 0;
      if (type === void 0 || !PERMITTED_X_MCP_HEADER_TYPES.has(type)) return `${pathName(path)}: x-mcp-header is only permitted on primitive-typed properties (string, integer, boolean); got ${type ?? "<none>"}`;
      const lower = raw.toLowerCase();
      const prior = seenLower.get(lower);
      if (prior !== void 0) return `x-mcp-header '${raw}' is not case-insensitively unique (also declared as '${prior}')`;
      seenLower.set(lower, raw);
      declarations.push({
        path,
        headerName: raw,
        type
      });
    }
    const properties = schema.properties;
    if (properties !== null && typeof properties === "object") for (const [key, child] of Object.entries(properties)) {
      const fault$1 = visit(child, [...path, key], reachable);
      if (fault$1 !== void 0) return fault$1;
    }
    for (const k of NON_REACHABLE_SUBSCHEMA_KEYWORDS) {
      const sub = schema[k];
      if (sub === void 0) continue;
      const branches = Array.isArray(sub) ? sub : sub !== null && typeof sub === "object" && OBJECT_VALUED_SUBSCHEMA_KEYWORDS.has(k) ? Object.values(sub) : [sub];
      for (const branch of branches) {
        const fault$1 = visit(branch, [...path, `<${k}>`], false);
        if (fault$1 !== void 0) return fault$1;
      }
    }
  };
  const fault = visit(inputSchema, [], true);
  return fault === void 0 ? {
    valid: true,
    declarations
  } : {
    valid: false,
    reason: fault
  };
}
var NON_REACHABLE_SUBSCHEMA_KEYWORDS = [
  "items",
  "prefixItems",
  "contains",
  "additionalProperties",
  "unevaluatedProperties",
  "unevaluatedItems",
  "propertyNames",
  "patternProperties",
  "dependentSchemas",
  "oneOf",
  "anyOf",
  "allOf",
  "not",
  "if",
  "then",
  "else",
  "$defs",
  "definitions"
];
var OBJECT_VALUED_SUBSCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
  "patternProperties",
  "dependentSchemas",
  "$defs",
  "definitions"
]);
function pathName(path) {
  return path.length === 0 ? "<root>" : path.join(".");
}
var BASE64_SENTINEL_PREFIX = "=?base64?";
var BASE64_SENTINEL_SUFFIX = "?=";
function mcpParamPrimitiveToString(value) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return void 0;
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) return void 0;
    return String(value);
  }
}
function needsBase64(s) {
  if (s.length === 0) return true;
  if (s.startsWith(BASE64_SENTINEL_PREFIX) && s.endsWith(BASE64_SENTINEL_SUFFIX)) return true;
  if (s !== s.trim()) return true;
  for (let i = 0; i < s.length; i++) {
    const c = s.codePointAt(i);
    if (c === 9 || c >= 32 && c <= 126) continue;
    return true;
  }
  return false;
}
function utf8ToBase64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCodePoint(b);
  return btoa(bin);
}
function encodeMcpParamValue(value) {
  return needsBase64(value) ? `${BASE64_SENTINEL_PREFIX}${utf8ToBase64(value)}${BASE64_SENTINEL_SUFFIX}` : value;
}
function valueAtPath(root, path) {
  let node2 = root;
  for (const key of path) {
    if (node2 === null || typeof node2 !== "object") return void 0;
    node2 = node2[key];
  }
  return node2;
}
function buildMcpParamHeaders(declarations, args) {
  const out = {};
  for (const decl of declarations) {
    const raw = valueAtPath(args, decl.path);
    if (raw === void 0 || raw === null) continue;
    const stringValue = mcpParamPrimitiveToString(raw);
    if (stringValue === void 0) continue;
    out[`${MCP_PARAM_HEADER_PREFIX}${decl.headerName}`] = encodeMcpParamValue(stringValue);
  }
  return out;
}
var HEADER_MISMATCH_ERROR_CODE = -32020;
var INBOUND_VALIDATION_LADDER = [
  {
    rung: "http-method",
    order: 1,
    evaluatedAt: "edge",
    codes: [-32e3],
    conformance: [],
    rationale: "The modern era is POST-only; GET/DELETE are body-less 2025-era session operations and are method-routed to legacy serving (405 when legacy serving is not configured), before any body is read."
  },
  {
    rung: "jsonrpc-shape",
    order: 2,
    evaluatedAt: "edge",
    codes: [ProtocolErrorCode.InvalidRequest],
    conformance: ["server-stateless"],
    rationale: "The body must be a JSON-RPC request or notification: posted responses and batch arrays containing a modern or invalid element are rejected before classification (element-wise batch rule); all-legacy arrays stay legacy traffic."
  },
  {
    rung: "era-classification",
    order: 3,
    evaluatedAt: "edge",
    codes: [HEADER_MISMATCH_ERROR_CODE, ProtocolErrorCode.UnsupportedProtocolVersion],
    conformance: [
      "server-stateless",
      "http-header-validation",
      "http-custom-header-server-validation"
    ],
    rationale: "Body-primary era classification with the protocol-version header as a cross-check; a header/body disagreement is rejected with -32020 (HeaderMismatch), and an envelope-less request on a modern-only endpoint is answered with the unsupported-protocol-version error naming the supported revisions."
  },
  {
    rung: "envelope",
    order: 4,
    evaluatedAt: "edge",
    codes: [ProtocolErrorCode.InvalidParams],
    conformance: ["server-stateless"],
    rationale: "A present envelope claim with a malformed envelope \u2014 and a missing envelope on a request whose protocol-version header names a modern revision \u2014 is an invalid-params rejection naming the offending or missing key(s); never a silent fall back to legacy handling. This is the only place an invalid-params rejection maps to HTTP 400."
  },
  {
    rung: "method-registry",
    order: 5,
    evaluatedAt: "dispatch",
    codes: [ProtocolErrorCode.MethodNotFound],
    conformance: ["server-stateless"],
    rationale: "Method existence outranks parameter validity: a method absent from the negotiated revision\u2019s registry (or with no handler installed) answers method-not-found before params or capabilities are looked at."
  },
  {
    rung: "request-params",
    order: 6,
    evaluatedAt: "dispatch",
    codes: [ProtocolErrorCode.InvalidParams],
    conformance: [],
    rationale: "Per-method params validation; emitted in-band by the dispatch layer (HTTP 200), never via the ladder status table."
  },
  {
    rung: "standard-header-validation",
    order: 7,
    evaluatedAt: "pre-dispatch",
    codes: [HEADER_MISMATCH_ERROR_CODE],
    conformance: ["http-header-validation"],
    rationale: "SEP-2243 standard `MCP-Protocol-Version` / `Mcp-Method` / `Mcp-Name` headers \u2014 presence, sentinel decoding, and `Mcp-Name` \u2194 body cross-check \u2014 are validated by the HTTP entry on a modern-classified request after the supported-revision gate and before dispatch. The spec requires `MCP-Protocol-Version` and `Mcp-Method` on every modern *request* POST (`Mcp-Name` only for the methods that mirror `params.name` / `params.uri` / `params.taskId`, see `MCP_NAME_HEADER_SOURCE`) and names them in that order, so a request missing several is answered by the earliest. Notification POSTs are exempt: the presence half runs on requests only, so a modern-enveloped notification is dispatched even with no standard headers at all. The classifier\u2019s own header-mismatch cells (protocol-version, `Mcp-Method` mismatch) stay on the edge `era-classification` rung; this rung carries the entry-layer presence/`Mcp-Name` half \u2014 including the missing `MCP-Protocol-Version` cell, which cannot live on the edge rung without breaking body-primary classification. Evaluated before the capability gate, the factory call, and the `Mcp-Param-*` rung so a request that fails several rungs is answered by the standard-header rung first. The documented order (after method-registry 5 and request-params 6) is NOT the observed precedence: serveModern evaluates this rung immediately after the supported-revision gate, so a request that also fails a dispatch rung is answered here before the dispatch rungs (5\u20136) are consulted."
  },
  {
    rung: "client-capabilities",
    order: 8,
    evaluatedAt: "pre-dispatch",
    codes: [ProtocolErrorCode.MissingRequiredClientCapability],
    conformance: ["server-stateless"],
    rationale: "The capability requirement is checked by the HTTP entry, pre-dispatch, against the validated envelope the classifier produced \u2014 pinning the spec-mandated HTTP 400 independently of how dispatch- and handler-produced errors are mapped. The documented order (after method resolution and params validation) is preserved observably only while the requirement table is empty: once a served method gains a requirement entry, a request that is missing the capability and would also fail a dispatch rung is answered by this gate first, so the entry must consult the method registry before the gate if the documented precedence is to stay observable."
  },
  {
    rung: "param-header-validation",
    order: 9,
    evaluatedAt: "pre-dispatch",
    codes: [HEADER_MISMATCH_ERROR_CODE],
    conformance: ["http-custom-header-server-validation"],
    rationale: "SEP-2243 `Mcp-Param-*` headers are validated against the named tool\u2019s `x-mcp-header` declarations and the body `arguments` after the tool registry is known and before dispatch reaches the handler; a missing/disagreeing/malformed header is rejected 400 / -32020 with the same shape as the standard-header cross-checks. The documented order (after method resolution and params validation) is preserved observably only when the body `arguments` would otherwise validate: the check runs pre-dispatch, so a `tools/call` that fails BOTH this rung and a dispatch-time rung (e.g. order-6 `request-params`, -32602) is answered by this gate first with 400 / -32020, not by the earlier-ordered rung."
  }
];
var LADDER_ERROR_HTTP_STATUS = {
  [ProtocolErrorCode.ParseError]: 400,
  [ProtocolErrorCode.InvalidRequest]: 400,
  [ProtocolErrorCode.MethodNotFound]: 404,
  [ProtocolErrorCode.UnsupportedProtocolVersion]: 400,
  [ProtocolErrorCode.MissingRequiredClientCapability]: 400,
  [HEADER_MISMATCH_ERROR_CODE]: 400
};
var MCP_NAME_HEADER_SOURCE = {
  "tools/call": "name",
  "prompts/get": "name",
  "resources/read": "uri",
  "tasks/get": "taskId",
  "tasks/update": "taskId",
  "tasks/cancel": "taskId"
};
function mcpNameSource(method, params) {
  const field = Object.hasOwn(MCP_NAME_HEADER_SOURCE, method) ? MCP_NAME_HEADER_SOURCE[method] : void 0;
  if (field === void 0) return;
  const raw = isPlainObject$2(params) ? params[field] : void 0;
  return {
    field,
    value: typeof raw === "string" ? raw : void 0
  };
}
function isPlainObject$2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function parseSchema(schema, data) {
  return safeParse(schema, data);
}
function shapeKeys(schemas) {
  return new Set(schemas.flatMap((schema) => Object.keys(schema.shape)));
}
function isStandardSchema(schema) {
  if (schema == null) return false;
  const schemaType = typeof schema;
  if (schemaType !== "object" && schemaType !== "function") return false;
  if (!("~standard" in schema)) return false;
  return typeof schema["~standard"]?.validate === "function";
}
var warnedZodFallback = false;
var JSON_SCHEMA_CONVERSION_TARGET = "draft-2020-12";
function standardSchemaToJsonSchema(schema, io = "input") {
  const std = schema["~standard"];
  let result;
  if (std.jsonSchema) result = std.jsonSchema[io]({ target: JSON_SCHEMA_CONVERSION_TARGET });
  else if (std.vendor === "zod") {
    if (!("_zod" in schema)) throw new Error("Schema appears to be from zod 3, which the SDK cannot convert to JSON Schema. Upgrade to zod >=4.2.0, or wrap your JSON Schema with fromJsonSchema().");
    if (!warnedZodFallback) {
      warnedZodFallback = true;
      console.warn("[mcp-sdk] Your zod version does not implement `~standard.jsonSchema` (added in zod 4.2.0). Falling back to z.toJSONSchema(). Upgrade to zod >=4.2.0 to silence this warning.");
    }
    result = toJSONSchema(schema, {
      target: JSON_SCHEMA_CONVERSION_TARGET,
      io
    });
  } else throw new Error(`Schema library "${std.vendor}" does not implement StandardJSONSchemaV1 (\`~standard.jsonSchema\`). Upgrade to a version that does, or wrap your JSON Schema with fromJsonSchema().`);
  if (io === "output") {
    if (result.type !== void 0) return result;
    return isProvablyObjectShapedRoot(result) ? {
      type: "object",
      ...result
    } : result;
  }
  if (result.type !== void 0 && result.type !== "object") throw new Error(`MCP tool and prompt schemas must describe objects (got type: ${JSON.stringify(result.type)}). Wrap your schema in z.object({...}) or equivalent.`);
  return {
    type: "object",
    ...result
  };
}
function isProvablyObjectShapedRoot(schema) {
  if ("properties" in schema || "patternProperties" in schema || "additionalProperties" in schema || "required" in schema) return true;
  for (const key of [
    "oneOf",
    "anyOf",
    "allOf"
  ]) {
    const members2 = schema[key];
    if (Array.isArray(members2) && members2.length > 0) return members2.every((m) => m !== null && typeof m === "object" && (m.type === "object" || isProvablyObjectShapedRoot(m)));
  }
  return false;
}
function formatIssue(issue2) {
  if (!issue2.path?.length) return issue2.message;
  return `${issue2.path.map((p) => String(typeof p === "object" ? p.key : p)).join(".")}: ${issue2.message}`;
}
async function validateStandardSchema(schema, data) {
  const result = await schema["~standard"].validate(data);
  if (result.issues && result.issues.length > 0) return {
    success: false,
    error: result.issues.map((i) => formatIssue(i)).join(", ")
  };
  return {
    success: true,
    data: result.value
  };
}
function zodEmittedPattern(schema) {
  const jsonSchema = toJSONSchema(schema, {
    target: JSON_SCHEMA_CONVERSION_TARGET,
    io: "input"
  });
  return typeof jsonSchema.pattern === "string" ? jsonSchema.pattern : void 0;
}
var DATETIME_FRACTION_DIGITS = /\\\.\\d\{(\d+)\}/;
function datetimeReferenceSchemas(pattern) {
  const fractionDigits = DATETIME_FRACTION_DIGITS.exec(pattern);
  const precisions = [
    void 0,
    -1,
    0
  ];
  if (fractionDigits) precisions.push(Number(fractionDigits[1]));
  return [false, true].flatMap((local) => [false, true].flatMap((offset) => precisions.map((precision) => iso_exports.datetime({
    local,
    offset,
    precision
  }))));
}
function referencePatternsForFormat(format2, pattern) {
  let referenceSchemas;
  switch (format2) {
    case "email":
      referenceSchemas = [email2()];
      break;
    case "uri":
      referenceSchemas = [url()];
      break;
    case "date":
      referenceSchemas = [iso_exports.date()];
      break;
    case "date-time":
      referenceSchemas = datetimeReferenceSchemas(pattern);
      break;
  }
  return new Set(referenceSchemas.map((schema) => zodEmittedPattern(schema)).filter((emitted) => emitted !== void 0));
}
function isLibraryFormatPattern(format2, pattern, vendor) {
  if (vendor !== "zod") return true;
  return referencePatternsForFormat(format2, pattern).has(pattern);
}
function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function convertStandardElicitationSchema(schema) {
  try {
    return standardSchemaToJsonSchema(schema, "input");
  } catch (error2) {
    const detail = error2 instanceof Error ? error2.message : String(error2);
    throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema must describe an object with flat primitive properties: ${detail}`);
  }
}
var ANNOTATION_ONLY_JSON_SCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
  "$comment",
  "deprecated",
  "description",
  "examples",
  "readOnly",
  "title",
  "writeOnly"
]);
function isAnnotationOnlyJsonSchemaKeyword(key) {
  return ANNOTATION_ONLY_JSON_SCHEMA_KEYWORDS.has(key) || key.startsWith("x-");
}
var ROOT_KEYS = /* @__PURE__ */ new Set(["$schema", ...Object.keys(ElicitRequestFormParamsSchema.shape.requestedSchema.shape)]);
var PROPERTY_KEYS_BY_TYPE = {
  string: shapeKeys([
    StringSchemaSchema,
    UntitledSingleSelectEnumSchemaSchema,
    TitledSingleSelectEnumSchemaSchema,
    LegacyTitledEnumSchemaSchema
  ]),
  number: shapeKeys([NumberSchemaSchema]),
  integer: shapeKeys([NumberSchemaSchema]),
  boolean: shapeKeys([BooleanSchemaSchema]),
  array: shapeKeys([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema])
};
var SUPPORTED_STRING_FORMATS = new Set(StringSchemaSchema.shape.format.unwrap().options);
function walkProperty(node2, path, vendor, unsupported) {
  if (!isJsonObject(node2)) return node2;
  const allowedKeys = typeof node2.type === "string" && Object.hasOwn(PROPERTY_KEYS_BY_TYPE, node2.type) ? PROPERTY_KEYS_BY_TYPE[node2.type] : void 0;
  if (allowedKeys === void 0) return node2;
  const pruned = {};
  for (const [key, value] of Object.entries(node2)) if (allowedKeys.has(key) || isAnnotationOnlyJsonSchemaKeyword(key)) pruned[key] = value;
  else if (key === "pattern" && node2.type === "string" && typeof node2.format === "string") {
    if (!SUPPORTED_STRING_FORMATS.has(node2.format)) pruned[key] = value;
    else if (typeof value !== "string" || !isLibraryFormatPattern(node2.format, value, vendor)) unsupported.push(`${path}.${key}`);
  } else unsupported.push(`${path}.${key}`);
  return pruned;
}
function walkRequestedSchema(converted, vendor) {
  const pruned = {};
  const unsupported = [];
  for (const [key, value] of Object.entries(converted)) if (key === "properties" && isJsonObject(value)) pruned[key] = Object.fromEntries(Object.entries(value).map(([name, node2]) => [name, walkProperty(node2, `properties.${name}`, vendor, unsupported)]));
  else if (ROOT_KEYS.has(key)) pruned[key] = value;
  else if (!isAnnotationOnlyJsonSchemaKeyword(key)) unsupported.push(key);
  if (unsupported.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: ${unsupported.join(", ")}`);
  return pruned;
}
function describeUnsupportedProperties(pruned, fallback) {
  if (!isJsonObject(pruned.properties)) return fallback;
  const offenders = Object.entries(pruned.properties).filter(([, node2]) => !parseSchema(PrimitiveSchemaDefinitionSchema, node2).success).map(([name]) => `properties.${name}`);
  return offenders.length > 0 ? offenders.join(", ") : fallback;
}
function findDroppedConstraintPaths(original, parsed, path = "") {
  if (Array.isArray(original) && Array.isArray(parsed)) return original.flatMap((item, index) => findDroppedConstraintPaths(item, parsed[index], `${path}[${index}]`));
  if (!isJsonObject(original) || !isJsonObject(parsed)) return [];
  return Object.entries(original).flatMap(([key, value]) => {
    const childPath = path ? `${path}.${key}` : key;
    if (!Object.prototype.hasOwnProperty.call(parsed, key)) return isAnnotationOnlyJsonSchemaKeyword(key) ? [] : [childPath];
    return findDroppedConstraintPaths(value, parsed[key], childPath);
  });
}
function normalizeElicitInputParams(input) {
  if (!isStandardSchema(input.requestedSchema)) return {
    ...input,
    mode: "form",
    requestedSchema: input.requestedSchema
  };
  const vendor = input.requestedSchema["~standard"].vendor;
  const pruned = walkRequestedSchema(convertStandardElicitationSchema(input.requestedSchema), vendor);
  const parsed = parseSchema(ElicitRequestFormParamsSchema.shape.requestedSchema, pruned);
  if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema only supports flat primitive properties (string, number, integer, boolean, and string enums): ${describeUnsupportedProperties(pruned, parsed.error.message)}`);
  const droppedConstraints = findDroppedConstraintPaths(pruned, parsed.data);
  if (droppedConstraints.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: ${droppedConstraints.join(", ")}`);
  const danglingRequired = (parsed.data.required ?? []).filter((key) => !Object.prototype.hasOwnProperty.call(parsed.data.properties, key));
  if (danglingRequired.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema lists required properties that are not defined in properties: ${danglingRequired.join(", ")}`);
  return {
    ...input,
    mode: "form",
    requestedSchema: parsed.data
  };
}
function buildInputRequired(spec) {
  const hasInputRequests = spec.inputRequests !== void 0 && Object.keys(spec.inputRequests).length > 0;
  const hasRequestState = typeof spec.requestState === "string";
  if (!hasInputRequests && !hasRequestState) throw new TypeError("inputRequired() requires at least one of inputRequests (with at least one entry) or requestState (spec: every InputRequiredResult MUST include at least one of the two)");
  return {
    resultType: "input_required",
    ...spec.inputRequests !== void 0 && { inputRequests: spec.inputRequests },
    ...spec.requestState !== void 0 && { requestState: spec.requestState }
  };
}
var inputRequired = Object.assign(buildInputRequired, {
  elicit(params) {
    try {
      return {
        method: "elicitation/create",
        params: normalizeElicitInputParams(params)
      };
    } catch (error2) {
      throw error2 instanceof ProtocolError ? new TypeError(error2.message, { cause: error2 }) : error2;
    }
  },
  elicitUrl(params) {
    return {
      method: "elicitation/create",
      params: {
        ...params,
        mode: "url"
      }
    };
  },
  createMessage(params) {
    return {
      method: "sampling/createMessage",
      params
    };
  },
  listRoots() {
    return { method: "roots/list" };
  }
});
var DEFAULT_INPUT_REQUIRED_AUTO_FULFILL = true;
var DEFAULT_INPUT_REQUIRED_MAX_ROUNDS = 10;
var REQUEST_STATE_ONLY_LEG_PACING_MS = 250;
function resolveInputRequiredDriverConfig(options) {
  return {
    autoFulfill: options?.autoFulfill ?? DEFAULT_INPUT_REQUIRED_AUTO_FULFILL,
    maxRounds: options?.maxRounds ?? DEFAULT_INPUT_REQUIRED_MAX_ROUNDS
  };
}
function buildInputRequiredRetryParams(originalParams, responses, requestState) {
  const hasResponses = responses !== void 0 && Object.keys(responses).length > 0;
  if (!hasResponses && requestState === void 0) return originalParams;
  return {
    ...originalParams,
    ...hasResponses && { inputResponses: responses },
    ...requestState !== void 0 && { requestState }
  };
}
function inputRequiredRoundsExceededMessage(method, maxRounds) {
  return `Multi-round-trip request '${method}' still required input after ${maxRounds} rounds (inputRequired.maxRounds)`;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof SdkError ? signal.reason : new SdkError(SdkErrorCode.RequestTimeout, String(signal.reason)));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason instanceof SdkError ? signal.reason : new SdkError(SdkErrorCode.RequestTimeout, String(signal?.reason)));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
function linkedRoundAbort(outer) {
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort(outer?.reason);
  outer?.addEventListener("abort", onOuterAbort, { once: true });
  if (outer?.aborted) controller.abort(outer.reason);
  return {
    signal: controller.signal,
    abort: (reason) => controller.abort(reason),
    dispose: () => outer?.removeEventListener("abort", onOuterAbort)
  };
}
async function runInputRequiredDriver(args) {
  const { config: config2, method, originalParams, requestOptions, hooks, signal } = args;
  const startedAt = args.flowStartedAt ?? Date.now();
  let payload = args.firstPayload;
  let round = 0;
  while (true) {
    round += 1;
    if (round > config2.maxRounds) throw new SdkError(SdkErrorCode.InputRequiredRoundsExceeded, inputRequiredRoundsExceededMessage(method, config2.maxRounds), {
      rounds: config2.maxRounds,
      lastResult: {
        inputRequests: payload.inputRequests,
        ...payload.requestState !== void 0 && { requestState: payload.requestState }
      }
    });
    requestOptions.onprogress?.({
      progress: round,
      message: `Fulfilling input required by '${method}' (round ${round})`
    });
    const entries = Object.entries(payload.inputRequests ?? {});
    let responses;
    if (entries.length > 0) {
      const round$1 = linkedRoundAbort(signal);
      try {
        const fulfilled = await Promise.all(entries.map(async ([key, entry]) => {
          try {
            return [key, await hooks.dispatchInputRequest(key, entry, round$1.signal)];
          } catch (error2) {
            round$1.abort(error2);
            throw error2;
          }
        }));
        responses = Object.fromEntries(fulfilled);
      } finally {
        round$1.dispose();
      }
    } else await sleep(REQUEST_STATE_ONLY_LEG_PACING_MS, signal);
    const legOptions = { ...requestOptions.timeout !== void 0 && { timeout: requestOptions.timeout } };
    if (requestOptions.maxTotalTimeout !== void 0) {
      const totalElapsed = Date.now() - startedAt;
      const remaining = requestOptions.maxTotalTimeout - totalElapsed;
      if (remaining <= 0) throw new SdkError(SdkErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: requestOptions.maxTotalTimeout,
        totalElapsed
      });
      legOptions.maxTotalTimeout = remaining;
    }
    const result = await hooks.retry(buildInputRequiredRetryParams(originalParams, responses, payload.requestState), legOptions);
    if (isInputRequiredResult(result)) {
      payload = {
        inputRequests: result.inputRequests ?? {},
        ...result.requestState !== void 0 && { requestState: result.requestState }
      };
      continue;
    }
    return result;
  }
}
var SPEC_SCHEMA_KEYS = [
  "AnnotationsSchema",
  "AudioContentSchema",
  "BaseMetadataSchema",
  "BlobResourceContentsSchema",
  "BooleanSchemaSchema",
  "CallToolRequestSchema",
  "CallToolRequestParamsSchema",
  "CallToolResultSchema",
  "CancelledNotificationSchema",
  "CancelledNotificationParamsSchema",
  "CancelTaskRequestSchema",
  "CancelTaskResultSchema",
  "ClientCapabilitiesSchema",
  "ClientNotificationSchema",
  "ClientRequestSchema",
  "ClientResultSchema",
  "CompatibilityCallToolResultSchema",
  "CompleteRequestSchema",
  "CompleteRequestParamsSchema",
  "CompleteResultSchema",
  "ContentBlockSchema",
  "CreateMessageRequestSchema",
  "CreateMessageRequestParamsSchema",
  "CreateMessageResultSchema",
  "CreateMessageResultWithToolsSchema",
  "CreateTaskResultSchema",
  "CursorSchema",
  "DiscoverRequestSchema",
  "DiscoverResultSchema",
  "ElicitationCompleteNotificationSchema",
  "ElicitationCompleteNotificationParamsSchema",
  "ElicitRequestSchema",
  "ElicitRequestFormParamsSchema",
  "ElicitRequestParamsSchema",
  "ElicitRequestURLParamsSchema",
  "ElicitResultSchema",
  "EmbeddedResourceSchema",
  "EmptyResultSchema",
  "EnumSchemaSchema",
  "GetPromptRequestSchema",
  "GetPromptRequestParamsSchema",
  "GetPromptResultSchema",
  "GetTaskPayloadRequestSchema",
  "GetTaskPayloadResultSchema",
  "GetTaskRequestSchema",
  "GetTaskResultSchema",
  "IconSchema",
  "IconsSchema",
  "ImageContentSchema",
  "ImplementationSchema",
  "InitializedNotificationSchema",
  "InitializeRequestSchema",
  "InitializeRequestParamsSchema",
  "InitializeResultSchema",
  "JSONArraySchema",
  "JSONObjectSchema",
  "JSONRPCErrorResponseSchema",
  "JSONRPCMessageSchema",
  "JSONRPCNotificationSchema",
  "JSONRPCRequestSchema",
  "JSONRPCResponseSchema",
  "JSONRPCResultResponseSchema",
  "JSONValueSchema",
  "LegacyTitledEnumSchemaSchema",
  "ListPromptsRequestSchema",
  "ListPromptsResultSchema",
  "ListResourcesRequestSchema",
  "ListResourcesResultSchema",
  "ListResourceTemplatesRequestSchema",
  "ListResourceTemplatesResultSchema",
  "ListRootsRequestSchema",
  "ListRootsResultSchema",
  "ListTasksRequestSchema",
  "ListTasksResultSchema",
  "ListToolsRequestSchema",
  "ListToolsResultSchema",
  "LoggingLevelSchema",
  "LoggingMessageNotificationSchema",
  "LoggingMessageNotificationParamsSchema",
  "ModelHintSchema",
  "ModelPreferencesSchema",
  "MultiSelectEnumSchemaSchema",
  "NotificationSchema",
  "NumberSchemaSchema",
  "PaginatedRequestSchema",
  "PaginatedRequestParamsSchema",
  "PaginatedResultSchema",
  "PingRequestSchema",
  "PrimitiveSchemaDefinitionSchema",
  "ProgressSchema",
  "ProgressNotificationSchema",
  "ProgressNotificationParamsSchema",
  "ProgressTokenSchema",
  "PromptSchema",
  "PromptArgumentSchema",
  "PromptListChangedNotificationSchema",
  "PromptMessageSchema",
  "PromptReferenceSchema",
  "ReadResourceRequestSchema",
  "ReadResourceRequestParamsSchema",
  "ReadResourceResultSchema",
  "RelatedTaskMetadataSchema",
  "RequestSchema",
  "RequestIdSchema",
  "RequestMetaSchema",
  "ResourceSchema",
  "ResourceContentsSchema",
  "ResourceLinkSchema",
  "ResourceListChangedNotificationSchema",
  "ResourceRequestParamsSchema",
  "ResourceTemplateSchema",
  "ResourceTemplateReferenceSchema",
  "ResourceUpdatedNotificationSchema",
  "ResourceUpdatedNotificationParamsSchema",
  "ResultMetaObjectSchema",
  "ResultSchema",
  "RoleSchema",
  "RootSchema",
  "RootsListChangedNotificationSchema",
  "SamplingContentSchema",
  "SamplingMessageSchema",
  "SamplingMessageContentBlockSchema",
  "ServerCapabilitiesSchema",
  "ServerNotificationSchema",
  "ServerRequestSchema",
  "ServerResultSchema",
  "SetLevelRequestSchema",
  "SetLevelRequestParamsSchema",
  "SingleSelectEnumSchemaSchema",
  "StringSchemaSchema",
  "SubscribeRequestSchema",
  "SubscribeRequestParamsSchema",
  "SubscriptionFilterSchema",
  "SubscriptionsAcknowledgedNotificationSchema",
  "SubscriptionsAcknowledgedNotificationParamsSchema",
  "SubscriptionsListenRequestSchema",
  "SubscriptionsListenRequestParamsSchema",
  "SubscriptionsListenResultSchema",
  "SubscriptionsListenResultMetaSchema",
  "TaskAugmentedRequestParamsSchema",
  "TaskCreationParamsSchema",
  "TaskMetadataSchema",
  "TaskSchema",
  "TaskStatusSchema",
  "TaskStatusNotificationSchema",
  "TaskStatusNotificationParamsSchema",
  "TextContentSchema",
  "TextResourceContentsSchema",
  "TitledMultiSelectEnumSchemaSchema",
  "TitledSingleSelectEnumSchemaSchema",
  "ToolSchema",
  "ToolAnnotationsSchema",
  "ToolChoiceSchema",
  "ToolExecutionSchema",
  "ToolListChangedNotificationSchema",
  "ToolResultContentSchema",
  "ToolUseContentSchema",
  "UnsubscribeRequestSchema",
  "UnsubscribeRequestParamsSchema",
  "UntitledMultiSelectEnumSchemaSchema",
  "UntitledSingleSelectEnumSchemaSchema"
];
var authSchemas = {
  IdJagTokenExchangeResponseSchema,
  OAuthClientInformationFullSchema,
  OAuthClientInformationSchema,
  OAuthClientMetadataSchema,
  OAuthClientRegistrationErrorSchema,
  OAuthErrorResponseSchema,
  OAuthMetadataSchema,
  OAuthProtectedResourceMetadataSchema,
  OAuthTokenRevocationRequestSchema,
  OAuthTokensSchema,
  OpenIdProviderDiscoveryMetadataSchema,
  OpenIdProviderMetadataSchema
};
var _specTypeSchemas = {};
var _isSpecType = {};
function register(key, schema) {
  const name = key.slice(0, -6);
  _specTypeSchemas[name] = schema;
  _isSpecType[name] = (v) => schema.safeParse(v).success;
}
for (const key of SPEC_SCHEMA_KEYS) register(key, schemas_exports2[key]);
for (const [key, schema] of Object.entries(authSchemas)) register(key, schema);
var specTypeSchemas = Object.freeze(_specTypeSchemas);
var isSpecType = Object.freeze(_isSpecType);
function bootstrapOutboundCodec(method) {
  switch (method) {
    case "initialize":
    case "notifications/initialized":
      return codecForVersion(void 0);
    case "server/discover":
      return codecForVersion(MODERN_WIRE_REVISION);
    default:
      return;
  }
}
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
var RESERVED_ENVELOPE_META_KEYS = [
  PROTOCOL_VERSION_META_KEY,
  CLIENT_INFO_META_KEY,
  CLIENT_CAPABILITIES_META_KEY,
  LOG_LEVEL_META_KEY
];
var RETRY_PARAMS_KEYS = ["inputResponses", "requestState"];
function liftWireOnlyMaterial(message, kind) {
  const params = message.params;
  if (!isPlainObject$1(params)) return {
    message,
    lifted: {}
  };
  const meta2 = params._meta;
  const envelopeKeys = isPlainObject$1(meta2) ? RESERVED_ENVELOPE_META_KEYS.filter((key) => key in meta2) : [];
  const retryKeys = kind === "request" ? RETRY_PARAMS_KEYS.filter((key) => key in params) : [];
  if (envelopeKeys.length === 0 && retryKeys.length === 0) return {
    message,
    lifted: {}
  };
  const lifted = {};
  const nextParams = { ...params };
  if (envelopeKeys.length > 0 && isPlainObject$1(meta2)) {
    const envelope = {};
    const nextMeta = { ...meta2 };
    for (const key of envelopeKeys) {
      envelope[key] = meta2[key];
      delete nextMeta[key];
    }
    lifted.envelope = envelope;
    if (Object.keys(nextMeta).length > 0) nextParams._meta = nextMeta;
    else delete nextParams._meta;
  }
  for (const key of retryKeys) {
    if (key === "inputResponses") lifted.inputResponses = nextParams[key];
    if (key === "requestState") lifted.requestState = nextParams[key];
    delete nextParams[key];
  }
  return {
    message: {
      ...message,
      params: nextParams
    },
    lifted
  };
}
function codecResultValidator(codec, method) {
  const probe = codec.validateResult(method, void 0);
  if (!probe.ok && probe.reason === "not-in-era") return void 0;
  return { "~standard": {
    version: 1,
    vendor: "mcp-wire-codec",
    validate(value) {
      const outcome = codec.validateResult(method, value);
      if (outcome.ok) return { value: outcome.value };
      return { issues: [{ message: outcome.reason === "invalid" ? outcome.message : `not-in-era: ${method}` }] };
    }
  } };
}
function requestStateAccessor(value) {
  return () => value;
}
var NO_REQUEST_STATE = requestStateAccessor(void 0);
var writeNegotiatedProtocolVersion;
var Protocol = class {
  _transport;
  _requestMessageId = 0;
  _requestHandlers = /* @__PURE__ */ new Map();
  /** Methods registered with an explicit schema; the era gate in `_onrequest` reads it for the Tasks extension names. */
  _customSchemaRequestMethods = /* @__PURE__ */ new Set();
  _requestHandlerAbortControllers = /* @__PURE__ */ new Map();
  _notificationHandlers = /* @__PURE__ */ new Map();
  _responseHandlers = /* @__PURE__ */ new Map();
  _progressHandlers = /* @__PURE__ */ new Map();
  _timeoutInfo = /* @__PURE__ */ new Map();
  _pendingDebouncedNotifications = /* @__PURE__ */ new Set();
  /**
  * The protocol version negotiated for the current connection (`undefined`
  * before negotiation completes), which determines the wire era this
  * instance speaks. Set by the SDK's negotiation and initialize paths
  * (`Client.connect`, `Server._oninitialize`).
  */
  _negotiatedProtocolVersion;
  static {
    writeNegotiatedProtocolVersion = (instance, version2) => {
      instance._negotiatedProtocolVersion = version2;
    };
  }
  _supportedProtocolVersions;
  /**
  * Callback for when the connection is closed for any reason.
  *
  * This is invoked when {@linkcode Protocol.close | close()} is called as well.
  */
  onclose;
  /**
  * Callback for when an error occurs.
  *
  * Note that errors are not necessarily fatal; they are used for reporting any kind of exceptional condition out of band.
  */
  onerror;
  /**
  * A handler to invoke for any request types that do not have their own handler installed.
  */
  fallbackRequestHandler;
  /**
  * A handler to invoke for any notification types that do not have their own handler installed.
  */
  fallbackNotificationHandler;
  constructor(_options) {
    this._options = _options;
    this._supportedProtocolVersions = _options?.supportedProtocolVersions ?? SUPPORTED_PROTOCOL_VERSIONS;
    this.setNotificationHandler("notifications/cancelled", (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler("notifications/progress", (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler("ping", (_request) => ({}));
  }
  /**
  * Drop consult for inbound messages whose transport did not classify them
  * at the edge — long-lived channels such as stdio, where a role class may
  * need to decline traffic the negotiated era has no answer for (the
  * client-side inbound-request drop on modern-era connections: the
  * 2026-07-28 era has no server→client request channel, and on stdio the
  * client must never write JSON-RPC responses).
  *
  * Consulted ONLY when the transport supplied no
  * {@linkcode MessageExtraInfo.classification}: edge-classified traffic
  * never reaches the hook. Returning `'drop'` discards the message without
  * writing any response (requests are surfaced via `onerror`). The base
  * implementation returns `undefined`: unclassified traffic keeps today's
  * dispatch path unchanged. Era selection never happens here — era is
  * instance state, owned by the serving entry that constructed and
  * connected the instance.
  */
  _shouldDropInbound(_message) {
  }
  /**
  * The per-request `_meta` envelope this instance attaches to every outgoing
  * request and notification, when one applies. The base implementation
  * returns `undefined` (no envelope — the 2025-era posture, so legacy-era
  * outbound traffic is byte-identical to a build without this seam).
  * `Client` overrides it on a connection that negotiated a modern (2026-07-28+)
  * era to return the reserved protocol-version / client-info /
  * client-capabilities keys. User-supplied `_meta` keys take precedence over
  * the auto-attached ones.
  */
  _outboundMetaEnvelope() {
  }
  /**
  * Attach this instance's outbound `_meta` envelope (when one is configured)
  * to a request or notification. A no-op when the seam returns `undefined`
  * — the message returns by reference, so the legacy-era wire stays
  * byte-identical. User-supplied `_meta` keys are spread last so they win
  * over the auto-attached envelope keys.
  */
  _envelopeOutbound(message) {
    const envelope = this._outboundMetaEnvelope();
    if (envelope === void 0) return message;
    const params = message.params ?? {};
    return {
      ...message,
      params: {
        ...params,
        _meta: {
          ...envelope,
          ...params._meta
        }
      }
    };
  }
  /**
  * Extension point for non-`complete` decoded results in the response
  * funnel: a result the wire codec discriminated into a kind other than
  * `'complete'` or `'invalid'` is handed here for the role class to
  * resolve. The base default surfaces it as a typed
  * {@linkcode SdkErrorCode.UnsupportedResultType} error (no retry).
  *
  * Intended consumers (named so the seam stays accountable):
  * - the `Client`'s multi-round-trip auto-fulfilment engine, which fulfils
  *   `'input_required'` results through the registered
  *   elicitation/sampling/roots handlers and retries via `flow.retry`;
  * - a future client-side terminal-result handler for
  *   `subscriptions/listen`, when the spec defines one.
  *
  * `Server` instances never receive `input_required` responses on their
  * outbound legs and leave the base behavior in place.
  */
  _resolveNonCompleteResult(decoded, flow) {
    return Promise.reject(new SdkError(SdkErrorCode.UnsupportedResultType, `Unsupported result type '${decoded.kind}' for ${flow.request.method}`, {
      resultType: decoded.kind,
      method: flow.request.method
    }));
  }
  /**
  * Protected accessor for a registered request handler. Used by role
  * classes that dispatch synthesized requests through the same stored
  * handler chain (e.g. the `Client` fulfilling an embedded multi-round-trip
  * input request).
  */
  _getRequestHandler(method) {
    return this._requestHandlers.get(method);
  }
  async _oncancel(notification) {
    if (notification.params.requestId === void 0) return;
    this._requestHandlerAbortControllers.get(notification.params.requestId)?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info) return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw new SdkError(SdkErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  /**
  * Attaches to the given transport, starts it, and starts listening for messages.
  *
  * The caller assumes ownership of the {@linkcode Transport}, replacing any callbacks that have already been set, and expects that it is the only user of the {@linkcode Transport} instance going forward.
  */
  async connect(transport) {
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      try {
        _onclose?.();
      } finally {
        this._onclose();
      }
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error2) => {
      _onerror?.(error2);
      this._onerror(error2);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) this._onresponse(message);
      else if (isJSONRPCRequest(message)) this._onrequest(message, extra);
      else if (isJSONRPCNotification(message)) this._onnotification(message, extra);
      else this._onerror(/* @__PURE__ */ new Error(`Unknown message type: ${JSON.stringify(message)}`));
    };
    transport.setSupportedProtocolVersions?.(this._supportedProtocolVersions);
    await this._transport.start();
  }
  /**
  * Transport-close hook. Subclass overrides MUST call `super._onclose()`
  * after their own cleanup — base teardown (response-handler settlement,
  * timeout clearing, in-flight request abort) does not run otherwise.
  */
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers.clear();
    this._pendingDebouncedNotifications.clear();
    for (const info of this._timeoutInfo.values()) clearTimeout(info.timeoutId);
    this._timeoutInfo.clear();
    const requestHandlerAbortControllers = this._requestHandlerAbortControllers;
    this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
    const error2 = new SdkError(SdkErrorCode.ConnectionClosed, "Connection closed");
    this._transport = void 0;
    try {
      this.onclose?.();
    } finally {
      for (const handler of responseHandlers.values()) handler(error2);
      for (const controller of requestHandlerAbortControllers.values()) controller.abort(error2);
    }
  }
  _onerror(error2) {
    this.onerror?.(error2);
  }
  /**
  * Inbound-notification dispatch. Subclass overrides MUST delegate
  * unmatched traffic to `super._onnotification(rawNotification, extra)` —
  * an override that consumes only what it owns and falls through to base
  * dispatch for everything else.
  */
  _onnotification(rawNotification, extra) {
    const { message: notification } = liftWireOnlyMaterial(rawNotification, "notification");
    const codec = this._negotiatedWireCodec();
    if (extra?.classification === void 0 && this._shouldDropInbound(rawNotification) === "drop") return;
    if (extra?.classification !== void 0) {
      const classified = classifiedWireEra(extra.classification);
      if (classified !== codec.era) {
        this._onerror(/* @__PURE__ */ new Error(`Era mismatch on inbound notification '${notification.method}': classified as ${classified} but this instance serves ${codec.era}`));
        return;
      }
    }
    if (isSpecNotificationMethod(notification.method) && !codec.hasNotificationMethod(notification.method)) return;
    const handler = this._notificationHandlers.get(notification.method);
    const fallback = this.fallbackNotificationHandler;
    if (handler === void 0 && fallback === void 0) return;
    Promise.resolve().then(() => handler === void 0 ? fallback(notification) : handler(notification, codec)).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Uncaught error in notification handler: ${error2}`)));
  }
  _onrequest(rawRequest, extra) {
    const { message: request, lifted } = liftWireOnlyMaterial(rawRequest, "request");
    const codec = this._negotiatedWireCodec();
    if (extra?.classification === void 0 && this._shouldDropInbound(rawRequest) === "drop") {
      this._onerror(/* @__PURE__ */ new Error(`Dropped inbound request '${rawRequest.method}': not servable on this connection's protocol era`));
      return;
    }
    const capturedTransport = this._transport;
    const sendErrorResponse = (code, message, data) => {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code,
          message,
          ...data !== void 0 && { data }
        }
      };
      capturedTransport?.send(errorResponse).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send an error response: ${error2}`)));
    };
    if (extra?.classification !== void 0) {
      const classified = classifiedWireEra(extra.classification);
      if (classified !== codec.era) {
        this._onerror(/* @__PURE__ */ new Error(`Era mismatch on inbound request '${request.method}': classified as ${classified} but this instance serves ${codec.era}`));
        const requested = extra.classification.revision ?? classified;
        sendErrorResponse(ProtocolErrorCode.UnsupportedProtocolVersion, `Unsupported protocol version: ${requested}`, {
          supported: this._supportedProtocolVersions,
          requested
        });
        return;
      }
    }
    if (isSpecRequestMethod(request.method) && !codec.hasRequestMethod(request.method) && !(isExtensionReusedRequestMethod(request.method) && this._customSchemaRequestMethods.has(request.method))) {
      sendErrorResponse(ProtocolErrorCode.MethodNotFound, "Method not found");
      return;
    }
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    if (handler === void 0) {
      sendErrorResponse(ProtocolErrorCode.MethodNotFound, "Method not found");
      return;
    }
    const envelopeError = codec.checkInboundEnvelope(lifted);
    if (envelopeError !== void 0) {
      sendErrorResponse(ProtocolErrorCode.InvalidParams, envelopeError);
      return;
    }
    const sendNotification = (notification, options) => this._notificationViaCodec(this._resolveOutboundCodec(notification.method), notification, {
      ...options,
      relatedRequestId: request.id
    });
    const sendRequest = (r, resultSchema, options) => this._requestWithSchemaViaCodec(this._resolveOutboundCodec(r.method), r, resultSchema, {
      ...options,
      relatedRequestId: request.id
    });
    const abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const partitionedInputResponses = lifted.inputResponses === void 0 ? void 0 : partitionInputResponses(lifted.inputResponses);
    const baseCtx = {
      sessionId: capturedTransport?.sessionId,
      mcpReq: {
        id: request.id,
        method: request.method,
        _meta: request.params?._meta,
        ...lifted.envelope !== void 0 && { envelope: lifted.envelope },
        ...partitionedInputResponses !== void 0 && { inputResponses: partitionedInputResponses.accepted },
        ...partitionedInputResponses !== void 0 && partitionedInputResponses.droppedKeys.length > 0 && { droppedInputResponseKeys: partitionedInputResponses.droppedKeys },
        requestState: lifted.requestState === void 0 ? NO_REQUEST_STATE : requestStateAccessor(lifted.requestState),
        signal: abortController.signal,
        send: ((r, schemaOrOptions, maybeOptions) => {
          const sendCodec = this._resolveOutboundCodec(r.method);
          this._assertOutboundRequestInEra(sendCodec, r.method);
          if (isStandardSchema(schemaOrOptions)) return sendRequest(r, schemaOrOptions, maybeOptions);
          const validate3 = codecResultValidator(sendCodec, r.method);
          if (validate3 === void 0) throw new TypeError(`'${r.method}' is not a spec method; pass a result schema as the second argument to ctx.mcpReq.send().`);
          return sendRequest(r, validate3, schemaOrOptions);
        }),
        notify: sendNotification
      },
      http: extra?.authInfo ? { authInfo: extra.authInfo } : void 0
    };
    const ctx = this.buildContext(baseCtx, extra);
    Promise.resolve().then(() => handler(request, ctx)).then(async (result) => {
      if (abortController.signal.aborted) return;
      let encoded;
      try {
        encoded = codec.encodeResult(request.method, result, this._outboundServerInfo());
      } catch (error2) {
        this._onerror(/* @__PURE__ */ new Error(`Failed to encode result for ${request.method}: ${error2}`));
        sendErrorResponse(ProtocolErrorCode.InternalError, "Internal error");
        return;
      }
      const response = {
        result: encoded,
        jsonrpc: "2.0",
        id: request.id
      };
      await capturedTransport?.send(response);
    }, async (error2) => {
      if (abortController.signal.aborted) return;
      const thrownCode = Number.isSafeInteger(error2["code"]) ? error2["code"] : ProtocolErrorCode.InternalError;
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: codec.encodeErrorCode(thrownCode),
          message: error2.message ?? "Internal error",
          ...error2["data"] !== void 0 && { data: error2["data"] }
        }
      };
      await capturedTransport?.send(errorResponse);
    }).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send response: ${error2}`))).finally(() => {
      if (this._requestHandlerAbortControllers.get(request.id) === abortController) this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(/* @__PURE__ */ new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) try {
      this._resetTimeout(messageId);
    } catch (error2) {
      this._responseHandlers.delete(messageId);
      this._progressHandlers.delete(messageId);
      this._cleanupTimeout(messageId);
      responseHandler(error2);
      return;
    }
    handler(params);
  }
  /**
  * Inbound-response dispatch. Subclass overrides MUST delegate unmatched
  * traffic to `super._onresponse(response)` — an override that consumes
  * only what it owns and falls through to base dispatch for everything
  * else.
  */
  _onresponse(response) {
    const messageId = Number(response.id);
    const handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(/* @__PURE__ */ new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    this._progressHandlers.delete(messageId);
    if (isJSONRPCResultResponse(response)) handler(response);
    else handler(ProtocolError.fromError(response.error.code, response.error.message, response.error.data));
  }
  get transport() {
    return this._transport;
  }
  /**
  * Closes the connection.
  */
  async close() {
    await this._transport?.close();
  }
  request(request, schemaOrOptions, maybeOptions) {
    const codec = this._resolveOutboundCodec(request.method);
    if (isStandardSchema(schemaOrOptions)) {
      if (!isExtensionReusedRequestMethod(request.method)) this._assertOutboundRequestInEra(codec, request.method);
      return this._requestWithSchemaViaCodec(codec, request, schemaOrOptions, maybeOptions);
    }
    this._assertOutboundRequestInEra(codec, request.method);
    const validate3 = codecResultValidator(codec, request.method);
    if (validate3 === void 0) throw new TypeError(`'${request.method}' is not a spec method; pass a result schema as the second argument to request().`);
    return this._requestWithSchemaViaCodec(codec, request, validate3, schemaOrOptions);
  }
  /**
  * The wire codec for this instance's negotiated era — the phase-2 truth:
  * everything an established connection sends and receives resolves
  * through it. Legacy until a version has been negotiated.
  */
  _negotiatedWireCodec() {
    return codecForVersion(this._negotiatedProtocolVersion);
  }
  /**
  * Protected accessor for the instance's negotiated wire codec, for role
  * classes (Client/Server/McpServer) routing era-dependent behavior
  * through the codec's function-only surface — `samplingResultVariant`,
  * `outboundEnvelope`, `projectCallToolResult` — instead of branching on
  * the protocol version themselves.
  */
  _wireCodec() {
    return this._negotiatedWireCodec();
  }
  /**
  * Outbound codec resolution: while the negotiated version is still unset
  * (the negotiation window), lifecycle messages are bootstrap-pinned BY
  * METHOD — they self-identify their era (`initialize` IS the legacy
  * handshake, `server/discover` IS the modern probe). Once a version has
  * been negotiated, the instance era is authoritative for everything — a
  * negotiated session never re-routes a method onto the other era.
  */
  _resolveOutboundCodec(method) {
    if (this._negotiatedProtocolVersion === void 0) {
      const pinned = bootstrapOutboundCodec(method);
      if (pinned) return pinned;
    }
    return this._negotiatedWireCodec();
  }
  /**
  * Era gate for outbound requests — deletions are physical in BOTH
  * directions: sending a spec method that the resolved era does not define
  * dies locally with a typed error before anything reaches the transport.
  * Methods outside the spec universe are consumer-owned extension methods
  * and stay era-blind.
  */
  _assertOutboundRequestInEra(codec, method) {
    if (isSpecRequestMethod(method) && !codec.hasRequestMethod(method)) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `Method '${method}' is not supported by the negotiated protocol version (wire era ${codec.era})`, {
      method,
      era: codec.era
    });
  }
  /**
  * Sends a request and waits for a response, using the provided schema for
  * validation instead of the era registry's method-keyed entry.
  *
  * This is the internal implementation used by SDK methods whose result
  * schema cannot be expressed as a method-keyed registry entry — the one
  * surviving case is `server.createMessage`, whose result schema depends
  * on the REQUEST params (tools vs no tools) — and by callers passing
  * explicit compatibility schemas. Spec methods are still era-gated here:
  * an explicit schema never smuggles a deleted method onto the wire.
  */
  _requestWithSchema(request, resultSchema, options) {
    const codec = this._resolveOutboundCodec(request.method);
    this._assertOutboundRequestInEra(codec, request.method);
    return this._requestWithSchemaViaCodec(codec, request, resultSchema, options);
  }
  /**
  * The request funnel proper, keyed by the resolved era codec: the codec
  * owns result decoding (raw-first `resultType` discrimination — V-1 —
  * and the era's lift posture) before the schema validation step.
  */
  _requestWithSchemaViaCodec(codec, request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, headers } = options ?? {};
    const flowStartedAt = Date.now();
    let onAbort;
    let cleanupMessageId;
    return new Promise((resolve, reject) => {
      const earlyReject = (error2) => {
        reject(error2);
      };
      if (!this._transport) {
        earlyReject(/* @__PURE__ */ new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) try {
        this.assertCapabilityForMethod(request.method);
      } catch (error2) {
        earlyReject(error2);
        return;
      }
      if (options?.signal?.aborted) {
        const reason = options.signal.reason;
        throw reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason));
      }
      const requestAbort = codec.era === MODERN_WIRE_REVISION && this._transport.hasPerRequestStream === true ? new AbortController() : void 0;
      const messageId = this._requestMessageId++;
      cleanupMessageId = messageId;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta,
            progressToken: messageId
          }
        };
      }
      const outbound = this._envelopeOutbound(jsonrpcRequest);
      let responseReceived = false;
      const cancel = (reason) => {
        if (responseReceived) return;
        this._progressHandlers.delete(messageId);
        if (requestAbort === void 0) {
          if (request.method !== "initialize") this._transport?.send(this._envelopeOutbound({
            jsonrpc: "2.0",
            method: "notifications/cancelled",
            params: {
              requestId: messageId,
              reason: String(reason)
            }
          }), {
            relatedRequestId,
            resumptionToken,
            onresumptiontoken
          }).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send cancellation: ${error2}`)));
        } else requestAbort.abort();
        reject(reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason)));
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) return;
        responseReceived = true;
        if (response instanceof Error) return reject(response);
        let decoded;
        try {
          decoded = codec.decodeResult(request.method, response.result);
        } catch (error2) {
          return reject(error2 instanceof Error ? error2 : new Error(String(error2)));
        }
        if (decoded.kind === "invalid") return reject(decoded.error);
        if (decoded.kind === "input_required") {
          if (options?.allowInputRequired === true) return resolve(manualInputRequiredValue(decoded));
          const flow = {
            codec,
            request,
            resultSchema,
            options,
            flowStartedAt,
            retry: (params, legOptions) => this._requestWithSchemaViaCodec(codec, params === void 0 ? { method: request.method } : {
              method: request.method,
              params
            }, resultSchema, legOptions)
          };
          return resolve(this._resolveNonCompleteResult(decoded, flow));
        }
        const result = decoded.result;
        validateStandardSchema(resultSchema, result).then((parseResult) => {
          if (parseResult.success) resolve(parseResult.data);
          else reject(new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${request.method}: ${parseResult.error}`));
        }, reject);
      });
      onAbort = () => cancel(options?.signal?.reason);
      options?.signal?.addEventListener("abort", onAbort, { once: true });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(new SdkError(SdkErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      this._transport.send(outbound, {
        relatedRequestId,
        resumptionToken,
        onresumptiontoken,
        headers,
        requestSignal: requestAbort?.signal
      }).catch((error2) => {
        this._progressHandlers.delete(messageId);
        reject(error2);
      });
    }).finally(() => {
      if (onAbort) options?.signal?.removeEventListener("abort", onAbort);
      if (cleanupMessageId !== void 0) {
        this._responseHandlers.delete(cleanupMessageId);
        this._cleanupTimeout(cleanupMessageId);
      }
    });
  }
  /**
  * Emits a notification, which is a one-way message that does not expect a response.
  */
  async notification(notification, options) {
    return await this._notificationViaCodec(this._resolveOutboundCodec(notification.method), notification, options);
  }
  /**
  * The notification funnel proper, keyed by the resolved era codec —
  * direct sends and related notifications (`ctx.mcpReq.notify`) alike
  * resolve through the instance's negotiated era at send time.
  */
  async _notificationViaCodec(codec, notification, options) {
    if (!this._transport) throw new SdkError(SdkErrorCode.NotConnected, "Not connected");
    if (isSpecNotificationMethod(notification.method) && !codec.hasNotificationMethod(notification.method)) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `Notification '${notification.method}' is not supported by the negotiated protocol version (wire era ${codec.era})`, {
      method: notification.method,
      era: codec.era
    });
    this.assertNotificationCapability(notification.method);
    const jsonrpcNotification = this._envelopeOutbound({
      jsonrpc: "2.0",
      ...notification
    });
    if ((this._options?.debouncedNotificationMethods ?? []).includes(notification.method) && !notification.params && options?.relatedRequestId === void 0) {
      if (this._pendingDebouncedNotifications.has(notification.method)) return;
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) return;
        this._transport?.send(jsonrpcNotification, options).catch((error2) => this._onerror(error2));
      });
      return;
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  setRequestHandler(method, schemasOrHandler, maybeHandler) {
    this.assertRequestHandlerCapability(method);
    let stored;
    if (typeof schemasOrHandler === "function") {
      if (!isSpecRequestMethod(method)) throw new TypeError(`'${method}' is not a spec request method; pass schemas as the second argument to setRequestHandler().`);
      stored = (request, ctx) => {
        const dispatchCodec = this._negotiatedWireCodec();
        let outcome = dispatchCodec.validateRequest(method, request);
        if (!outcome.ok && outcome.reason === "not-in-era") outcome = dispatchCodec.validateInputRequest(method, request);
        if (!outcome.ok) {
          if (outcome.reason === "not-in-era") throw new ProtocolError(ProtocolErrorCode.InternalError, `No wire schema for ${method} in the resolved era`);
          throw new Error(outcome.message);
        }
        return Promise.resolve(schemasOrHandler(outcome.value, ctx));
      };
    } else if (maybeHandler) stored = async (request, ctx) => {
      const parsed = await validateStandardSchema(schemasOrHandler.params, { ...request.params });
      if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid params for ${method}: ${parsed.error}`);
      return maybeHandler(parsed.data, ctx);
    };
    else throw new TypeError("setRequestHandler: handler is required");
    if (typeof schemasOrHandler === "function") this._customSchemaRequestMethods.delete(method);
    else this._customSchemaRequestMethods.add(method);
    this._requestHandlers.set(method, this._wrapHandler(method, stored));
  }
  /**
  * Hook for subclasses to wrap a registered request handler with role-specific
  * validation or behavior (e.g. `Server` validates `tools/call` results, `Client`
  * validates `elicitation/create` mode and result). Runs for both the 2-arg and
  * 3-arg registration paths. The default implementation is identity.
  *
  * Subclasses overriding this hook avoid redeclaring `setRequestHandler`'s overload set.
  */
  _wrapHandler(_method, handler) {
    return handler;
  }
  /**
  * Hook for subclasses to supply the implementation identity the 2026-era
  * encode seam stamps into outbound result `_meta` under
  * `io.modelcontextprotocol/serverInfo` (spec PR #3002: servers SHOULD
  * identify themselves on every response). The default is `undefined` — no
  * stamp. Only `Server` overrides this: the key identifies the software
  * producing a response, and the 2025-era codec never stamps anything
  * regardless (the never-stamp guarantee).
  */
  _outboundServerInfo() {
  }
  /**
  * Removes the request handler for the given method.
  */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
    this._customSchemaRequestMethods.delete(method);
  }
  /**
  * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
  */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) throw new Error(`A request handler for ${method} already exists, which would be overridden`);
  }
  setNotificationHandler(method, schemasOrHandler, maybeHandler) {
    if (typeof schemasOrHandler === "function") {
      if (!isSpecNotificationMethod(method)) throw new TypeError(`'${method}' is not a spec notification method; pass schemas as the second argument to setNotificationHandler().`);
      this._notificationHandlers.set(method, (notification, codec) => {
        const outcome = codec.validateNotification(method, notification);
        if (!outcome.ok) {
          if (outcome.reason === "not-in-era") throw new ProtocolError(ProtocolErrorCode.InternalError, `No wire schema for ${method} in the resolved era`);
          throw new Error(outcome.message);
        }
        return Promise.resolve(schemasOrHandler(outcome.value));
      });
      return;
    }
    if (!maybeHandler) throw new TypeError("setNotificationHandler: handler is required");
    this._notificationHandlers.set(method, async (notification) => {
      const parsed = await validateStandardSchema(schemasOrHandler.params, { ...notification.params });
      if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid params for notification ${method}: ${parsed.error}`);
      await maybeHandler(parsed.data, notification);
    });
  }
  /**
  * Removes the notification handler for the given method.
  */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
};
function isPlainObject$1(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === void 0) continue;
    const baseValue = result[k];
    result[k] = isPlainObject$1(baseValue) && isPlainObject$1(addValue) ? {
      ...baseValue,
      ...addValue
    } : addValue;
  }
  return result;
}
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function partitionInputResponses(inputResponses) {
  const accepted = {};
  const droppedKeys = [];
  if (!isPlainObject2(inputResponses)) return {
    accepted,
    droppedKeys
  };
  for (const [key, entry] of Object.entries(inputResponses)) {
    if (!isPlainObject2(entry) || "method" in entry || "result" in entry) {
      droppedKeys.push(key);
      continue;
    }
    accepted[key] = entry;
  }
  return {
    accepted,
    droppedKeys
  };
}
function relatedMessagingUnavailable(member) {
  throw new SdkError(SdkErrorCode.SendFailed, `ctx.mcpReq.${member} is not available while fulfilling an embedded input request: the request is fulfilled locally and has no related peer request`);
}
function synthesizeInputRequestContext(key, method, params, signal, sessionId) {
  return {
    sessionId,
    mcpReq: {
      id: key,
      method,
      _meta: params?.["_meta"],
      requestState: requestStateAccessor(void 0),
      signal,
      send: (() => relatedMessagingUnavailable("send")),
      notify: () => relatedMessagingUnavailable("notify")
    }
  };
}
async function dispatchInputRequest(host, codec, key, entry, signal) {
  if (!isPlainObject2(entry) || typeof entry["method"] !== "string") throw new SdkError(SdkErrorCode.InvalidResult, `Invalid input request '${key}': each inputRequests entry must be an embedded request object with a method`, { key });
  const method = entry["method"];
  if (!codec.hasInputRequestMethod(method)) throw new SdkError(SdkErrorCode.InvalidResult, `Invalid input request '${key}': '${method}' is not an embedded request the ${codec.era} revision defines (expected elicitation/create, sampling/createMessage, or roots/list)`, {
    key,
    method
  });
  const handler = host.getRequestHandler(method);
  if (handler === void 0) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Cannot fulfil input request '${key}': no handler is registered for '${method}' on this client. Declare the corresponding capability and register a handler, or handle input_required results manually.`, {
    key,
    method
  });
  const params = isPlainObject2(entry["params"]) ? entry["params"] : void 0;
  return await handler({
    jsonrpc: "2.0",
    id: key,
    method,
    ...params !== void 0 && { params }
  }, host.buildContext(synthesizeInputRequestContext(key, method, params, signal, host.sessionId)));
}
function buildRetryLegRequestOptions(options, legOptions) {
  return {
    ...options?.signal !== void 0 && { signal: options.signal },
    ...options?.onprogress !== void 0 && { onprogress: options.onprogress },
    ...options?.resetTimeoutOnProgress !== void 0 && { resetTimeoutOnProgress: options.resetTimeoutOnProgress },
    ...options?.headers !== void 0 && { headers: options.headers },
    ...legOptions.timeout !== void 0 && { timeout: legOptions.timeout },
    ...legOptions.maxTotalTimeout !== void 0 && { maxTotalTimeout: legOptions.maxTotalTimeout },
    allowInputRequired: true
  };
}
function runInputRequiredFlow(host, config2, decoded, flow) {
  const { codec, request, options, flowStartedAt } = flow;
  const firstPayload = {
    inputRequests: decoded.inputRequests,
    ...decoded.requestState !== void 0 && { requestState: decoded.requestState }
  };
  const hooks = {
    dispatchInputRequest: (key, entry, signal) => dispatchInputRequest(host, codec, key, entry, signal),
    retry: (params, legOptions) => flow.retry(params, buildRetryLegRequestOptions(options, legOptions))
  };
  return runInputRequiredDriver({
    config: config2,
    method: request.method,
    originalParams: request.params,
    firstPayload,
    flowStartedAt,
    signal: options?.signal,
    requestOptions: {
      ...options?.timeout !== void 0 && { timeout: options.timeout },
      ...options?.maxTotalTimeout !== void 0 && { maxTotalTimeout: options.maxTotalTimeout },
      ...options?.onprogress !== void 0 && { onprogress: options.onprogress }
    },
    hooks
  });
}
function manualInputRequiredValue(decoded) {
  return {
    resultType: "input_required",
    inputRequests: decoded.inputRequests,
    ...decoded.requestState !== void 0 && { requestState: decoded.requestState },
    ...decoded._meta !== void 0 && { _meta: decoded._meta }
  };
}
/*!
* content-type
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
var require_content_type = /* @__PURE__ */ __commonJSMin(((exports) => {
  var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
  var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;
  var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  exports.parse = parse2;
  function parse2(string4) {
    if (!string4) throw new TypeError("argument string is required");
    var header = typeof string4 === "object" ? getcontenttype(string4) : string4;
    if (typeof header !== "string") throw new TypeError("argument string is required to be a string");
    var index = header.indexOf(";");
    var type = index !== -1 ? header.slice(0, index).trim() : header.trim();
    if (!TYPE_REGEXP.test(type)) throw new TypeError("invalid media type");
    var obj = new ContentType(type.toLowerCase());
    if (index !== -1) {
      var key;
      var match;
      var value;
      PARAM_REGEXP.lastIndex = index;
      while (match = PARAM_REGEXP.exec(header)) {
        if (match.index !== index) throw new TypeError("invalid parameter format");
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value.charCodeAt(0) === 34) {
          value = value.slice(1, -1);
          if (value.indexOf("\\") !== -1) value = value.replace(QESC_REGEXP, "$1");
        }
        obj.parameters[key] = value;
      }
      if (index !== header.length) throw new TypeError("invalid parameter format");
    }
    return obj;
  }
  function getcontenttype(obj) {
    var header;
    if (typeof obj.getHeader === "function") header = obj.getHeader("content-type");
    else if (typeof obj.headers === "object") header = obj.headers && obj.headers["content-type"];
    if (typeof header !== "string") throw new TypeError("content-type header is missing from object");
    return header;
  }
  function ContentType(type) {
    this.parameters = /* @__PURE__ */ Object.create(null);
    this.type = type;
  }
}));
var import_content_type = /* @__PURE__ */ __toESM(require_content_type(), 1);
function mediaTypeEssence(header) {
  if (!header) return;
  try {
    return import_content_type.parse(header).type;
  } catch {
    const essence = (header.split(";", 1)[0] ?? "").trim().toLowerCase();
    if (essence === "" || header.slice(essence.length).includes(",")) return;
    return essence;
  }
}
var STDIO_DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;
function normalizeHeaders(headers) {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}
function createFetchWithInit(baseFetch = fetch, baseInit) {
  if (!baseInit) return baseFetch;
  return async (url2, init) => {
    return baseFetch(url2, {
      ...baseInit,
      ...init,
      headers: init?.headers ? {
        ...normalizeHeaders(baseInit.headers),
        ...normalizeHeaders(init.headers)
      } : baseInit.headers
    });
  };
}
var REDIRECT_STATUSES = /* @__PURE__ */ new Set([
  301,
  302,
  303,
  307,
  308
]);
var MAX_REDIRECTS = 5;
function isWithinOrigin(from, to) {
  if (from.protocol === to.protocol && from.host === to.host) return true;
  return from.protocol === "http:" && to.protocol === "https:" && from.hostname === to.hostname && !from.port && !to.port;
}
function redirectTarget(url2, response) {
  const location2 = REDIRECT_STATUSES.has(response.status) ? response.headers?.get("location") : void 0;
  if (!location2) return void 0;
  try {
    return new URL(location2, url2);
  } catch {
    return;
  }
}
var leftToFetch = /* @__PURE__ */ new WeakSet();
function fetchLeavingRedirects(baseFetch) {
  const copy = (url2, init) => baseFetch(url2, init);
  leftToFetch.add(copy);
  return copy;
}
function fetchWithinOrigin(baseFetch) {
  if (leftToFetch.has(baseFetch)) return baseFetch;
  return async (url2, init) => {
    if (init?.redirect === "error" || init?.redirect === "manual") return baseFetch(url2, init);
    const method = (init?.method ?? "GET").toUpperCase();
    let current = url2;
    for (let followed = 0; ; followed++) {
      const response = await baseFetch(current, {
        ...init,
        redirect: "manual"
      });
      const target = redirectTarget(current, response);
      if (!target || followed === MAX_REDIRECTS) return response;
      const from = new URL(current);
      const keepsMethod = method === "GET" || response.status === 307 || response.status === 308;
      const keepsUserinfo = !(target.username || target.password) || target.username === from.username && target.password === from.password;
      if (!keepsMethod || !keepsUserinfo || !isWithinOrigin(from, target)) return response;
      await response.text?.().catch(() => {
      });
      current = target;
    }
  };
}
function unfollowedRedirect(url2, response) {
  if (response.type === "opaqueredirect") return "Redirect not followed: this runtime does not expose where it points";
  const target = redirectTarget(response.url || url2, response);
  if (!target) return void 0;
  target.username = target.password = target.search = target.hash = "";
  if (target.protocol === "http:" && new URL(response.url || url2).protocol === "https:") {
    target.protocol = "https:";
    return `Redirect from https to plain http not followed; try ${target.href} as the endpoint`;
  }
  return `Redirect to ${target.href} not followed; use that URL as the endpoint if it is the intended server`;
}

// node_modules/@modelcontextprotocol/client/dist/cfWorkerProvider-BylNJ1R5.mjs
function deepCompareStrict(a, b) {
  const typeofa = typeof a;
  if (typeofa !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    const length = a.length;
    if (length !== b.length) return false;
    for (let i = 0; i < length; i++) if (!deepCompareStrict(a[i], b[i])) return false;
    return true;
  }
  if (typeofa === "object") {
    if (!a || !b) return a === b;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) if (!deepCompareStrict(a[k], b[k])) return false;
    return true;
  }
  return a === b;
}
function encodePointer(p) {
  return encodeURI(escapePointer(p));
}
function escapePointer(p) {
  return p.replace(/~/g, "~0").replace(/\//g, "~1");
}
var schemaArrayKeyword = {
  prefixItems: true,
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};
var schemaMapKeyword = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependentSchemas: true
};
var ignoredKeyword = {
  id: true,
  $id: true,
  $ref: true,
  $schema: true,
  $anchor: true,
  $vocabulary: true,
  $comment: true,
  default: true,
  enum: true,
  const: true,
  required: true,
  type: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};
var initialBaseURI = typeof self !== "undefined" && self.location && self.location.origin !== "null" ? new URL(self.location.origin + self.location.pathname + location.search) : new URL("https://github.com/cfworker");
function dereference(schema, lookup = /* @__PURE__ */ Object.create(null), baseURI = initialBaseURI, basePointer = "") {
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const id = schema.$id || schema.id;
    if (id) {
      const url2 = new URL(id, baseURI.href);
      if (url2.hash.length > 1) lookup[url2.href] = schema;
      else {
        url2.hash = "";
        if (basePointer === "") baseURI = url2;
        else dereference(schema, lookup, baseURI);
      }
    }
  } else if (schema !== true && schema !== false) return lookup;
  const schemaURI = baseURI.href + (basePointer ? "#" + basePointer : "");
  if (lookup[schemaURI] !== void 0) throw new Error(`Duplicate schema URI "${schemaURI}".`);
  lookup[schemaURI] = schema;
  if (schema === true || schema === false) return lookup;
  if (schema.__absolute_uri__ === void 0) Object.defineProperty(schema, "__absolute_uri__", {
    enumerable: false,
    value: schemaURI
  });
  if (schema.$ref && schema.__absolute_ref__ === void 0) {
    const url2 = new URL(schema.$ref, baseURI.href);
    url2.hash = url2.hash;
    Object.defineProperty(schema, "__absolute_ref__", {
      enumerable: false,
      value: url2.href
    });
  }
  if (schema.$recursiveRef && schema.__absolute_recursive_ref__ === void 0) {
    const url2 = new URL(schema.$recursiveRef, baseURI.href);
    url2.hash = url2.hash;
    Object.defineProperty(schema, "__absolute_recursive_ref__", {
      enumerable: false,
      value: url2.href
    });
  }
  if (schema.$anchor) {
    const url2 = new URL("#" + schema.$anchor, baseURI.href);
    lookup[url2.href] = schema;
  }
  for (let key in schema) {
    if (ignoredKeyword[key]) continue;
    const keyBase = `${basePointer}/${encodePointer(key)}`;
    const subSchema = schema[key];
    if (Array.isArray(subSchema)) {
      if (schemaArrayKeyword[key]) {
        const length = subSchema.length;
        for (let i = 0; i < length; i++) dereference(subSchema[i], lookup, baseURI, `${keyBase}/${i}`);
      }
    } else if (schemaMapKeyword[key]) for (let subKey in subSchema) dereference(subSchema[subKey], lookup, baseURI, `${keyBase}/${encodePointer(subKey)}`);
    else dereference(subSchema, lookup, baseURI, keyBase);
  }
  return lookup;
}
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [
  0,
  31,
  28,
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
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
var URL_ = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
var EMAIL = (input) => {
  if (input[0] === '"') return false;
  const [name, host, ...rest] = input.split("@");
  if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253) return false;
  if (name[0] === "." || name.endsWith(".") || name.includes("..")) return false;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) return false;
  return host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
};
var IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var IPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
var DURATION = (input) => input.length > 1 && input.length < 80 && (/^P\d+([.,]\d+)?W$/.test(input) || /^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) && /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input));
function bind(r) {
  return r.test.bind(r);
}
var format = {
  date: date4,
  time: time3.bind(void 0, false),
  "date-time": date_time,
  duration: DURATION,
  uri,
  "uri-reference": bind(URIREF),
  "uri-template": bind(URITEMPLATE),
  url: bind(URL_),
  email: EMAIL,
  hostname: bind(HOSTNAME),
  ipv4: bind(IPV4),
  ipv6: bind(IPV6),
  regex,
  uuid: bind(UUID),
  "json-pointer": bind(JSON_POINTER),
  "json-pointer-uri-fragment": bind(JSON_POINTER_URI_FRAGMENT),
  "relative-json-pointer": bind(RELATIVE_JSON_POINTER)
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function date4(str) {
  const matches = str.match(DATE);
  if (!matches) return false;
  const year = +matches[1];
  const month = +matches[2];
  const day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
function time3(full, str) {
  const matches = str.match(TIME);
  if (!matches) return false;
  const hour = +matches[1];
  const minute = +matches[2];
  const second = +matches[3];
  const timeZone = !!matches[5];
  return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
}
var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  const dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date4(dateTime[0]) && time3(true, dateTime[1]);
}
var NOT_URI_FRAGMENT = /\/|:/;
var URI_PATTERN = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI_PATTERN.test(str);
}
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    new RegExp(str, "u");
    return true;
  } catch (e) {
    return false;
  }
}
function ucs2length(s) {
  let result = 0;
  let length = s.length;
  let index = 0;
  let charCode;
  while (index < length) {
    result++;
    charCode = s.charCodeAt(index++);
    if (charCode >= 55296 && charCode <= 56319 && index < length) {
      charCode = s.charCodeAt(index);
      if ((charCode & 64512) == 56320) index++;
    }
  }
  return result;
}
function validate2(instance, schema, draft = "2019-09", lookup = dereference(schema), shortCircuit = true, recursiveAnchor = null, instanceLocation = "#", schemaLocation = "#", evaluated = /* @__PURE__ */ Object.create(null)) {
  if (schema === true) return {
    valid: true,
    errors: []
  };
  if (schema === false) return {
    valid: false,
    errors: [{
      instanceLocation,
      keyword: "false",
      keywordLocation: instanceLocation,
      error: "False boolean schema."
    }]
  };
  const rawInstanceType = typeof instance;
  let instanceType;
  switch (rawInstanceType) {
    case "boolean":
    case "number":
    case "string":
      instanceType = rawInstanceType;
      break;
    case "object":
      if (instance === null) instanceType = "null";
      else if (Array.isArray(instance)) instanceType = "array";
      else instanceType = "object";
      break;
    default:
      throw new Error(`Instances of "${rawInstanceType}" type are not supported.`);
  }
  const { $ref, $recursiveRef, $recursiveAnchor, type: $type, const: $const, enum: $enum, required: $required, not: $not, anyOf: $anyOf, allOf: $allOf, oneOf: $oneOf, if: $if, then: $then, else: $else, format: $format, properties: $properties, patternProperties: $patternProperties, additionalProperties: $additionalProperties, unevaluatedProperties: $unevaluatedProperties, minProperties: $minProperties, maxProperties: $maxProperties, propertyNames: $propertyNames, dependentRequired: $dependentRequired, dependentSchemas: $dependentSchemas, dependencies: $dependencies, prefixItems: $prefixItems, items: $items, additionalItems: $additionalItems, unevaluatedItems: $unevaluatedItems, contains: $contains, minContains: $minContains, maxContains: $maxContains, minItems: $minItems, maxItems: $maxItems, uniqueItems: $uniqueItems, minimum: $minimum, maximum: $maximum, exclusiveMinimum: $exclusiveMinimum, exclusiveMaximum: $exclusiveMaximum, multipleOf: $multipleOf, minLength: $minLength, maxLength: $maxLength, pattern: $pattern, __absolute_ref__, __absolute_recursive_ref__ } = schema;
  const errors = [];
  if ($recursiveAnchor === true && recursiveAnchor === null) recursiveAnchor = schema;
  if ($recursiveRef === "#") {
    const refSchema = recursiveAnchor === null ? lookup[__absolute_recursive_ref__] : recursiveAnchor;
    const keywordLocation = `${schemaLocation}/$recursiveRef`;
    const result = validate2(instance, recursiveAnchor === null ? schema : recursiveAnchor, draft, lookup, shortCircuit, refSchema, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) errors.push({
      instanceLocation,
      keyword: "$recursiveRef",
      keywordLocation,
      error: "A subschema had errors."
    }, ...result.errors);
  }
  if ($ref !== void 0) {
    const refSchema = lookup[__absolute_ref__ || $ref];
    if (refSchema === void 0) {
      let message = `Unresolved $ref "${$ref}".`;
      if (__absolute_ref__ && __absolute_ref__ !== $ref) message += `  Absolute URI "${__absolute_ref__}".`;
      message += `
Known schemas:
- ${Object.keys(lookup).join("\n- ")}`;
      throw new Error(message);
    }
    const keywordLocation = `${schemaLocation}/$ref`;
    const result = validate2(instance, refSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) errors.push({
      instanceLocation,
      keyword: "$ref",
      keywordLocation,
      error: "A subschema had errors."
    }, ...result.errors);
    if (draft === "4" || draft === "7") return {
      valid: errors.length === 0,
      errors
    };
  }
  if (Array.isArray($type)) {
    let length = $type.length;
    let valid = false;
    for (let i = 0; i < length; i++) if (instanceType === $type[i] || $type[i] === "integer" && instanceType === "number" && instance % 1 === 0 && instance === instance) {
      valid = true;
      break;
    }
    if (!valid) errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type.join('", "')}".`
    });
  } else if ($type === "integer") {
    if (instanceType !== "number" || instance % 1 || instance !== instance) errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
    });
  } else if ($type !== void 0 && instanceType !== $type) errors.push({
    instanceLocation,
    keyword: "type",
    keywordLocation: `${schemaLocation}/type`,
    error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
  });
  if ($const !== void 0) {
    if (instanceType === "object" || instanceType === "array") {
      if (!deepCompareStrict(instance, $const)) errors.push({
        instanceLocation,
        keyword: "const",
        keywordLocation: `${schemaLocation}/const`,
        error: `Instance does not match ${JSON.stringify($const)}.`
      });
    } else if (instance !== $const) errors.push({
      instanceLocation,
      keyword: "const",
      keywordLocation: `${schemaLocation}/const`,
      error: `Instance does not match ${JSON.stringify($const)}.`
    });
  }
  if ($enum !== void 0) {
    if (instanceType === "object" || instanceType === "array") {
      if (!$enum.some((value) => deepCompareStrict(instance, value))) errors.push({
        instanceLocation,
        keyword: "enum",
        keywordLocation: `${schemaLocation}/enum`,
        error: `Instance does not match any of ${JSON.stringify($enum)}.`
      });
    } else if (!$enum.some((value) => instance === value)) errors.push({
      instanceLocation,
      keyword: "enum",
      keywordLocation: `${schemaLocation}/enum`,
      error: `Instance does not match any of ${JSON.stringify($enum)}.`
    });
  }
  if ($not !== void 0) {
    const keywordLocation = `${schemaLocation}/not`;
    if (validate2(instance, $not, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation).valid) errors.push({
      instanceLocation,
      keyword: "not",
      keywordLocation,
      error: 'Instance matched "not" schema.'
    });
  }
  let subEvaluateds = [];
  if ($anyOf !== void 0) {
    const keywordLocation = `${schemaLocation}/anyOf`;
    const errorsLength = errors.length;
    let anyValid = false;
    for (let i = 0; i < $anyOf.length; i++) {
      const subSchema = $anyOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      anyValid = anyValid || result.valid;
      if (result.valid) subEvaluateds.push(subEvaluated);
    }
    if (anyValid) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "anyOf",
      keywordLocation,
      error: "Instance does not match any subschemas."
    });
  }
  if ($allOf !== void 0) {
    const keywordLocation = `${schemaLocation}/allOf`;
    const errorsLength = errors.length;
    let allValid = true;
    for (let i = 0; i < $allOf.length; i++) {
      const subSchema = $allOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      allValid = allValid && result.valid;
      if (result.valid) subEvaluateds.push(subEvaluated);
    }
    if (allValid) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "allOf",
      keywordLocation,
      error: `Instance does not match every subschema.`
    });
  }
  if ($oneOf !== void 0) {
    const keywordLocation = `${schemaLocation}/oneOf`;
    const errorsLength = errors.length;
    const matches = $oneOf.filter((subSchema, i) => {
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      if (result.valid) subEvaluateds.push(subEvaluated);
      return result.valid;
    }).length;
    if (matches === 1) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "oneOf",
      keywordLocation,
      error: `Instance does not match exactly one subschema (${matches} matches).`
    });
  }
  if (instanceType === "object" || instanceType === "array") Object.assign(evaluated, ...subEvaluateds);
  if ($if !== void 0) {
    const keywordLocation = `${schemaLocation}/if`;
    if (validate2(instance, $if, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated).valid) {
      if ($then !== void 0) {
        const thenResult = validate2(instance, $then, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/then`, evaluated);
        if (!thenResult.valid) errors.push({
          instanceLocation,
          keyword: "if",
          keywordLocation,
          error: `Instance does not match "then" schema.`
        }, ...thenResult.errors);
      }
    } else if ($else !== void 0) {
      const elseResult = validate2(instance, $else, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/else`, evaluated);
      if (!elseResult.valid) errors.push({
        instanceLocation,
        keyword: "if",
        keywordLocation,
        error: `Instance does not match "else" schema.`
      }, ...elseResult.errors);
    }
  }
  if (instanceType === "object") {
    if ($required !== void 0) {
      for (const key of $required) if (!(key in instance)) errors.push({
        instanceLocation,
        keyword: "required",
        keywordLocation: `${schemaLocation}/required`,
        error: `Instance does not have required property "${key}".`
      });
    }
    const keys = Object.keys(instance);
    if ($minProperties !== void 0 && keys.length < $minProperties) errors.push({
      instanceLocation,
      keyword: "minProperties",
      keywordLocation: `${schemaLocation}/minProperties`,
      error: `Instance does not have at least ${$minProperties} properties.`
    });
    if ($maxProperties !== void 0 && keys.length > $maxProperties) errors.push({
      instanceLocation,
      keyword: "maxProperties",
      keywordLocation: `${schemaLocation}/maxProperties`,
      error: `Instance does not have at least ${$maxProperties} properties.`
    });
    if ($propertyNames !== void 0) {
      const keywordLocation = `${schemaLocation}/propertyNames`;
      for (const key in instance) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(key, $propertyNames, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "propertyNames",
          keywordLocation,
          error: `Property name "${key}" does not match schema.`
        }, ...result.errors);
      }
    }
    if ($dependentRequired !== void 0) {
      const keywordLocation = `${schemaLocation}/dependantRequired`;
      for (const key in $dependentRequired) if (key in instance) {
        const required2 = $dependentRequired[key];
        for (const dependantKey of required2) if (!(dependantKey in instance)) errors.push({
          instanceLocation,
          keyword: "dependentRequired",
          keywordLocation,
          error: `Instance has "${key}" but does not have "${dependantKey}".`
        });
      }
    }
    if ($dependentSchemas !== void 0) for (const key in $dependentSchemas) {
      const keywordLocation = `${schemaLocation}/dependentSchemas`;
      if (key in instance) {
        const result = validate2(instance, $dependentSchemas[key], draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`, evaluated);
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "dependentSchemas",
          keywordLocation,
          error: `Instance has "${key}" but does not match dependant schema.`
        }, ...result.errors);
      }
    }
    if ($dependencies !== void 0) {
      const keywordLocation = `${schemaLocation}/dependencies`;
      for (const key in $dependencies) if (key in instance) {
        const propsOrSchema = $dependencies[key];
        if (Array.isArray(propsOrSchema)) {
          for (const dependantKey of propsOrSchema) if (!(dependantKey in instance)) errors.push({
            instanceLocation,
            keyword: "dependencies",
            keywordLocation,
            error: `Instance has "${key}" but does not have "${dependantKey}".`
          });
        } else {
          const result = validate2(instance, propsOrSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`);
          if (!result.valid) errors.push({
            instanceLocation,
            keyword: "dependencies",
            keywordLocation,
            error: `Instance has "${key}" but does not match dependant schema.`
          }, ...result.errors);
        }
      }
    }
    const thisEvaluated = /* @__PURE__ */ Object.create(null);
    let stop = false;
    if ($properties !== void 0) {
      const keywordLocation = `${schemaLocation}/properties`;
      for (const key in $properties) {
        if (!(key in instance)) continue;
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $properties[key], draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(key)}`);
        if (result.valid) evaluated[key] = thisEvaluated[key] = true;
        else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "properties",
            keywordLocation,
            error: `Property "${key}" does not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
    }
    if (!stop && $patternProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/patternProperties`;
      for (const pattern in $patternProperties) {
        const regex$1 = new RegExp(pattern, "u");
        const subSchema = $patternProperties[pattern];
        for (const key in instance) {
          if (!regex$1.test(key)) continue;
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate2(instance[key], subSchema, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(pattern)}`);
          if (result.valid) evaluated[key] = thisEvaluated[key] = true;
          else {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "patternProperties",
              keywordLocation,
              error: `Property "${key}" matches pattern "${pattern}" but does not match associated schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if (!stop && $additionalProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/additionalProperties`;
      for (const key in instance) {
        if (thisEvaluated[key]) continue;
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $additionalProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) evaluated[key] = true;
        else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "additionalProperties",
            keywordLocation,
            error: `Property "${key}" does not match additional properties schema.`
          }, ...result.errors);
        }
      }
    } else if (!stop && $unevaluatedProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/unevaluatedProperties`;
      for (const key in instance) if (!evaluated[key]) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $unevaluatedProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) evaluated[key] = true;
        else errors.push({
          instanceLocation,
          keyword: "unevaluatedProperties",
          keywordLocation,
          error: `Property "${key}" does not match unevaluated properties schema.`
        }, ...result.errors);
      }
    }
  } else if (instanceType === "array") {
    if ($maxItems !== void 0 && instance.length > $maxItems) errors.push({
      instanceLocation,
      keyword: "maxItems",
      keywordLocation: `${schemaLocation}/maxItems`,
      error: `Array has too many items (${instance.length} > ${$maxItems}).`
    });
    if ($minItems !== void 0 && instance.length < $minItems) errors.push({
      instanceLocation,
      keyword: "minItems",
      keywordLocation: `${schemaLocation}/minItems`,
      error: `Array has too few items (${instance.length} < ${$minItems}).`
    });
    const length = instance.length;
    let i = 0;
    let stop = false;
    if ($prefixItems !== void 0) {
      const keywordLocation = `${schemaLocation}/prefixItems`;
      const length2 = Math.min($prefixItems.length, length);
      for (; i < length2; i++) {
        const result = validate2(instance[i], $prefixItems[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "prefixItems",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
    }
    if ($items !== void 0) {
      const keywordLocation = `${schemaLocation}/items`;
      if (Array.isArray($items)) {
        const length2 = Math.min($items.length, length);
        for (; i < length2; i++) {
          const result = validate2(instance[i], $items[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop) break;
          }
        }
      } else for (; i < length; i++) {
        const result = validate2(instance[i], $items, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "items",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
      if (!stop && $additionalItems !== void 0) {
        const keywordLocation$1 = `${schemaLocation}/additionalItems`;
        for (; i < length; i++) {
          const result = validate2(instance[i], $additionalItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation$1);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "additionalItems",
              keywordLocation: keywordLocation$1,
              error: `Items did not match additional items schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($contains !== void 0) if (length === 0 && $minContains === void 0) errors.push({
      instanceLocation,
      keyword: "contains",
      keywordLocation: `${schemaLocation}/contains`,
      error: `Array is empty. It must contain at least one item matching the schema.`
    });
    else if ($minContains !== void 0 && length < $minContains) errors.push({
      instanceLocation,
      keyword: "minContains",
      keywordLocation: `${schemaLocation}/minContains`,
      error: `Array has less items (${length}) than minContains (${$minContains}).`
    });
    else {
      const keywordLocation = `${schemaLocation}/contains`;
      const errorsLength = errors.length;
      let contained = 0;
      for (let j = 0; j < length; j++) {
        const result = validate2(instance[j], $contains, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${j}`, keywordLocation);
        if (result.valid) {
          evaluated[j] = true;
          contained++;
        } else errors.push(...result.errors);
      }
      if (contained >= ($minContains || 0)) errors.length = errorsLength;
      if ($minContains === void 0 && $maxContains === void 0 && contained === 0) errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "contains",
        keywordLocation,
        error: `Array does not contain item matching schema.`
      });
      else if ($minContains !== void 0 && contained < $minContains) errors.push({
        instanceLocation,
        keyword: "minContains",
        keywordLocation: `${schemaLocation}/minContains`,
        error: `Array must contain at least ${$minContains} items matching schema. Only ${contained} items were found.`
      });
      else if ($maxContains !== void 0 && contained > $maxContains) errors.push({
        instanceLocation,
        keyword: "maxContains",
        keywordLocation: `${schemaLocation}/maxContains`,
        error: `Array may contain at most ${$maxContains} items matching schema. ${contained} items were found.`
      });
    }
    if (!stop && $unevaluatedItems !== void 0) {
      const keywordLocation = `${schemaLocation}/unevaluatedItems`;
      for (; i < length; i++) {
        if (evaluated[i]) continue;
        const result = validate2(instance[i], $unevaluatedItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "unevaluatedItems",
          keywordLocation,
          error: `Items did not match unevaluated items schema.`
        }, ...result.errors);
      }
    }
    if ($uniqueItems) for (let j = 0; j < length; j++) {
      const a = instance[j];
      const ao = typeof a === "object" && a !== null;
      for (let k = 0; k < length; k++) {
        if (j === k) continue;
        const b = instance[k];
        if (a === b || ao && typeof b === "object" && b !== null && deepCompareStrict(a, b)) {
          errors.push({
            instanceLocation,
            keyword: "uniqueItems",
            keywordLocation: `${schemaLocation}/uniqueItems`,
            error: `Duplicate items at indexes ${j} and ${k}.`
          });
          j = Number.MAX_SAFE_INTEGER;
          k = Number.MAX_SAFE_INTEGER;
        }
      }
    }
  } else if (instanceType === "number") {
    if (draft === "4") {
      if ($minimum !== void 0 && ($exclusiveMinimum === true && instance <= $minimum || instance < $minimum)) errors.push({
        instanceLocation,
        keyword: "minimum",
        keywordLocation: `${schemaLocation}/minimum`,
        error: `${instance} is less than ${$exclusiveMinimum ? "or equal to " : ""} ${$minimum}.`
      });
      if ($maximum !== void 0 && ($exclusiveMaximum === true && instance >= $maximum || instance > $maximum)) errors.push({
        instanceLocation,
        keyword: "maximum",
        keywordLocation: `${schemaLocation}/maximum`,
        error: `${instance} is greater than ${$exclusiveMaximum ? "or equal to " : ""} ${$maximum}.`
      });
    } else {
      if ($minimum !== void 0 && instance < $minimum) errors.push({
        instanceLocation,
        keyword: "minimum",
        keywordLocation: `${schemaLocation}/minimum`,
        error: `${instance} is less than ${$minimum}.`
      });
      if ($maximum !== void 0 && instance > $maximum) errors.push({
        instanceLocation,
        keyword: "maximum",
        keywordLocation: `${schemaLocation}/maximum`,
        error: `${instance} is greater than ${$maximum}.`
      });
      if ($exclusiveMinimum !== void 0 && instance <= $exclusiveMinimum) errors.push({
        instanceLocation,
        keyword: "exclusiveMinimum",
        keywordLocation: `${schemaLocation}/exclusiveMinimum`,
        error: `${instance} is less than ${$exclusiveMinimum}.`
      });
      if ($exclusiveMaximum !== void 0 && instance >= $exclusiveMaximum) errors.push({
        instanceLocation,
        keyword: "exclusiveMaximum",
        keywordLocation: `${schemaLocation}/exclusiveMaximum`,
        error: `${instance} is greater than or equal to ${$exclusiveMaximum}.`
      });
    }
    if ($multipleOf !== void 0) {
      const remainder = instance % $multipleOf;
      if (Math.abs(0 - remainder) >= 11920929e-14 && Math.abs($multipleOf - remainder) >= 11920929e-14) errors.push({
        instanceLocation,
        keyword: "multipleOf",
        keywordLocation: `${schemaLocation}/multipleOf`,
        error: `${instance} is not a multiple of ${$multipleOf}.`
      });
    }
  } else if (instanceType === "string") {
    const length = $minLength === void 0 && $maxLength === void 0 ? 0 : ucs2length(instance);
    if ($minLength !== void 0 && length < $minLength) errors.push({
      instanceLocation,
      keyword: "minLength",
      keywordLocation: `${schemaLocation}/minLength`,
      error: `String is too short (${length} < ${$minLength}).`
    });
    if ($maxLength !== void 0 && length > $maxLength) errors.push({
      instanceLocation,
      keyword: "maxLength",
      keywordLocation: `${schemaLocation}/maxLength`,
      error: `String is too long (${length} > ${$maxLength}).`
    });
    if ($pattern !== void 0 && !new RegExp($pattern, "u").test(instance)) errors.push({
      instanceLocation,
      keyword: "pattern",
      keywordLocation: `${schemaLocation}/pattern`,
      error: `String does not match pattern.`
    });
    if ($format !== void 0 && format[$format] && !format[$format](instance)) errors.push({
      instanceLocation,
      keyword: "format",
      keywordLocation: `${schemaLocation}/format`,
      error: `String does not match format "${$format}".`
    });
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
var Validator = class {
  schema;
  draft;
  shortCircuit;
  lookup;
  constructor(schema, draft = "2019-09", shortCircuit = true) {
    this.schema = schema;
    this.draft = draft;
    this.shortCircuit = shortCircuit;
    this.lookup = dereference(schema);
  }
  validate(instance) {
    return validate2(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
  }
  addSchema(schema, id) {
    if (id) schema = {
      ...schema,
      $id: id
    };
    dereference(schema, this.lookup);
  }
};
var CfWorkerJsonSchemaValidator = class {
  shortcircuit;
  /** Caller-supplied draft; when set, the `$schema` check is skipped (caller owns dialect). */
  draft;
  /**
  * Create a validator
  *
  * @param options - Configuration options
  * @param options.shortcircuit - If `true`, stop validation after first error (default: `true`)
  * @param options.draft - JSON Schema draft version to force for every schema. When set, the
  * `$schema` dispatch is skipped. When omitted, the provider dispatches on each schema's
  * declared `$schema` (2020-12, 2019-09, draft-07, draft-06; absent means 2020-12) and rejects others.
  */
  constructor(options) {
    this.shortcircuit = options?.shortcircuit ?? true;
    this.draft = options?.draft;
  }
  /**
  * Pick the engine draft for a schema's declared dialect (a caller-forced `{draft}` bypasses
  * this — do not second-guess by `$schema`). No `$schema` or 2020-12 → `'2020-12'`; 2019-09 →
  * `'2019-09'`; draft-07 or draft-06 → `'7'`; anything else → `Error`.
  */
  _draftFor(schema) {
    const dialect = declaredDialect(schema, "pass an explicit { draft } to CfWorkerJsonSchemaValidator to validate other dialects.");
    return dialect === "draft-7" ? "7" : dialect;
  }
  /**
  * Create a validator for the given JSON Schema
  *
  * Unlike AJV, this validator is not cached internally
  *
  * @param schema - Standard JSON Schema object
  * @returns A validator function that validates input data
  */
  getValidator(schema) {
    const validator = new Validator(schema, this.draft ?? this._draftFor(schema), this.shortcircuit);
    return (input) => {
      const result = validator.validate(input);
      return result.valid ? {
        valid: true,
        data: input,
        errorMessage: void 0
      } : {
        valid: false,
        data: void 0,
        errorMessage: result.errors.map((err) => `${err.instanceLocation}: ${err.error}`).join("; ")
      };
    };
  }
};

// node_modules/@modelcontextprotocol/client/dist/shimsBrowser.mjs
var CORS_IS_POSSIBLE = true;

// node_modules/pkce-challenge/dist/index.browser.js
var crypto;
crypto = globalThis.crypto;
async function getRandomValues(size) {
  return (await crypto).getRandomValues(new Uint8Array(size));
}
async function random(size) {
  const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  const evenDistCutoff = Math.pow(2, 8) - Math.pow(2, 8) % mask.length;
  let result = "";
  while (result.length < size) {
    const randomBytes = await getRandomValues(size - result.length);
    for (const randomByte of randomBytes) {
      if (randomByte < evenDistCutoff) {
        result += mask[randomByte % mask.length];
      }
    }
  }
  return result;
}
async function generateVerifier(length) {
  return await random(length);
}
async function generateChallenge(code_verifier) {
  const buffer = await (await crypto).subtle.digest("SHA-256", new TextEncoder().encode(code_verifier));
  return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}
async function pkceChallenge(length) {
  if (!length)
    length = 43;
  if (length < 43 || length > 128) {
    throw `Expected a length between 43 and 128. Received ${length}.`;
  }
  const verifier = await generateVerifier(length);
  const challenge = await generateChallenge(verifier);
  return {
    code_verifier: verifier,
    code_challenge: challenge
  };
}

// node_modules/eventsource-parser/dist/index.js
var ParseError = class extends Error {
  constructor(message, options) {
    super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
  }
};
var LF = 10;
var CR = 13;
var SPACE = 32;
function noop(_arg) {
}
function createParser(config2) {
  if (typeof config2 == "function")
    throw new TypeError(
      "`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?"
    );
  const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config2, pendingFragments = [];
  let pendingFragmentsLength = 0, isFirstChunk = true, id, data = "", dataLines = 0, eventType, terminated = false;
  function feed(chunk) {
    if (terminated)
      throw new Error(
        "Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing."
      );
    if (isFirstChunk && (isFirstChunk = false, chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191 && (chunk = chunk.slice(3))), pendingFragments.length === 0) {
      const trailing2 = processLines(chunk);
      trailing2 !== "" && (pendingFragments.push(trailing2), pendingFragmentsLength = trailing2.length), checkBufferSize();
      return;
    }
    if (chunk.indexOf(`
`) === -1 && chunk.indexOf("\r") === -1) {
      pendingFragments.push(chunk), pendingFragmentsLength += chunk.length, checkBufferSize();
      return;
    }
    pendingFragments.push(chunk);
    const input = pendingFragments.join("");
    pendingFragments.length = 0, pendingFragmentsLength = 0;
    const trailing = processLines(input);
    trailing !== "" && (pendingFragments.push(trailing), pendingFragmentsLength = trailing.length), checkBufferSize();
  }
  function checkBufferSize() {
    maxBufferSize !== void 0 && (pendingFragmentsLength + data.length <= maxBufferSize || (terminated = true, pendingFragments.length = 0, pendingFragmentsLength = 0, id = void 0, data = "", dataLines = 0, eventType = void 0, onError(
      new ParseError(`Buffered data exceeded max buffer size of ${maxBufferSize} characters`, {
        type: "max-buffer-size-exceeded"
      })
    )));
  }
  function processLines(chunk) {
    let searchIndex = 0;
    if (chunk.indexOf("\r") === -1) {
      let lfIndex = chunk.indexOf(`
`, searchIndex);
      for (; lfIndex !== -1; ) {
        if (searchIndex === lfIndex) {
          dataLines > 0 && onEvent({ id, event: eventType, data }), id = void 0, data = "", dataLines = 0, eventType = void 0, searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
          continue;
        }
        const firstCharCode = chunk.charCodeAt(searchIndex);
        if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
          const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5, value = chunk.slice(valueStart, lfIndex);
          if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
            onEvent({ id, event: eventType, data: value }), id = void 0, data = "", eventType = void 0, searchIndex = lfIndex + 2, lfIndex = chunk.indexOf(`
`, searchIndex);
            continue;
          }
          data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
        } else isEventPrefix(chunk, searchIndex, firstCharCode) ? eventType = chunk.slice(
          chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6,
          lfIndex
        ) || void 0 : parseLine(chunk, searchIndex, lfIndex);
        searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
      }
      return chunk.slice(searchIndex);
    }
    for (; searchIndex < chunk.length; ) {
      const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
      let lineEnd = -1;
      if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = crIndex < lfIndex ? crIndex : lfIndex : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1)
        break;
      parseLine(chunk, searchIndex, lineEnd), searchIndex = lineEnd + 1, chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF && searchIndex++;
    }
    return chunk.slice(searchIndex);
  }
  function parseLine(chunk, start, end) {
    if (start === end) {
      dispatchEvent();
      return;
    }
    const firstCharCode = chunk.charCodeAt(start);
    if (isDataPrefix(chunk, start, firstCharCode)) {
      const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5, value2 = chunk.slice(valueStart, end);
      data = dataLines === 0 ? value2 : `${data}
${value2}`, dataLines++;
      return;
    }
    if (isEventPrefix(chunk, start, firstCharCode)) {
      eventType = chunk.slice(chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6, end) || void 0;
      return;
    }
    if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
      const value2 = chunk.slice(chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3, end);
      value2.includes("\0") || (id = value2);
      return;
    }
    if (firstCharCode === 58) {
      if (onComment) {
        const line2 = chunk.slice(start, end);
        onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
      }
      return;
    }
    const line = chunk.slice(start, end), fieldSeparatorIndex = line.indexOf(":");
    if (fieldSeparatorIndex === -1) {
      processField(line, "", line);
      return;
    }
    const field = line.slice(0, fieldSeparatorIndex), offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1, value = line.slice(fieldSeparatorIndex + offset);
    processField(field, value, line);
  }
  function processField(field, value, line) {
    switch (field) {
      case "event":
        eventType = value || void 0;
        break;
      case "data":
        data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
        break;
      case "id":
        value.includes("\0") || (id = value);
        break;
      case "retry":
        /^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(
          new ParseError(`Invalid \`retry\` value: "${value}"`, {
            type: "invalid-retry",
            value,
            line
          })
        );
        break;
      default:
        onError(
          new ParseError(
            `Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`,
            { type: "unknown-field", field, value, line }
          )
        );
        break;
    }
  }
  function dispatchEvent() {
    dataLines > 0 && onEvent({
      id,
      event: eventType,
      data
    }), id = void 0, data = "", dataLines = 0, eventType = void 0;
  }
  function reset(options = {}) {
    if (options.consume && pendingFragments.length > 0) {
      const incompleteLine = pendingFragments.join("");
      parseLine(incompleteLine, 0, incompleteLine.length);
    }
    isFirstChunk = true, id = void 0, data = "", dataLines = 0, eventType = void 0, pendingFragments.length = 0, pendingFragmentsLength = 0, terminated = false;
  }
  return { feed, reset };
}
function isDataPrefix(chunk, i, firstCharCode) {
  return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
}
function isEventPrefix(chunk, i, firstCharCode) {
  return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
}

// node_modules/eventsource-parser/dist/stream.js
var EventSourceParserStream = class extends TransformStream {
  constructor({ onError, onRetry, onComment, maxBufferSize } = {}) {
    let parser;
    super({
      start(controller) {
        parser = createParser({
          onEvent: (event) => {
            controller.enqueue(event);
          },
          onError(error2) {
            typeof onError == "function" && onError(error2), (onError === "terminate" || error2.type === "max-buffer-size-exceeded") && controller.error(error2);
          },
          onRetry,
          onComment,
          maxBufferSize
        });
      },
      transform(chunk) {
        parser.feed(chunk);
      }
    });
  }
};

// node_modules/@modelcontextprotocol/client/dist/index.mjs
var OAuthClientFlowError = class extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.OAuthClientFlowError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(message) {
    super(message);
    this.name = new.target.name;
    stampErrorBrands(this, new.target);
  }
};
var IssuerMismatchError = class extends OAuthClientFlowError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.IssuerMismatchError" });
  }
  /** Which check failed — metadata echo (RFC 8414 §3.3) or authorization-response `iss` (RFC 9207). */
  kind;
  /** The issuer the client expected (from validated metadata / discovery input). */
  expected;
  /** The issuer value that was received. Attacker-controllable on the `'authorization_response'` path. */
  received;
  constructor(kind, expected, received) {
    super(`Issuer mismatch in ${kind === "metadata" ? "authorization server metadata (RFC 8414 \xA73.3)" : "authorization response (RFC 9207)"}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(received)}`);
    this.kind = kind;
    this.expected = expected;
    this.received = received;
  }
};
var RegistrationRejectedError = class extends OAuthClientFlowError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.RegistrationRejectedError" });
  }
  /** HTTP status code returned by the registration endpoint. */
  status;
  /** Raw response body text (typically an RFC 7591 error JSON document). */
  body;
  /** The exact client metadata that was POSTed (after SDK defaults were applied). */
  submittedMetadata;
  constructor(args) {
    super(`Dynamic Client Registration rejected (HTTP ${args.status}): ${args.body}`);
    this.status = args.status;
    this.body = args.body;
    this.submittedMetadata = args.submittedMetadata;
  }
};
var InsecureTokenEndpointError = class extends OAuthClientFlowError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.InsecureTokenEndpointError" });
  }
  /** The token endpoint URL that was rejected. */
  tokenEndpoint;
  constructor(tokenEndpoint) {
    super(`Refusing to send credentials to non-https token endpoint '${tokenEndpoint}'. OAuth token requests MUST use TLS (localhost / *.localhost / 127.0.0.1 / ::1 are exempt).`);
    this.tokenEndpoint = tokenEndpoint;
  }
};
var AuthorizationServerMismatchError = class extends OAuthClientFlowError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.AuthorizationServerMismatchError" });
  }
  constructor(recordedIssuer, currentIssuer) {
    super(`Authorization server mismatch: credentials are bound to ${JSON.stringify(recordedIssuer)} but this call resolved ${JSON.stringify(currentIssuer)}; refusing to present them to a different authorization server`);
    this.recordedIssuer = recordedIssuer;
    this.currentIssuer = currentIssuer;
  }
};
var InsufficientScopeError = class extends OAuthClientFlowError {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.InsufficientScopeError" });
  }
  /** The `scope` value from the `WWW-Authenticate` challenge — the scopes the resource server says are required. */
  requiredScope;
  /** The `resource_metadata` URL from the `WWW-Authenticate` challenge, if present. */
  resourceMetadataUrl;
  /** The `error_description` from the `WWW-Authenticate` challenge, if present. */
  errorDescription;
  constructor(init) {
    super(`Insufficient scope${init.requiredScope ? `: required "${init.requiredScope}"` : ""}`);
    this.requiredScope = init.requiredScope;
    this.resourceMetadataUrl = init.resourceMetadataUrl;
    this.errorDescription = init.errorDescription;
  }
};
function discardIfIssuerMismatch(stored, issuer, opts) {
  if (!stored) return void 0;
  if (typeof stored.issuer !== "string") {
    if (opts?.canPersistStamp !== false) console.warn("[mcp-sdk] SEP-2352: stored OAuth credential has no 'issuer' stamp (pre-upgrade storage or provider not round-tripping the value). SEP-2352 isolation is inactive for this read; ensure your provider round-trips the issuer field.");
    return stored.issuer === void 0 ? stored : {
      ...stored,
      issuer: void 0
    };
  }
  return issuersMatch(stored.issuer, issuer) ? stored : void 0;
}
function issuersMatch(a, b) {
  return a === b || a.endsWith("/") && a.slice(0, -1) === b || b.endsWith("/") && b.slice(0, -1) === a;
}
function isOAuthClientProvider(provider) {
  if (provider == null) return false;
  const p = provider;
  return typeof p.tokens === "function" && typeof p.clientInformation === "function";
}
async function handleOAuthUnauthorized(provider, ctx, extraAuthOptions) {
  const { resourceMetadataUrl, scope } = extractWWWAuthenticateParams(ctx.response);
  if (await auth(provider, {
    serverUrl: ctx.serverUrl,
    resourceMetadataUrl,
    scope,
    fetchFn: ctx.fetchFn,
    ...extraAuthOptions
  }) !== "AUTHORIZED") throw new UnauthorizedError();
}
function adaptOAuthProvider(provider, extraAuthOptions) {
  return {
    token: async () => {
      return (await provider.tokens())?.access_token;
    },
    onUnauthorized: async (ctx) => handleOAuthUnauthorized(provider, ctx, extraAuthOptions)
  };
}
var UnauthorizedError = class extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.UnauthorizedError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(message) {
    super(message ?? "Unauthorized");
    this.name = "UnauthorizedError";
    stampErrorBrands(this, new.target);
  }
};
function isIssParameterSupported(metadata) {
  return metadata?.authorization_response_iss_parameter_supported === true;
}
function validateAuthorizationResponseIssuer({ iss, expectedIssuer, issParameterSupported }) {
  if (expectedIssuer === void 0) return;
  if (iss === void 0) {
    if (issParameterSupported) throw new IssuerMismatchError("authorization_response", expectedIssuer, void 0);
    return;
  }
  if (iss !== expectedIssuer) throw new IssuerMismatchError("authorization_response", expectedIssuer, iss);
}
function computeScopeUnion(...scopes) {
  const seen = /* @__PURE__ */ new Set();
  for (const scope of scopes) {
    if (!scope) continue;
    for (const token of scope.split(/\s+/)) if (token) seen.add(token);
  }
  return seen.size > 0 ? [...seen].join(" ") : void 0;
}
function isStrictScopeSuperset(union2, current) {
  if (!union2) return false;
  const currentSet = new Set((current ?? "").split(/\s+/).filter(Boolean));
  for (const token of union2.split(/\s+/)) if (token && !currentSet.has(token)) return true;
  return false;
}
async function resolveAuthorizationCallbackParams(codeOrParams, iss, provider, serverUrl, opts) {
  if (typeof codeOrParams === "string") return {
    authorizationCode: codeOrParams,
    iss
  };
  const issParam = codeOrParams.get("iss") ?? void 0;
  const code = codeOrParams.get("code");
  if (code) return {
    authorizationCode: code,
    iss: issParam
  };
  let metadata = (await provider.discoveryState?.())?.authorizationServerMetadata;
  if (!metadata) try {
    metadata = (await discoverOAuthServerInfo(serverUrl, opts)).authorizationServerMetadata;
  } catch {
    metadata = void 0;
  }
  if (!metadata) throw new UnauthorizedError("Authorization callback failed and the issuer could not be verified");
  validateAuthorizationResponseIssuer({
    iss: issParam,
    expectedIssuer: metadata.issuer,
    issParameterSupported: isIssParameterSupported(metadata)
  });
  const error2 = codeOrParams.get("error");
  if (error2) throw new OAuthError(error2, codeOrParams.get("error_description") ?? error2, codeOrParams.get("error_uri") ?? void 0);
  throw new UnauthorizedError("Authorization callback contained neither `code` nor `error`");
}
function isClientAuthMethod(method) {
  return [
    "client_secret_basic",
    "client_secret_post",
    "none"
  ].includes(method);
}
var AUTHORIZATION_CODE_RESPONSE_TYPE = "code";
var AUTHORIZATION_CODE_CHALLENGE_METHOD = "S256";
function selectClientAuthMethod(clientInformation, supportedMethods) {
  const hasClientSecret = clientInformation.client_secret !== void 0;
  if ("token_endpoint_auth_method" in clientInformation && clientInformation.token_endpoint_auth_method && isClientAuthMethod(clientInformation.token_endpoint_auth_method) && (supportedMethods.length === 0 || supportedMethods.includes(clientInformation.token_endpoint_auth_method))) return clientInformation.token_endpoint_auth_method;
  if (supportedMethods.length === 0) return hasClientSecret ? "client_secret_basic" : "none";
  if (hasClientSecret && supportedMethods.includes("client_secret_basic")) return "client_secret_basic";
  if (hasClientSecret && supportedMethods.includes("client_secret_post")) return "client_secret_post";
  if (supportedMethods.includes("none")) return "none";
  return hasClientSecret ? "client_secret_post" : "none";
}
function applyClientAuthentication(method, clientInformation, headers, params) {
  const { client_id, client_secret } = clientInformation;
  switch (method) {
    case "client_secret_basic":
      applyBasicAuth(client_id, client_secret, headers);
      return;
    case "client_secret_post":
      applyPostAuth(client_id, client_secret, params);
      return;
    case "none":
      applyPublicAuth(client_id, params);
      return;
    default:
      throw new Error(`Unsupported client authentication method: ${method}`);
  }
}
function applyBasicAuth(clientId, clientSecret, headers) {
  if (!clientSecret) throw new Error("client_secret_basic authentication requires a client_secret");
  const credentials = btoa(`${clientId}:${clientSecret}`);
  headers.set("Authorization", `Basic ${credentials}`);
}
function applyPostAuth(clientId, clientSecret, params) {
  params.set("client_id", clientId);
  if (clientSecret) params.set("client_secret", clientSecret);
}
function applyPublicAuth(clientId, params) {
  params.set("client_id", clientId);
}
function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}
function assertSecureTokenEndpoint(tokenEndpoint) {
  const url2 = new URL(String(tokenEndpoint));
  if (url2.protocol !== "https:" && !isLoopbackHost(url2.hostname)) throw new InsecureTokenEndpointError(url2.href);
  return url2;
}
function deriveApplicationType(redirectUris) {
  for (const raw of redirectUris ?? []) {
    let url2;
    try {
      url2 = new URL(raw);
    } catch {
      continue;
    }
    if (url2.protocol !== "http:" && url2.protocol !== "https:") return "native";
    if (isLoopbackHost(url2.hostname)) return "native";
  }
  return "web";
}
function resolveClientMetadata(provider) {
  const clientMetadata = provider.clientMetadata;
  return {
    ...clientMetadata,
    grant_types: clientMetadata.grant_types ?? (provider.redirectUrl === void 0 ? void 0 : ["authorization_code", "refresh_token"]),
    application_type: clientMetadata.application_type ?? deriveApplicationType(clientMetadata.redirect_uris)
  };
}
async function parseErrorResponse(input) {
  const statusCode = input instanceof Response ? input.status : void 0;
  const body = input instanceof Response ? await input.text() : input;
  try {
    const result = OAuthErrorResponseSchema.parse(JSON.parse(body));
    return OAuthError.fromResponse(result);
  } catch (error2) {
    const errorMessage = `${statusCode ? `HTTP ${statusCode}: ` : ""}Invalid OAuth error response: ${error2}. Raw body: ${body}`;
    return new OAuthError(OAuthErrorCode.ServerError, errorMessage);
  }
}
function warnCredentialInvalidation(provider, error2, invalidated) {
  const action = provider.invalidateCredentials === void 0 ? `retrying authorization without discarding the stored ${invalidated} (provider implements no invalidateCredentials())` : `invalidating the stored ${invalidated} and retrying authorization`;
  console.warn(`[mcp-sdk] OAuth ${JSON.stringify(error2.code)} \u2014 ${action}. Cause: ${JSON.stringify(error2.message)}`);
}
async function auth(provider, options) {
  try {
    return await authInternal(provider, options);
  } catch (error2) {
    if (error2 instanceof OAuthError) {
      if (error2.code === OAuthErrorCode.InvalidClient || error2.code === OAuthErrorCode.UnauthorizedClient) {
        warnCredentialInvalidation(provider, error2, "client credentials and tokens");
        await provider.invalidateCredentials?.("client");
        await provider.invalidateCredentials?.("tokens");
        return await authInternal(provider, options);
      } else if (error2.code === OAuthErrorCode.InvalidGrant || error2.code === OAuthErrorCode.InvalidDpopProof) {
        warnCredentialInvalidation(provider, error2, "tokens");
        await provider.invalidateCredentials?.("tokens");
        return await authInternal(provider, options);
      }
    }
    throw error2;
  }
}
function determineScope(options) {
  const { requestedScope, resourceMetadata, authServerMetadata, clientMetadata } = options;
  let effectiveScope = requestedScope || resourceMetadata?.scopes_supported?.join(" ") || clientMetadata.scope;
  if (effectiveScope && authServerMetadata?.scopes_supported?.includes("offline_access") && !effectiveScope.split(" ").includes("offline_access") && clientMetadata.grant_types?.includes("refresh_token")) effectiveScope = `${effectiveScope} offline_access`;
  return effectiveScope;
}
async function authInternal(provider, { serverUrl, authorizationCode, iss, scope, resourceMetadataUrl, fetchFn, skipIssuerMetadataValidation, forceReauthorization }) {
  const clientMetadata = resolveClientMetadata(provider);
  const cachedState = await provider.discoveryState?.();
  let resourceMetadata;
  let authorizationServerUrl;
  let metadata;
  let freshDiscoveryState;
  let effectiveResourceMetadataUrl = resourceMetadataUrl;
  if (!effectiveResourceMetadataUrl && cachedState?.resourceMetadataUrl) effectiveResourceMetadataUrl = new URL(cachedState.resourceMetadataUrl);
  if (cachedState?.authorizationServerUrl) {
    authorizationServerUrl = cachedState.authorizationServerUrl;
    resourceMetadata = cachedState.resourceMetadata;
    metadata = cachedState.authorizationServerMetadata ?? await discoverAuthorizationServerMetadata(authorizationServerUrl, {
      fetchFn,
      skipIssuerValidation: skipIssuerMetadataValidation
    });
    if (!resourceMetadata) try {
      resourceMetadata = await discoverOAuthProtectedResourceMetadata(serverUrl, { resourceMetadataUrl: effectiveResourceMetadataUrl }, fetchFn);
    } catch (error2) {
      if (error2 instanceof TypeError) throw error2;
    }
    if (metadata !== cachedState.authorizationServerMetadata || resourceMetadata !== cachedState.resourceMetadata) await provider.saveDiscoveryState?.({
      authorizationServerUrl: String(authorizationServerUrl),
      resourceMetadataUrl: effectiveResourceMetadataUrl?.toString(),
      resourceMetadata,
      authorizationServerMetadata: metadata
    });
  } else {
    const serverInfo = await discoverOAuthServerInfo(serverUrl, {
      resourceMetadataUrl: effectiveResourceMetadataUrl,
      fetchFn,
      skipIssuerMetadataValidation
    });
    authorizationServerUrl = serverInfo.authorizationServerUrl;
    metadata = serverInfo.authorizationServerMetadata;
    resourceMetadata = serverInfo.resourceMetadata;
    freshDiscoveryState = {
      authorizationServerUrl: String(authorizationServerUrl),
      resourceMetadataUrl: effectiveResourceMetadataUrl?.toString(),
      resourceMetadata,
      authorizationServerMetadata: metadata
    };
  }
  const issuer = metadata?.issuer ?? String(authorizationServerUrl);
  const infoCtx = { issuer };
  await provider.saveAuthorizationServerUrl?.(issuer);
  if (authorizationCode !== void 0) {
    const recordedIssuer = cachedState?.authorizationServerMetadata?.issuer ?? cachedState?.authorizationServerUrl;
    if (recordedIssuer === void 0) {
      if (provider.saveDiscoveryState !== void 0) throw new AuthorizationServerMismatchError("discoveryState was not available on the callback leg; ensure your provider persists discoveryState alongside codeVerifier", issuer);
      console.warn("[mcp-sdk] OAuthClientProvider does not implement saveDiscoveryState()/discoveryState(); the SEP-2352 callback-leg authorization-server binding cannot be checked. Implement discoveryState (persist alongside codeVerifier) \u2014 see docs/migration/upgrade-to-v2.md \xA7SEP-2352.");
    } else if (!issuersMatch(recordedIssuer, issuer)) throw new AuthorizationServerMismatchError(recordedIssuer, issuer);
  }
  if (freshDiscoveryState) await provider.saveDiscoveryState?.(freshDiscoveryState);
  const selectedResource = await selectResourceURL(serverUrl, provider, resourceMetadata);
  const resource = selectedResource && resourceMetadata && !provider.validateResourceURL ? resourceMetadata.resource : selectedResource;
  if (resource) await provider.saveResourceUrl?.(resourceIndicatorToString(resource));
  const resolvedScope = determineScope({
    requestedScope: scope,
    resourceMetadata,
    authServerMetadata: metadata,
    clientMetadata: provider.clientMetadata
  });
  const rawClientInfo = await Promise.resolve(provider.clientInformation(infoCtx));
  let clientInformation = discardIfIssuerMismatch(rawClientInfo, issuer, { canPersistStamp: provider.saveClientInformation !== void 0 });
  if (clientInformation === void 0 && rawClientInfo?.issuer && provider.saveClientInformation === void 0) throw new AuthorizationServerMismatchError(rawClientInfo.issuer, issuer);
  if (clientInformation && clientInformation.issuer === void 0) {
    clientInformation = {
      ...clientInformation,
      issuer
    };
    await provider.saveClientInformation?.(clientInformation, infoCtx);
  }
  if (!clientInformation) {
    if (authorizationCode !== void 0) throw new Error("Existing OAuth client information is required when exchanging an authorization code");
    const supportsUrlBasedClientId = metadata?.client_id_metadata_document_supported === true;
    const clientMetadataUrl = provider.clientMetadataUrl;
    if (clientMetadataUrl && !isHttpsUrl(clientMetadataUrl)) throw new OAuthError(OAuthErrorCode.InvalidClientMetadata, `clientMetadataUrl must be a valid HTTPS URL with a non-root pathname, got: ${clientMetadataUrl}`);
    if (supportsUrlBasedClientId && clientMetadataUrl) {
      clientInformation = {
        client_id: clientMetadataUrl,
        issuer
      };
      await provider.saveClientInformation?.(clientInformation, infoCtx);
    } else {
      if (!provider.saveClientInformation) throw new Error("OAuth client information must be saveable for dynamic registration");
      clientInformation = {
        ...await registerClient(authorizationServerUrl, {
          metadata,
          clientMetadata,
          scope: resolvedScope,
          fetchFn
        }),
        issuer
      };
      await provider.saveClientInformation(clientInformation, infoCtx);
    }
  }
  const nonInteractiveFlow = !provider.redirectUrl;
  if (authorizationCode !== void 0 || nonInteractiveFlow) {
    if (authorizationCode !== void 0) validateAuthorizationResponseIssuer({
      iss,
      expectedIssuer: metadata?.issuer,
      issParameterSupported: isIssParameterSupported(metadata)
    });
    const tokens$1 = await fetchToken(provider, authorizationServerUrl, {
      metadata,
      resource,
      authorizationCode,
      iss,
      scope: resolvedScope,
      fetchFn
    });
    await provider.saveTokens({
      ...tokens$1,
      issuer
    }, infoCtx);
    return "AUTHORIZED";
  }
  let tokens = discardIfIssuerMismatch(await provider.tokens(infoCtx), issuer);
  if (tokens && tokens.issuer === void 0) {
    tokens = {
      ...tokens,
      issuer
    };
    await provider.saveTokens(tokens, infoCtx);
  }
  if (tokens?.refresh_token && !forceReauthorization) {
    let newTokens;
    try {
      newTokens = await refreshAuthorization(authorizationServerUrl, {
        metadata,
        clientInformation,
        refreshToken: tokens.refresh_token,
        resource,
        addClientAuthentication: provider.addClientAuthentication,
        dpop: await provider.dpop?.(),
        fetchFn
      });
    } catch (error2) {
      if (error2 instanceof InsecureTokenEndpointError) throw error2;
      if (!(error2 instanceof OAuthError) || error2.code === OAuthErrorCode.ServerError) console.warn(`[mcp-sdk] Could not refresh OAuth tokens; falling back to a new authorization request. Cause: ${JSON.stringify(error2 instanceof Error ? error2.message : String(error2))}`);
      else throw error2;
    }
    if (newTokens) {
      await provider.saveTokens({
        ...newTokens,
        issuer
      }, infoCtx);
      return "AUTHORIZED";
    }
  }
  const state = provider.state ? await provider.state() : void 0;
  const { authorizationUrl, codeVerifier } = await startAuthorization(authorizationServerUrl, {
    metadata,
    clientInformation,
    state,
    redirectUrl: provider.redirectUrl,
    scope: resolvedScope,
    resource
  });
  await provider.saveCodeVerifier(codeVerifier);
  await provider.redirectToAuthorization(authorizationUrl);
  return "REDIRECT";
}
function isHttpsUrl(value) {
  if (!value) return false;
  try {
    const url2 = new URL(value);
    return url2.protocol === "https:" && url2.pathname !== "/";
  } catch {
    return false;
  }
}
async function selectResourceURL(serverUrl, provider, resourceMetadata) {
  const defaultResource = resourceUrlFromServerUrl(serverUrl);
  if (provider.validateResourceURL) return await provider.validateResourceURL(defaultResource, resourceMetadata?.resource);
  if (!resourceMetadata) return;
  if (!checkResourceAllowed({
    requestedResource: defaultResource,
    configuredResource: resourceMetadata.resource
  })) throw new Error(`Protected resource ${resourceMetadata.resource} does not match expected ${defaultResource} (or origin)`);
  return new URL(resourceMetadata.resource);
}
var RECOGNIZED_CHALLENGE_SCHEMES = /* @__PURE__ */ new Set(["bearer", "dpop"]);
function extractWWWAuthenticateParams(res) {
  const authenticateHeader = res.headers.get("WWW-Authenticate");
  if (!authenticateHeader) return {};
  const [type, scheme] = authenticateHeader.split(" ");
  if (!type || !RECOGNIZED_CHALLENGE_SCHEMES.has(type.toLowerCase()) || !scheme) return {};
  const resourceMetadataMatch = extractFieldFromWwwAuth(res, "resource_metadata") || void 0;
  let resourceMetadataUrl;
  if (resourceMetadataMatch) try {
    resourceMetadataUrl = new URL(resourceMetadataMatch);
  } catch {
  }
  const scope = extractFieldFromWwwAuth(res, "scope") || void 0;
  const error2 = extractFieldFromWwwAuth(res, "error") || void 0;
  const errorDescription = extractFieldFromWwwAuth(res, "error_description") || void 0;
  return {
    resourceMetadataUrl,
    scope,
    error: error2,
    errorDescription
  };
}
function extractFieldFromWwwAuth(response, fieldName) {
  const wwwAuthHeader = response.headers.get("WWW-Authenticate");
  if (!wwwAuthHeader) return null;
  const pattern = new RegExp(String.raw`${fieldName}=(?:"([^"]+)"|([^\s,]+))`);
  const match = wwwAuthHeader.match(pattern);
  if (match) {
    const result = match[1] || match[2];
    if (result) return result;
  }
  return null;
}
async function discoverOAuthProtectedResourceMetadata(serverUrl, opts, fetchFn = fetch) {
  const response = await discoverMetadataWithFallback(serverUrl, "oauth-protected-resource", fetchFn, {
    protocolVersion: opts?.protocolVersion,
    metadataUrl: opts?.resourceMetadataUrl
  });
  if (!response || response.status === 404) {
    await response?.text?.().catch(() => {
    });
    throw new Error(`Resource server does not implement OAuth 2.0 Protected Resource Metadata.`);
  }
  if (!response.ok) {
    await response.text?.().catch(() => {
    });
    throw new Error(`HTTP ${response.status} trying to load well-known OAuth protected resource metadata.`);
  }
  return OAuthProtectedResourceMetadataSchema.parse(await response.json());
}
async function fetchWithCorsRetry(url2, headers, fetchFn = fetch) {
  const withinOrigin = fetchWithinOrigin(fetchFn);
  try {
    return await withinOrigin(url2, { headers });
  } catch (error2) {
    if (!(error2 instanceof TypeError) || !CORS_IS_POSSIBLE) throw error2;
    if (headers) try {
      return await withinOrigin(url2, {});
    } catch (retryError) {
      if (!(retryError instanceof TypeError)) throw retryError;
      return;
    }
    return;
  }
}
function buildWellKnownPath(wellKnownPrefix, pathname = "", options = {}) {
  if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  return options.prependPathname ? `${pathname}/.well-known/${wellKnownPrefix}` : `/.well-known/${wellKnownPrefix}${pathname}`;
}
async function tryMetadataDiscovery(url2, protocolVersion, fetchFn = fetch) {
  return await fetchWithCorsRetry(url2, { "MCP-Protocol-Version": protocolVersion }, fetchFn);
}
function shouldAttemptFallback(response, pathname) {
  if (!response) return true;
  if (pathname === "/") return false;
  return !response.ok && response.status < 500 || response.status === 502;
}
async function discoverMetadataWithFallback(serverUrl, wellKnownType, fetchFn, opts) {
  const issuer = new URL(serverUrl);
  const protocolVersion = opts?.protocolVersion ?? LATEST_PROTOCOL_VERSION;
  let url2;
  if (opts?.metadataUrl) url2 = new URL(opts.metadataUrl);
  else {
    const wellKnownPath = buildWellKnownPath(wellKnownType, issuer.pathname);
    url2 = new URL(wellKnownPath, opts?.metadataServerUrl ?? issuer);
    url2.search = issuer.search;
  }
  let response = await tryMetadataDiscovery(url2, protocolVersion, fetchFn);
  if (!opts?.metadataUrl && shouldAttemptFallback(response, issuer.pathname)) response = await tryMetadataDiscovery(new URL(`/.well-known/${wellKnownType}`, issuer), protocolVersion, fetchFn);
  return response;
}
function buildDiscoveryUrls(authorizationServerUrl) {
  const url2 = typeof authorizationServerUrl === "string" ? new URL(authorizationServerUrl) : authorizationServerUrl;
  const hasPath = url2.pathname !== "/";
  const urlsToTry = [];
  if (!hasPath) {
    urlsToTry.push({
      url: new URL("/.well-known/oauth-authorization-server", url2.origin),
      type: "oauth"
    }, {
      url: new URL(`/.well-known/openid-configuration`, url2.origin),
      type: "oidc"
    });
    return urlsToTry;
  }
  let pathname = url2.pathname;
  if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  urlsToTry.push({
    url: new URL(`/.well-known/oauth-authorization-server${pathname}`, url2.origin),
    type: "oauth"
  }, {
    url: new URL(`/.well-known/openid-configuration${pathname}`, url2.origin),
    type: "oidc"
  }, {
    url: new URL(`${pathname}/.well-known/openid-configuration`, url2.origin),
    type: "oidc"
  });
  return urlsToTry;
}
async function discoverAuthorizationServerMetadata(authorizationServerUrl, { fetchFn = fetch, protocolVersion = LATEST_PROTOCOL_VERSION, skipIssuerValidation = false } = {}) {
  const headers = {
    "MCP-Protocol-Version": protocolVersion,
    Accept: "application/json"
  };
  const urlsToTry = buildDiscoveryUrls(authorizationServerUrl);
  for (const { url: endpointUrl, type } of urlsToTry) {
    const response = await fetchWithCorsRetry(endpointUrl, headers, fetchFn);
    if (!response)
      continue;
    if (!response.ok) {
      await response.text?.().catch(() => {
      });
      if (response.status < 500 || response.status === 502) continue;
      throw new Error(`HTTP ${response.status} trying to load ${type === "oauth" ? "OAuth" : "OpenID provider"} metadata from ${endpointUrl}`);
    }
    const parsed = type === "oauth" ? OAuthMetadataSchema.parse(await response.json()) : OpenIdProviderDiscoveryMetadataSchema.parse(await response.json());
    if (!skipIssuerValidation) {
      const expectedIssuer = typeof authorizationServerUrl === "string" ? authorizationServerUrl : authorizationServerUrl.href;
      if (!(parsed.issuer === expectedIssuer || expectedIssuer.endsWith("/") && parsed.issuer === expectedIssuer.slice(0, -1))) throw new IssuerMismatchError("metadata", expectedIssuer, parsed.issuer);
    }
    return parsed;
  }
}
async function discoverOAuthServerInfo(serverUrl, opts) {
  let resourceMetadata;
  let authorizationServerUrl;
  try {
    resourceMetadata = await discoverOAuthProtectedResourceMetadata(serverUrl, { resourceMetadataUrl: opts?.resourceMetadataUrl }, opts?.fetchFn);
    if (resourceMetadata.authorization_servers && resourceMetadata.authorization_servers.length > 0) authorizationServerUrl = resourceMetadata.authorization_servers[0];
  } catch (error2) {
    if (error2 instanceof TypeError) throw error2;
  }
  if (!authorizationServerUrl) authorizationServerUrl = String(new URL("/", serverUrl));
  const authorizationServerMetadata = await discoverAuthorizationServerMetadata(authorizationServerUrl, {
    fetchFn: opts?.fetchFn,
    skipIssuerValidation: opts?.skipIssuerMetadataValidation
  });
  return {
    authorizationServerUrl,
    authorizationServerMetadata,
    resourceMetadata
  };
}
function resourceIndicatorToString(resource) {
  return typeof resource === "string" ? resource : resource.href;
}
async function startAuthorization(authorizationServerUrl, { metadata, clientInformation, redirectUrl, scope, state, resource }) {
  let authorizationUrl;
  if (metadata) {
    authorizationUrl = new URL(metadata.authorization_endpoint);
    if (!metadata.response_types_supported.includes(AUTHORIZATION_CODE_RESPONSE_TYPE)) throw new Error(`Incompatible auth server: does not support response type ${AUTHORIZATION_CODE_RESPONSE_TYPE}`);
    if (metadata.code_challenge_methods_supported && !metadata.code_challenge_methods_supported.includes(AUTHORIZATION_CODE_CHALLENGE_METHOD)) throw new Error(`Incompatible auth server: does not support code challenge method ${AUTHORIZATION_CODE_CHALLENGE_METHOD}`);
  } else authorizationUrl = new URL("/authorize", authorizationServerUrl);
  const challenge = await pkceChallenge();
  const codeVerifier = challenge.code_verifier;
  const codeChallenge = challenge.code_challenge;
  authorizationUrl.searchParams.set("response_type", AUTHORIZATION_CODE_RESPONSE_TYPE);
  authorizationUrl.searchParams.set("client_id", clientInformation.client_id);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", AUTHORIZATION_CODE_CHALLENGE_METHOD);
  authorizationUrl.searchParams.set("redirect_uri", String(redirectUrl));
  if (state) authorizationUrl.searchParams.set("state", state);
  if (scope) authorizationUrl.searchParams.set("scope", scope);
  if (scope?.split(" ").includes("offline_access")) authorizationUrl.searchParams.append("prompt", "consent");
  if (resource) authorizationUrl.searchParams.set("resource", resourceIndicatorToString(resource));
  return {
    authorizationUrl,
    codeVerifier
  };
}
function prepareAuthorizationCodeRequest(authorizationCode, codeVerifier, redirectUri) {
  return new URLSearchParams({
    grant_type: "authorization_code",
    code: authorizationCode,
    code_verifier: codeVerifier,
    redirect_uri: String(redirectUri)
  });
}
async function executeTokenRequest(authorizationServerUrl, { metadata, tokenRequestParams, clientInformation, addClientAuthentication, resource, dpop, fetchFn }) {
  const tokenUrl = assertSecureTokenEndpoint(metadata?.token_endpoint ?? new URL("/token", authorizationServerUrl));
  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json"
  });
  if (resource) tokenRequestParams.set("resource", resourceIndicatorToString(resource));
  if (!addClientAuthentication && clientInformation) applyClientAuthentication(selectClientAuthMethod(clientInformation, metadata?.token_endpoint_auth_methods_supported ?? []), clientInformation, headers, tokenRequestParams);
  const requestOnce = async () => {
    const requestHeaders = new Headers(headers);
    if (addClientAuthentication) await addClientAuthentication(requestHeaders, tokenRequestParams, tokenUrl, metadata);
    if (dpop) requestHeaders.set("DPoP", await dpop.buildProof({
      htm: "POST",
      htu: tokenUrl
    }));
    return fetchWithinOrigin(fetchFn ?? fetch)(tokenUrl, {
      method: "POST",
      headers: requestHeaders,
      body: tokenRequestParams
    });
  };
  let response = await requestOnce();
  if (dpop && response.status === 400) {
    if ((await response.clone().json().catch(() => {
    }))?.error === OAuthErrorCode.UseDpopNonce) {
      dpop.observeNonce(response, tokenUrl);
      response = await requestOnce();
    }
  }
  dpop?.observeNonce(response, tokenUrl);
  if (!response.ok) throw await parseErrorResponse(response);
  const json = await response.json();
  try {
    return OAuthTokensSchema.parse(withoutIssuer(json));
  } catch (parseError) {
    if (typeof json === "object" && json !== null && "error" in json) throw await parseErrorResponse(JSON.stringify(json));
    throw parseError;
  }
}
async function refreshAuthorization(authorizationServerUrl, { metadata, clientInformation, refreshToken, resource, addClientAuthentication, dpop, fetchFn }) {
  return {
    refresh_token: refreshToken,
    ...await executeTokenRequest(authorizationServerUrl, {
      metadata,
      tokenRequestParams: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      }),
      clientInformation,
      addClientAuthentication,
      resource,
      dpop,
      fetchFn
    })
  };
}
async function fetchToken(provider, authorizationServerUrl, { metadata, resource, authorizationCode, iss, scope, fetchFn } = {}) {
  if (authorizationCode !== void 0) validateAuthorizationResponseIssuer({
    iss,
    expectedIssuer: metadata?.issuer,
    issParameterSupported: isIssParameterSupported(metadata)
  });
  const issuer = metadata?.issuer ?? String(authorizationServerUrl);
  const readClientInformation = async () => {
    const rawClientInfo = await provider.clientInformation({ issuer });
    const checked = discardIfIssuerMismatch(rawClientInfo, issuer, { canPersistStamp: false });
    if (rawClientInfo && checked === void 0) throw new AuthorizationServerMismatchError(String(rawClientInfo.issuer), issuer);
    return checked;
  };
  let clientInformation = await readClientInformation();
  const effectiveScope = scope ?? provider.clientMetadata.scope;
  let tokenRequestParams;
  if (provider.prepareTokenRequest) tokenRequestParams = await provider.prepareTokenRequest(effectiveScope);
  if (!tokenRequestParams) {
    if (!authorizationCode) throw new Error("Either provider.prepareTokenRequest() or authorizationCode is required");
    if (!provider.redirectUrl) throw new Error("redirectUrl is required for authorization_code flow");
    tokenRequestParams = prepareAuthorizationCodeRequest(authorizationCode, await provider.codeVerifier(), provider.redirectUrl);
  }
  clientInformation ??= await readClientInformation();
  return executeTokenRequest(authorizationServerUrl, {
    metadata,
    tokenRequestParams,
    clientInformation,
    addClientAuthentication: provider.addClientAuthentication,
    resource,
    dpop: await provider.dpop?.(),
    fetchFn
  });
}
async function registerClient(authorizationServerUrl, { metadata, clientMetadata, scope, fetchFn }) {
  let registrationUrl;
  if (metadata) {
    if (!metadata.registration_endpoint) throw new Error("Incompatible auth server: does not support dynamic client registration");
    registrationUrl = new URL(metadata.registration_endpoint);
  } else registrationUrl = new URL("/register", authorizationServerUrl);
  const submittedMetadata = {
    ...clientMetadata,
    ...scope === void 0 ? {} : { scope }
  };
  const response = await fetchWithinOrigin(fetchFn ?? fetch)(registrationUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submittedMetadata)
  });
  if (!response.ok) throw new RegistrationRejectedError({
    status: response.status,
    body: await response.text(),
    submittedMetadata
  });
  return OAuthClientInformationFullSchema.parse(withoutIssuer(await response.json()));
}
var CAP_EXEMPT_METHODS = /* @__PURE__ */ new Set([
  "tools/list",
  "prompts/list",
  "resources/list",
  "resources/templates/list",
  "server/discover"
]);
var InMemoryResponseCacheStore = class {
  _entries = /* @__PURE__ */ new Map();
  _maxEntries;
  _stamp = 0;
  /** Count of held entries that are subject to the cap (i.e. not in {@linkcode CAP_EXEMPT_METHODS}). */
  _cappedSize = 0;
  constructor(options) {
    this._maxEntries = options?.maxEntries ?? 512;
  }
  /** Number of held entries (for diagnostics / bounding tests). */
  get size() {
    return this._entries.size;
  }
  get(key) {
    return this._entries.get(keyOf(key));
  }
  set(key, entry) {
    const k = keyOf(key);
    const exempt = CAP_EXEMPT_METHODS.has(key.method);
    const isNew = !this._entries.has(k);
    if (!exempt && isNew && this._maxEntries > 0 && this._cappedSize >= this._maxEntries) {
      for (const oldKey of this._entries.keys()) if (!CAP_EXEMPT_METHODS.has(oldKey.slice(0, oldKey.indexOf("\0")))) {
        this._entries.delete(oldKey);
        this._cappedSize--;
        break;
      }
    }
    const stamp = ++this._stamp;
    this._entries.set(k, {
      ...entry,
      stamp
    });
    if (isNew && !exempt) this._cappedSize++;
    return stamp;
  }
  delete(key) {
    if (this._entries.delete(keyOf(key)) && !CAP_EXEMPT_METHODS.has(key.method)) this._cappedSize--;
  }
  evict(method) {
    const prefix = `${method}\0`;
    const exempt = CAP_EXEMPT_METHODS.has(method);
    for (const k of this._entries.keys()) if (k.startsWith(prefix)) {
      this._entries.delete(k);
      if (!exempt) this._cappedSize--;
    }
  }
  clear() {
    this._entries.clear();
    this._cappedSize = 0;
  }
};
function keyOf(key) {
  return `${key.method}\0${JSON.stringify([key.partition ?? "", key.params ?? ""])}`;
}
function genKey(method, params) {
  return params === void 0 ? method : `${method}\0${params}`;
}
var MAX_CACHE_TTL_MS = 864e5;
var ClientResponseCache = class {
  /**
  * Per-logical-key eviction-generation counter. {@linkcode evict} (whole
  * method) and {@linkcode evictKey} (single `{method, params}`) bump it
  * before touching the store; {@linkcode captureGeneration} reads it before
  * the request; {@linkcode write} skips when it moved — so a `list_changed`
  * arriving mid-walk, or a `resources/updated` arriving while a
  * `readResource()` for the same URI is in flight, is not overwritten by
  * the in-flight request's stale write. The map key is `method` for the
  * list singletons and `` `${method}\0${params}` `` for per-URI keys.
  *
  * Growth is bounded by keys the CLIENT has issued a `captureGeneration`
  * for: {@linkcode captureGeneration} records the key (so an interleaved
  * {@linkcode evictKey} sees there is an in-flight write to suppress);
  * {@linkcode evictKey} only bumps a key that is already recorded — a
  * server streaming `notifications/resources/updated` for URIs the client
  * has never read therefore cannot grow this map.
  */
  _evictionGeneration = /* @__PURE__ */ new Map();
  /**
  * `name → Tool` index derived from the cached `tools/list` entry, memoized
  * against the entry's `stamp` so it re-derives only when the backing entry
  * changes (mcp.d's `cachedTool` pattern).
  */
  _toolIndex;
  /**
  * `name → compiled output-schema validator` derived from the cached
  * `tools/list` entry; same stamp-keyed memoization as `_toolIndex`. Typed
  * `unknown` so this class stays free of any validator-provider dependency
  * — the compile callback supplied to {@linkcode outputValidator} owns the
  * concrete type.
  */
  _toolOutputValidatorIndex;
  /**
  * The connected server's identity (`serverInfo.name@version`, the
  * transport's `sessionId`, or a client-generated per-connection
  * surrogate). Set by the `Client` immediately after a successful connect;
  * `''` is the pre-connect sentinel. Every storage partition is derived
  * from this (see `_partitionFor`), so two clients sharing one store but
  * connected to different servers never collide on `tools/list` and a
  * server cannot read another server's `'public'` entries.
  */
  _serverIdentity = "";
  constructor(_store, _isUserSupplied, _reportError = () => {
  }, _cachePartition = "", _now = Date.now) {
    this._store = _store;
    this._isUserSupplied = _isUserSupplied;
    this._reportError = _reportError;
    this._cachePartition = _cachePartition;
    this._now = _now;
  }
  /** The clock used for every freshness computation and check. */
  now() {
    return this._now();
  }
  /**
  * Record the connected server's identity. Called by `Client` immediately
  * after a successful connect: `serverInfo.name@version` when the server
  * identified itself, else the transport's `sessionId`, else a
  * client-generated per-connection surrogate (`serverInfo` is a spec
  * SHOULD on 2026-07-28, so anonymous servers exist). Surrogate-keyed
  * partitions are NOT stable across reconnects — no identity means no
  * cross-connection cache reuse, and a shared long-lived store should
  * bound its own size accordingly. Every partition derived after this
  * call is scoped to this identity; entries written under the pre-connect
  * `''` sentinel are no longer reachable.
  */
  setServerIdentity(identity) {
    this._serverIdentity = identity;
  }
  /**
  * Derive the storage partition for `scope`. The encoding is
  * `JSON.stringify([serverIdentity, principal])` — JSON escaping makes it
  * collision-free by construction: a malicious server cannot craft a
  * `serverInfo.name`/`version` whose concatenated form bleeds into another
  * server's namespace or another principal's slot, regardless of `@` / `|`
  * / `"` / NUL in the server-controlled strings. `'public'` →
  * `[serverIdentity, '']` (shared within this server); `'private'` →
  * `[serverIdentity, cachePartition]`. When `cachePartition` is `''` the
  * two coincide.
  */
  _partitionFor(scope) {
    return JSON.stringify([this._serverIdentity, scope === "public" ? "" : this._cachePartition]);
  }
  /**
  * Two-probe lookup: this client's own (private) partition first, then the
  * connected server's shared (public) partition. The shared probe is gated
  * on `entry.scope === 'public'` — a co-tenant client that omits
  * `cachePartition` writes its `'private'`-scoped entries at the public
  * partition, and serving those to a correctly-partitioned client would
  * leak private bodies (mcp.d's `cachedEntry` two-probe order; the scope
  * gate is defence-in-depth on top of the partition split). When
  * `cachePartition` is `''` the two partitions are identical and only one
  * probe is issued.
  */
  async _probe(method, params) {
    const key = {
      method,
      params: params ?? ""
    };
    const ownPartition = this._partitionFor("private");
    const own2 = await this._store.get({
      ...key,
      partition: ownPartition
    });
    if (own2 !== void 0) return own2;
    const sharedPartition = this._partitionFor("public");
    if (sharedPartition === ownPartition) return void 0;
    const shared = await this._store.get({
      ...key,
      partition: sharedPartition
    });
    return shared?.scope === "public" ? shared : void 0;
  }
  /**
  * Bump the per-method generation (so an in-flight {@linkcode write} for the
  * same method becomes a no-op) and drop the connected server's two list
  * singletons (own + shared partition; `params: ''`). The generation bump
  * is unconditional and FIRST — the {@linkcode write} race guard relies on
  * the bump, not on the store's deletes completing.
  *
  * Eviction is scoped to this client's `[serverIdentity, principal]`
  * partitions (mirroring {@linkcode evictKey}) — the method-wide
  * `store.evict()` is NOT called, so on a shared store one server's
  * `list_changed` cannot wipe a co-tenant's entry. A custom store's
  * `delete()` may throw or reject; each partition is guarded
  * independently so a failure on one does not skip the other, the failure
  * is reported via the constructor's sink, and the call resolves so
  * dispatch proceeds.
  */
  async evict(method) {
    this._evictionGeneration.set(method, (this._evictionGeneration.get(method) ?? 0) + 1);
    await this._deleteBoth(method, "");
  }
  /**
  * Guarded two-partition delete of `{method, params}`: each partition's
  * `delete` is independently wrapped so a custom store's failure on one is
  * reported and does not skip the other, and the call always resolves.
  */
  async _deleteBoth(method, params) {
    const ownPartition = this._partitionFor("private");
    const sharedPartition = this._partitionFor("public");
    try {
      await this._store.delete({
        method,
        params,
        partition: ownPartition
      });
    } catch (error2) {
      this._reportError(error2);
    }
    if (sharedPartition !== ownPartition) try {
      await this._store.delete({
        method,
        params,
        partition: sharedPartition
      });
    } catch (error2) {
      this._reportError(error2);
    }
  }
  /**
  * Drop the single logical entry `{method, params}` from BOTH the private
  * and public partitions for this client's connected server (mcp.d's
  * `invalidateLogical`). Used for `notifications/resources/updated`'s
  * per-URI eviction. The per-key generation is bumped FIRST (so an
  * in-flight {@linkcode write} for the same `{method, params}` becomes a
  * no-op and cannot re-cache the now-stale body) but only when the key was
  * already recorded by {@linkcode captureGeneration} — bounding the map to
  * keys the client has actually read. A custom store's `delete()` may
  * throw or reject; each partition's delete is guarded independently so a
  * failure on one does not skip the other, and the call resolves so
  * dispatch proceeds.
  */
  async evictKey(method, params) {
    const gk = genKey(method, params);
    const current = this._evictionGeneration.get(gk);
    if (current !== void 0) this._evictionGeneration.set(gk, current + 1);
    await this._deleteBoth(method, params);
  }
  /**
  * Snapshot the eviction generation for `{method, params}` before issuing
  * the request (a list walk's page 1, or a `resources/read` for `params`).
  * Records the key so an interleaved {@linkcode evictKey} for the same
  * `{method, params}` knows there is an in-flight write to suppress and
  * bumps; without the record, `evictKey`'s recorded-only bump would skip
  * and the stale body would be cached.
  */
  captureGeneration(method, params) {
    const gk = genKey(method, params);
    const current = this._evictionGeneration.get(gk) ?? 0;
    this._evictionGeneration.set(gk, current);
    return current;
  }
  /**
  * Write `value` under `{method}` unless the per-method generation moved
  * since `capturedGen` was taken — a `list_changed` that landed mid-walk has
  * already invalidated the result the caller is about to write, and
  * overwriting the eviction with the stale aggregate would lose the
  * invalidation.
  *
  * The value is stored as its JSON-serialized document; serialization
  * doubles as the mutation barrier, so a caller mutating the returned
  * aggregate cannot reach the cache or its derived indices. A value that
  * is not JSON-serializable (reachable only via in-process transports)
  * fails the write loudly into the `reportError` sink. A custom store
  * whose `set()` throws or rejects is routed to the same sink and the
  * write resolves — cache bookkeeping never costs the caller a result it
  * already fetched.
  *
  * `freshness` carries the client-computed `expiresAt` (absolute ms epoch,
  * `now + ttlMs`) and the server-reported `cacheScope`. The storage
  * `partition` is derived from the scope via `_partitionFor`:
  * `'public'` → `[serverIdentity, '']` (shared within this server);
  * `'private'` → `[serverIdentity, cachePartition]` (so a shared store
  * never serves a private entry to another identity). Absent `freshness`
  * preserves the substrate write (no `expiresAt`, private partition) — the
  * `tools/list` retain-for-schema posture: never served by
  * {@linkcode read}'s freshness gate, always readable by
  * {@linkcode toolDefinition}.
  *
  * After storing under the derived partition, the same `{method, params}`
  * is deleted from the OPPOSITE partition (mirroring {@linkcode evictKey}'s
  * two-partition posture). A server that flips a result's `cacheScope` for
  * the same key would otherwise leave the previous entry in the other slot
  * — and since `_probe` checks own-partition first, a stale private entry
  * would shadow the fresh public one (or a stale public entry would keep
  * serving co-tenants). Both store calls are independently guarded so a
  * custom store's failure on one does not skip the other.
  */
  async write(method, value, capturedGen, freshness) {
    if ((this._evictionGeneration.get(genKey(method, freshness?.params)) ?? 0) !== capturedGen) return;
    const params = freshness?.params ?? "";
    const ownPartition = this._partitionFor("private");
    const sharedPartition = this._partitionFor("public");
    const partition = (freshness?.scope ?? "private") === "public" ? sharedPartition : ownPartition;
    try {
      await this._store.set({
        method,
        params,
        partition
      }, {
        value: encodeCacheValue(value),
        expiresAt: freshness?.expiresAt,
        scope: freshness?.scope
      });
    } catch (error2) {
      this._reportError(error2);
    }
    if (sharedPartition !== ownPartition) try {
      await this._store.delete({
        method,
        params,
        partition: partition === ownPartition ? sharedPartition : ownPartition
      });
    } catch (error2) {
      this._reportError(error2);
    }
  }
  /**
  * Serve the fresh cached result for `{method, params}`, or `undefined`.
  * Lookup is the two-probe order (own-partition then this server's shared
  * partition, gated on `scope === 'public'`); freshness is
  * `entry.expiresAt > now()` (a missing `expiresAt` is never fresh),
  * checked BEFORE decoding so stale entries cost no parse. Every hit is
  * freshly parsed, so the caller owns the value outright. An entry whose
  * document does not parse or is not an object (corrupted external
  * store) is reported,
  * deleted, and treated as a miss — deleted because a fresh-but-corrupt
  * entry would otherwise re-parse and re-report on every read until its
  * `expiresAt` passes.
  */
  async read(method, params) {
    const entry = await this._probe(method, params);
    if (entry?.expiresAt === void 0 || !(entry.expiresAt > this.now())) return void 0;
    try {
      const parsed = JSON.parse(entry.value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new TypeError("cached document is not an object");
      return { value: parsed };
    } catch (error2) {
      this._reportError(error2);
      await this._deleteBoth(method, params ?? "");
      return;
    }
  }
  /**
  * Connection reset. The per-instance default store IS cleared
  * (connection-scoped); a user-supplied store is NOT — that would defeat
  * the only reason to supply one. The generation map and every derived
  * index are dropped regardless: they are connection-scoped even when the
  * backing store survives, so the next read re-derives from whatever the
  * store still holds. The server identity returns to the pre-connect
  * sentinel. The default impl is synchronous, so the `MaybePromise<void>`
  * return is a plain void here and the caller need not await.
  */
  resetForReconnect() {
    if (!this._isUserSupplied) this._store.clear();
    this._evictionGeneration.clear();
    this._toolIndex = void 0;
    this._toolOutputValidatorIndex = void 0;
    this._serverIdentity = "";
  }
  /**
  * The descriptor for tool `name` taken from the cached `tools/list` entry.
  * The `name → Tool` index is memoized against the entry's `stamp` and
  * re-derived only when the backing entry changes (mcp.d's `cachedTool`).
  * Returns `undefined` only when no `tools/list` response is held at all,
  * or the held list does not contain `name`.
  *
  * Consumed by `callTool()`'s SEP-2243 `_resolveXMcpHeaderScan` (mirroring)
  * and, via {@linkcode outputValidator}, its output-schema validation.
  */
  async toolDefinition(name) {
    const entry = await this._probe("tools/list");
    if (entry === void 0) {
      this._toolIndex = void 0;
      return;
    }
    if (this._toolIndex?.stamp !== entry.stamp) {
      const list = this._decodeListTools(entry);
      const byName = /* @__PURE__ */ new Map();
      if (list !== void 0) for (const tool of list.tools) byName.set(tool.name, tool);
      this._toolIndex = {
        stamp: entry.stamp,
        byName
      };
    }
    return this._toolIndex.byName.get(name);
  }
  /**
  * The compiled output-schema validator for tool `name`, derived from the
  * cached `tools/list` entry — same source and same stamp-keyed
  * memoization as {@linkcode toolDefinition}. The `name → validator` index
  * re-derives only when the backing entry's stamp changes (a refetched
  * `tools/list` recompiles; a `list_changed` eviction drops it). Returns
  * `undefined` when no `tools/list` is held, the tool is absent, or it has
  * no `outputSchema`.
  *
  * `compile` is the caller-supplied validator-compile callback (the
  * `Client` passes its `_jsonSchemaValidator` wrapper) so this
  * class carries no validator-provider dependency. One tool's uncompilable
  * `outputSchema` (e.g. an invalid `pattern` regex or unresolvable `$ref`)
  * must not poison every other tool's `callTool` — the callback isolates
  * that compile error per tool by returning a per-tool error variant which
  * the index stores alongside the good ones, and `callTool` surfaces it as
  * a typed `InvalidParams` only for that name. Because the error is held on
  * this stamp-keyed substrate (not a parallel map), it inherits the
  * substrate's invalidation lifecycle: a `list_changed` eviction drops it,
  * a refetched `tools/list` re-derives it, and `resetForReconnect` clears
  * the lot.
  */
  async outputValidator(name, compile2) {
    const entry = await this._probe("tools/list");
    if (entry === void 0) {
      this._toolOutputValidatorIndex = void 0;
      return;
    }
    if (this._toolOutputValidatorIndex?.stamp !== entry.stamp) {
      const list = this._decodeListTools(entry) ?? { tools: [] };
      const byName = /* @__PURE__ */ new Map();
      for (const tool of list.tools) {
        const compiled = compile2(tool);
        if (compiled !== void 0) byName.set(tool.name, compiled);
      }
      this._toolOutputValidatorIndex = {
        stamp: entry.stamp,
        byName
      };
    }
    return this._toolOutputValidatorIndex.byName.get(name);
  }
  /** Parse a held `tools/list` document for the index builders; a document
  * that does not parse OR whose `tools` is not an array of objects
  * (both mean a corrupted external store) is reported and treated as if
  * nothing were held. Callers memoize the outcome against the entry's
  * stamp, so a corrupt document costs one parse + report per stamp, not
  * per lookup. */
  _decodeListTools(entry) {
    try {
      const parsed = JSON.parse(entry.value);
      if (!Array.isArray(parsed?.tools) || !parsed.tools.every((t) => t !== null && typeof t === "object")) throw new TypeError("cached tools/list document has a malformed tools array");
      return parsed;
    } catch (error2) {
      this._reportError(error2);
      return;
    }
  }
};
function encodeCacheValue(value) {
  let json;
  try {
    json = JSON.stringify(value);
  } catch (error2) {
    throw new TypeError(`cache value is not JSON-serializable: ${error2 instanceof Error ? error2.message : String(error2)}`);
  }
  if (typeof json !== "string") throw new TypeError("cache value is not JSON-serializable: it has no JSON representation");
  return json;
}
var AUTH_SEAM = /* @__PURE__ */ Symbol.for("mcp.authSeamEscape");
function markAuthSeamEscape(error2) {
  if (typeof error2 === "object" && error2 !== null || typeof error2 === "function") try {
    Object.defineProperty(error2, AUTH_SEAM, {
      value: true,
      configurable: true
    });
  } catch {
  }
  return error2;
}
function isAuthSeamEscape(error2) {
  return (typeof error2 === "object" && error2 !== null || typeof error2 === "function") && error2[AUTH_SEAM] === true;
}
var UNSUPPORTED_PROTOCOL_VERSION = -32022;
var NOT_PROBE_RECOGNIZED = /* @__PURE__ */ new Set([
  -32001,
  -32020,
  -32021
]);
function classifyProbeOutcome(outcome, context) {
  switch (outcome.kind) {
    case "result":
      return classifyResult(outcome.result, context);
    case "rpc-error":
      return classifyRpcError(outcome, context);
    case "http-error":
      return classifyHttpError(outcome, context);
    case "network-error":
      return classifyNetworkError(outcome.error, context);
    case "unusable-reply":
      return {
        kind: "error",
        error: new SdkError(SdkErrorCode.EraNegotiationFailed, `Version negotiation probe failed: the server answered with an unusable reply (${describeError(outcome.error)})`, { cause: outcome.error }, { cause: outcome.error })
      };
    case "auth-required":
      return {
        kind: "error",
        error: outcome.error
      };
    case "closed":
      if (context.transportKind === "stdio") return { kind: "legacy" };
      return classifyNetworkError(/* @__PURE__ */ new Error("Connection closed during the version negotiation probe"), context);
    case "timeout":
      if (context.transportKind === "stdio") return { kind: "legacy" };
      return {
        kind: "error",
        error: new SdkError(SdkErrorCode.RequestTimeout, `Version negotiation probe timed out after ${outcome.timeoutMs}ms`, { timeout: outcome.timeoutMs })
      };
  }
}
function classifyResult(result, context) {
  const parsed = codecForVersion(MODERN_WIRE_REVISION).validateResult("server/discover", result);
  if (!parsed.ok) return { kind: "legacy" };
  const supportedVersions = parsed.value.supportedVersions;
  const overlap = context.clientModernVersions.find((version2) => supportedVersions.includes(version2));
  if (overlap !== void 0) return {
    kind: "modern",
    version: overlap,
    discover: parsed.value
  };
  if (context.fallbackAvailable) return { kind: "legacy" };
  return {
    kind: "error",
    error: new UnsupportedProtocolVersionError({
      supported: [...supportedVersions],
      requested: context.requestedVersion
    })
  };
}
function classifyRpcError(outcome, context) {
  const { code, message, data } = outcome;
  if (code === UNSUPPORTED_PROTOCOL_VERSION) {
    const supported = parseSupportedList(data);
    if (supported === void 0) return { kind: "legacy" };
    const error2 = new UnsupportedProtocolVersionError({
      supported,
      requested: parseRequested(data) ?? context.requestedVersion
    }, message);
    const supportedModern = modernProtocolVersions(supported);
    const mutual = context.clientModernVersions.find((version2) => supportedModern.includes(version2));
    if (mutual !== void 0) return {
      kind: "corrective",
      version: mutual,
      error: error2
    };
    if (supportedModern.length > 0) return {
      kind: "error",
      error: error2
    };
    return context.fallbackAvailable ? { kind: "legacy" } : {
      kind: "error",
      error: error2
    };
  }
  if (NOT_PROBE_RECOGNIZED.has(code)) return { kind: "legacy" };
  return { kind: "legacy" };
}
function classifyHttpError(outcome, context) {
  if (outcome.status === 401 || outcome.status === 403) {
    const isDenial = outcome.status === 403;
    return {
      kind: "error",
      error: new SdkHttpError(isDenial ? SdkErrorCode.ClientHttpForbidden : SdkErrorCode.ClientHttpAuthentication, `Version negotiation failed: ${isDenial ? "the server denied access (HTTP 403)" : "the server requires authorization (HTTP 401)"}`, {
        status: outcome.status,
        statusText: outcome.statusText,
        text: outcome.body
      })
    };
  }
  if (outcome.status >= 500) return {
    kind: "error",
    error: new SdkHttpError(SdkErrorCode.EraNegotiationFailed, `Version negotiation failed: the server answered the probe with HTTP ${outcome.status}`, {
      status: outcome.status,
      statusText: outcome.statusText,
      text: outcome.body
    })
  };
  const rpcError = parseJsonRpcErrorBody(outcome.body);
  if (rpcError !== void 0) return classifyRpcError(rpcError, context);
  return { kind: "legacy" };
}
function classifyNetworkError(error2, context) {
  if (context.environment === "browser" && isOpaqueFetchTypeError(error2)) return { kind: "legacy" };
  return {
    kind: "error",
    error: new SdkError(SdkErrorCode.EraNegotiationFailed, `Version negotiation probe failed: ${describeError(error2)}`, { cause: error2 }, { cause: error2 })
  };
}
function isOpaqueFetchTypeError(error2) {
  return error2 instanceof TypeError || error2 instanceof Error && error2.name === "TypeError";
}
function describeError(error2) {
  return error2 instanceof Error ? error2.message : String(error2);
}
function parseSupportedList(data) {
  if (typeof data !== "object" || data === null) return void 0;
  const supported = data.supported;
  if (!Array.isArray(supported) || supported.length === 0 || !supported.every((v) => typeof v === "string")) return;
  return supported;
}
function parseRequested(data) {
  if (typeof data !== "object" || data === null) return void 0;
  const requested = data.requested;
  return typeof requested === "string" ? requested : void 0;
}
function parseJsonRpcErrorBody(body) {
  if (body === void 0 || body === "") return void 0;
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return;
  }
  if (typeof parsed !== "object" || parsed === null) return void 0;
  const error2 = parsed.error;
  if (typeof error2 !== "object" || error2 === null) return void 0;
  const { code, message, data } = error2;
  if (typeof code !== "number") return void 0;
  return {
    code,
    message: typeof message === "string" ? message : "",
    data
  };
}
var DEFAULT_VERSION_NEGOTIATION_MODE = "legacy";
function resolveVersionNegotiation(options, supportedProtocolVersionsOption) {
  const mode = options?.mode ?? DEFAULT_VERSION_NEGOTIATION_MODE;
  if (mode === "legacy") return { kind: "legacy" };
  const probe = options?.probe ?? {};
  if (typeof mode === "object") {
    if (!isModernProtocolVersion(mode.pin)) throw new TypeError(`versionNegotiation: { pin: '${mode.pin}' } is not a modern protocol revision \u2014 pinning is for 2026-07-28 and later; omit versionNegotiation (or use mode: 'legacy') for 2025-era servers.`);
    return {
      kind: "pin",
      version: mode.pin,
      probe
    };
  }
  const explicitModern = supportedProtocolVersionsOption ? modernProtocolVersions(supportedProtocolVersionsOption) : [];
  return {
    kind: "auto",
    modernVersions: explicitModern.length > 0 ? explicitModern : [...SUPPORTED_MODERN_PROTOCOL_VERSIONS],
    fallbackAvailable: supportedProtocolVersionsOption ? legacyProtocolVersions(supportedProtocolVersionsOption).length > 0 : true,
    probe
  };
}
function detectProbeEnvironment() {
  const g = globalThis;
  return g.window !== void 0 && g.document !== void 0 ? "browser" : "node";
}
function detectProbeTransportKind(transport) {
  return "stderr" in transport && "pid" in transport ? "stdio" : "http";
}
var ProbeWindow = class ProbeWindow2 {
  _pending;
  _probeCounter = 0;
  _savedOnMessage;
  _savedOnError;
  _savedOnClose;
  _closeDelivered = false;
  constructor(_transport) {
    this._transport = _transport;
    this._savedOnMessage = _transport.onmessage;
    this._savedOnError = _transport.onerror;
    this._savedOnClose = _transport.onclose;
  }
  static async open(transport) {
    const window = new ProbeWindow2(transport);
    transport.onmessage = (message) => {
      const pending = window._pending;
      if (pending !== void 0 && (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) && message.id === pending.id) {
        window._pending = void 0;
        if (isJSONRPCResultResponse(message)) pending.resolve({
          kind: "response",
          result: message.result
        });
        else pending.resolve({
          kind: "response",
          error: message.error
        });
        return;
      }
    };
    transport.onerror = (error2) => {
      window._savedOnError?.(error2);
    };
    transport.onclose = () => {
      const pending = window._pending;
      if (pending !== void 0) {
        window._pending = void 0;
        pending.resolve({ kind: "closed" });
      }
      window._closeDelivered = true;
      window._savedOnClose?.();
    };
    try {
      await transport.start();
    } catch (error2) {
      window.detach();
      throw error2;
    }
    return window;
  }
  /**
  * Send one probe request and await its reply. Probe ids are strings, so they
  * never collide with Protocol's numeric ids (e.g. on a shared stdio pipe).
  */
  async exchange(buildRequest, timeoutMs) {
    const id = `server-discover-probe-${++this._probeCounter}`;
    return new Promise((resolve) => {
      let settled = false;
      const settle2 = (reply) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this._pending?.id === id) this._pending = void 0;
        resolve(reply);
      };
      const timer = setTimeout(() => settle2({ kind: "timeout" }), timeoutMs);
      this._pending = {
        id,
        resolve: settle2
      };
      this._transport.send(buildRequest(id)).catch((error2) => settle2({
        kind: "send-error",
        error: error2
      }));
    });
  }
  /** Detach the window's handlers, restoring any the caller pre-set, leaving the transport's own `start` untouched. */
  detach() {
    this._pending = void 0;
    this._transport.onmessage = this._savedOnMessage;
    this._transport.onerror = this._savedOnError;
    if (this._closeDelivered && this._savedOnClose !== void 0) {
      const saved = this._savedOnClose;
      const transport = this._transport;
      let spent = false;
      const wrapper = () => {
        if (!spent) {
          spent = true;
          return;
        }
        saved();
      };
      transport.onclose = wrapper;
      pendingSpentCloseGuards.set(transport, () => {
        if (transport.onclose === wrapper) transport.onclose = saved;
      });
    } else this._transport.onclose = this._savedOnClose;
  }
  /** Detach the handlers and arm the one-shot `start()` pass-through for the `Protocol.connect()` handover. */
  release() {
    this.detach();
    const transport = this._transport;
    const originalStart = transport.start;
    let armed = true;
    transport.start = async function() {
      if (armed) {
        armed = false;
        transport.start = originalStart;
        return;
      }
      return originalStart.call(transport);
    };
  }
};
var pendingSpentCloseGuards = /* @__PURE__ */ new WeakMap();
function disarmSpentCloseGuard(transport) {
  const disarm = pendingSpentCloseGuards.get(transport);
  pendingSpentCloseGuards.delete(transport);
  disarm?.();
}
function buildProbeRequest(id, protocolVersion, clientInfo, capabilities) {
  return {
    jsonrpc: "2.0",
    id,
    method: "server/discover",
    params: { _meta: codecForVersion(protocolVersion).outboundEnvelope({
      protocolVersion,
      clientInfo,
      clientCapabilities: capabilities
    }) }
  };
}
function isUnusableReplyError(error2) {
  if (error2 instanceof SdkError && error2.code === SdkErrorCode.ClientHttpUnexpectedContent) return true;
  return error2 instanceof Error && error2.name === "SyntaxError";
}
function normalizeReply(reply, timeoutMs) {
  switch (reply.kind) {
    case "response":
      return reply.error === void 0 ? {
        kind: "result",
        result: reply.result
      } : {
        kind: "rpc-error",
        ...reply.error
      };
    case "send-error": {
      const error2 = reply.error;
      if (isAuthSeamEscape(error2) || error2 instanceof UnauthorizedError || error2 instanceof Error && error2.name === "UnauthorizedError") return {
        kind: "auth-required",
        error: error2
      };
      if (error2 instanceof SdkHttpError) {
        const text = error2.data?.text;
        return {
          kind: "http-error",
          status: error2.data.status,
          body: typeof text === "string" ? text : void 0,
          statusText: error2.data.statusText
        };
      }
      if (isUnusableReplyError(error2)) return {
        kind: "unusable-reply",
        error: error2
      };
      return {
        kind: "network-error",
        error: error2
      };
    }
    case "closed":
      return { kind: "closed" };
    case "timeout":
      return {
        kind: "timeout",
        timeoutMs
      };
  }
}
async function negotiateEra(negotiation, deps) {
  const timeoutMs = negotiation.probe.timeoutMs ?? deps.defaultTimeoutMs;
  const maxRetries = Math.max(0, negotiation.probe.maxRetries ?? 0);
  const clientModernVersions = negotiation.kind === "pin" ? [negotiation.version] : negotiation.modernVersions;
  const fallbackAvailable = negotiation.kind === "auto" && negotiation.fallbackAvailable;
  const window = await ProbeWindow.open(deps.transport);
  const probe = async () => {
    let requestedVersion = clientModernVersions[0];
    let correctiveUsed = false;
    let timeoutRetriesRemaining = maxRetries;
    for (; ; ) {
      const reply = await window.exchange((id) => buildProbeRequest(id, requestedVersion, deps.clientInfo, deps.capabilities), timeoutMs);
      if (reply.kind === "timeout" && timeoutRetriesRemaining > 0) {
        timeoutRetriesRemaining--;
        continue;
      }
      const outcome = normalizeReply(reply, timeoutMs);
      const verdict = classifyProbeOutcome(outcome, {
        clientModernVersions,
        requestedVersion,
        fallbackAvailable,
        environment: deps.environment,
        transportKind: deps.transportKind
      });
      switch (verdict.kind) {
        case "modern":
          return {
            era: "modern",
            version: verdict.version,
            discover: verdict.discover
          };
        case "corrective":
          if (correctiveUsed) throw verdict.error;
          correctiveUsed = true;
          requestedVersion = verdict.version;
          continue;
        case "legacy": {
          const closedCause = outcome.kind === "closed" ? "the connection closed during the server/discover probe" : void 0;
          if (negotiation.kind === "pin") throw new SdkError(SdkErrorCode.EraNegotiationFailed, closedCause === void 0 ? `Version negotiation failed: the server did not offer pinned protocol version ${negotiation.version} via server/discover (no fallback in pin mode)` : `Version negotiation failed: ${closedCause} before the server offered pinned protocol version ${negotiation.version} (no fallback in pin mode)`);
          if (!negotiation.fallbackAvailable) throw new SdkError(SdkErrorCode.EraNegotiationFailed, closedCause === void 0 ? "Version negotiation failed: the server gave no modern evidence and this client supports no pre-2026-07-28 protocol version to fall back to" : `Version negotiation failed: ${closedCause} and this client supports no pre-2026-07-28 protocol version to fall back to`);
          if (closedCause !== void 0 && deps.disposableProbe !== true) throw new SdkError(SdkErrorCode.EraNegotiationFailed, `Version negotiation failed: ${closedCause} (this transport probed in place \u2014 the disposable sibling probe requires the SDK's base StdioClientTransport)`);
          return { era: "legacy" };
        }
        case "error":
          throw verdict.error;
      }
    }
  };
  let result;
  try {
    result = await probe();
  } catch (error2) {
    window.detach();
    throw error2;
  }
  window.release();
  return result;
}
function readStdioServerParams(transport) {
  const proto = Object.getPrototypeOf(transport);
  if (proto === null || !Object.prototype.hasOwnProperty.call(proto, "_dispose")) return;
  const params = transport._serverParams;
  return typeof params === "object" && params !== null && typeof params.command === "string" ? params : void 0;
}
async function negotiateStdioViaSibling(negotiation, sessionTransport, params, deps) {
  const SiblingTransport = sessionTransport.constructor;
  const sibling = new SiblingTransport({
    ...params,
    stderr: "ignore"
  });
  const originalClose = sessionTransport.close;
  let callerClosed = false;
  let signalClosed;
  const closedSignal = new Promise((_, reject) => {
    signalClosed = () => reject(callerCloseAbortError());
  });
  sessionTransport.close = async function() {
    callerClosed = true;
    signalClosed?.();
    return originalClose.call(sessionTransport);
  };
  let result;
  try {
    const negotiated = negotiateEra(negotiation, {
      ...deps,
      transport: sibling,
      transportKind: "stdio",
      disposableProbe: true
    });
    negotiated.catch(() => {
    });
    result = await Promise.race([negotiated, closedSignal]);
  } finally {
    await disposeSibling(sibling);
    sessionTransport.close = originalClose;
  }
  if (callerClosed) throw callerCloseAbortError();
  return result;
}
function callerCloseAbortError() {
  return new SdkError(SdkErrorCode.EraNegotiationFailed, "Version negotiation failed: the transport was closed during the server/discover probe");
}
async function disposeSibling(sibling) {
  try {
    const dispose = sibling._dispose;
    await (typeof dispose === "function" ? dispose.call(sibling) : sibling.close());
  } catch {
  }
}
function serverInfoFromDiscover(discover) {
  const fromMeta = discover._meta?.[SERVER_INFO_META_KEY];
  return isSpecType.Implementation(fromMeta) ? fromMeta : void 0;
}
function applyElicitationDefaults(schema, data) {
  if (!schema || data === null || typeof data !== "object") return;
  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const obj = data;
    const props = schema.properties;
    for (const key of Object.keys(props)) {
      const propSchema = props[key];
      if (obj[key] === void 0 && Object.prototype.hasOwnProperty.call(propSchema, "default")) obj[key] = propSchema.default;
      if (obj[key] !== void 0) applyElicitationDefaults(propSchema, obj[key]);
    }
  }
  if (Array.isArray(schema.anyOf)) {
    for (const sub of schema.anyOf) if (typeof sub !== "boolean") applyElicitationDefaults(sub, data);
  }
  if (Array.isArray(schema.oneOf)) {
    for (const sub of schema.oneOf) if (typeof sub !== "boolean") applyElicitationDefaults(sub, data);
  }
}
function getSupportedElicitationModes(capabilities) {
  if (!capabilities) return {
    supportsFormMode: false,
    supportsUrlMode: false
  };
  const hasFormCapability = capabilities.form !== void 0;
  const hasUrlCapability = capabilities.url !== void 0;
  return {
    supportsFormMode: hasFormCapability || !hasFormCapability && !hasUrlCapability,
    supportsUrlMode: hasUrlCapability
  };
}
function validatePrior(prior) {
  if (typeof prior === "object" && prior !== null) {
    if (prior.kind === "legacy" && !("supportedVersions" in prior) && !("discover" in prior)) return prior;
    if (prior.kind === "modern" && DiscoverResultSchema.safeParse(prior.discover).success) return prior;
  }
  throw new SdkError(SdkErrorCode.EraNegotiationFailed, "connect({ prior }): unrecognized prior \u2014 expected { kind: 'modern', discover } or { kind: 'legacy' }");
}
var LIST_CHANGED_EVICTIONS = {
  "notifications/tools/list_changed": ["tools/list"],
  "notifications/prompts/list_changed": ["prompts/list"],
  "notifications/resources/list_changed": ["resources/list", "resources/templates/list"]
};
var DEFAULT_LIST_MAX_PAGES = 64;
var Client = class extends Protocol {
  _serverCapabilities;
  _serverVersion;
  _capabilities;
  _instructions;
  _jsonSchemaValidator;
  /**
  * The response-cache substrate. Owns the backing store, the per-method
  * eviction-generation counter, the user-supplied/default flag, and the
  * stamp-memoized derived `name → Tool` / `name → output-validator`
  * indices — the cache-coordination state that used to live as separate
  * private fields here. The internal aggregating walk writes one entry per
  * list verb; `list_changed` evicts the matching method;
  * `_resetConnectionState` resets the lot. {@linkcode callTool}'s
  * output-schema validation reads the derived `outputValidator` index (the
  * substrate's first production caller); the stacked SEP-2243 PR wires
  * `Mcp-Param-*` mirroring through `toolDefinition` on top.
  */
  _cache;
  _defaultCacheTtlMs;
  _listMaxPages;
  _listChangedDebounceTimers = /* @__PURE__ */ new Map();
  /**
  * The constructor `listChanged` configuration. Durable across reconnects:
  * read fresh on every connect (legacy or modern), never consumed.
  */
  _listChangedConfig;
  _enforceStrictCapabilities;
  _versionNegotiation;
  _supportedProtocolVersionsOption;
  _inputRequiredDriverConfig;
  /**
  * Active subscriptions/listen state, keyed by subscription id (= the
  * listen request's JSON-RPC id verbatim). The id is a STRING from a
  * Client-owned counter (`'listen:' + N`) — JSON-RPC permits string ids,
  * and Protocol's numeric `_requestMessageId` counter only ever issues
  * numbers, so listen ids cannot collide with ordinary request ids.
  */
  _listenState = /* @__PURE__ */ new Map();
  _nextListenId = 0;
  /** The auto-opened subscription backing ClientOptions.listChanged on a modern connection. */
  _autoOpenedSubscription;
  /** Backing store for {@linkcode getDiscoverResult}. Per-connection. */
  _discoverResult;
  /**
  * Clears every per-connection field in one place. Called at the start of
  * each fresh (non-resuming) connect and from `close()`, so a stale
  * negotiated era / server identity / auto-opened subscription cannot
  * survive a reconnect.
  */
  _resetConnectionState() {
    this._negotiatedProtocolVersion = void 0;
    this._serverCapabilities = void 0;
    this._serverVersion = void 0;
    this._instructions = void 0;
    this._discoverResult = void 0;
    this._autoOpenedSubscription = void 0;
    if (this._listenState.size > 0) {
      const reason = new SdkError(SdkErrorCode.ConnectionClosed, "subscriptions/listen: client reconnected or closed; subscription state from the previous connection was reset");
      for (const entry of this._listenState.values()) entry.settle({
        cause: "remote",
        error: reason
      });
    }
    this._listenState.clear();
    for (const timer of this._listChangedDebounceTimers.values()) clearTimeout(timer);
    this._listChangedDebounceTimers.clear();
    this._cache.resetForReconnect();
  }
  async close() {
    try {
      await super.close();
    } finally {
      this._resetConnectionState();
    }
  }
  /**
  * Initializes this client with the given name and version information.
  */
  constructor(_clientInfo, options) {
    super(options);
    this._clientInfo = _clientInfo;
    this._capabilities = options?.capabilities ? { ...options.capabilities } : {};
    this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new CfWorkerJsonSchemaValidator();
    this._enforceStrictCapabilities = options?.enforceStrictCapabilities ?? false;
    this._versionNegotiation = options?.versionNegotiation;
    this._supportedProtocolVersionsOption = options?.supportedProtocolVersions;
    this._inputRequiredDriverConfig = resolveInputRequiredDriverConfig(options?.inputRequired);
    this._cache = new ClientResponseCache(options?.responseCacheStore ?? new InMemoryResponseCacheStore(), options?.responseCacheStore !== void 0, (error2) => this._reportStoreError(error2), options?.cachePartition ?? "");
    this._defaultCacheTtlMs = options?.defaultCacheTtlMs ?? 0;
    this._listMaxPages = options?.listMaxPages ?? DEFAULT_LIST_MAX_PAGES;
    if (options?.listChanged) this._listChangedConfig = options.listChanged;
  }
  buildContext(ctx, _transportInfo) {
    return ctx;
  }
  /**
  * Era-keyed direction enforcement for inbound traffic on channels whose
  * transport does not classify (e.g. stdio): the 2026-07-28 era has no
  * server→client JSON-RPC request channel — server-to-client interactions
  * are carried in-band in `input_required` results — and on stdio the
  * client must never write JSON-RPC responses. An inbound request arriving
  * on a connection that negotiated a modern era is therefore dropped
  * (surfaced via `onerror`) rather than answered. Connections on a legacy
  * era — and all responses and notifications — keep today's dispatch path.
  */
  _shouldDropInbound(message) {
    if (this._negotiatedProtocolVersion !== void 0 && isModernProtocolVersion(this._negotiatedProtocolVersion) && isJSONRPCRequest(message)) return "drop";
  }
  /**
  * Per-request `_meta` envelope auto-emission (protocol revision 2026-07-28):
  * on a connection that negotiated a modern era — auto-negotiated or pinned —
  * every outgoing request and notification automatically carries the reserved
  * protocol-version / client-info / client-capabilities `_meta` keys (the
  * same envelope the connect-time `server/discover` probe sends).
  * User-supplied `_meta` keys take precedence over the auto-attached ones.
  *
  * Legacy-era connections return `undefined`: the envelope seam is a no-op
  * and outbound traffic is byte-identical to a 2025 client (the legacy
  * `'auto'` fallback included).
  */
  _outboundMetaEnvelope() {
    const version2 = this._negotiatedProtocolVersion;
    if (version2 === void 0) return void 0;
    return this._wireCodec().outboundEnvelope({
      protocolVersion: version2,
      clientInfo: this._clientInfo,
      clientCapabilities: this._capabilities
    });
  }
  /**
  * Wires the multi-round-trip auto-fulfilment engine (protocol revision
  * 2026-07-28) into the response funnel: an `input_required` answer is
  * fulfilled through the registered elicitation/sampling/roots handlers
  * and the original request retried via `flow.retry`, up to
  * `inputRequired.maxRounds` rounds. With auto-fulfilment disabled the
  * response surfaces as a typed error steering to manual mode.
  */
  _resolveNonCompleteResult(decoded, flow) {
    if (!this._inputRequiredDriverConfig.autoFulfill) return Promise.reject(new SdkError(SdkErrorCode.UnsupportedResultType, `Unsupported result type 'input_required' for ${flow.request.method}: multi-round-trip auto-fulfilment is not enabled on this instance \u2014 pass allowInputRequired: true to handle it manually, or enable inputRequired.autoFulfill`, {
      resultType: "input_required",
      method: flow.request.method
    }));
    return runInputRequiredFlow({
      getRequestHandler: (method) => this._getRequestHandler(method),
      buildContext: (baseCtx) => this.buildContext(baseCtx, void 0),
      sessionId: this.transport?.sessionId
    }, this._inputRequiredDriverConfig, decoded, flow);
  }
  /**
  * Set up handlers for list changed notifications based on config and server capabilities.
  * This should only be called after initialization when server capabilities are known.
  * Handlers are silently skipped if the server doesn't advertise the corresponding listChanged capability.
  * @internal
  */
  _setupListChangedHandlers(config2) {
    if (config2.tools && this._serverCapabilities?.tools?.listChanged) this._setupListChangedHandler("tools", "notifications/tools/list_changed", config2.tools, async () => {
      return (await this.listTools(void 0, { cacheMode: "refresh" })).tools;
    });
    if (config2.prompts && this._serverCapabilities?.prompts?.listChanged) this._setupListChangedHandler("prompts", "notifications/prompts/list_changed", config2.prompts, async () => {
      return (await this.listPrompts(void 0, { cacheMode: "refresh" })).prompts;
    });
    if (config2.resources && this._serverCapabilities?.resources?.listChanged) this._setupListChangedHandler("resources", "notifications/resources/list_changed", config2.resources, async () => {
      return (await this.listResources(void 0, { cacheMode: "refresh" })).resources;
    });
  }
  /**
  * Registers new capabilities. This can only be called before connecting to a transport.
  *
  * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
  */
  registerCapabilities(capabilities) {
    if (this.transport) throw new Error("Cannot register capabilities after connecting to transport");
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  /**
  * Configure protocol version negotiation before connecting (equivalent to
  * passing `versionNegotiation` at construction time). Can only be called
  * before connecting to a transport. Passing `undefined` clears a previously
  * configured negotiation, restoring the default `'legacy'` posture.
  *
  * See {@linkcode ClientOptions | ClientOptions.versionNegotiation} for the mode semantics.
  */
  setVersionNegotiation(options) {
    if (this.transport) throw new Error("Cannot configure version negotiation after connecting to transport");
    this._versionNegotiation = options;
  }
  /**
  * Enforces client-side validation for `elicitation/create` and `sampling/createMessage`
  * regardless of how the handler was registered.
  */
  _wrapHandler(method, handler) {
    if (method === "elicitation/create") return async (request, ctx) => {
      const codec = codecForVersion(this._negotiatedProtocolVersion);
      let validatedRequest = codec.validateRequest("elicitation/create", request);
      if (!validatedRequest.ok && validatedRequest.reason === "not-in-era") validatedRequest = codec.validateInputRequest("elicitation/create", request);
      if (!validatedRequest.ok) throw new ProtocolError(validatedRequest.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validatedRequest.reason === "not-in-era" ? "No wire schema for elicitation/create in the resolved era" : `Invalid elicitation request: ${validatedRequest.message}`);
      const { params } = validatedRequest.value;
      params.mode = params.mode ?? "form";
      const { supportsFormMode, supportsUrlMode } = getSupportedElicitationModes(this._capabilities.elicitation);
      if (params.mode === "form" && !supportsFormMode) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "Client does not support form-mode elicitation requests");
      if (params.mode === "url" && !supportsUrlMode) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "Client does not support URL-mode elicitation requests");
      const result = await handler(request, ctx);
      let validationResult = codec.validateResult("elicitation/create", result);
      if (!validationResult.ok && validationResult.reason === "not-in-era") validationResult = codec.validateInputResponse("elicitation/create", result);
      if (!validationResult.ok) throw new ProtocolError(validationResult.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validationResult.reason === "not-in-era" ? "No wire schema for elicitation/create in the resolved era" : `Invalid elicitation result: ${validationResult.message}`);
      const validatedResult = validationResult.value;
      const requestedSchema = params.mode === "form" ? params.requestedSchema : void 0;
      if (params.mode === "form" && validatedResult.action === "accept" && validatedResult.content && requestedSchema && this._capabilities.elicitation?.form?.applyDefaults) try {
        applyElicitationDefaults(requestedSchema, validatedResult.content);
      } catch {
      }
      return validatedResult;
    };
    if (method === "sampling/createMessage") return async (request, ctx) => {
      const codec = codecForVersion(this._negotiatedProtocolVersion);
      let validatedRequest = codec.validateRequest("sampling/createMessage", request);
      if (!validatedRequest.ok && validatedRequest.reason === "not-in-era") validatedRequest = codec.validateInputRequest("sampling/createMessage", request);
      if (!validatedRequest.ok) throw new ProtocolError(validatedRequest.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validatedRequest.reason === "not-in-era" ? "No wire schema for sampling/createMessage in the resolved era" : `Invalid sampling request: ${validatedRequest.message}`);
      const { params } = validatedRequest.value;
      const result = await handler(request, ctx);
      const hasTools = Boolean(params.tools || params.toolChoice);
      let validatedResult = codec.samplingResultVariant(hasTools, result);
      if (!validatedResult.ok && validatedResult.reason === "not-in-era") validatedResult = codec.validateInputResponse("sampling/createMessage", result);
      if (!validatedResult.ok) throw new ProtocolError(validatedResult.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validatedResult.reason === "not-in-era" ? "No result schema for sampling/createMessage in the resolved era" : `Invalid sampling result: ${validatedResult.message}`);
      return validatedResult.value;
    };
    return handler;
  }
  assertCapability(capability, method) {
    if (!this._serverCapabilities?.[capability]) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support ${capability} (required for ${method})`);
  }
  /**
  * Connects to a server via the given transport and performs the MCP initialization handshake.
  *
  * @example Basic usage (stdio)
  * ```ts source="./client.examples.ts#Client_connect_stdio"
  * const client = new Client({ name: 'my-client', version: '1.0.0' });
  * const transport = new StdioClientTransport({ command: 'my-mcp-server' });
  * await client.connect(transport);
  * ```
  *
  * @example Streamable HTTP with SSE fallback
  * ```ts source="./client.examples.ts#Client_connect_sseFallback"
  * const baseUrl = new URL(url);
  *
  * try {
  *     // Try modern Streamable HTTP transport first
  *     const client = new Client({ name: 'my-client', version: '1.0.0' });
  *     const transport = new StreamableHTTPClientTransport(baseUrl);
  *     await client.connect(transport);
  *     return { client, transport };
  * } catch {
  *     // Fall back to legacy SSE transport
  *     const client = new Client({ name: 'my-client', version: '1.0.0' });
  *     const transport = new SSEClientTransport(baseUrl);
  *     await client.connect(transport);
  *     return { client, transport };
  * }
  * ```
  */
  async connect(transport, options) {
    if (options?.prior != null) return this._connectFromPrior(transport, validatePrior(options.prior), options);
    const negotiation = resolveVersionNegotiation(this._versionNegotiation, this._supportedProtocolVersionsOption);
    if (negotiation.kind !== "legacy") return this._connectNegotiated(transport, negotiation, options);
    return this._connectPlainLegacy(transport, options);
  }
  /**
  * Plain legacy connect — the pinned 2025 sequence, byte-untouched. The
  * `mode: 'legacy'` connect body, shared with the `prior` legacy verdict.
  */
  async _connectPlainLegacy(transport, options) {
    await super.connect(transport);
    if (transport.sessionId !== void 0) {
      const negotiatedProtocolVersion = this._negotiatedProtocolVersion;
      if (negotiatedProtocolVersion !== void 0) transport.setProtocolVersion?.(negotiatedProtocolVersion);
      return;
    }
    this._resetConnectionState();
    await this._legacyHandshake(transport, options);
  }
  /**
  * The 2025 `initialize` handshake — the body of the plain legacy connect and
  * the `'auto'`-mode fallback path (same `initialize` body, zero 2026 headers;
  * on the stdio sibling path it opens the session child's fresh pipe, in the
  * in-place modes it rides the probed connection). Callers clear the negotiated protocol version before
  * the handshake; its completion sets the negotiated (legacy) version.
  */
  async _legacyHandshake(transport, options) {
    const legacyVersions = legacyProtocolVersions(this._supportedProtocolVersions);
    try {
      const offeredVersion = legacyVersions[0];
      if (offeredVersion === void 0) throw new SdkError(SdkErrorCode.EraNegotiationFailed, "Cannot run the initialize handshake: supportedProtocolVersions contains no pre-2026-07-28 protocol version");
      const result = await this.request({
        method: "initialize",
        params: {
          protocolVersion: offeredVersion,
          capabilities: this._capabilities,
          clientInfo: this._clientInfo
        }
      }, options);
      if (result === void 0) throw new Error(`Server sent invalid initialize result: ${result}`);
      if (!legacyVersions.includes(result.protocolVersion)) throw new Error(`Server's protocol version is not supported: ${result.protocolVersion}`);
      this._serverCapabilities = result.capabilities;
      this._serverVersion = result.serverInfo;
      this._cache.setServerIdentity(this._deriveServerIdentity(transport));
      if (transport.setProtocolVersion) transport.setProtocolVersion(result.protocolVersion);
      this._instructions = result.instructions;
      await this.notification({ method: "notifications/initialized" });
      this._negotiatedProtocolVersion = result.protocolVersion;
      if (this._listChangedConfig) this._setupListChangedHandlers(this._listChangedConfig);
    } catch (error2) {
      this.close();
      throw error2;
    }
  }
  /**
  * Negotiated connect (mode `'auto'` or `{ pin }`): probe with `server/discover`
  * before the Protocol machinery attaches — on a disposable sibling process for
  * the SDK's stdio transport, in place otherwise — then either establish the
  * modern era or perform the plain legacy handshake.
  */
  async _connectNegotiated(transport, negotiation, options) {
    if (transport.sessionId !== void 0) {
      await super.connect(transport);
      const negotiatedProtocolVersion = this._negotiatedProtocolVersion;
      if (negotiatedProtocolVersion !== void 0 && transport.setProtocolVersion) transport.setProtocolVersion(negotiatedProtocolVersion);
      return;
    }
    this._resetConnectionState();
    let result;
    try {
      const transportKind = detectProbeTransportKind(transport);
      const baseDeps = {
        clientInfo: this._clientInfo,
        capabilities: this._capabilities,
        environment: detectProbeEnvironment(),
        defaultTimeoutMs: options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC
      };
      const stdioParams = transportKind === "stdio" ? readStdioServerParams(transport) : void 0;
      result = stdioParams === void 0 ? await negotiateEra(negotiation, {
        ...baseDeps,
        transport,
        transportKind
      }) : await negotiateStdioViaSibling(negotiation, transport, stdioParams, baseDeps);
    } catch (error2) {
      await transport.close().catch(() => {
      });
      disarmSpentCloseGuard(transport);
      throw error2;
    }
    disarmSpentCloseGuard(transport);
    await super.connect(transport);
    if (result.era === "legacy") {
      await this._legacyHandshake(transport, options);
      return;
    }
    this._serverCapabilities = result.discover.capabilities;
    this._serverVersion = serverInfoFromDiscover(result.discover);
    this._cache.setServerIdentity(this._deriveServerIdentity(transport));
    this._instructions = result.discover.instructions;
    this._discoverResult = result.discover;
    this._negotiatedProtocolVersion = result.version;
    if (transport.setProtocolVersion) transport.setProtocolVersion(result.version);
    if (this._listChangedConfig) {
      const config2 = this._listChangedConfig;
      const advertised = this._serverCapabilities;
      const effective = {
        ...config2.tools && advertised?.tools?.listChanged && { tools: config2.tools },
        ...config2.prompts && advertised?.prompts?.listChanged && { prompts: config2.prompts },
        ...config2.resources && advertised?.resources?.listChanged && { resources: config2.resources }
      };
      let handlersRegistered = true;
      try {
        this._setupListChangedHandlers(effective);
      } catch (error2) {
        handlersRegistered = false;
        this.onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
      }
      const filter = handlersRegistered ? {
        ...effective.tools && { toolsListChanged: true },
        ...effective.prompts && { promptsListChanged: true },
        ...effective.resources && { resourcesListChanged: true }
      } : {};
      if (Object.keys(filter).length > 0) {
        const ackAbort = new AbortController();
        const onConnectAbort = () => ackAbort.abort(options?.signal?.reason);
        if (options?.signal?.aborted) onConnectAbort();
        options?.signal?.addEventListener("abort", onConnectAbort);
        try {
          this._autoOpenedSubscription = await this.listen(filter, {
            timeout: options?.timeout,
            signal: ackAbort.signal
          });
        } catch (error2) {
          if (options?.signal?.aborted) {
            await this.close().catch(() => {
            });
            throw error2;
          }
          this.onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
        } finally {
          options?.signal?.removeEventListener("abort", onConnectAbort);
        }
      }
    }
  }
  /**
  * Connect from a validated {@linkcode PriorDiscovery}: the modern arm
  * adopts the `DiscoverResult` (zero round trips; `EraNegotiationFailed`
  * on no 2026-07-28+ overlap), the legacy arm runs the plain legacy connect.
  */
  async _connectFromPrior(transport, prior, options) {
    if (prior.kind === "legacy") return this._connectPlainLegacy(transport, options);
    const discover = prior.discover;
    this._resetConnectionState();
    const explicit = this._supportedProtocolVersionsOption;
    const version2 = (explicit && modernProtocolVersions(explicit).length > 0 ? modernProtocolVersions(explicit) : SUPPORTED_MODERN_PROTOCOL_VERSIONS).find((v) => discover.supportedVersions.includes(v));
    if (version2 === void 0) throw new SdkError(SdkErrorCode.EraNegotiationFailed, "connect({ prior }) with a modern verdict requires a 2026-07-28+ mutual protocol version; the supplied DiscoverResult and this client's supportedProtocolVersions have no modern overlap. For a server known to be legacy, pass prior: { kind: 'legacy' } to skip the probe and initialize directly, or use versionNegotiation: { mode: 'auto' } to re-probe with legacy fallback.");
    await super.connect(transport);
    this._discoverResult = discover;
    this._serverCapabilities = discover.capabilities;
    this._serverVersion = serverInfoFromDiscover(discover);
    this._cache.setServerIdentity(this._deriveServerIdentity(transport));
    this._instructions = discover.instructions;
    this._negotiatedProtocolVersion = version2;
    transport.setProtocolVersion?.(version2);
    if (this._listChangedConfig) try {
      this._setupListChangedHandlers(this._listChangedConfig);
    } catch (error2) {
      this.onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
    }
  }
  /**
  * After initialization has completed, this will be populated with the server's reported capabilities.
  */
  getServerCapabilities() {
    return this._serverCapabilities;
  }
  /**
  * The connected server's self-reported name and version, when it
  * identified itself: required on the legacy `initialize` result; a spec
  * SHOULD in the discover result's `_meta` on 2026-07-28, so a successful
  * modern connect against an anonymous server leaves this `undefined`.
  */
  getServerVersion() {
    return this._serverVersion;
  }
  /**
  * The connected server's identity for response-cache partitioning. The
  * `serverInfo` `name@version` pair when available (required on
  * `initialize`; a SHOULD in the discover result's `_meta` since spec PR
  * #3002); falls back to the transport's `sessionId`, then to a
  * per-connection surrogate. The surrogate matters since #3002 made
  * identity optional: without it, two identity-less servers reached over
  * sessionId-less transports would share the cache's pre-connect `''`
  * partition and read each other's entries — no stable identity means no
  * cross-connection cache reuse. The value itself is server-controlled —
  * the collision-safety of the storage partition comes from
  * {@linkcode ClientResponseCache}'s JSON-array encoding around it, not
  * from any character it does or does not contain.
  */
  _deriveServerIdentity(transport) {
    const v = this._serverVersion;
    if (v !== void 0) return `${v.name}@${v.version}`;
    return transport.sessionId ?? `anonymous:${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  /**
  * After initialization has completed, this will be populated with the protocol version negotiated
  * during the initialize handshake. When manually reconstructing a transport for reconnection, pass this
  * value to the new transport so it continues sending the required `mcp-protocol-version` header.
  */
  getNegotiatedProtocolVersion() {
    return this._negotiatedProtocolVersion;
  }
  /**
  * After initialization has completed, this returns the protocol era of the
  * connection: `'modern'` when the connection negotiated a 2026-07-28+
  * revision (via `server/discover`), `'legacy'` for the 2025-era
  * `initialize` handshake, or `undefined` before the connection is
  * established.
  */
  getProtocolEra() {
    const version2 = this._negotiatedProtocolVersion;
    if (version2 === void 0) return void 0;
    return isModernProtocolVersion(version2) ? "modern" : "legacy";
  }
  /**
  * After initialization has completed, this may be populated with information about the server's instructions.
  */
  getInstructions() {
    return this._instructions;
  }
  /**
  * The {@linkcode DiscoverResult} from the last `'auto'`/pinned probe,
  * {@linkcode discover} call, or `connect({ prior })` that adopted a
  * modern verdict (a legacy verdict leaves this `undefined` — there is no
  * `DiscoverResult` on that path). Persistable via `JSON.stringify`; wrap
  * as `{ kind: 'modern', discover }` and feed to {@linkcode ConnectOptions}
  * `prior`.
  */
  getDiscoverResult() {
    return this._discoverResult;
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "logging/setLevel":
        if (!this._serverCapabilities?.logging) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support logging (required for ${method})`);
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._serverCapabilities?.prompts) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support prompts (required for ${method})`);
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
      case "resources/subscribe":
      case "resources/unsubscribe":
        if (!this._serverCapabilities?.resources) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support resources (required for ${method})`);
        if (method === "resources/subscribe" && !this._serverCapabilities.resources.subscribe) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support resource subscriptions (required for ${method})`);
        break;
      case "tools/call":
      case "tools/list":
        if (!this._serverCapabilities?.tools) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support tools (required for ${method})`);
        break;
      case "completion/complete":
        if (!this._serverCapabilities?.completions) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support completions (required for ${method})`);
        break;
      case "initialize":
        break;
      case "server/discover":
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/roots/list_changed":
        if (!this._capabilities.roots?.listChanged) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support roots list changed notifications (required for ${method})`);
        break;
      case "notifications/initialized":
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    switch (method) {
      case "sampling/createMessage":
        if (!this._capabilities.sampling) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support sampling capability (required for ${method})`);
        break;
      case "elicitation/create":
        if (!this._capabilities.elicitation) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support elicitation capability (required for ${method})`);
        break;
      case "roots/list":
        if (!this._capabilities.roots) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support roots capability (required for ${method})`);
        break;
      case "ping":
        break;
    }
  }
  async ping(options) {
    return this.request({ method: "ping" }, options);
  }
  /**
  * Send `server/discover` (2026-07-28+) and record the result for
  * {@linkcode getDiscoverResult}.
  */
  async discover(options) {
    const result = await this._requestWithSchema({ method: "server/discover" }, DiscoverResultSchema, options);
    this._discoverResult = result;
    return result;
  }
  /** Requests argument autocompletion suggestions from the server for a prompt or resource. */
  async complete(params, options) {
    return this.request({
      method: "completion/complete",
      params
    }, options);
  }
  /**
  * Sets the minimum severity level for log messages sent by the server.
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Remains functional during the deprecation window (at least twelve months).
  * Migrate to stderr logging (STDIO servers) or OpenTelemetry.
  */
  async setLoggingLevel(level, options) {
    return this.request({
      method: "logging/setLevel",
      params: { level }
    }, options);
  }
  /** Retrieves a prompt by name from the server, passing the given arguments for template substitution. */
  async getPrompt(params, options) {
    return this.request({
      method: "prompts/get",
      params
    }, options);
  }
  /**
  * Lists available prompts.
  *
  * Called without a `cursor` (the common case), this walks every page and
  * returns the complete aggregated list with no `nextCursor`; the
  * aggregate is also written to the {@linkcode ResponseCacheStore}. Pass an
  * explicit `{ cursor }` to fetch a single page and walk pagination
  * yourself — the per-page path returns the server's raw page (with
  * `nextCursor` for the next call) and does not write the response cache.
  * The auto-aggregate path is capped by
  * {@linkcode ClientOptions | ClientOptions.listMaxPages} (default 64); the per-page path
  * is not.
  *
  * Returns an empty list if the server does not advertise prompts capability
  * (or throws if {@linkcode ClientOptions.enforceStrictCapabilities} is enabled).
  *
  * @example
  * ```ts source="./client.examples.ts#Client_listPrompts_pagination"
  * // No cursor → all pages aggregated for you.
  * const { prompts } = await client.listPrompts();
  * console.log(
  *     'Available prompts:',
  *     prompts.map(p => p.name)
  * );
  * ```
  */
  async listPrompts(params, options) {
    if (!this._serverCapabilities?.prompts && !this._enforceStrictCapabilities) {
      console.debug("Client.listPrompts() called but server does not advertise prompts capability - returning empty list");
      return { prompts: [] };
    }
    if (params?.cursor !== void 0) return this.request({
      method: "prompts/list",
      params
    }, options);
    const hit = await this._serveFromCache("prompts/list", void 0, options);
    if (hit !== void 0) return hit;
    return this._listAllPages("prompts/list", params, options, (r) => r.prompts);
  }
  /**
  * Lists available resources.
  *
  * Called without a `cursor` (the common case), this walks every page and
  * returns the complete aggregated list with no `nextCursor`; the
  * aggregate is also written to the {@linkcode ResponseCacheStore}. Pass an
  * explicit `{ cursor }` to fetch a single page and walk pagination
  * yourself — the per-page path returns the server's raw page (with
  * `nextCursor` for the next call) and does not write the response cache.
  * The auto-aggregate path is capped by
  * {@linkcode ClientOptions | ClientOptions.listMaxPages} (default 64); the per-page path
  * is not.
  *
  * Returns an empty list if the server does not advertise resources capability
  * (or throws if {@linkcode ClientOptions.enforceStrictCapabilities} is enabled).
  *
  * @example
  * ```ts source="./client.examples.ts#Client_listResources_pagination"
  * // No cursor → all pages aggregated for you.
  * const { resources } = await client.listResources();
  * console.log(
  *     'Available resources:',
  *     resources.map(r => r.name)
  * );
  * ```
  */
  async listResources(params, options) {
    if (!this._serverCapabilities?.resources && !this._enforceStrictCapabilities) {
      console.debug("Client.listResources() called but server does not advertise resources capability - returning empty list");
      return { resources: [] };
    }
    if (params?.cursor !== void 0) return this.request({
      method: "resources/list",
      params
    }, options);
    const hit = await this._serveFromCache("resources/list", void 0, options);
    if (hit !== void 0) return hit;
    return this._listAllPages("resources/list", params, options, (r) => r.resources);
  }
  /**
  * Lists available resource URI templates for dynamic resources.
  *
  * Called without a `cursor`, this walks every page and returns the
  * complete aggregated list with no `nextCursor`; the aggregate is
  * also written to the {@linkcode ResponseCacheStore}. Pass an explicit
  * `{ cursor }` to fetch a single page — see
  * {@linkcode listResources | listResources()} for the per-page contract.
  *
  * Returns an empty list if the server does not advertise resources capability
  * (or throws if {@linkcode ClientOptions.enforceStrictCapabilities} is enabled).
  */
  async listResourceTemplates(params, options) {
    if (!this._serverCapabilities?.resources && !this._enforceStrictCapabilities) {
      console.debug("Client.listResourceTemplates() called but server does not advertise resources capability - returning empty list");
      return { resourceTemplates: [] };
    }
    if (params?.cursor !== void 0) return this.request({
      method: "resources/templates/list",
      params
    }, options);
    const hit = await this._serveFromCache("resources/templates/list", void 0, options);
    if (hit !== void 0) return hit;
    return this._listAllPages("resources/templates/list", params, options, (r) => r.resourceTemplates);
  }
  /**
  * Walk every page of a paginated list verb, aggregate, and write ONE
  * entry to the response cache. Internal — backs the public `list*`
  * methods' no-`cursor` auto-aggregate path. Page 1's result object is
  * mutated in place (its items array is extended; `nextCursor` is
  * cleared); page-1 metadata (`ttlMs`, `cacheScope`, `_meta`) is preserved.
  * A page with the same items and `nextCursor` as the previous page ends the walk;
  * {@linkcode ClientOptions.listMaxPages} is a hard cap — hitting it
  * throws, so a partial aggregate is never cached. The
  * captured-generation guard skips the write when a `list_changed` landed
  * mid-walk, so the eviction is never overwritten by a stale aggregate.
  * `finalize` runs on the complete aggregate before the cache write — the
  * SEP-2243 invalid-`x-mcp-header` exclusion hooks here so the cached
  * `tools/list` entry is already filtered.
  *
  * The caller's `baseParams` (everything except `cursor`) is threaded into
  * every page request — page 1 sends `{...baseParams}`, later pages
  * `{...baseParams, cursor}` — so a typed, documented `_meta` (e.g. W3C
  * trace context) supplied to the public `list*()` reaches every wire
  * request the walk issues.
  */
  async _listAllPages(method, baseParams, options, items, finalize2) {
    const bypass = options?.cacheMode === "bypass";
    const generation = this._cache.captureGeneration(method);
    const acc = await this.request({
      method,
      ...baseParams && { params: { ...baseParams } }
    }, options);
    let cursor = acc.nextCursor;
    let previous = acc;
    let pages = 1;
    while (cursor !== void 0) {
      if (this._listMaxPages !== 0 && pages >= this._listMaxPages) throw new SdkError(SdkErrorCode.ListPaginationExceeded, `${method}: exceeded listMaxPages (${this._listMaxPages}); server pagination did not terminate`, {
        method,
        listMaxPages: this._listMaxPages
      });
      const page = await this.request({
        method,
        params: {
          ...baseParams,
          cursor
        }
      }, options);
      if (page.nextCursor === cursor && JSON.stringify(items(page)) === JSON.stringify(items(previous))) break;
      items(acc).push(...items(page));
      previous = page;
      cursor = page.nextCursor;
      pages++;
    }
    delete acc.nextCursor;
    finalize2?.(acc);
    if (bypass) return acc;
    await this._cache.write(method, acc, generation, this._freshness(acc));
    return acc;
  }
  /**
  * Compute the {@linkcode ClientResponseCache.write} freshness payload from
  * a cacheable result body. The single seam through which the client reads
  * `ttlMs`/`cacheScope` (mcp.d's `cachedFetch` engine). The fields pass
  * through the loose result schema, so they are read off the runtime body;
  * a missing `ttlMs` falls back to
  * {@linkcode ClientOptions | ClientOptions.defaultCacheTtlMs}; an explicit server-sent
  * `ttlMs` (including `0` — the spec's "immediately stale") is honoured
  * as-is. The default of `0` means `expiresAt === now()` ⇒ never served,
  * only stored. A missing `cacheScope` is treated as `'private'` — the
  * spec's `'public'` grant ("any client … MAY serve to any user") is too
  * strong to infer by default, and matches this SDK's server-side stamp
  * default.
  */
  _freshness(result, params) {
    const body = result;
    const ttlMs = typeof body.ttlMs === "number" ? body.ttlMs : this._defaultCacheTtlMs;
    const scope = body.cacheScope === "public" ? "public" : "private";
    return {
      expiresAt: this._cache.now() + Math.min(Math.max(0, ttlMs), MAX_CACHE_TTL_MS),
      scope,
      params
    };
  }
  /**
  * The cache-serving front of every cacheable verb (mcp.d's `cachedFetch`
  * read half): under `cacheMode: 'use'` (the default), a fresh held entry
  * is served and the round trip is skipped. `'refresh'` and `'bypass'`
  * always fetch (the caller decides whether to write). Freshness and
  * decoding live in {@linkcode ClientResponseCache.read}; every hit is
  * freshly parsed, so the caller owns it outright. A custom store
  * whose `get()` rejects is routed to `onerror` and treated as a miss —
  * cache bookkeeping never blocks a request from reaching the wire.
  */
  async _serveFromCache(method, params, options) {
    if (options?.cacheMode === "bypass" || options?.cacheMode === "refresh") return void 0;
    const hit = await this._cache.read(method, params).catch((error2) => void this._reportStoreError(error2));
    if (hit !== void 0) {
      if (options?.signal?.aborted) {
        const reason = options.signal.reason;
        throw reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason));
      }
      return hit.value;
    }
  }
  /** Route a custom-store failure to `onerror` without aborting the surrounding dispatch. */
  _reportStoreError(e) {
    this.onerror?.(e instanceof Error ? e : new Error(String(e)));
  }
  /**
  * Compile a single tool's `outputSchema`. Passed as the compile callback to
  * {@linkcode ClientResponseCache.outputValidator} so the cache class stays
  * free of any validator-provider dependency, and called directly for the
  * `options.toolDefinition` path of {@linkcode callTool} (a one-off
  * caller-supplied definition is compiled in isolation and never enters the
  * cache, so it cannot poison the listed tool of the same name).
  *
  * Returns `undefined` when the tool has no `outputSchema`, or a
  * discriminated `{ok}` result otherwise. SEP-2106: ANY throw from the
  * validator engine — unsupported `$schema` dialect, invalid `pattern`
  * regex, unresolvable `$ref`, or any other engine error — is captured as
  * `{ok: false, compileError}` so one bad schema does not poison the rest
  * of the listing; `callTool()` surfaces it as an `InvalidParams` error
  * before the request. The `{ok}` discriminator (not
  * `compileError !== undefined`) means a custom provider that does
  * `throw undefined` is still treated as a captured failure.
  */
  _compileOutputValidator(tool) {
    if (!tool.outputSchema) return void 0;
    try {
      return {
        ok: true,
        validator: this._jsonSchemaValidator.getValidator(tool.outputSchema)
      };
    } catch (error2) {
      return {
        ok: false,
        compileError: error2
      };
    }
  }
  /**
  * Resolve the SEP-2243 `x-mcp-header` declaration scan for a tool name.
  *
  * The caller-supplied `toolDefinition` escape hatch wins; otherwise the
  * cached `tools/list` entry (via the cache's `toolDefinition`) is the
  * source. Freshness is the response cache's lifecycle: `list_changed`
  * evicts, otherwise the held schema is the best information available
  * regardless of age, and a stale schema is recovered through the
  * `HEADER_MISMATCH` → evict-refetch-retry path in {@linkcode callTool}.
  * On a miss the call proceeds without `Mcp-Param-*` headers (the spec's
  * "client SHOULD send without custom headers" guidance) and relies on the
  * same recovery.
  */
  async _resolveXMcpHeaderScan(name, override) {
    const tool = override ?? await this._cache.toolDefinition(name);
    return tool === void 0 ? void 0 : scanXMcpHeaderDeclarations(tool.inputSchema);
  }
  /**
  * Reads the contents of a resource by URI.
  *
  * Honours the result's `ttlMs`/`cacheScope` (SEP-2549): a still-fresh
  * cached body for the same `uri` is returned without a round trip
  * (`cacheMode: 'use'`, the default). The cache key is `{method, uri}`
  * partitioned by the resolved scope — `'private'` (the default when the
  * server omits the field) is stored under this client's
  * {@linkcode ClientOptions | ClientOptions.cachePartition}, so a shared
  * store cannot serve one principal's resource body to another. Unlike the
  * list verbs, a result whose resolved TTL is ≤0 is **not** stored
  * (`resources/read` has no derived index and the URI keyspace is
  * unbounded).
  */
  async readResource(params, options) {
    const hit = await this._serveFromCache("resources/read", params.uri, options);
    if (hit !== void 0) return hit;
    const generation = this._cache.captureGeneration("resources/read", params.uri);
    const result = await this.request({
      method: "resources/read",
      params
    }, options);
    if (options?.cacheMode !== "bypass") {
      const freshness = this._freshness(result, params.uri);
      if (freshness.expiresAt > this._cache.now()) await this._cache.write("resources/read", result, generation, freshness);
      else if (options?.cacheMode === "refresh") await this._cache.evictKey("resources/read", params.uri);
    }
    return result;
  }
  /** Subscribes to change notifications for a resource. The server must support resource subscriptions. */
  async subscribeResource(params, options) {
    return this.request({
      method: "resources/subscribe",
      params
    }, options);
  }
  /** Unsubscribes from change notifications for a resource. */
  async unsubscribeResource(params, options) {
    return this.request({
      method: "resources/unsubscribe",
      params
    }, options);
  }
  /**
  * Opens a `subscriptions/listen` stream (protocol revision 2026-07-28).
  *
  * Resolves once the server's `notifications/subscriptions/acknowledged`
  * arrives (the standard request timeout applies to this ack phase). Change
  * notifications delivered on the stream are dispatched to the existing
  * {@linkcode setNotificationHandler} registrations — the same handlers the
  * 2025-era unsolicited notifications fire on a legacy connection — so
  * `listen()` is era-transparent for consumers that already register those.
  *
  * `close()` tears the subscription down by aborting the listen request's
  * `requestSignal` (closes the SSE stream where the transport honors it)
  * AND sending `notifications/cancelled` referencing the listen request id
  * — both, unconditionally, so any spec-compliant server on any transport
  * sees the cancel. No automatic re-listen — call `listen()` again to
  * re-establish.
  *
  * On a 2025-era connection this throws a typed
  * {@linkcode SdkErrorCode.MethodNotSupportedByProtocolVersion} steering to
  * `resources/subscribe` and `ClientOptions.listChanged` (the legacy
  * unsolicited delivery model still applies there); no transparent shim.
  */
  async listen(filter, options) {
    if (this.transport === void 0) throw new SdkError(SdkErrorCode.NotConnected, "Not connected");
    const negotiated = this._negotiatedProtocolVersion;
    if (negotiated === void 0 || !isModernProtocolVersion(negotiated)) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `subscriptions/listen requires a 2026-07-28-era connection (negotiated: ${negotiated ?? "none"}). On a 2025-era connection, change notifications are delivered unsolicited: use ClientOptions.listChanged and resources/subscribe instead.`, {
      method: "subscriptions/listen",
      protocolVersion: negotiated
    });
    if (options?.signal?.aborted) {
      const reason = options.signal.reason;
      throw reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason));
    }
    const requestAbort = new AbortController();
    const listenId = `listen:${this._nextListenId++}`;
    let state = "opening";
    let ackTimer;
    let onCallerAbort;
    let resolveOpening;
    let rejectOpening;
    const opening = new Promise((resolve, reject) => {
      resolveOpening = resolve;
      rejectOpening = reject;
    });
    let resolveClosed;
    const closed = new Promise((resolve) => {
      resolveClosed = resolve;
    });
    const settle2 = (outcome) => {
      if (state === "closed") return;
      const wasOpening = state === "opening";
      if (ackTimer !== void 0) {
        clearTimeout(ackTimer);
        ackTimer = void 0;
      }
      if ("ack" in outcome) {
        state = "open";
        resolveOpening(outcome.ack);
        return;
      }
      state = "closed";
      if (onCallerAbort !== void 0) options?.signal?.removeEventListener("abort", onCallerAbort);
      this._listenState.delete(listenId);
      requestAbort.abort();
      resolveClosed(outcome.cause);
      if (wasOpening) rejectOpening(outcome.error ?? new SdkError(SdkErrorCode.ConnectionClosed, "subscriptions/listen closed before the server acknowledged"));
    };
    const wireTeardown = async () => {
      requestAbort.abort();
      await this.notification({
        method: "notifications/cancelled",
        params: { requestId: listenId }
      }).catch(() => {
      });
    };
    const close = async () => {
      if (state === "closed") return;
      settle2({ cause: "local" });
      await wireTeardown();
    };
    this._listenState.set(listenId, { settle: settle2 });
    const ackTimeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
    ackTimer = setTimeout(() => {
      settle2({
        cause: "remote",
        error: new SdkError(SdkErrorCode.RequestTimeout, "subscriptions/listen ack timed out", { timeout: ackTimeout })
      });
      wireTeardown().catch(() => {
      });
    }, ackTimeout);
    if (options?.signal) {
      const callerSignal = options.signal;
      onCallerAbort = () => {
        if (state === "closed") return;
        const reason = callerSignal.reason;
        settle2({
          cause: "local",
          error: reason instanceof Error ? reason : new Error(String(reason ?? "Aborted"))
        });
        wireTeardown().catch(() => {
        });
      };
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
    const jsonrpcRequest = {
      jsonrpc: "2.0",
      id: listenId,
      method: "subscriptions/listen",
      params: {
        _meta: { ...this._outboundMetaEnvelope() },
        notifications: filter
      }
    };
    const routeSendFailure = (error2) => {
      settle2({
        cause: "remote",
        error: error2 instanceof Error ? error2 : new Error(String(error2))
      });
    };
    try {
      this.transport.send(jsonrpcRequest, {
        requestSignal: requestAbort.signal,
        onRequestStreamEnd: () => settle2({
          cause: "remote",
          error: /* @__PURE__ */ new Error("subscriptions/listen: stream ended")
        })
      }).catch(routeSendFailure);
    } catch (error2) {
      routeSendFailure(error2);
    }
    return {
      honoredFilter: await opening,
      close,
      closed
    };
  }
  /**
  * The subscription auto-opened by `ClientOptions.listChanged` on a modern
  * connection — the listen filter is the intersection of the configured
  * sub-options and the server-advertised `listChanged` capabilities.
  * `undefined` on a legacy connection, before connect, or when that
  * intersection is empty (auto-open skipped). Exposed so the consumer can
  * `close()` it.
  */
  get autoOpenedSubscription() {
    return this._autoOpenedSubscription;
  }
  /**
  * Transport-level demux for `subscriptions/listen` notifications, before
  * any decoding/era-gating/handler dispatch. Consumes the leading
  * `notifications/subscriptions/acknowledged` referencing a live
  * subscription id (resolves the ack waiter) and an inbound
  * `notifications/cancelled` referencing a live string-typed subscription
  * id (server-side teardown on stdio). Change notifications carrying a
  * subscription id pass through to the existing registered handlers via
  * `super`. An unmatched ack/cancelled is NOT consumed: it reaches
  * `setNotificationHandler` / `fallbackNotificationHandler` instead of
  * being silently swallowed.
  */
  _onnotification(raw, extra) {
    const evicted = Object.hasOwn(LIST_CHANGED_EVICTIONS, raw.method) ? LIST_CHANGED_EVICTIONS[raw.method] : void 0;
    if (raw.method === "notifications/resources/updated") {
      const uri2 = raw.params?.uri;
      if (typeof uri2 === "string") this._cache.evictKey("resources/read", uri2);
    } else if (evicted !== void 0) for (const method of evicted) this._cache.evict(method);
    if (raw.method === "notifications/subscriptions/acknowledged") {
      const subscriptionId = raw.params?._meta?.[SUBSCRIPTION_ID_META_KEY];
      const entry = typeof subscriptionId === "string" ? this._listenState.get(subscriptionId) : void 0;
      if (entry !== void 0) {
        const honored = this._wireCodec().validateNotification("notifications/subscriptions/acknowledged", raw);
        entry.settle({ ack: honored.ok ? honored.value.params.notifications : {} });
        return;
      }
    }
    if (raw.method === "notifications/cancelled") {
      const cancelledId = raw.params?.requestId;
      const entry = typeof cancelledId === "string" ? this._listenState.get(cancelledId) : void 0;
      if (entry !== void 0) {
        entry.settle({
          cause: "remote",
          error: /* @__PURE__ */ new Error("subscriptions/listen: server cancelled the subscription")
        });
        return;
      }
    }
    super._onnotification(raw, extra);
  }
  /**
  * Transport-level demux for `subscriptions/listen` responses. A JSON-RPC
  * ERROR for the listen id is the server's pre-ack capacity/params
  * rejection; a JSON-RPC RESULT for the listen id is the spec's
  * `SubscriptionsListenResult` — the server's GRACEFUL-close signal (sent
  * on shutdown). A string-id response that matches a live `_listenState`
  * entry is consumed here (Protocol's `_responseHandlers` map is keyed by
  * NUMBER and never holds a listen id, so passing a string-id response
  * through would surface as "unknown message ID" via `onerror`).
  */
  _onresponse(response) {
    const id = response.id;
    const entry = typeof id === "string" ? this._listenState.get(id) : void 0;
    if (entry !== void 0) {
      if (isJSONRPCErrorResponse(response)) entry.settle({
        cause: "remote",
        error: ProtocolError.fromError(response.error.code, response.error.message, response.error.data)
      });
      else entry.settle({
        cause: "graceful",
        error: new SdkError(SdkErrorCode.ConnectionClosed, "subscriptions/listen: server closed the subscription gracefully before acknowledging")
      });
      return;
    }
    super._onresponse(response);
  }
  /**
  * Settle every live per-listen state machine on a transport-initiated
  * close (the server dropping the connection on stdio/InMemory) before
  * Protocol's `_onclose` tears the transport down. The base
  * `_responseHandlers` settlement does not reach `_listenState` (listen
  * ids are never registered there), so without this override a remote
  * close would leave an in-flight `listen()` / open `McpSubscription`
  * hanging.
  */
  _onclose() {
    if (this._listenState.size > 0) {
      const reason = new SdkError(SdkErrorCode.ConnectionClosed, "Connection closed");
      for (const entry of this._listenState.values()) entry.settle({
        cause: "remote",
        error: reason
      });
      this._listenState.clear();
    }
    super._onclose();
  }
  /**
  * Calls a tool on the connected server and returns the result. Automatically validates structured output
  * if the tool has an `outputSchema`.
  *
  * Tool results have two error surfaces: `result.isError` for tool-level failures (the tool ran but reported
  * a problem), and thrown {@linkcode ProtocolError} for protocol-level failures or {@linkcode SdkError} for
  * SDK-level issues (timeouts, missing capabilities).
  *
  * @example Basic usage
  * ```ts source="./client.examples.ts#Client_callTool_basic"
  * const result = await client.callTool({
  *     name: 'calculate-bmi',
  *     arguments: { weightKg: 70, heightM: 1.75 }
  * });
  *
  * // Tool-level errors are returned in the result, not thrown
  * if (result.isError) {
  *     console.error('Tool error:', result.content);
  *     return;
  * }
  *
  * console.log(result.content);
  * ```
  *
  * @example Structured output
  * ```ts source="./client.examples.ts#Client_callTool_structuredOutput"
  * const result = await client.callTool({
  *     name: 'calculate-bmi',
  *     arguments: { weightKg: 70, heightM: 1.75 }
  * });
  *
  * // Machine-readable output for the client application. SEP-2106: structuredContent is
  * // `unknown` (any JSON value). Check for presence with `!== undefined` and narrow before use.
  * if (result.structuredContent !== undefined) {
  *     const sc: unknown = result.structuredContent; // e.g. { bmi: 22.86 }
  *     if (typeof sc === 'object' && sc !== null && 'bmi' in sc) {
  *         console.log(sc.bmi);
  *     }
  * }
  * ```
  */
  async callTool(params, options) {
    const mirroringActive = this.getProtocolEra() === "modern" && detectProbeEnvironment() !== "browser";
    const buildSendOptions = async () => {
      if (!mirroringActive) return options;
      let scan;
      try {
        scan = await this._resolveXMcpHeaderScan(params.name, options?.toolDefinition);
      } catch (error2) {
        this._reportStoreError(error2);
      }
      if (!scan?.valid || scan.declarations.length === 0) return options;
      const paramHeaders = buildMcpParamHeaders(scan.declarations, params.arguments);
      return Object.keys(paramHeaders).length === 0 ? options : {
        ...options,
        headers: {
          ...options?.headers,
          ...paramHeaders
        }
      };
    };
    let compiled = options?.toolDefinition === void 0 ? await this._cache.outputValidator(params.name, (tool) => this._compileOutputValidator(tool)).catch((error2) => void this._reportStoreError(error2)) : this._compileOutputValidator(options.toolDefinition);
    const assertCompiled = () => {
      if (compiled === void 0 || compiled.ok) return;
      const err = compiled.compileError;
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 200);
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Tool '${params.name}' has an invalid outputSchema: ${message}`);
    };
    assertCompiled();
    let result;
    try {
      result = await this.request({
        method: "tools/call",
        params
      }, await buildSendOptions());
    } catch (error2) {
      const isHeaderMismatch = error2 instanceof ProtocolError && error2.code === HEADER_MISMATCH_ERROR_CODE;
      if (!mirroringActive || !isHeaderMismatch || options?.toolDefinition !== void 0) throw error2;
      const refreshOptions = {
        signal: options?.signal,
        timeout: options?.timeout,
        cacheMode: "refresh"
      };
      await this._cache.evict("tools/list");
      await this.listTools(void 0, refreshOptions).catch((error_) => this._reportStoreError(error_));
      compiled = await this._cache.outputValidator(params.name, (tool) => this._compileOutputValidator(tool)).catch((error_) => void this._reportStoreError(error_));
      assertCompiled();
      result = await this.request({
        method: "tools/call",
        params
      }, await buildSendOptions());
    }
    const validator = compiled !== void 0 && compiled.ok ? compiled.validator : void 0;
    if (validator) {
      if (result.structuredContent === void 0 && !result.isError) throw new ProtocolError(ProtocolErrorCode.InvalidRequest, `Tool ${params.name} has an output schema but did not return structured content`);
      if (result.structuredContent !== void 0 && !result.isError) try {
        const validationResult = validator(result.structuredContent);
        if (!validationResult.valid) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Structured content does not match the tool's output schema: ${validationResult.errorMessage}`);
      } catch (error2) {
        if (error2 instanceof ProtocolError) throw error2;
        throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Failed to validate structured content: ${error2 instanceof Error ? error2.message : String(error2)}`);
      }
    }
    return result;
  }
  /**
  * Lists available tools.
  *
  * Called without a `cursor` (the common case), this walks every page and
  * returns the complete aggregated list with no `nextCursor`; the
  * aggregate is also written to the {@linkcode ResponseCacheStore} (the
  * source for {@linkcode callTool | callTool()}'s output-schema validation
  * and SEP-2243 `Mcp-Param-*` header mirroring). Pass an explicit
  * `{ cursor }` to fetch a single page and walk pagination yourself — the
  * per-page path returns the server's raw page (with `nextCursor` for the
  * next call) and does not write the response cache. The auto-aggregate
  * path is capped by {@linkcode ClientOptions | ClientOptions.listMaxPages} (default 64);
  * the per-page path is not.
  *
  * Returns an empty list if the server does not advertise tools capability
  * (or throws if {@linkcode ClientOptions.enforceStrictCapabilities} is enabled).
  *
  * @example
  * ```ts source="./client.examples.ts#Client_listTools_pagination"
  * // No cursor → all pages aggregated for you.
  * const { tools } = await client.listTools();
  * console.log(
  *     'Available tools:',
  *     tools.map(t => t.name)
  * );
  * ```
  */
  async listTools(params, options) {
    if (!this._serverCapabilities?.tools && !this._enforceStrictCapabilities) {
      console.debug("Client.listTools() called but server does not advertise tools capability - returning empty list");
      return { tools: [] };
    }
    if (params?.cursor !== void 0) {
      const page = await this.request({
        method: "tools/list",
        params
      }, options);
      this._excludeInvalidXMcpHeaderTools(page);
      return page;
    }
    const hit = await this._serveFromCache("tools/list", void 0, options);
    if (hit !== void 0) return hit;
    return this._listAllPages("tools/list", params, options, (r) => r.tools, (acc) => this._excludeInvalidXMcpHeaderTools(acc));
  }
  /**
  * SEP-2243 (protocol revision 2026-07-28): a Streamable HTTP client MUST
  * exclude tool definitions whose `x-mcp-header` declarations violate the
  * constraints, and SHOULD log a warning naming the tool and the reason.
  * Applied to the CACHED aggregated `tools/list` result (so the entry
  * mirroring reads never holds an unmirrorable tool) AND to every public
  * per-page {@linkcode listTools | listTools()} return (the spec's MUST
  * has no carve-out for paginated reads). The gate is era-only on
  * non-stdio transports — `detectProbeTransportKind` cannot distinguish a
  * real HTTP transport from in-memory/custom transports (it only
  * positively recognizes stdio), and over-excluding on a non-HTTP modern
  * connection is harmless: those transports never carry per-request
  * headers, so an excluded tool would have been uncallable on a Streamable
  * HTTP arm of the same server. Mutates `result.tools` in place.
  */
  _excludeInvalidXMcpHeaderTools(result) {
    if (this.getProtocolEra() !== "modern" || !this.transport || detectProbeTransportKind(this.transport) === "stdio") return;
    const filtered = result.tools.filter((tool) => {
      const scan = scanXMcpHeaderDeclarations(tool.inputSchema);
      if (!scan.valid) {
        console.warn(`[mcp-sdk] excluding tool '${tool.name}' from tools/list: invalid x-mcp-header declaration \u2014 ${scan.reason}`);
        return false;
      }
      return true;
    });
    if (filtered.length !== result.tools.length) result.tools = filtered;
  }
  /**
  * Set up a single list changed handler.
  * @internal
  */
  _setupListChangedHandler(listType, notificationMethod, options, fetcher) {
    const parseResult = parseSchema(ListChangedOptionsBaseSchema, options);
    if (!parseResult.success) throw new Error(`Invalid ${listType} listChanged options: ${parseResult.error.message}`);
    if (typeof options.onChanged !== "function") throw new TypeError(`Invalid ${listType} listChanged options: onChanged must be a function`);
    const { autoRefresh, debounceMs } = parseResult.data;
    const { onChanged } = options;
    const refresh = async () => {
      if (!autoRefresh) {
        onChanged(null, null);
        return;
      }
      try {
        onChanged(null, await fetcher());
      } catch (error2) {
        onChanged(error2 instanceof Error ? error2 : new Error(String(error2)), null);
      }
    };
    const handler = () => {
      if (debounceMs) {
        const existingTimer = this._listChangedDebounceTimers.get(listType);
        if (existingTimer) clearTimeout(existingTimer);
        const timer = setTimeout(refresh, debounceMs);
        this._listChangedDebounceTimers.set(listType, timer);
      } else refresh();
    };
    this.setNotificationHandler(notificationMethod, handler);
  }
  /**
  * Notifies the server that the client's root list has changed. Requires the `roots.listChanged` capability.
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Remains functional during the deprecation window (at least twelve months).
  * Migrate to passing paths via tool parameters, resource URIs, or configuration.
  */
  async sendRootsListChanged() {
    return this.notification({ method: "notifications/roots/list_changed" });
  }
};
function hasDpopChallenge(wwwAuthenticate) {
  return /(?:^|,)\s*dpop(?:\s|$|,)/i.test(wwwAuthenticate);
}
function isDpopNonceChallenge(response) {
  if (response.status !== 401) return false;
  const wwwAuthenticate = response.headers.get("www-authenticate") ?? "";
  return hasDpopChallenge(wwwAuthenticate) && /use_dpop_nonce/i.test(wwwAuthenticate);
}
var withDpop = (session, getToken) => (next) => {
  const resolveSession = typeof session === "function" ? session : () => session;
  return async (input, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url2 = new URL(input.toString());
    const activeSession = await resolveSession();
    if (!activeSession) return next(input, init);
    const makeRequest = async () => {
      const accessToken = await getToken();
      if (!accessToken) return next(input, init);
      const headers = new Headers(init?.headers);
      const proof = await activeSession.buildProof({
        htm: method,
        htu: url2,
        accessToken
      });
      headers.set("Authorization", `DPoP ${accessToken}`);
      headers.set("DPoP", proof);
      return next(input, {
        ...init,
        headers
      });
    };
    let response = await makeRequest();
    if (isDpopNonceChallenge(response) && response.headers.has("dpop-nonce")) {
      activeSession.observeNonce(response, url2);
      await response.text?.().catch(() => {
      });
      response = await makeRequest();
    }
    activeSession.observeNonce(response, url2);
    return response;
  };
};
var withDpopFromProvider = (provider) => withDpop(async () => {
  try {
    return await provider.dpop?.();
  } catch (error2) {
    throw markAuthSeamEscape(error2);
  }
}, async () => {
  let tokens;
  try {
    tokens = await provider.tokens();
  } catch (error2) {
    throw markAuthSeamEscape(error2);
  }
  return tokens?.token_type?.toLowerCase() === "dpop" ? tokens.access_token : void 0;
});
var SseError = class extends Error {
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.SseError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(code, message, event) {
    super(`SSE error: ${message}`);
    this.code = code;
    this.event = event;
    stampErrorBrands(this, new.target);
  }
};
var DEFAULT_MAX_STEP_UP_RETRIES = 1;
var DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS = {
  initialReconnectionDelay: 1e3,
  maxReconnectionDelay: 3e4,
  reconnectionDelayGrowFactor: 1.5,
  maxRetries: 2
};
var RESERVED_REQUEST_HEADER_NAMES = /* @__PURE__ */ new Set([
  "authorization",
  "dpop",
  "content-type",
  "mcp-protocol-version",
  "mcp-method",
  "mcp-name",
  "mcp-session-id"
]);
function anySignal(a, b) {
  if (typeof AbortSignal.any === "function") return AbortSignal.any([a, b]);
  const controller = new AbortController();
  if (a.aborted) return controller.abort(a.reason), controller.signal;
  if (b.aborted) return controller.abort(b.reason), controller.signal;
  const cleanup = () => {
    a.removeEventListener("abort", onA);
    b.removeEventListener("abort", onB);
  };
  function onA() {
    cleanup();
    controller.abort(a.reason);
  }
  function onB() {
    cleanup();
    controller.abort(b.reason);
  }
  a.addEventListener("abort", onA, { once: true });
  b.addEventListener("abort", onB, { once: true });
  return controller.signal;
}
var StreamableHTTPClientTransport = class {
  _abortController;
  _url;
  _resourceMetadataUrl;
  _scope;
  _requestInit;
  _authProvider;
  _oauthProvider;
  _skipIssuerMetadataValidation;
  _fetch;
  _fetchWithInit;
  _redirectPolicy;
  _sessionId;
  _reconnectionOptions;
  _protocolVersion;
  _onInsufficientScope;
  _maxStepUpRetries;
  _serverRetryMs;
  _reconnectionScheduler;
  _cancelReconnection;
  onclose;
  onerror;
  onmessage;
  /**
  * Streamable HTTP opens one POST (and SSE response stream) per outbound
  * request and honors `TransportSendOptions.requestSignal`. On a 2026-era
  * connection the protocol layer aborts that per-request stream as the
  * spec cancellation signal instead of POSTing `notifications/cancelled`.
  */
  hasPerRequestStream = true;
  constructor(url2, opts) {
    this._url = url2;
    this._resourceMetadataUrl = void 0;
    this._scope = void 0;
    this._requestInit = opts?.requestInit;
    this._skipIssuerMetadataValidation = opts?.skipIssuerMetadataValidation;
    this._fetch = opts?.fetch;
    if (isOAuthClientProvider(opts?.authProvider)) {
      this._oauthProvider = opts.authProvider;
      this._authProvider = adaptOAuthProvider(opts.authProvider, { skipIssuerMetadataValidation: opts.skipIssuerMetadataValidation });
      if (opts.authProvider.dpop) this._fetch = withDpopFromProvider(opts.authProvider)(opts.fetch ?? fetch);
    } else this._authProvider = opts?.authProvider;
    this._redirectPolicy = opts?.redirectPolicy;
    this._fetchWithInit = createFetchWithInit(opts?.fetch, opts?.requestInit);
    if (this._redirectPolicy === "follow") this._fetchWithInit = fetchLeavingRedirects(this._fetchWithInit);
    this._sessionId = opts?.sessionId;
    this._protocolVersion = opts?.protocolVersion;
    this._reconnectionOptions = opts?.reconnectionOptions ?? DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS;
    this._reconnectionScheduler = opts?.reconnectionScheduler;
    this._onInsufficientScope = opts?.onInsufficientScope ?? "reauthorize";
    this._maxStepUpRetries = Math.max(0, opts?.maxStepUpRetries ?? DEFAULT_MAX_STEP_UP_RETRIES);
  }
  /**
  * SEP-2350 step-up: compute the union scope, decide whether refresh must be
  * bypassed, and run {@linkcode auth}. Returns the auth result so the caller
  * can decide whether to retry. Shared by the POST `_send` path and the GET
  * `_startOrAuthSse` path so both apply the same `'throw'` short-circuit,
  * the same superset-gated refresh bypass, and the same retry cap.
  */
  async _stepUpAuthorize(challenge, stepUpRetries) {
    try {
      return await this._stepUpAuthorizeInner(challenge, stepUpRetries);
    } catch (error2) {
      throw markAuthSeamEscape(error2);
    }
  }
  async _stepUpAuthorizeInner(challenge, stepUpRetries) {
    if (this._onInsufficientScope === "throw") throw new InsufficientScopeError({
      requiredScope: challenge.scope,
      resourceMetadataUrl: challenge.resourceMetadataUrl,
      errorDescription: challenge.errorDescription
    });
    if (!this._oauthProvider) throw new InsufficientScopeError({
      requiredScope: challenge.scope,
      resourceMetadataUrl: challenge.resourceMetadataUrl,
      errorDescription: challenge.errorDescription
    });
    if (stepUpRetries >= this._maxStepUpRetries) throw new SdkHttpError(SdkErrorCode.ClientHttpForbidden, `Server returned 403 insufficient_scope after step-up re-authorization (retry limit ${this._maxStepUpRetries} reached)`, {
      status: 403,
      statusText: challenge.statusText ?? "Forbidden",
      text: challenge.text
    });
    if (challenge.resourceMetadataUrl) this._resourceMetadataUrl = challenge.resourceMetadataUrl;
    const tokens = await this._oauthProvider.tokens();
    const unionScope = computeScopeUnion(this._scope, tokens?.scope, challenge.scope);
    this._scope = unionScope;
    const forceReauthorization = isStrictScopeSuperset(unionScope, tokens?.scope);
    return auth(this._oauthProvider, {
      serverUrl: this._url,
      resourceMetadataUrl: this._resourceMetadataUrl,
      scope: unionScope,
      forceReauthorization,
      fetchFn: this._fetchWithInit,
      skipIssuerMetadataValidation: this._skipIssuerMetadataValidation
    });
  }
  /** `baseFetch` with redirects handled as `redirectPolicy` says. */
  _redirects(baseFetch) {
    return this._redirectPolicy === "follow" ? baseFetch : fetchWithinOrigin(baseFetch);
  }
  /** Error text for a redirect `response` that was not followed, or `undefined` for any other response. */
  _unfollowedRedirect(url2, response) {
    const text = this._redirectPolicy === "follow" ? void 0 : unfollowedRedirect(url2, response);
    return text && `${text} (redirectPolicy: 'same-origin')`;
  }
  async _commonHeaders() {
    const headers = new Headers(this._requestInit?.headers || void 0);
    let token;
    try {
      token = await this._authProvider?.token();
    } catch (error2) {
      throw markAuthSeamEscape(error2);
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (this._sessionId) headers.set("mcp-session-id", this._sessionId);
    if (this._protocolVersion) headers.set("mcp-protocol-version", this._protocolVersion);
    return headers;
  }
  /**
  * Body-derived per-request headers: when an outgoing request carries a
  * protocol-version claim in its `_meta` envelope (the version negotiation
  * probe is the first such sender), `MCP-Protocol-Version` and `Mcp-Method`
  * derive from the message itself. The connection-level version slot is
  * neither consulted nor mutated; messages without an envelope claim are
  * untouched, so no 2026 header can appear on a legacy exchange.
  */
  _applyBodyDerivedHeaders(headers, message) {
    if (Array.isArray(message) || !isJSONRPCRequest(message)) return;
    const envelopeVersion = message.params?._meta?.[PROTOCOL_VERSION_META_KEY];
    if (typeof envelopeVersion !== "string") return;
    headers.set("mcp-protocol-version", envelopeVersion);
    headers.set("mcp-method", message.method);
    const source = mcpNameSource(message.method, message.params);
    if (source?.value !== void 0) headers.set("mcp-name", encodeMcpParamValue(source.value));
  }
  /**
  * `true` when the outbound message is a single request carrying a
  * modern-era protocol-version envelope claim — the same predicate that
  * gates body-derived `mcp-method`/`mcp-name` emission. Used to confine the
  * 400-body-as-ProtocolError delivery to modern-era exchanges only.
  */
  _isModernEnvelopedRequest(message) {
    if (Array.isArray(message) || !isJSONRPCRequest(message)) return false;
    const v = message.params?._meta?.[PROTOCOL_VERSION_META_KEY];
    return typeof v === "string" && isModernProtocolVersion(v);
  }
  async _startOrAuthSse(options, isAuthRetry = false, stepUpRetries = 0) {
    const { resumptionToken, requestSignal } = options;
    const isIntentionalAbort = () => this._abortController?.signal.aborted === true || requestSignal?.aborted === true;
    try {
      const headers = await this._commonHeaders();
      const types = [...headers.get("accept")?.split(",").map((s) => s.trim().toLowerCase()) ?? [], "text/event-stream"];
      headers.set("accept", [...new Set(types)].join(", "));
      if (resumptionToken) headers.set("last-event-id", resumptionToken);
      const transportSignal = this._abortController?.signal;
      const signal = requestSignal !== void 0 && transportSignal !== void 0 ? anySignal(transportSignal, requestSignal) : requestSignal ?? transportSignal;
      const response = await this._redirects(this._fetch ?? fetch)(this._url, {
        ...this._requestInit,
        method: "GET",
        headers,
        signal
      });
      if (!response.ok) {
        if (response.status === 401 && this._authProvider) {
          if (response.headers.has("www-authenticate")) {
            const { resourceMetadataUrl, scope } = extractWWWAuthenticateParams(response);
            this._resourceMetadataUrl = resourceMetadataUrl;
            this._scope = computeScopeUnion(this._scope, scope);
          }
          if (this._authProvider.onUnauthorized && !isAuthRetry) {
            try {
              await this._authProvider.onUnauthorized({
                response,
                serverUrl: this._url,
                fetchFn: this._fetchWithInit
              });
            } catch (error2) {
              throw markAuthSeamEscape(error2);
            }
            await response.text?.().catch(() => {
            });
            return this._startOrAuthSse(options, true, stepUpRetries);
          }
          await response.text?.().catch(() => {
          });
          if (isAuthRetry) throw markAuthSeamEscape(new SdkHttpError(SdkErrorCode.ClientHttpAuthentication, "Server returned 401 after re-authentication", {
            status: 401,
            statusText: response.statusText
          }));
          throw markAuthSeamEscape(new UnauthorizedError());
        }
        if (response.status === 403) {
          const { resourceMetadataUrl, scope, error: error2, errorDescription } = extractWWWAuthenticateParams(response);
          if (error2 === "insufficient_scope") {
            const text = await response.text?.().catch(() => null);
            if (await this._stepUpAuthorize({
              scope,
              resourceMetadataUrl,
              errorDescription,
              statusText: response.statusText,
              text
            }, stepUpRetries) !== "AUTHORIZED") throw markAuthSeamEscape(new UnauthorizedError());
            return this._startOrAuthSse(options, isAuthRetry, stepUpRetries + 1);
          }
        }
        await response.text?.().catch(() => {
        });
        if (response.status === 405) {
          options.onRequestStreamEnd?.();
          return;
        }
        const reason = this._unfollowedRedirect(this._url, response) ?? response.statusText;
        throw new SdkHttpError(SdkErrorCode.ClientHttpFailedToOpenStream, `Failed to open SSE stream: ${reason}`, {
          status: response.status,
          statusText: response.statusText
        });
      }
      this._handleSseStream(response.body, options, true);
    } catch (error2) {
      if (!isIntentionalAbort()) this.onerror?.(error2);
      throw error2;
    }
  }
  /**
  * Calculates the next reconnection delay using a backoff algorithm
  *
  * @param attempt Current reconnection attempt count for the specific stream
  * @returns Time to wait in milliseconds before next reconnection attempt
  */
  _getNextReconnectionDelay(attempt) {
    if (this._serverRetryMs !== void 0) return this._serverRetryMs;
    const initialDelay = this._reconnectionOptions.initialReconnectionDelay;
    const growFactor = this._reconnectionOptions.reconnectionDelayGrowFactor;
    const maxDelay = this._reconnectionOptions.maxReconnectionDelay;
    return Math.min(initialDelay * Math.pow(growFactor, attempt), maxDelay);
  }
  /**
  * Schedule a reconnection attempt using server-provided retry interval or backoff
  *
  * @param lastEventId The ID of the last received event for resumability
  * @param attemptCount Current reconnection attempt count for this specific stream
  */
  _scheduleReconnection(options, attemptCount = 0) {
    const maxRetries = this._reconnectionOptions.maxRetries;
    if (attemptCount >= maxRetries) {
      this.onerror?.(/* @__PURE__ */ new Error(`Maximum reconnection attempts (${maxRetries}) exceeded.`));
      options.onRequestStreamEnd?.();
      return;
    }
    const delay2 = this._getNextReconnectionDelay(attemptCount);
    const reconnect = () => {
      this._cancelReconnection = void 0;
      if (this._abortController?.signal.aborted || options.requestSignal?.aborted) return;
      this._startOrAuthSse(options).catch((error2) => {
        if (this._abortController?.signal.aborted || options.requestSignal?.aborted) return;
        this.onerror?.(/* @__PURE__ */ new Error(`Failed to reconnect SSE stream: ${error2 instanceof Error ? error2.message : String(error2)}`));
        try {
          this._scheduleReconnection(options, attemptCount + 1);
        } catch (scheduleError) {
          this.onerror?.(scheduleError instanceof Error ? scheduleError : new Error(String(scheduleError)));
        }
      });
    };
    if (this._reconnectionScheduler) {
      const cancel = this._reconnectionScheduler(reconnect, delay2, attemptCount);
      this._cancelReconnection = typeof cancel === "function" ? cancel : void 0;
    } else {
      const handle = setTimeout(reconnect, delay2);
      this._cancelReconnection = () => clearTimeout(handle);
    }
  }
  _handleSseStream(stream, options, isReconnectable) {
    if (!stream) {
      options.onRequestStreamEnd?.();
      return;
    }
    const { onresumptiontoken, replayMessageId, requestSignal, onRequestStreamEnd } = options;
    const isIntentionalAbort = () => this._abortController?.signal.aborted === true || requestSignal?.aborted === true;
    let lastEventId;
    let hasPrimingEvent = false;
    let receivedResponse = false;
    const processStream = async () => {
      try {
        const reader = stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream({ onRetry: (retryMs) => {
          this._serverRetryMs = retryMs;
        } })).getReader();
        while (true) {
          const { value: event, done } = await reader.read();
          if (done) break;
          if (event.id) {
            lastEventId = event.id;
            hasPrimingEvent = true;
            onresumptiontoken?.(event.id);
          }
          if (!event.data) continue;
          if (!event.event || event.event === "message") try {
            const message = JSONRPCMessageSchema.parse(JSON.parse(event.data));
            if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
              receivedResponse = true;
              if (replayMessageId !== void 0) message.id = replayMessageId;
            }
            this.onmessage?.(message);
          } catch (error2) {
            this.onerror?.(error2);
          }
        }
        if ((isReconnectable || hasPrimingEvent) && !receivedResponse && this._abortController && !isIntentionalAbort()) this._scheduleReconnection({
          resumptionToken: lastEventId,
          onresumptiontoken,
          replayMessageId,
          requestSignal,
          onRequestStreamEnd
        }, 0);
        else if (!isIntentionalAbort()) onRequestStreamEnd?.();
      } catch (error2) {
        if (isIntentionalAbort()) return;
        this.onerror?.(/* @__PURE__ */ new Error(`SSE stream disconnected: ${error2}`));
        if ((isReconnectable || hasPrimingEvent) && !receivedResponse && this._abortController && !isIntentionalAbort()) try {
          this._scheduleReconnection({
            resumptionToken: lastEventId,
            onresumptiontoken,
            replayMessageId,
            requestSignal,
            onRequestStreamEnd
          }, 0);
        } catch (error$1) {
          this.onerror?.(/* @__PURE__ */ new Error(`Failed to reconnect: ${error$1 instanceof Error ? error$1.message : String(error$1)}`));
          onRequestStreamEnd?.();
        }
        else onRequestStreamEnd?.();
      }
    };
    processStream();
  }
  async start() {
    if (this._abortController) throw new Error("StreamableHTTPClientTransport already started! If using Client class, note that connect() calls start() automatically.");
    this._abortController = new AbortController();
  }
  async finishAuth(codeOrParams, iss) {
    if (!this._oauthProvider) throw new UnauthorizedError("finishAuth requires an OAuthClientProvider");
    const { authorizationCode, iss: issParam } = await resolveAuthorizationCallbackParams(codeOrParams, iss, this._oauthProvider, this._url, {
      fetchFn: this._fetchWithInit,
      resourceMetadataUrl: this._resourceMetadataUrl
    });
    if (await auth(this._oauthProvider, {
      serverUrl: this._url,
      authorizationCode,
      iss: issParam,
      resourceMetadataUrl: this._resourceMetadataUrl,
      scope: this._scope,
      fetchFn: this._fetchWithInit,
      skipIssuerMetadataValidation: this._skipIssuerMetadataValidation
    }) !== "AUTHORIZED") throw new UnauthorizedError("Failed to authorize");
  }
  async close() {
    try {
      this._cancelReconnection?.();
    } finally {
      this._cancelReconnection = void 0;
      this._abortController?.abort();
      this.onclose?.();
    }
  }
  async send(message, options) {
    return this._send(message, options, false);
  }
  async _send(message, options, isAuthRetry, stepUpRetries = 0) {
    try {
      const { resumptionToken, onresumptiontoken } = options || {};
      if (resumptionToken) {
        this._startOrAuthSse({
          resumptionToken,
          replayMessageId: isJSONRPCRequest(message) ? message.id : void 0,
          requestSignal: options?.requestSignal
        }).catch((error2) => this.onerror?.(error2));
        return;
      }
      const headers = await this._commonHeaders();
      this._applyBodyDerivedHeaders(headers, message);
      const isHandshake = Array.isArray(message) ? message.some((m) => isInitializeRequest(m)) : isInitializeRequest(message);
      if (isHandshake) headers.delete("mcp-session-id");
      if (options?.headers !== void 0) for (const [name, value] of Object.entries(options.headers)) {
        if (RESERVED_REQUEST_HEADER_NAMES.has(name.toLowerCase())) continue;
        headers.set(name, value);
      }
      headers.set("content-type", "application/json");
      const types = [
        ...headers.get("accept")?.split(",").map((s) => s.trim().toLowerCase()) ?? [],
        "application/json",
        "text/event-stream"
      ];
      headers.set("accept", [...new Set(types)].join(", "));
      const transportSignal = this._abortController?.signal;
      const signal = options?.requestSignal !== void 0 && transportSignal !== void 0 ? anySignal(transportSignal, options.requestSignal) : options?.requestSignal ?? transportSignal;
      const init = {
        ...this._requestInit,
        method: "POST",
        headers,
        body: JSON.stringify(message),
        signal
      };
      const response = await this._redirects(this._fetch ?? fetch)(this._url, init);
      if (isHandshake && response.ok) this._sessionId = response.headers.get("mcp-session-id") || void 0;
      if (!response.ok) {
        if (response.status === 401 && this._authProvider) {
          if (response.headers.has("www-authenticate")) {
            const { resourceMetadataUrl, scope } = extractWWWAuthenticateParams(response);
            this._resourceMetadataUrl = resourceMetadataUrl;
            this._scope = computeScopeUnion(this._scope, scope);
          }
          if (this._authProvider.onUnauthorized && !isAuthRetry) {
            try {
              await this._authProvider.onUnauthorized({
                response,
                serverUrl: this._url,
                fetchFn: this._fetchWithInit
              });
            } catch (error2) {
              throw markAuthSeamEscape(error2);
            }
            await response.text?.().catch(() => {
            });
            return this._send(message, options, true, stepUpRetries);
          }
          await response.text?.().catch(() => {
          });
          if (isAuthRetry) throw markAuthSeamEscape(new SdkHttpError(SdkErrorCode.ClientHttpAuthentication, "Server returned 401 after re-authentication", {
            status: 401,
            statusText: response.statusText
          }));
          throw markAuthSeamEscape(new UnauthorizedError());
        }
        const text = await response.text?.().catch(() => null);
        if (response.status === 403) {
          const { resourceMetadataUrl, scope, error: error2, errorDescription } = extractWWWAuthenticateParams(response);
          if (error2 === "insufficient_scope") {
            if (await this._stepUpAuthorize({
              scope,
              resourceMetadataUrl,
              errorDescription,
              statusText: response.statusText,
              text
            }, stepUpRetries) !== "AUTHORIZED") throw markAuthSeamEscape(new UnauthorizedError());
            return this._send(message, options, isAuthRetry, stepUpRetries + 1);
          }
        }
        if (response.status === 400 && typeof text === "string" && this._isModernEnvelopedRequest(message)) try {
          const parsed = JSONRPCMessageSchema.parse(JSON.parse(text));
          const requests = (Array.isArray(message) ? message : [message]).filter((m) => isJSONRPCRequest(m));
          if (isJSONRPCErrorResponse(parsed) && requests.some((r) => r.id === parsed.id)) {
            this.onmessage?.(parsed);
            return;
          }
        } catch {
        }
        const reason = this._unfollowedRedirect(this._url, response) ?? text;
        throw new SdkHttpError(SdkErrorCode.ClientHttpNotImplemented, `Error POSTing to endpoint: ${reason}`, {
          status: response.status,
          statusText: response.statusText,
          text
        });
      }
      if (response.status === 202) {
        await response.text?.().catch(() => {
        });
        if (isInitializedNotification(message)) this._startOrAuthSse({ resumptionToken: void 0 }).catch((error2) => this.onerror?.(error2));
        return;
      }
      const hasRequests = (Array.isArray(message) ? message : [message]).some((msg) => "method" in msg && "id" in msg && msg.id !== void 0);
      const contentType = response.headers.get("content-type");
      const responseMediaType = mediaTypeEssence(contentType);
      if (hasRequests) if (responseMediaType === "text/event-stream") this._handleSseStream(response.body, {
        onresumptiontoken,
        requestSignal: options?.requestSignal,
        onRequestStreamEnd: options?.onRequestStreamEnd
      }, false);
      else if (responseMediaType === "application/json") {
        const data = await response.json();
        const responseMessages = Array.isArray(data) ? data.map((msg) => JSONRPCMessageSchema.parse(msg)) : [JSONRPCMessageSchema.parse(data)];
        for (const msg of responseMessages) this.onmessage?.(msg);
      } else {
        await response.text?.().catch(() => {
        });
        throw new SdkError(SdkErrorCode.ClientHttpUnexpectedContent, `Unexpected content type: ${contentType}`, { contentType });
      }
      else await response.text?.().catch(() => {
      });
    } catch (error2) {
      if (options?.requestSignal?.aborted !== true) this.onerror?.(error2);
      throw error2;
    }
  }
  get sessionId() {
    return this._sessionId;
  }
  /**
  * Terminates the current session by sending a `DELETE` request to the server.
  *
  * Clients that no longer need a particular session
  * (e.g., because the user is leaving the client application) SHOULD send an
  * HTTP `DELETE` to the MCP endpoint with the `Mcp-Session-Id` header to explicitly
  * terminate the session.
  *
  * The server MAY respond with HTTP `405 Method Not Allowed`, indicating that
  * the server does not allow clients to terminate sessions.
  */
  async terminateSession() {
    if (!this._sessionId) return;
    try {
      const headers = await this._commonHeaders();
      const init = {
        ...this._requestInit,
        method: "DELETE",
        headers,
        signal: this._abortController?.signal
      };
      const response = await this._redirects(this._fetch ?? fetch)(this._url, init);
      await response.text?.().catch(() => {
      });
      if (!response.ok && response.status !== 405) throw new SdkHttpError(SdkErrorCode.ClientHttpFailedToTerminateSession, `Failed to terminate session: ${this._unfollowedRedirect(this._url, response) ?? response.statusText}`, {
        status: response.status,
        statusText: response.statusText
      });
      this._sessionId = void 0;
    } catch (error2) {
      this.onerror?.(error2);
      throw error2;
    }
  }
  setProtocolVersion(version2) {
    this._protocolVersion = version2;
  }
  get protocolVersion() {
    return this._protocolVersion;
  }
  /**
  * Resume an SSE stream from a previous event ID.
  * Opens a `GET` SSE connection with `Last-Event-ID` header to replay missed events.
  *
  * @param lastEventId The event ID to resume from
  * @param options Optional callback to receive new resumption tokens
  */
  async resumeStream(lastEventId, options) {
    await this._startOrAuthSse({
      resumptionToken: lastEventId,
      onresumptiontoken: options?.onresumptiontoken
    });
  }
};

// src/runtime/runtime.mjs
import { validator as defaultValidator } from "./browser-validate.mjs";
var DEFAULT_BINDING = /* @__PURE__ */ Symbol.for("@holon-sh/sdk/default-binding");
function setDefaultBinding(resolve) {
  if (typeof resolve !== "function") throw new TypeError("Binding resolver must be a function.");
  globalThis[DEFAULT_BINDING] = resolve;
}
var ToolCallError = class extends Error {
  constructor(app, tool, result) {
    const [code, message] = result.resultType === "input_required" ? ["input_required", "additional input required"] : ["tool_error", "tool failed"];
    super(`${app}.${tool}: ${message}.`);
    this.name = "ToolCallError";
    this.code = code;
    this.app = app;
    this.tool = tool;
    this.result = result;
  }
};
function untilAborted(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const aborted2 = () => reject(signal.reason);
    signal.addEventListener("abort", aborted2, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted2));
  });
}
function delay(milliseconds, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
function bindApps(identity, contracts, bindings, options) {
  const selected = Object.fromEntries(Object.keys(bindings).map((name) => {
    if (!Object.hasOwn(contracts, name) && !Object.hasOwn(identity.requires ?? {}, name)) throw new Error("Unknown app binding: " + name);
    return [name, contracts[name] ?? null];
  }));
  return createApps(identity, selected, bindings, options);
}
function createApps(identity, contracts, bindings, options) {
  const validator = options?.validator ?? defaultValidator;
  const apps = /* @__PURE__ */ Object.create(null);
  const members2 = { ...bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map((name) => [name, null])), ...contracts };
  for (const [name, contract] of Object.entries(members2)) {
    const binding = bindings?.[name];
    const resolve = () => binding ?? (bindings ? void 0 : globalThis[DEFAULT_BINDING]?.(name));
    let connection;
    const connect = (endpoint, resolved) => {
      const client = new Client({ name: identity.name, version: identity.version }, { versionNegotiation: { mode: "auto" } });
      const transport = new StreamableHTTPClientTransport(new URL(endpoint), resolved ? { authProvider: resolved.authProvider, fetch: resolved.fetch, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } } : void 0);
      const current = { client, close: async () => {
        await transport.close();
        await current.ready.catch(() => {
        });
      } };
      transport.onclose = () => {
        if (connection === current) connection = void 0;
      };
      current.ready = client.connect(transport).catch(async (error2) => {
        await transport.close();
        throw error2;
      });
      return current;
    };
    const hosted = binding?.host && {
      callTool: (request, { signal, timeout } = {}) => binding.host.callServerTool(request, { signal, timeout }),
      readResource: (request, { signal, timeout } = {}) => binding.host.readServerResource(request, { signal, timeout }),
      listTools: () => {
        throw new Error(`${name} is bound to its host; the host owns the tool catalog.`);
      }
    };
    const session = async (options2, run) => {
      options2?.signal?.throwIfAborted();
      if (hosted) return run(hosted);
      const resolved = resolve();
      if (!resolved && !Object.hasOwn(identity.requires ?? {}, name)) throw new Error(`Dependency ${name} is not declared by this application.`);
      const variable = `${name.toUpperCase().replaceAll("-", "_")}_MCP_URL`;
      const endpoint = resolved?.endpoint ?? (bindings ? void 0 : globalThis.process?.env?.[variable]);
      if (!endpoint) throw new Error(`Dependency ${name} is unavailable (${variable}). Provide a binding or set the environment variable.`);
      const scoped = !resolved || resolved.scoped === true;
      const current = scoped ? connect(endpoint, resolved) : connection ??= connect(endpoint, resolved);
      try {
        await untilAborted(current.ready, options2?.signal);
        return await run(current.client);
      } finally {
        if (scoped) await current.close();
      }
    };
    const tools = /* @__PURE__ */ Object.create(null);
    const definitions = new Map((contract?.tools ?? []).map((definition) => [definition.name, { definition }]));
    const callTool = async (request, options2) => {
      const tool = definitions.get(request.name);
      if (!tool && contract) throw new Error(`Unknown tool ${name}.${request.name}.`);
      let validation;
      if (tool) {
        const { definition } = tool;
        validation = tool.validation ??= {
          input: validator(definition.inputSchema),
          output: definition.outputSchema ? validator(definition.outputSchema) : void 0
        };
        if (!validation.input(request.arguments)) throw new Error(`Invalid arguments for ${name}.${request.name}: ${JSON.stringify(validation.input.errors)}`);
      }
      const result = await session(options2, (client) => client.callTool(request, {
        ...options2,
        allowInputRequired: true,
        ...tool && { toolDefinition: { ...tool.definition, outputSchema: void 0 } }
      }));
      if (result.resultType === "input_required") return result;
      if (!result.isError && validation?.output && !validation.output(result.structuredContent)) {
        throw new Error(`Invalid structured output from ${name}.${request.name}: ${JSON.stringify(validation.output.errors)}`);
      }
      return { ...result, resultType: "complete" };
    };
    const listTools = (options2) => session(options2, (client) => client.listTools(void 0, options2));
    for (const { definition: tool } of definitions.values()) if (!["then", "toJSON", "toString", "valueOf", "toLocaleString"].includes(tool.name)) {
      tools[tool.name] = async (input, options2) => {
        const result = await callTool({ name: tool.name, arguments: input }, options2);
        if (result.resultType === "input_required" || result.isError) throw new ToolCallError(name, tool.name, result);
        return result.structuredContent;
      };
    }
    const resources = /* @__PURE__ */ Object.create(null);
    for (const resource of contract?.resources ?? []) {
      let valid;
      const parse2 = (result) => {
        const value = JSON.parse(result.contents[0].text);
        valid ??= validator(resource.outputSchema);
        if (!valid(value)) throw new Error(`Invalid contents from ${name} ${resource.uri}: ${JSON.stringify(valid.errors)}`);
        return value;
      };
      const read = async (options2) => parse2(await session(options2, (client) => client.readResource({ uri: resource.uri }, options2)));
      const watch = async (onChange, { signal } = {}) => {
        const resolved = resolve();
        if (!resolved?.endpoint) throw new Error(`Watching ${name} ${resource.uri} requires an endpoint binding.`);
        for (let established = false; !signal?.aborted; await delay(1e3, signal)) {
          const current = connect(resolved.endpoint, resolved);
          let failure2;
          try {
            await untilAborted(current.ready, signal);
            const { client } = current;
            if (!client.getServerCapabilities()?.resources?.subscribe) throw new Error(`${name} does not advertise resource subscriptions.`);
            let reads = Promise.resolve();
            const refresh = () => reads = reads.then(async () => onChange(parse2(await client.readResource({ uri: resource.uri }, { signal, cacheMode: "bypass" })))).catch((error2) => {
              failure2 ??= error2;
              return current.close();
            });
            client.setNotificationHandler("notifications/resources/updated", ({ params }) => {
              if (params.uri === resource.uri) void refresh();
            });
            const subscription = await client.listen({ resourceSubscriptions: [resource.uri] }, { signal });
            if (!subscription.honoredFilter.resourceSubscriptions?.includes(resource.uri)) throw new Error(`${name} did not accept a subscription to ${resource.uri}.`);
            established = true;
            await refresh();
            await subscription.closed;
          } catch (error2) {
            failure2 ??= error2;
          } finally {
            await current.close();
          }
          if (signal?.aborted) return;
          if (failure2 && !established) throw failure2;
        }
      };
      resources[resource.uri] = Object.freeze({ read, watch });
    }
    apps[name] = Object.freeze({ callTool, listTools, resources: Object.freeze(resources), close: async () => {
      await connection?.close();
    }, tools: Object.freeze(tools) });
  }
  return Object.freeze(apps);
}
async function exposeTools(app, options = {}) {
  const context = globalThis.document?.modelContext ?? globalThis.navigator?.modelContext;
  if (!context) return false;
  const { signal } = options;
  const execute = options.execute ?? ((name, args) => app.callTool({ name, arguments: args }, { signal }));
  const { tools } = await app.listTools({ signal });
  for (const tool of tools) {
    await context.registerTool({
      name: tool.name,
      title: tool.title,
      description: tool.description ?? "",
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
      execute: (args) => execute(tool.name, args ?? {})
    }, { signal });
  }
  return true;
}
async function registerPageTools(tools, { view, signal } = {}) {
  const context = globalThis.document?.modelContext ?? globalThis.navigator?.modelContext;
  const removals = [];
  for (const [name, { description, inputSchema, annotations, execute }] of Object.entries(tools)) {
    if (view) {
      removals.push(view.registerTool(name, { description, inputSchema, annotations }, (args) => execute(args)).remove);
    } else if (context) {
      const standard = inputSchema["~standard"];
      await context.registerTool({
        name,
        description,
        annotations,
        inputSchema: standard.jsonSchema.input({ target: "draft-2020-12" }),
        execute: async (args) => {
          const parsed = await standard.validate(args ?? {});
          if (parsed.issues) throw new Error(`Invalid arguments for ${name}: ${JSON.stringify(parsed.issues)}`);
          return execute(parsed.value);
        }
      }, { signal });
    }
  }
  signal?.addEventListener("abort", () => {
    for (const remove of removals) remove();
  }, { once: true });
  return Boolean(view || context);
}
export {
  ToolCallError,
  bindApps,
  createApps,
  exposeTools,
  registerPageTools,
  setDefaultBinding
};
