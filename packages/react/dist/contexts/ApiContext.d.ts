import React from 'react';
import { type ApolloClient as ApolloClientType, type NormalizedCacheObject, type QueryOptions, type MutationOptions, type ApolloQueryResult, type FetchResult } from '@apollo/client';
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
    ransack: <TData = unknown, TVariables = unknown>(options: QueryOptions<TVariables, TData>) => Promise<ApolloQueryResult<unknown>>;
    /** MUTATION（戻り値は FetchResult、必要なら as でキャスト） */
    handing: <TData = unknown, TVariables = unknown>(options: MutationOptions<TData, TVariables>) => Promise<FetchResult<unknown>>;
};
export declare const ApiContext: React.Context<ApiContextValue | null>;
export type ApiProviderMode = 'rest' | 'graphql';
type ApiProviderProps = {
    provider: 'rest';
    children: React.ReactNode;
    baseUrl?: string;
} | {
    provider: 'graphql';
    children: React.ReactNode;
    uri?: string;
    client?: ApolloClientType<NormalizedCacheObject>;
};
export declare function ApiProvider(props: ApiProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useApi(): ApiContextValue;
export {};
//# sourceMappingURL=ApiContext.d.ts.map