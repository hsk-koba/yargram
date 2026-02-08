import React, { createContext, useContext, useMemo } from 'react';
import {
  ApolloClient,
  ApolloProvider,
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

/** GraphQL: useApi().ransack (QUERY) / .handing (MUTATION) で LogWindow Network に反映 */
export type GraphqlApiContextValue = {
  provider: 'graphql';
  /** QUERY（戻り値は ApolloQueryResult、必要なら as でキャスト） */
  ransack: <TData = unknown, TVariables = unknown>(
    options: QueryOptions<TVariables, TData>
  ) => Promise<ApolloQueryResult<unknown>>;
  /** MUTATION（戻り値は FetchResult、必要なら as でキャスト） */
  handing: <TData = unknown, TVariables = unknown>(
    options: MutationOptions<TData, TVariables>
  ) => Promise<FetchResult<unknown>>;
};

export const ApiContext = createContext<ApiContextValue | null>(null);

export type ApiProviderMode = 'rest' | 'graphql';

type ApiProviderProps =
  | {
      provider: 'rest';
      children: React.ReactNode;
      baseUrl?: string;
    }
  | {
      provider: 'graphql';
      children: React.ReactNode;
      uri?: string;
      client?: ApolloClientType<NormalizedCacheObject>;
    };

function createApolloClient(uri: string) {
  return new ApolloClient({
    uri,
    cache: new InMemoryCache(),
  });
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
    return createApolloClient(endpoint);
  }, [isGraphql, graphqlUri, graphqlClientProp]);

  const baseUrl = props.provider === 'rest' ? props.baseUrl : undefined;
  const endpoint =
    baseUrl ?? (typeof process !== 'undefined' ? process.env?.ENDPOINT_URL : '') ?? '';

  const restValue = useMemo<RestApiContextValue | null>(() => {
    if (isGraphql) return null;
    const url = (path: string) => `${endpoint}${path}`;
    return {
      provider: 'rest',
      get: (path, options) => fetch(url(path), { ...options, method: 'GET' }),
      post: (path, body, options) =>
        fetch(url(path), {
          ...options,
          method: 'POST',
          body: resolveBody(body),
          headers:
            body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
              ? { 'Content-Type': 'application/json', ...options?.headers }
              : options?.headers,
        }),
      put: (path, body, options) =>
        fetch(url(path), {
          ...options,
          method: 'PUT',
          body: resolveBody(body),
          headers:
            body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams)
              ? { 'Content-Type': 'application/json', ...options?.headers }
              : options?.headers,
        }),
      delete: (path, options) => fetch(url(path), { ...options, method: 'DELETE' }),
    };
  }, [isGraphql, endpoint]);

  if (isGraphql && graphqlClient) {
    const graphqlValue: GraphqlApiContextValue = useMemo(
      () => ({
        provider: 'graphql',
        ransack: (options) =>
          graphqlClient.query(options as QueryOptions<OperationVariables, unknown>),
        handing: (options) =>
          graphqlClient.mutate(options as MutationOptions<unknown, OperationVariables>),
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
