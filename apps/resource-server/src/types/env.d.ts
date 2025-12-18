// types/env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
        PORT?: string
        RESOURCE_META_DIR?: string
        RESOURCE_CHUNK_DIR?: string
        SECRET?: string
    }
}
