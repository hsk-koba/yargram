import React, { createContext, useContext, useMemo } from 'react';
import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  type ApolloClient as ApolloClientType,
  type NormalizedCacheObject,
  type QueryOptions,
  type MutationOptions,
  type ApolloQueryResult,
  type FetchResult,
  type OperationVariables,
} from '@apollo/client';

export type ApiContextValue = RestApiContextValue | GraphqlApiContextValue;

/** REST: useApi().get / .post / .put / .delete で LogWindow Network に反映 */
export type RestApiContextValue = {
  provider: 'rest';
  get: (path: string, options?: RequestInit) => Promise<Response>;
  post: (path: string, body?: BodyInit | Record<string, unknown>, options?: RequestInit) => Promise<Response>;
  put: (path: string, body?: BodyInit | Record<string, unknown>, options?: RequestInit) => Promise<Response>;
  delete: (path: string, options?: RequestInit) => Promise<Response>;
};

export type YargramGraphqlQueryOptions<TVariables = unknown, TData = unknown> = QueryOptions<TVariables, TData> & {
  cache?: RequestCache;
  noCache?: boolean;
  dedupe?: boolean;
};

export type YargramGraphqlMutationOptions<TData = unknown, TVariables = unknown> = MutationOptions<TData, TVariables> & {
  cache?: RequestCache;
  noCache?: boolean;
  dedupe?: boolean;
};

/** GraphQL: useApi().ransack (QUERY) / .handing (MUTATION) で LogWindow Network に反映 */
export type GraphqlApiContextValue = {
  provider: 'graphql';
  /** QUERY（戻り値は ApolloQueryResult、必要なら as でキャスト） */
  ransack: <TData = unknown, TVariables = unknown>(
    options: YargramGraphqlQueryOptions<TVariables, TData>
  ) => Promise<ApolloQueryResult<unknown>>;
  /** MUTATION（戻り値は FetchResult、必要なら as でキャスト） */
  handing: <TData = unknown, TVariables = unknown>(
    options: YargramGraphqlMutationOptions<TData, TVariables>
  ) => Promise<FetchResult<unknown>>;
};

export const ApiContext = createContext<ApiContextValue | null>(null);

export type ApiProviderMode = 'rest' | 'graphql';

type ApiProviderProps =
  | {
      provider: 'rest';
      children: React.ReactNode;
      baseUrl?: string;
      headers?: HeadersInit;
    }
  | {
      provider: 'graphql';
      children: React.ReactNode;
      uri?: string;
      client?: ApolloClientType<NormalizedCacheObject>;
      headers?: HeadersInit;
    };

function createApolloClient(uri: string, headers?: HeadersInit) {
  return new ApolloClient({
    link: new HttpLink({ uri, headers: headersInitToRecord(headers) }),
    cache: new InMemoryCache(),
  });
}

function mergeHeaders(base?: HeadersInit, override?: HeadersInit): Headers | undefined {
  if (!base && !override) return undefined;
  const h = new Headers(base);
  if (override) {
    new Headers(override).forEach((value, key) => {
      h.set(key, value);
    });
  }
  return h;
}

function headersInitToRecord(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;
  const record: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function normalizeGraphqlOptions<T extends { context?: any; noCache?: boolean; cache?: RequestCache; dedupe?: boolean; fetchPolicy?: any }>(
  options: T
): Omit<T, 'noCache' | 'cache' | 'dedupe'> {
  const { noCache, cache, dedupe, context, ...rest } = options;
  const next: any = { ...rest };

  if (noCache === true && next.fetchPolicy == null) {
    next.fetchPolicy = 'no-cache';
  }

  if (cache != null || dedupe != null) {
    next.context = {
      ...(context ?? {}),
      ...(dedupe != null ? { queryDeduplication: dedupe } : {}),
      ...(cache != null
        ? {
            fetchOptions: {
              ...((context as any)?.fetchOptions ?? {}),
              cache,
            },
          }
        : {}),
    };
  } else if (context != null) {
    next.context = context;
  }

  return next;
}

function resolveBody(body?: BodyInit | Record<string, unknown>): BodyInit | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string' || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || body instanceof FormData || body instanceof URLSearchParams) {
    return body;
  }
  return JSON.stringify(body);
}

export function ApiProvider(props: ApiProviderProps) {
  const { children } = props;
  const isGraphql = props.provider === 'graphql';

  const graphqlUri = props.provider === 'graphql' ? props.uri : undefined;
  const graphqlClientProp = props.provider === 'graphql' ? props.client : undefined;
  const graphqlHeaders = props.provider === 'graphql' ? props.headers : undefined;
  const graphqlClient = useMemo(() => {
    if (!isGraphql) return null;
    if (graphqlClientProp) return graphqlClientProp;
    const endpoint =
      graphqlUri ?? (typeof process !== 'undefined' ? process.env?.GRAPHQL_URI : '');
    if (!endpoint) {
      throw new Error(
        'ApiProvider(provider="graphql") requires either "uri" prop or GRAPHQL_URI environment variable'
      );
    }
    return createApolloClient(endpoint, graphqlHeaders);
  }, [isGraphql, graphqlUri, graphqlClientProp, graphqlHeaders]);

  const baseUrl = props.provider === 'rest' ? props.baseUrl : undefined;
  const restHeaders = props.provider === 'rest' ? props.headers : undefined;
  const endpoint =
    baseUrl ?? (typeof process !== 'undefined' ? process.env?.ENDPOINT_URL : '') ?? '';

  const restValue = useMemo<RestApiContextValue | null>(() => {
    if (isGraphql) return null;
    const url = (path: string) => `${endpoint}${path}`;
    return {
      provider: 'rest',
      get: (path, options) =>
        fetch(url(path), {
          ...options,
          method: 'GET',
          headers: mergeHeaders(restHeaders, options?.headers),
        }),
      post: (path, body, options) =>
        fetch(url(path), {
          ...options,
          method: 'POST',
          body: resolveBody(body),
          headers:
            body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
              ? mergeHeaders({ 'Content-Type': 'application/json', ...(restHeaders as any) }, options?.headers)
              : mergeHeaders(restHeaders, options?.headers),
        }),
      put: (path, body, options) =>
        fetch(url(path), {
          ...options,
          method: 'PUT',
          body: resolveBody(body),
          headers:
            body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
              ? mergeHeaders({ 'Content-Type': 'application/json', ...(restHeaders as any) }, options?.headers)
              : mergeHeaders(restHeaders, options?.headers),
        }),
      delete: (path, options) =>
        fetch(url(path), {
          ...options,
          method: 'DELETE',
          headers: mergeHeaders(restHeaders, options?.headers),
        }),
    };
  }, [isGraphql, endpoint, restHeaders]);

  if (isGraphql && graphqlClient) {
    const graphqlValue: GraphqlApiContextValue = useMemo(
      () => ({
        provider: 'graphql',
        ransack: (options) =>
          graphqlClient.query(
            normalizeGraphqlOptions(options) as QueryOptions<OperationVariables, unknown>
          ),
        handing: (options) =>
          graphqlClient.mutate(
            normalizeGraphqlOptions(options) as MutationOptions<unknown, OperationVariables>
          ),
      }),
      [graphqlClient]
    );
    return (
      <ApolloProvider client={graphqlClient}>
        <ApiContext.Provider value={graphqlValue}>{children}</ApiContext.Provider>
      </ApolloProvider>
    );
  }

  if (restValue) {
    return <ApiContext.Provider value={restValue}>{children}</ApiContext.Provider>;
  }

  return <>{children}</>;
}

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApi must be used within ApiProvider or YargramProvider');
  }
  return ctx;
}
