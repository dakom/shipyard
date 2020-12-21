(function () {
    'use strict';

    let wasm;

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    function getObject(idx) { return heap[idx]; }

    let heap_next = heap.length;

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    let cachegetFloat64Memory0 = null;
    function getFloat64Memory0() {
        if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
            cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
        }
        return cachegetFloat64Memory0;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    let WASM_VECTOR_LEN = 0;

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

                } else {
                    state.a = a;
                }
            }
        };
        real.original = state;

        return real;
    }

    let stack_pointer = 32;

    function addBorrowedObject(obj) {
        if (stack_pointer == 1) throw new Error('out of js stack');
        heap[--stack_pointer] = obj;
        return stack_pointer;
    }
    function __wbg_adapter_24(arg0, arg1, arg2) {
        try {
            wasm._dyn_core__ops__function__FnMut___A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hcec9f2605727d7ab(arg0, arg1, addBorrowedObject(arg2));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }

    function __wbg_adapter_27(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h30840c02ec9f9589(arg0, arg1, arg2);
    }

    function __wbg_adapter_30(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h9bec0582f5e99e74(arg0, arg1, addHeapObject(arg2));
    }

    function __wbg_adapter_33(arg0, arg1) {
        wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h47134b0856858c26(arg0, arg1);
    }

    function __wbg_adapter_36(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h6edb1125bb97787b(arg0, arg1, addHeapObject(arg2));
    }

    function handleError(f) {
        return function () {
            try {
                return f.apply(this, arguments);

            } catch (e) {
                wasm.__wbindgen_exn_store(addHeapObject(e));
            }
        };
    }

    let cachegetFloat32Memory0 = null;
    function getFloat32Memory0() {
        if (cachegetFloat32Memory0 === null || cachegetFloat32Memory0.buffer !== wasm.memory.buffer) {
            cachegetFloat32Memory0 = new Float32Array(wasm.memory.buffer);
        }
        return cachegetFloat32Memory0;
    }

    function getArrayF32FromWasm0(ptr, len) {
        return getFloat32Memory0().subarray(ptr / 4, ptr / 4 + len);
    }

    function getArrayU8FromWasm0(ptr, len) {
        return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {

            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            input = (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href).replace(/\.js$/, '_bg.wasm');
        }
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            var ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_cb_drop = function(arg0) {
            const obj = takeObject(arg0).original;
            if (obj.cnt-- == 1) {
                obj.a = 0;
                return true;
            }
            var ret = false;
            return ret;
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            var ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            var ret = getObject(arg0) === undefined;
            return ret;
        };
        imports.wbg.__wbg_new_68adb0d58759a4ed = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_2e79e744454afade = function(arg0, arg1, arg2) {
            getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
        };
        imports.wbg.__wbg_instanceof_Window_49f532f06a9786ee = function(arg0) {
            var ret = getObject(arg0) instanceof Window;
            return ret;
        };
        imports.wbg.__wbg_document_c0366b39e4f4c89a = function(arg0) {
            var ret = getObject(arg0).document;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_location_c1e50a6e4c53d45c = function(arg0) {
            var ret = getObject(arg0).location;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_innerWidth_cea04a991524ea87 = handleError(function(arg0) {
            var ret = getObject(arg0).innerWidth;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_innerHeight_83651dca462998d1 = handleError(function(arg0) {
            var ret = getObject(arg0).innerHeight;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_performance_87e4f3b6f966469f = function(arg0) {
            var ret = getObject(arg0).performance;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_requestAnimationFrame_ef0e2294dc8b1088 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
            return ret;
        });
        imports.wbg.__wbg_fetch_f532e04b8fe49aa0 = function(arg0, arg1) {
            var ret = getObject(arg0).fetch(getObject(arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_origin_be15168c886ad7ab = handleError(function(arg0, arg1) {
            var ret = getObject(arg1).origin;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        });
        imports.wbg.__wbg_instanceof_Response_f52c65c389890639 = function(arg0) {
            var ret = getObject(arg0) instanceof Response;
            return ret;
        };
        imports.wbg.__wbg_text_afdc7a1dc7edda52 = handleError(function(arg0) {
            var ret = getObject(arg0).text();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_origin_a4c92689076eab26 = function(arg0, arg1) {
            var ret = getObject(arg1).origin;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_new_bcd64c6565e8d34f = handleError(function(arg0, arg1) {
            var ret = new URL(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_now_7628760b7b640632 = function(arg0) {
            var ret = getObject(arg0).now();
            return ret;
        };
        imports.wbg.__wbg_drawArraysInstancedANGLE_de5ad88e1aa2bcff = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_vertexAttribDivisorANGLE_9512bb2274e6e553 = function(arg0, arg1, arg2) {
            getObject(arg0).vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
        };
        imports.wbg.__wbg_addEventListener_a422088e686210b5 = handleError(function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
        });
        imports.wbg.__wbg_instanceof_HtmlCanvasElement_7bd3ee7838f11fc3 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLCanvasElement;
            return ret;
        };
        imports.wbg.__wbg_width_0efa4604d41c58c5 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_setwidth_1d0e975feecff3ef = function(arg0, arg1) {
            getObject(arg0).width = arg1 >>> 0;
        };
        imports.wbg.__wbg_height_aa24e3fef658c4a8 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_setheight_7758ee3ff5c65474 = function(arg0, arg1) {
            getObject(arg0).height = arg1 >>> 0;
        };
        imports.wbg.__wbg_getContext_3db9399e6dc524ff = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_getContext_93be69215ea9dbbf = handleError(function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2), getObject(arg3));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_setsrc_ca894d724570195d = function(arg0, arg1, arg2) {
            getObject(arg0).src = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_setcrossOrigin_e1a35c32f0633f24 = function(arg0, arg1, arg2) {
            getObject(arg0).crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_width_f3b349ce7a53895c = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_59f27baafc5c7528 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_new_1f2ded01c889cd38 = handleError(function() {
            var ret = new Image();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_width_e9b21223febd2508 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_9b63c09643cff585 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_newwithstr_bf2216e354083680 = handleError(function(arg0, arg1) {
            var ret = new Request(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_size_d062788058dfe6f7 = function(arg0) {
            var ret = getObject(arg0).size;
            return ret;
        };
        imports.wbg.__wbg_type_69df81ce730cd07a = function(arg0) {
            var ret = getObject(arg0).type;
            return ret;
        };
        imports.wbg.__wbg_name_99c5f2c3a3d268ab = function(arg0, arg1) {
            var ret = getObject(arg1).name;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_body_c8cb19d760637268 = function(arg0) {
            var ret = getObject(arg0).body;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createElement_99351c8bf0efac6e = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_instanceof_WebGlRenderingContext_ef4e51c6e4133d85 = function(arg0) {
            var ret = getObject(arg0) instanceof WebGLRenderingContext;
            return ret;
        };
        imports.wbg.__wbg_canvas_54c016d62da93f0f = function(arg0) {
            var ret = getObject(arg0).canvas;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_drawingBufferWidth_fab3e20dd1ba5d4e = function(arg0) {
            var ret = getObject(arg0).drawingBufferWidth;
            return ret;
        };
        imports.wbg.__wbg_drawingBufferHeight_31bc93d4dc3a0dcc = function(arg0) {
            var ret = getObject(arg0).drawingBufferHeight;
            return ret;
        };
        imports.wbg.__wbg_bufferData_dc5899657e9f1803 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
        };
        imports.wbg.__wbg_texImage2D_6b433ad1d91323ea = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
        });
        imports.wbg.__wbg_texImage2D_3349131303419a50 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_8e1412eece52e87d = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_8861cbc8aa02485c = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_a50e3b9a9ff4695b = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_5f727622c399931a = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_uniform1fv_cd9d2dea0641919d = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform1fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform2fv_bb8f4185c4640c8e = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform2fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform3fv_c0187b9c32677f59 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform3fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform4fv_24ef46675c137552 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform4fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniformMatrix2fv_6280160161dcdb7e = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_uniformMatrix3fv_a0a261980af4587d = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_uniformMatrix4fv_088c96db8ee28c1d = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_activeTexture_a51ec6273de88bc6 = function(arg0, arg1) {
            getObject(arg0).activeTexture(arg1 >>> 0);
        };
        imports.wbg.__wbg_attachShader_0dd248f6ab98fcf2 = function(arg0, arg1, arg2) {
            getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
        };
        imports.wbg.__wbg_bindAttribLocation_48f2316a145bc4a7 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).bindAttribLocation(getObject(arg1), arg2 >>> 0, getStringFromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_bindBuffer_1ceb83e9674e812a = function(arg0, arg1, arg2) {
            getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
        };
        imports.wbg.__wbg_bindTexture_6121e6db3f879582 = function(arg0, arg1, arg2) {
            getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
        };
        imports.wbg.__wbg_blendFunc_34a6bb31770822c5 = function(arg0, arg1, arg2) {
            getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
        };
        imports.wbg.__wbg_clear_f6b2dd48aeed2752 = function(arg0, arg1) {
            getObject(arg0).clear(arg1 >>> 0);
        };
        imports.wbg.__wbg_clearColor_89f7819aa9f80129 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).clearColor(arg1, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_compileShader_28bdbafe4445d24b = function(arg0, arg1) {
            getObject(arg0).compileShader(getObject(arg1));
        };
        imports.wbg.__wbg_createBuffer_acedc3831832a280 = function(arg0) {
            var ret = getObject(arg0).createBuffer();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createProgram_7e2f44b7b74694d4 = function(arg0) {
            var ret = getObject(arg0).createProgram();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createShader_64c474f1d1d0c1f8 = function(arg0, arg1) {
            var ret = getObject(arg0).createShader(arg1 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createTexture_0a156dab1efc3499 = function(arg0) {
            var ret = getObject(arg0).createTexture();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_deleteProgram_c86e81ed9dcee4ba = function(arg0, arg1) {
            getObject(arg0).deleteProgram(getObject(arg1));
        };
        imports.wbg.__wbg_deleteShader_183b279d1e903e2d = function(arg0, arg1) {
            getObject(arg0).deleteShader(getObject(arg1));
        };
        imports.wbg.__wbg_detachShader_7c42d3c18f91c39c = function(arg0, arg1, arg2) {
            getObject(arg0).detachShader(getObject(arg1), getObject(arg2));
        };
        imports.wbg.__wbg_disable_5b9c6f74d5efd3a5 = function(arg0, arg1) {
            getObject(arg0).disable(arg1 >>> 0);
        };
        imports.wbg.__wbg_enable_87f39f6396535e1f = function(arg0, arg1) {
            getObject(arg0).enable(arg1 >>> 0);
        };
        imports.wbg.__wbg_enableVertexAttribArray_f29c8dde9c8c5cf5 = function(arg0, arg1) {
            getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
        };
        imports.wbg.__wbg_generateMipmap_7e65e4c36fe45473 = function(arg0, arg1) {
            getObject(arg0).generateMipmap(arg1 >>> 0);
        };
        imports.wbg.__wbg_getActiveAttrib_c89d38cdd25a7557 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getActiveAttrib(getObject(arg1), arg2 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_getActiveUniform_db9cf2cb26252380 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getActiveUniform(getObject(arg1), arg2 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_getAttribLocation_ba61f837da80e249 = function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getAttribLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        };
        imports.wbg.__wbg_getExtension_c6863c255090d82f = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getExtension(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_getParameter_ff687a6ea303e551 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).getParameter(arg1 >>> 0);
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_getProgramInfoLog_aacf06c959070653 = function(arg0, arg1, arg2) {
            var ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_getProgramParameter_a89bf14502c109f7 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getShaderInfoLog_1eb885f2468e2429 = function(arg0, arg1, arg2) {
            var ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_getShaderParameter_99510442d33c6589 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getUniformLocation_ca853de4f2f9270d = function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_linkProgram_46a36cb158f10676 = function(arg0, arg1) {
            getObject(arg0).linkProgram(getObject(arg1));
        };
        imports.wbg.__wbg_pixelStorei_31f6dc244bf4cd5b = function(arg0, arg1, arg2) {
            getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
        };
        imports.wbg.__wbg_shaderSource_700ae72fca39850d = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_texParameteri_e45f3977eb998137 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
        };
        imports.wbg.__wbg_uniform1f_3eb09312a513b94a = function(arg0, arg1, arg2) {
            getObject(arg0).uniform1f(getObject(arg1), arg2);
        };
        imports.wbg.__wbg_uniform1i_e76b668973ae0655 = function(arg0, arg1, arg2) {
            getObject(arg0).uniform1i(getObject(arg1), arg2);
        };
        imports.wbg.__wbg_uniform2f_6298542797865c61 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform2f(getObject(arg1), arg2, arg3);
        };
        imports.wbg.__wbg_uniform3f_dc331a9a4148b382 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniform3f(getObject(arg1), arg2, arg3, arg4);
        };
        imports.wbg.__wbg_uniform4f_df665e266e041cad = function(arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
        };
        imports.wbg.__wbg_useProgram_d63a57db0571e803 = function(arg0, arg1) {
            getObject(arg0).useProgram(getObject(arg1));
        };
        imports.wbg.__wbg_vertexAttribPointer_34a99be638fd0005 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
        };
        imports.wbg.__wbg_viewport_54305c74f5668b33 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).viewport(arg1, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_setclassName_a54c9337081c9cf4 = function(arg0, arg1, arg2) {
            getObject(arg0).className = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_instanceof_HtmlElement_ed44c8f443dbd619 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLElement;
            return ret;
        };
        imports.wbg.__wbg_setonload_6fb79f39cb59de67 = function(arg0, arg1) {
            getObject(arg0).onload = getObject(arg1);
        };
        imports.wbg.__wbg_setonerror_bf29bf699c956162 = function(arg0, arg1) {
            getObject(arg0).onerror = getObject(arg1);
        };
        imports.wbg.__wbg_new_fa648a085e1df44e = handleError(function(arg0, arg1) {
            var ret = new Event(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_width_e7621260858d5c60 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_3afa78ae74b9713a = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_width_e371377812f96eca = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_40253ca6aed546f3 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_settextContent_075f464e1f9a4ac7 = function(arg0, arg1, arg2) {
            getObject(arg0).textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_appendChild_7c45aeccd496f2a5 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).appendChild(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_removeChild_1e1942a296b255c1 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).removeChild(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_call_951bd0c6d815d6f1 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_newnoargs_7c6bd521992b4022 = function(arg0, arg1) {
            var ret = new Function(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_ba07d0daa0e4677e = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_resolve_6e61e640925a0db9 = function(arg0) {
            var ret = Promise.resolve(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_dd3785597974798a = function(arg0, arg1) {
            var ret = getObject(arg0).then(getObject(arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_0f957e0f4c3e537a = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_self_6baf3a3aa7b63415 = handleError(function() {
            var ret = self.self;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_window_63fc4027b66c265b = handleError(function() {
            var ret = window.window;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_globalThis_513fb247e8e4e6d2 = handleError(function() {
            var ret = globalThis.globalThis;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_global_b87245cd886d7113 = handleError(function() {
            var ret = global.global;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_buffer_3f12a1c608c6d04e = function(arg0) {
            var ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_9428545f18592c34 = function(arg0, arg1, arg2) {
            var ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_length_5451d14971418d5f = function(arg0) {
            var ret = getObject(arg0).length;
            return ret;
        };
        imports.wbg.__wbg_new_2863e4d532e8dfb4 = function(arg0) {
            var ret = new Float32Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_424e78f4062c3790 = function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_set_9bdd413385146137 = handleError(function(arg0, arg1, arg2) {
            var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        });
        imports.wbg.__wbg_getRandomValues_3ac1b33c90b52596 = function(arg0, arg1, arg2) {
            getObject(arg0).getRandomValues(getArrayU8FromWasm0(arg1, arg2));
        };
        imports.wbg.__wbg_randomFillSync_6f956029658662ec = function(arg0, arg1, arg2) {
            getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
        };
        imports.wbg.__wbg_self_1c83eb4471d9eb9b = handleError(function() {
            var ret = self.self;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_static_accessor_MODULE_abf5ae284bffdf45 = function() {
            var ret = module;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_require_5b2b5b594d809d9f = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_crypto_c12f14e810edcaa2 = function(arg0) {
            var ret = getObject(arg0).crypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_msCrypto_679be765111ba775 = function(arg0) {
            var ret = getObject(arg0).msCrypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getRandomValues_05a60bf171bfc2be = function(arg0) {
            var ret = getObject(arg0).getRandomValues;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'number' ? obj : undefined;
            getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
            getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
        };
        imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_boolean_get = function(arg0) {
            const v = getObject(arg0);
            var ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
            return ret;
        };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            var ret = debugString(getObject(arg1));
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_memory = function() {
            var ret = wasm.memory;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper419 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 111, __wbg_adapter_24);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper421 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 111, __wbg_adapter_27);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper576 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 175, __wbg_adapter_30);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper578 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 175, __wbg_adapter_33);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper726 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 218, __wbg_adapter_36);
            return addHeapObject(ret);
        };

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }

        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;
        wasm.__wbindgen_start();
        return wasm;
    }

    init("wasm/shipyard_demo.wasm").catch(console.error);

}());
//# sourceMappingURL=index.js.map
