import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, } from '@apollo/client';
export const ApiContext = createContext(null);
function createApolloClient(uri, headers) {
    return new ApolloClient({
        link: new HttpLink({ uri, headers: headersInitToRecord(headers) }),
        cache: new InMemoryCache(),
    });
}
function mergeHeaders(base, override) {
    if (!base && !override)
        return undefined;
    const h = new Headers(base);
    if (override) {
        new Headers(override).forEach((value, key) => {
            h.set(key, value);
        });
    }
    return h;
}
function headersInitToRecord(headers) {
    if (!headers)
        return undefined;
    const record = {};
    new Headers(headers).forEach((value, key) => {
        record[key] = value;
    });
    return record;
}
function resolveBody(body) {
    if (body == null)
        return undefined;
    if (typeof body === 'string' || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || body instanceof FormData || body instanceof URLSearchParams) {
        return body;
    }
    return JSON.stringify(body);
}
export function ApiProvider(props) {
    const { children } = props;
    const isGraphql = props.provider === 'graphql';
    const graphqlUri = props.provider === 'graphql' ? props.uri : undefined;
    const graphqlClientProp = props.provider === 'graphql' ? props.client : undefined;
    const graphqlHeaders = props.provider === 'graphql' ? props.headers : undefined;
    const graphqlClient = useMemo(() => {
        if (!isGraphql)
            return null;
        if (graphqlClientProp)
            return graphqlClientProp;
        const endpoint = graphqlUri ?? (typeof process !== 'undefined' ? process.env?.GRAPHQL_URI : '');
        if (!endpoint) {
            throw new Error('ApiProvider(provider="graphql") requires either "uri" prop or GRAPHQL_URI environment variable');
        }
        return createApolloClient(endpoint, graphqlHeaders);
    }, [isGraphql, graphqlUri, graphqlClientProp, graphqlHeaders]);
    const baseUrl = props.provider === 'rest' ? props.baseUrl : undefined;
    const restHeaders = props.provider === 'rest' ? props.headers : undefined;
    const endpoint = baseUrl ?? (typeof process !== 'undefined' ? process.env?.ENDPOINT_URL : '') ?? '';
    const restValue = useMemo(() => {
        if (isGraphql)
            return null;
        const url = (path) => `${endpoint}${path}`;
        return {
            provider: 'rest',
            get: (path, options) => fetch(url(path), {
                ...options,
                method: 'GET',
                headers: mergeHeaders(restHeaders, options?.headers),
            }),
            post: (path, body, options) => fetch(url(path), {
                ...options,
                method: 'POST',
                body: resolveBody(body),
                headers: body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
                    ? mergeHeaders({ 'Content-Type': 'application/json', ...restHeaders }, options?.headers)
                    : mergeHeaders(restHeaders, options?.headers),
            }),
            put: (path, body, options) => fetch(url(path), {
                ...options,
                method: 'PUT',
                body: resolveBody(body),
                headers: body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
                    ? mergeHeaders({ 'Content-Type': 'application/json', ...restHeaders }, options?.headers)
                    : mergeHeaders(restHeaders, options?.headers),
            }),
            delete: (path, options) => fetch(url(path), {
                ...options,
                method: 'DELETE',
                headers: mergeHeaders(restHeaders, options?.headers),
            }),
        };
    }, [isGraphql, endpoint, restHeaders]);
    if (isGraphql && graphqlClient) {
        const graphqlValue = useMemo(() => ({
            provider: 'graphql',
            ransack: (options) => graphqlClient.query(options),
            handing: (options) => graphqlClient.mutate(options),
        }), [graphqlClient]);
        return (_jsx(ApolloProvider, { client: graphqlClient, children: _jsx(ApiContext.Provider, { value: graphqlValue, children: children }) }));
    }
    if (restValue) {
        return _jsx(ApiContext.Provider, { value: restValue, children: children });
    }
    return _jsx(_Fragment, { children: children });
}
export function useApi() {
    const ctx = useContext(ApiContext);
    if (!ctx) {
        throw new Error('useApi must be used within ApiProvider or YargramProvider');
    }
    return ctx;
}
