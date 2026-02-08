// Api（provider: 'rest' | 'graphql' で REST: get/post/put/delete、GraphQL: ransack/handing）
export {
  useApi,
} from './contexts/ApiContext';

export { type RestApiContextValue, type GraphqlApiContextValue } from './contexts/ApiContext';

// Printer
export { usePrinter } from './contexts/PrinterContext';

// 統合 Context（Api + Printer + LogWindow）
export { YargramProvider, useYargram } from './contexts/YargramContext';
export type { YargramProviderProps } from './contexts/YargramContext';
export { gql } from '@apollo/client';
